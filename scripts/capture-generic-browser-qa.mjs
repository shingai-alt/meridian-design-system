#!/usr/bin/env node
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
  browserQaSummary,
  deriveScenarioFindings,
  digestFile,
  measureManifestStressCoverage,
  validateBrowserQaEvidence,
} from './lib/browser-qa.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const requestedManifest = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
const manifestRefs = requestedManifest ? [requestedManifest] : [
  'test/fixtures/ui-generation/team-invitation.generation-manifest.json',
  'test/fixtures/ui-generation/issue-triage.generation-manifest.json',
];
const policyRef = 'design/ui-generation-browser-qa-policy.json';
const policy = JSON.parse(readFileSync(join(root, policyRef), 'utf8'));
const nestedRequire = createRequire(join(root, 'spikes/external-adapters/package.json'));
const playwrightVersion = nestedRequire('playwright/package.json').version;
const outputRoot = 'test/fixtures/generated/browser-qa';

const readJson = (ref) => JSON.parse(readFileSync(join(root, ref), 'utf8'));
const pilotIdFromManifest = (manifest) => manifest.meta.id
  .replace(/^fixture_generation_/, '')
  .replaceAll('_', '-');

function sourceBinding(ref) {
  return { ref, digest: digestFile(join(root, ref)) };
}

function pngDimensions(path) {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function inspectDom(page, state, usageIds) {
  return page.evaluate(({ state, usageIds }) => {
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const danglingAriaRefs = [];
    for (const node of document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')) {
      for (const attribute of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
        const value = node.getAttribute(attribute);
        if (!value) continue;
        for (const id of value.split(/\s+/)) if (!document.getElementById(id)) danglingAriaRefs.push(`${attribute}:${id}`);
      }
    }
    function accessibleName(node) {
      const labelledBy = node.getAttribute('aria-labelledby');
      if (labelledBy) return labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent || '').join(' ').trim();
      if (node.getAttribute('aria-label')) return node.getAttribute('aria-label').trim();
      if (node.id) {
        const label = document.querySelector(`label[for="${CSS.escape(node.id)}"]`);
        if (label) return label.textContent.trim();
      }
      const wrapping = node.closest('label');
      if (wrapping) return wrapping.textContent.trim();
      return (node.textContent || node.getAttribute('title') || '').trim();
    }
    const controls = [...document.querySelectorAll('button,input,select,textarea,a[href],summary')]
      .filter((node) => !node.closest('[hidden]') && !node.closest('dialog:not([open])'));
    const unnamedControls = controls.filter((node) => !accessibleName(node)).map((node) => node.id || node.tagName.toLowerCase());
    const rendered = [...document.querySelectorAll('[data-meridian-component]')];
    const requiredProvenance = [
      'data-meridian-component',
      'data-meridian-instance',
      'data-meridian-usage',
      'data-meridian-variant',
      'data-meridian-state',
      'data-meridian-contract-version',
      'data-meridian-runtime-version',
      'data-meridian-decision',
    ];
    const unknown = rendered
      .filter((node) => !usageIds.includes(node.getAttribute('data-meridian-usage')))
      .map((node) => node.getAttribute('data-meridian-usage') || node.tagName.toLowerCase());
    const incomplete = rendered
      .filter((node) => requiredProvenance.some((attribute) => !node.hasAttribute(attribute)))
      .map((node) => node.getAttribute('data-meridian-instance') || node.tagName.toLowerCase());
    const signalSelectors = {
      default: 'article[data-state="default"]',
      loading: '[aria-busy="true"],[data-meridian-variant="running"]',
      empty: '[data-meridian-state="empty"],.mrd-generic-empty',
      error: '[aria-invalid="true"],[data-meridian-variant="error"],[data-meridian-state="error"]',
      permission: ':disabled,[aria-disabled="true"],[data-meridian-variant="warning"]',
    };
    const observed = document.querySelectorAll(signalSelectors[state]).length;
    return {
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      duplicateIds,
      danglingAriaRefs: [...new Set(danglingAriaRefs)],
      unnamedControls,
      stateSignal: {
        expected: signalSelectors[state],
        observed,
        pass: observed > 0,
      },
      runtimeProvenance: {
        rendered: rendered.length,
        unknown: [...new Set(unknown)],
        incomplete: [...new Set(incomplete)],
      },
    };
  }, { state, usageIds });
}

