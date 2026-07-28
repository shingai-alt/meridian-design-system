import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';
import { preview } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const runnerPath = fileURLToPath(import.meta.url);
const spikeRoot = resolve(here, '..');
const repositoryRoot = resolve(spikeRoot, '..', '..');
const planPath = join(repositoryRoot, 'design/adapter-browser-evaluation-plan.json');
const benchmarkPath = join(repositoryRoot, 'design/adapter-benchmark.json');
const evidenceRoot = join(repositoryRoot, 'design/evidence/adapter-browser');
const shadcnSnapshotPath = join(evidenceRoot, 'shadcn-registry-snapshot.json');
const chromeExecutable =
  process.env.MERIDIAN_CHROME_EXECUTABLE ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const digestFile = async (path) => sha256(await readFile(path));
const pathRef = (path) => relative(repositoryRoot, path).split('\\').join('/');

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const plan = await readJson(planPath);
const benchmark = await readJson(benchmarkPath);
const candidateFilter = process.env.MERIDIAN_CANDIDATE;
const pilotFilter = process.env.MERIDIAN_PILOT;
const viewportFilter = process.env.MERIDIAN_VIEWPORT;
const executionCandidateRefs = candidateFilter ? [candidateFilter] : plan.candidateRefs;
const executionPilotRefs = pilotFilter ? [pilotFilter] : plan.pilotRefs;
const executionViewports = viewportFilter
  ? plan.viewports.filter((viewport) => viewport.id === viewportFilter)
  : plan.viewports;
const filteredExecution = Boolean(candidateFilter || pilotFilter || viewportFilter);
const packageLockPath = join(spikeRoot, 'package-lock.json');
const buildManifestPath = join(spikeRoot, 'dist/.vite/manifest.json');
const generatedRegistryRoot = join(spikeRoot, 'registry-parity/generated');
const packageLockDigest = await digestFile(packageLockPath);
await stat(chromeExecutable);
await mkdir(evidenceRoot, { recursive: true });
const implementationPaths = [
  join(spikeRoot, 'package.json'),
  packageLockPath,
  join(spikeRoot, 'index.html'),
  join(spikeRoot, 'vite.config.mjs'),
  join(spikeRoot, 'scripts/materialize-shadcn-registry.mjs'),
  join(spikeRoot, 'registry-parity/styles.css'),
  shadcnSnapshotPath,
  runnerPath,
  ...(await listFiles(generatedRegistryRoot)).filter(
    (path) => !path.endsWith('materialization-manifest.json'),
  ),
  ...(await listFiles(join(spikeRoot, 'src'))),
].sort();
const implementationFiles = [];
for (const path of implementationPaths) {
  implementationFiles.push({ ref: pathRef(path), sha256: await digestFile(path) });
}
const implementationSha256 = sha256(
  implementationFiles.map((file) => `${file.ref}:${file.sha256}`).join('\n'),
);

const buildManifest = await readJson(buildManifestPath);
const evidenceBuildManifestPath = join(evidenceRoot, 'vite-manifest.json');
await writeFile(evidenceBuildManifestPath, `${JSON.stringify(buildManifest, null, 2)}\n`);
const candidateBuildEntries = {
  'shadcn-ui': 'src/adapters/shadcn-registry.tsx',
  'radix-primitives': 'src/adapters/radix.mjs',
  'react-aria': 'src/adapters/react-aria.mjs',
  'material-ui': 'src/adapters/material-ui.mjs',
  carbon: 'src/adapters/carbon.mjs',
};

async function buildFootprint(candidateRef) {
  const visitedEntries = new Set();
  const files = new Set(['index.html']);
  const visit = (entryKey) => {
    if (visitedEntries.has(entryKey)) return;
    visitedEntries.add(entryKey);
    const entry = buildManifest[entryKey];
    if (!entry) throw new Error(`Build manifest is missing ${entryKey}`);
    files.add(entry.file);
    for (const css of entry.css ?? []) files.add(css);
    for (const imported of entry.imports ?? []) visit(imported);
  };
  visit('index.html');
  visit(candidateBuildEntries[candidateRef]);
  const artifacts = [];
  for (const file of [...files].sort()) {
    const buffer = await readFile(join(spikeRoot, 'dist', file));
    artifacts.push({
      file,
      type: file.endsWith('.css') ? 'css' : file.endsWith('.js') ? 'javascript' : 'html',
      rawBytes: buffer.byteLength,
      gzipBytes: gzipSync(buffer).byteLength,
      sha256: sha256(buffer),
    });
  }
  return {
    candidateRef,
    rawBytes: artifacts.reduce((sum, artifact) => sum + artifact.rawBytes, 0),
    gzipBytes: artifacts.reduce((sum, artifact) => sum + artifact.gzipBytes, 0),
    javascriptRawBytes: artifacts
      .filter((artifact) => artifact.type === 'javascript')
      .reduce((sum, artifact) => sum + artifact.rawBytes, 0),
    cssRawBytes: artifacts
      .filter((artifact) => artifact.type === 'css')
      .reduce((sum, artifact) => sum + artifact.rawBytes, 0),
    artifacts,
  };
}

const buildFootprints = [];
for (const candidateRef of plan.candidateRefs) {
  buildFootprints.push(await buildFootprint(candidateRef));
}

const server = await preview({
  root: spikeRoot,
  preview: { host: '127.0.0.1', port: 4179, strictPort: true },
  logLevel: 'error',
});
const baseUrl = 'http://127.0.0.1:4179';
const browser = await chromium.launch({
  executablePath: chromeExecutable,
  headless: true,
  args: ['--force-color-profile=srgb'],
});
const browserVersion = browser.version();

async function accessibilityInventory(page) {
  const locator = page.locator(
    'button:visible,input:visible,select:visible,a[href]:visible,[role="button"]:visible,[role="checkbox"]:visible,[role="option"]:visible',
  );
  const count = await locator.count();
  const controls = [];
  for (let index = 0; index < Math.min(count, 80); index += 1) {
    const item = locator.nth(index);
    let snapshot = '';
    try {
      snapshot = await item.ariaSnapshot();
    } catch (error) {
      snapshot = `snapshot-error: ${error.message}`;
    }
    controls.push({
      index,
      tag: await item.evaluate((node) => node.tagName.toLowerCase()),
      testId: await item.getAttribute('data-testid'),
      snapshot: snapshot.slice(0, 500),
      inAccessibilityTree: snapshot.trim().length > 0,
      hasName: /^- \w+ "[^"]+"/m.test(snapshot) || /^- \w+:\s+.+/m.test(snapshot),
      intentionallyHidden: await item.evaluate((node) =>
        Boolean(node.closest('[aria-hidden="true"],[inert]')),
      ),
    });
  }
  return {
    visibleInteractiveCount: count,
    sampledCount: controls.length,
    unnamed: controls.filter((control) => control.inAccessibilityTree && !control.hasName),
    absentFromTree: controls.filter(
      (control) => !control.inAccessibilityTree && !control.intentionallyHidden,
    ),
    controls,
  };
}