async function inspectKeyboard(page) {
  const expected = await page.evaluate(() => {
    function descriptor(node) {
      return node.id || node.getAttribute('data-meridian-instance') || `${node.tagName.toLowerCase()}:${(node.textContent || '').trim().slice(0, 40)}`;
    }
    return [...document.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary,[tabindex]:not([tabindex="-1"])')]
      .filter((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
          && !node.closest('dialog:not([open])');
      })
      .map(descriptor);
  });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.documentElement.scrollTop = 0;
  });
  const reached = new Set();
  const missingVisibleFocus = new Set();
  const obscured = new Set();
  for (let index = 0; index < expected.length + 2; index += 1) {
    await page.keyboard.press('Tab');
    const current = await page.evaluate(() => {
      const node = document.activeElement;
      if (!(node instanceof HTMLElement) || node === document.body) return null;
      const descriptor = node.id || node.getAttribute('data-meridian-instance') || `${node.tagName.toLowerCase()}:${(node.textContent || '').trim().slice(0, 40)}`;
      const style = getComputedStyle(node);
      const outlineWidth = Number.parseFloat(style.outlineWidth) || 0;
      const visibleFocus = (style.outlineStyle !== 'none' && outlineWidth > 0) || style.boxShadow !== 'none';
      const rect = node.getBoundingClientRect();
      const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
      const top = document.elementFromPoint(x, y);
      const entirelyOutside = rect.bottom <= 0 || rect.top >= innerHeight || rect.right <= 0 || rect.left >= innerWidth;
      const covered = !entirelyOutside && top && top !== node && !node.contains(top) && !top.contains(node);
      return { descriptor, visibleFocus, obscured: entirelyOutside || covered };
    });
    if (!current) continue;
    reached.add(current.descriptor);
    if (!current.visibleFocus) missingVisibleFocus.add(current.descriptor);
    if (current.obscured) obscured.add(current.descriptor);
  }
  return {
    expected: expected.length,
    reached: reached.size,
    missing: expected.filter((item) => !reached.has(item)),
    missingVisibleFocus: [...missingVisibleFocus],
    obscured: [...obscured],
  };
}