async function tabSequence(page) {
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  const sequence = [];
  const seen = new Set();
  let cycleComplete = false;
  for (let index = 0; index < 80; index += 1) {
    await page.keyboard.press('Tab');
    const active = await page.evaluate(async () => {
      const node = document.activeElement;
      if (!node) return null;
      const visibleFocusable = [
        ...document.querySelectorAll(
          'button,input,select,textarea,a[href],[tabindex]:not([tabindex="-1"]),' +
            '[role="button"],[role="checkbox"],[role="option"]',
        ),
      ].filter((candidate) => {
        const style = getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();
        return (
          !candidate.disabled &&
          !candidate.closest('[aria-hidden="true"],[inert]') &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      });
      const visualFingerprint = (target) => {
        const visualNodes = [
          target,
          target.parentElement,
          target.parentElement?.parentElement,
          target.querySelector?.('fieldset'),
          target.parentElement?.querySelector?.('fieldset'),
          target.parentElement?.parentElement?.querySelector?.('fieldset'),
        ].filter(Boolean);
        return visualNodes.flatMap((visualNode) =>
          [null, '::before', '::after'].map((pseudo) => {
            const style = getComputedStyle(visualNode, pseudo);
            return [
              style.outline,
              style.outlineOffset,
              style.boxShadow,
              style.borderTop,
              style.borderRight,
              style.borderBottom,
              style.borderLeft,
              style.backgroundColor,
            ].join('|');
          }),
        );
      };
      const focusedFingerprint = visualFingerprint(node);
      node.blur();
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
      const unfocusedFingerprint = visualFingerprint(node);
      try {
        node.focus({ focusVisible: true });
      } catch {
        node.focus();
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return {
        domIndex: visibleFocusable.indexOf(node),
        tag: node.tagName.toLowerCase(),
        testId: node.getAttribute('data-testid'),
        name:
          node.getAttribute('aria-label') ??
          node.getAttribute('name') ??
          node.textContent?.trim().slice(0, 120) ??
          '',
        focusIndicator:
          JSON.stringify(focusedFingerprint) !== JSON.stringify(unfocusedFingerprint),
      };
    });
    if (active?.tag === 'body') continue;
    if (active) {
      const signature = `${active.domIndex}:${active.tag}:${active.testId ?? active.name}`;
      if (seen.has(signature)) {
        cycleComplete = true;
        break;
      }
      seen.add(signature);
      sequence.push(active);
    }
  }
  return {
    sequence,
    uniqueStops: new Set(
      sequence.map((item) => `${item.domIndex}:${item.tag}:${item.testId ?? item.name}`),
    ).size,
    missingVisibleFocus: sequence.filter((item) => !item.focusIndicator),
    cycleComplete,
  };
}

async function touchTargetInventory(page) {
  return page.evaluate(() => {
    const nodes = [
      ...document.querySelectorAll(
        'button,input,select,textarea,a[href],[role="button"],[role="checkbox"],[role="option"]',
      ),
    ].filter((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return (
        !node.disabled &&
        !node.closest('[aria-hidden="true"],[inert]') &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    });
    const targets = nodes.slice(0, 120).map((node, index) => {
      const labelEligible =
        (node instanceof HTMLInputElement && ['checkbox', 'radio'].includes(node.type)) ||
        node.getAttribute('role') === 'checkbox';
      const labelledTarget =
        labelEligible && node.id
          ? document.querySelector(`label[for="${CSS.escape(node.id)}"]`)
          : null;
      const effectiveTarget =
        (labelEligible ? node.closest('label') : null) ?? labelledTarget ?? node;
      const rect = effectiveTarget.getBoundingClientRect();
      return {
        index,
        tag: node.tagName.toLowerCase(),
        testId: node.getAttribute('data-testid'),
        width: Number(rect.width.toFixed(2)),
        height: Number(rect.height.toFixed(2)),
      };
    });
    return {
      minimumCssPixels: 24,
      sampledCount: targets.length,
      failures: targets.filter((target) => target.width < 24 || target.height < 24),
      targets,
    };
  });
}

async function layoutMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((node) => ({
      level: Number(node.tagName.slice(1)),
      text: node.textContent.trim().slice(0, 160),
    }));
    const headingSkips = headings
      .slice(1)
      .filter((heading, index) => heading.level - headings[index].level > 1);
    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      direction: root.dir || getComputedStyle(root).direction,
      forcedColorsActive: matchMedia('(forced-colors: active)').matches,
      landmarks: {
        main: document.querySelectorAll('main').length,
        nav: document.querySelectorAll('nav').length,
        dialog: document.querySelectorAll('[role="dialog"]').length,
      },
      headings,
      headingSkips,
    };
  });
}

async function runTeamInvitationJourney(page) {
  const findings = [];
  const review = page.getByTestId('review-invitations');
  await review.focus();
  await review.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  const focusInside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
  if (!focusInside) findings.push({ severity: 'major', code: 'dialog-initial-focus', message: 'Initial focus is outside the review dialog.' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(
    () => document.activeElement?.getAttribute('data-testid') === 'review-invitations',
    null,
    { timeout: 1000 },
  ).catch(() => {});
  const focusRestored = await review.evaluate((node) => document.activeElement === node);
  if (!focusRestored) findings.push({ severity: 'major', code: 'dialog-focus-restoration', message: 'Review trigger did not regain focus after Escape.' });
  await review.focus();
  await review.press('Enter');
  const explicitConfirm = page.getByTestId('confirm-invitations');
  if (await explicitConfirm.count()) {
    await explicitConfirm.focus();
    await explicitConfirm.press('Enter');
  } else {
    const fallbackConfirm = dialog.getByRole('button', { name: /\d+ 件を招待/ });
    await fallbackConfirm.focus();
    await fallbackConfirm.press('Enter');
  }
  await page.getByTestId('invitation-result').waitFor({ state: 'visible' });
  const resultText = await page.getByTestId('invitation-result').innerText();
  if (!/1 件を招待しました/.test(resultText) || !/1 件は/.test(resultText)) {
    findings.push({ severity: 'major', code: 'partial-result', message: 'Partial invitation result did not preserve success and failure counts.' });
  }
  return {
    id: 'team-invitation-primary-and-partial-failure',
    interactionModality: 'keyboard',
    passed: findings.length === 0,
    assertions: {
      dialogInitialFocus: focusInside,
      escapeClosedDialog: true,
      focusRestored,
      partialResultText: resultText.trim(),
    },
    findings,
  };
}

async function runIssueTriageJourney(page) {
  const findings = [];
  const sort = page.getByTestId('sort-priority');
  const beforeSort = await sort.innerText();
  await sort.focus();
  await sort.press('Enter');
  const afterSort = await sort.innerText();
  if (beforeSort === afterSort) findings.push({ severity: 'major', code: 'sort-state', message: 'Priority sort control did not expose its changed state.' });

  const selection = page.getByRole('checkbox', { name: /選択/ }).first();
  const selectionBefore = await selection.evaluate((node) => ({
    tag: node.tagName.toLowerCase(),
    checked: 'checked' in node ? node.checked : null,
    ariaChecked: node.getAttribute('aria-checked'),
  }));
  await selection.focus();
  await selection.press('Space');
  await page.waitForTimeout(100);
  const selectionAfter = await selection.evaluate((node) => ({
    tag: node.tagName.toLowerCase(),
    checked: 'checked' in node ? node.checked : null,
    ariaChecked: node.getAttribute('aria-checked'),
  }));
  const batchStatus = page.getByRole('status');
  const batchText = (await batchStatus.count()) ? await batchStatus.innerText() : '';
  if (!/1 件を選択中/.test(batchText)) findings.push({ severity: 'major', code: 'selection-status', message: 'Selection count was not announced.' });

  const detailTrigger = page.locator('[data-testid^="open-"]:visible').first();
  const triggerTestId = await detailTrigger.getAttribute('data-testid');
  await detailTrigger.focus();
  await detailTrigger.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  const focusInside = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
  if (!focusInside) findings.push({ severity: 'major', code: 'detail-initial-focus', message: 'Initial focus is outside the detail dialog.' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(
    (testId) => document.activeElement?.getAttribute('data-testid') === testId,
    triggerTestId,
    { timeout: 1000 },
  ).catch(() => {});
  const focusRestored = await detailTrigger.evaluate((node) => document.activeElement === node);
  if (!focusRestored) findings.push({ severity: 'major', code: 'detail-focus-restoration', message: 'Detail trigger did not regain focus after Escape.' });

  const nextPage = page.getByTestId('next-page');
  await nextPage.focus();
  await nextPage.press('Enter');
  const pagination = page.getByRole('navigation', { name: '問い合わせページ' });
  await page.waitForFunction(
    (navigation) => /2 \//.test(navigation?.textContent ?? ''),
    await pagination.elementHandle(),
    { timeout: 1000 },
  ).catch(() => {});
  const paginationText = await pagination.innerText();
  if (!/2 \//.test(paginationText)) findings.push({ severity: 'major', code: 'pagination-state', message: 'Pagination did not advance to page 2.' });
  return {
    id: 'issue-triage-sort-select-detail-and-pagination',
    interactionModality: 'keyboard',
    passed: findings.length === 0,
    assertions: {
      sortStateChanged: beforeSort !== afterSort,
      selectedStatus: batchText.trim(),
      selectionBefore,
      selectionAfter,
      detailTrigger: triggerTestId,
      dialogInitialFocus: focusInside,
      focusRestored,
      paginationText: paginationText.trim(),
    },
    findings,
  };
}

async function runScenario({ candidateRef, pilotRef, viewport }) {
  const routePilot = pilotRef.replaceAll('_', '-');
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    colorScheme: 'light',
    locale: 'ja-JP',
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (['warning', 'error'].includes(message.type())) {
      consoleMessages.push({ type: message.type(), text: message.text().slice(0, 2000) });
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  if (viewport.fixture === 'forced-colors') {
    await page.emulateMedia({ forcedColors: 'active' });
  }
  const direction = viewport.fixture === 'rtl' ? 'rtl' : 'ltr';
  const url = `${baseUrl}/?candidate=${candidateRef}&pilot=${routePilot}&locale=ja&direction=${direction}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__MERIDIAN_SPIKE__?.ready === true);

  const initialLayout = await layoutMetrics(page);
  const accessibility = await accessibilityInventory(page);
  const keyboard = await tabSequence(page);
  const touchTargets = await touchTargetInventory(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__MERIDIAN_SPIKE__?.ready === true);
  const journey =
    pilotRef === 'team_invitation'
      ? await runTeamInvitationJourney(page)
      : await runIssueTriageJourney(page);

  let zoom200 = null;
  if (viewport.id === 'desktop') {
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    zoom200 = await layoutMetrics(page);
    await page.evaluate(() => {
      document.documentElement.style.zoom = '';
    });
  }

  const screenshotName = `${candidateRef}.${routePilot}.${viewport.id}.png`;
  const screenshotPath = join(evidenceRoot, screenshotName);
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
  const screenshotDigest = await digestFile(screenshotPath);
  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map((entry) => ({
      name: new URL(entry.name).pathname,
      transferSize: entry.transferSize,
      decodedBodySize: entry.decodedBodySize,
      durationMs: Number(entry.duration.toFixed(2)),
    })),
  );
  const runtimeErrors = await page.evaluate(() => window.__MERIDIAN_SPIKE__?.runtimeErrors ?? []);
  const findings = [
    ...journey.findings,
    ...(initialLayout.horizontalOverflow
      ? [{ severity: 'major', code: 'document-overflow', message: 'Document has horizontal overflow.' }]
      : []),
    ...(zoom200?.horizontalOverflow
      ? [{ severity: 'major', code: 'zoom-overflow', message: 'Document has horizontal overflow at 200 percent CSS zoom.' }]
      : []),
    ...accessibility.unnamed.map((control) => ({
      severity: 'major',
      code: 'accessible-name',
      message: `Interactive element ${control.index} has no detected accessible name.`,
    })),
    ...accessibility.absentFromTree.map((control) => ({
      severity: 'major',
      code: 'accessibility-tree',
      message: `Visible interactive element ${control.index} is absent from the accessibility tree.`,
    })),
    ...keyboard.missingVisibleFocus.map((control) => ({
      severity: 'major',
      code: 'visible-focus',
      message: `${control.tag} ${control.name} has no detected focus indicator.`,
    })),
    ...(!keyboard.cycleComplete
      ? [{
          severity: 'major',
          code: 'tab-sequence-incomplete',
          message: 'Tab traversal did not return to a previously visited focus stop within 80 steps.',
        }]
      : []),
    ...touchTargets.failures.map((target) => ({
      severity: 'major',
      code: 'touch-target',
      message: `${target.tag} ${target.testId ?? target.index} has a ${target.width} × ${target.height} CSS pixel target.`,
    })),
    ...pageErrors.map((message) => ({ severity: 'critical', code: 'page-error', message })),
    ...runtimeErrors.map((message) => ({ severity: 'critical', code: 'runtime-error', message })),
    ...consoleMessages
      .filter((message) => message.type === 'error')
      .map((message) => ({ severity: 'major', code: 'console-error', message: message.text })),
  ];
  const result = {
    id: `${candidateRef}.${pilotRef}.${viewport.id}`,
    candidateRef,
    pilotRef,
    viewport: {
      id: viewport.id,
      width: viewport.width,
      height: viewport.height,
      fixture: viewport.fixture,
    },
    path: `/?candidate=${candidateRef}&pilot=${routePilot}&locale=ja&direction=${direction}`,
    screenshot: {
      ref: pathRef(screenshotPath),
      sha256: screenshotDigest,
    },
    checks: {
      journey,
      layout: initialLayout,
      zoom200,
      accessibility,
      keyboard,
      touchTargets,
      consoleMessages,
      pageErrors,
      runtimeErrors,
      resources,
    },
    findings,
    blocking: findings.some((finding) => ['critical', 'major'].includes(finding.severity)),
  };
  await context.close();
  return result;
}

const scenarios = [];
try {
  for (const candidateRef of executionCandidateRefs) {
    for (const pilotRef of executionPilotRefs) {
      for (const viewport of executionViewports) {
        process.stdout.write(`Evaluating ${candidateRef} / ${pilotRef} / ${viewport.id}\n`);
        try {
          scenarios.push(await runScenario({ candidateRef, pilotRef, viewport }));
        } catch (error) {
          for (const openContext of browser.contexts()) {
            await openContext.close().catch(() => {});
          }
          scenarios.push({
            id: `${candidateRef}.${pilotRef}.${viewport.id}`,
            candidateRef,
            pilotRef,
            viewport: {
              id: viewport.id,
              width: viewport.width,
              height: viewport.height,
              fixture: viewport.fixture,
            },
            path: `/?candidate=${candidateRef}&pilot=${pilotRef.replaceAll('_', '-')}`,
            screenshot: null,
            checks: null,
            findings: [
              {
                severity: 'critical',
                code: 'scenario-execution',
                message: error instanceof Error ? error.message : String(error),
              },
            ],
            blocking: true,
          });
          process.stderr.write(`Scenario failed: ${candidateRef} / ${pilotRef} / ${viewport.id}: ${error.message}\n`);
        }
      }
    }
  }
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.httpServer.close(resolveClose));
}

const candidateSummaries = executionCandidateRefs.map((candidateRef) => {
  const candidateScenarios = scenarios.filter((scenario) => scenario.candidateRef === candidateRef);
  const findings = candidateScenarios.flatMap((scenario) => scenario.findings);
  return {
    candidateRef,
    scenarioCount: candidateScenarios.length,
    passedScenarioCount: candidateScenarios.filter((scenario) => !scenario.blocking).length,
    critical: findings.filter((finding) => finding.severity === 'critical').length,
    major: findings.filter((finding) => finding.severity === 'major').length,
    minor: findings.filter((finding) => finding.severity === 'minor').length,
    blocking: findings.some((finding) => ['critical', 'major'].includes(finding.severity)),
  };
});

const evidence = {
  $schema: '../../../schemas/adapter-browser-evidence.schema.json',
  schemaVersion: '0.1.0',
  kind: 'adapter-browser-evidence',
  id: 'external-adapter-browser-evidence-v1',
  status: filteredExecution ? 'debug-partial' : 'automated-complete',
  generatedAt: new Date().toISOString(),
  source: {
    planRef: pathRef(planPath),
    planSha256: await digestFile(planPath),
    benchmarkRef: pathRef(benchmarkPath),
    benchmarkSha256: await digestFile(benchmarkPath),
    packageLockRef: pathRef(packageLockPath),
    packageLockSha256: packageLockDigest,
    implementationFiles,
    implementationSha256,
  },
  environment: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    browserName: 'Google Chrome',
    browserVersion,
    browserExecutable: chromeExecutable,
    headless: true,
  },
  build: {
    manifestRef: pathRef(evidenceBuildManifestPath),
    manifestSha256: await digestFile(evidenceBuildManifestPath),
    candidateFootprints: buildFootprints,
    warnings: [
      'Vite reported a chunk larger than 500 kB; candidate-specific footprint is recorded without suppressing the warning.',
    ],
  },
  limitations: [
    'Automated accessibility snapshots and keyboard checks do not establish WCAG conformance.',
    'VoiceOver and other assistive-technology checks remain pending and are required before selection.',
    'CSS zoom is used as a deterministic 200 percent reflow fixture; browser UI zoom must be checked manually.',
    'The mobile forced-colors run verifies operability and media activation, not Windows High Contrast parity on macOS.',
    'The shadcn candidate compiles the captured new-york-v4 registry TSX unchanged; Meridian still owns the business-level adapter composition and project theme-token mapping.',
  ],
  scenarios,
  candidateSummaries,
  manualChecks: [
    {
      id: 'voiceover-chrome',
      status: 'pending',
      requiredForSelection: true,
      evidenceRefs: [],
      notes: 'Run primary journeys with VoiceOver and Chrome using the same lockfile and build.',
    },
    {
      id: 'browser-ui-zoom-200',
      status: 'pending',
      requiredForSelection: true,
      evidenceRefs: [],
      notes: 'Confirm browser UI zoom at 200 percent; automated CSS zoom is supporting evidence only.',
    },
    {
      id: 'windows-high-contrast',
      status: 'pending',
      requiredForSelection: true,
      evidenceRefs: [],
      notes: 'Confirm Windows High Contrast in an appropriate Windows environment.',
    },
    {
      id: 'shadcn-registry-parity',
      status: 'complete',
      requiredForSelection: true,
      evidenceRefs: [
        'design/evidence/adapter-browser/shadcn-registry-snapshot.json',
        'design/evidence/adapter-browser/manifest.json',
      ],
      notes: 'The candidate materializes the content-digested captured registry TSX unchanged, compiles it with the pinned Tailwind v4 Vite toolchain, and executes it in the same 30-scenario matrix.',
    },
  ],
  decisionEligible: false,
};

const evidencePath = join(evidenceRoot, filteredExecution ? 'debug-manifest.json' : 'manifest.json');
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
process.stdout.write(`Wrote ${pathRef(evidencePath)} with ${scenarios.length} scenarios.\n`);
process.stdout.write(`${JSON.stringify(candidateSummaries, null, 2)}\n`);