async function captureManifest(browser, manifestRef) {
  const manifest = readJson(manifestRef);
  const pilotId = pilotIdFromManifest(manifest);
  const model = readJson(manifest.output.reviewModel);
  const usage = readJson(manifest.output.usageManifest);
  const pilotOutputDirectory = join(root, outputRoot, pilotId);
  mkdirSync(pilotOutputDirectory, { recursive: true });
  const scenarios = [];
  const browserVersion = browser.version();

  for (const viewport of policy.viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      hasTouch: viewport.touch,
      locale: 'ja-JP',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    let consoleErrors = [];
    let pageErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    try {
      for (const fixture of manifest.stateFixtures) {
        for (const screenRef of fixture.screenRefs) {
          consoleErrors = [];
          pageErrors = [];
          await page.goto(pathToFileURL(join(root, manifest.output.reviewUi)).href, { waitUntil: 'load' });
          await page.locator('#generic-screen').selectOption(screenRef);
          await page.locator('#generic-viewport-select').selectOption(viewport.id);
          await page.locator('#generic-fixture').selectOption(fixture.id);
          await page.locator('article').waitFor({ state: 'visible' });
          const dom = await inspectDom(page, fixture.state, usage.instances.map((item) => item.instanceId));
          const keyboard = await inspectKeyboard(page);
          const checks = {
            consoleErrors,
            pageErrors,
            horizontalOverflow: dom.horizontalOverflow,
            duplicateIds: dom.duplicateIds,
            danglingAriaRefs: dom.danglingAriaRefs,
            unnamedControls: dom.unnamedControls,
            keyboard,
            stateSignal: dom.stateSignal,
            runtimeProvenance: dom.runtimeProvenance,
          };
          const scenarioId = `scenario-${screenRef}-${fixture.state}-${viewport.id}`;
          const findings = deriveScenarioFindings(checks, scenarioId);
          const status = findings.some((item) => policy.repair.blockingSeverities.includes(item.severity))
            ? 'blocked'
            : 'pass';
          const screenshotRef = `${outputRoot}/${pilotId}/${screenRef}.${fixture.state}.${viewport.id}.png`;
          const screenshotPath = join(root, screenshotRef);
          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            animations: policy.browser.animations,
          });
          const dimensions = pngDimensions(screenshotPath);
          scenarios.push({
            id: scenarioId,
            screenRef,
            state: fixture.state,
            viewport: viewport.id,
            dimensions: { width: viewport.width, height: viewport.height },
            screenshot: {
              ref: screenshotRef,
              digest: digestFile(screenshotPath),
              ...dimensions,
            },
            checks,
            findings,
            status,
          });
        }
      }
    } finally {
      await context.close();
    }
  }
  scenarios.sort((left, right) => left.id.localeCompare(right.id));
  const summary = browserQaSummary(scenarios);
  const evidence = {
    $schema: '../../../../schemas/browser-qa-evidence.schema.json',
    meta: {
      schemaVersion: '0.1.0',
      kind: 'browser-qa-evidence',
      id: `browser-qa-${pilotId}`,
      pilotId,
      status: summary.blocked ? 'blocked' : 'pass',
      generatedAt: '2026-07-27T11:00:00Z',
    },
    environment: {
      engine: 'chromium',
      browserVersion,
      playwrightVersion,
      platform: process.platform,
      headless: true,
    },
    source: {
      policy: sourceBinding(policyRef),
      generationManifest: sourceBinding(manifestRef),
      reviewUi: sourceBinding(manifest.output.reviewUi),
      reviewModel: sourceBinding(manifest.output.reviewModel),
      usageManifest: sourceBinding(manifest.output.usageManifest),
    },
    stressCoverage: measureManifestStressCoverage(manifest, policy),
    scenarios,
    summary,
  };
  const evidenceRef = `${outputRoot}/${pilotId}.evidence.json`;
  writeFileSync(join(root, evidenceRef), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Captured ${pilotId}: ${summary.completed} scenarios, ${summary.blocked} blocked.`);
}

if (check) {
  let failed = false;
  for (const manifestRef of manifestRefs) {
    const manifest = readJson(manifestRef);
    const pilotId = pilotIdFromManifest(manifest);
    const evidenceRef = `${outputRoot}/${pilotId}.evidence.json`;
    if (!existsSync(join(root, evidenceRef))) {
      console.error(`${evidenceRef} is missing`);
      failed = true;
      continue;
    }
    const evidence = readJson(evidenceRef);
    const errors = validateBrowserQaEvidence(evidence, manifest, policy, {
      root,
      manifestRef,
      policyRef,
    });
    if (errors.length) {
      console.error(`${evidenceRef} is invalid:\n${errors.map((item) => `- ${item}`).join('\n')}`);
      failed = true;
    } else {
      console.log(`Verified ${pilotId} Browser QA evidence.`);
    }
  }
  if (failed) process.exit(1);
} else {
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE
    || (existsSync(systemChrome) ? systemChrome : undefined);
  const { chromium } = nestedRequire('playwright');
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    for (const manifestRef of manifestRefs) await captureManifest(browser, manifestRef);
  } finally {
    await browser.close();
  }
}
