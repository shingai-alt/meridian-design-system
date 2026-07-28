#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  throw new Error('Playwright is required to capture visual candidates. Set NODE_PATH to a runtime that provides playwright.');
}

const candidates = JSON.parse(readFileSync(join(root, 'examples/phase-2/team-invitation.visual-candidates.json'), 'utf8'));
const digestFile = (path) => `sha256-${createHash('sha256').update(readFileSync(join(root, path))).digest('hex')}`;
const outputDirectory = join(root, 'examples/generated/visual-review');
mkdirSync(outputDirectory, { recursive: true });

const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE
  || (existsSync(systemChrome) ? systemChrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const pageErrors = [];
const captures = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

try {
  for (const candidate of candidates.candidates) {
    const url = pathToFileURL(join(root, 'examples/generated/team-invitation.phase2.html'));
    url.searchParams.set('candidate', candidate.id);
    await page.goto(url.href, { waitUntil: 'load' });
    const prototype = page.locator('#prototype');
    const capturedLayout = await prototype.getAttribute('data-design-candidate');
    const capturedScenario = await prototype.getAttribute('data-scenario-id');
    if (capturedLayout !== candidate.layout) throw new Error(`${candidate.id}: requested candidate resolved to ${capturedLayout}`);
    if (!capturedScenario) throw new Error(`${candidate.id}: capture has no active scenario provenance`);
    const desktopPath = join(outputDirectory, `${candidate.id}.desktop.png`);
    await prototype.screenshot({ path: desktopPath });
    await page.evaluate(() => {
      const prototype = document.querySelector('#prototype');
      prototype.style.transition = 'none';
      prototype.style.width = '390px';
      prototype.style.maxWidth = '390px';
      prototype.dataset.viewport = 'mobile';
    });
    const mobilePath = join(outputDirectory, `${candidate.id}.mobile.png`);
    await prototype.screenshot({ path: mobilePath });
    for (const [viewport, path] of [['desktop', desktopPath], ['mobile', mobilePath]]) {
      const bytes = readFileSync(path);
      captures.push({
        candidateId: candidate.id,
        candidateLayout: capturedLayout,
        scenarioId: capturedScenario,
        viewport,
        path: `examples/generated/visual-review/${candidate.id}.${viewport}.png`,
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        digest: `sha256-${createHash('sha256').update(bytes).digest('hex')}`,
      });
    }
    console.log(`Captured ${candidate.id}: desktop, mobile`);
  }

  const reviewUrl = pathToFileURL(join(root, 'examples/generated/team-invitation.phase2.html'));
  await page.goto(reviewUrl.href, { waitUntil: 'load' });
  await page.locator('#download-visual-review').click();
  if (!(await page.locator('#visual-review-live').textContent()).includes('Reviewer')) throw new Error('Visual review export must reject an empty reviewer');
  await page.locator('#visual-reviewer').fill('Automated verification');
  await page.locator('#download-visual-review').click();
  if (!(await page.locator('#visual-review-live').textContent()).includes('少なくとも1件')) throw new Error('Visual review export must reject an empty comparison set');
  await page.locator('#comparison-right').click();
  const firstComparison = candidates.comparisons[0];
  const rightCandidate = candidates.candidates.find((candidate) => candidate.id === firstComparison.right);
  if (await page.locator('#prototype').getAttribute('data-design-candidate') !== rightCandidate.layout) throw new Error('Pairwise right toggle did not constrain the visible candidate');
  await page.locator('#comparison-reason').fill('Rubricに基づく自動UI検証');
  await page.locator('#record-comparison').click();
  if (!(await page.locator('#visual-review-live').textContent()).includes(`1 / ${candidates.comparisons.length}`)) throw new Error('Pairwise comparison was not recorded');
  await page.locator('[data-viewport="mobile"]').click();
  await page.locator('#comparison-reason').fill('未確認Mobile evidenceは保存できない');
  await page.locator('#record-comparison').click();
  if (!(await page.locator('#visual-review-live').textContent()).includes('現在のScenarioとViewport')) throw new Error('Pairwise comparison must require both candidates in the current viewport');
  await page.locator('#candidate-select').selectOption('guided-flow');
  if (await page.locator('#comparison-left').getAttribute('aria-pressed') !== 'false' || await page.locator('#comparison-right').getAttribute('aria-pressed') !== 'false') throw new Error('Candidate selector did not clear pairwise side state');

  await page.reload({ waitUntil: 'load' });
  await page.locator('#visual-reviewer').fill('Automated verification');
  const winners = ['task-focus', 'guided-flow', 'context-aside', 'task-focus', 'context-aside', 'guided-flow'];
  for (const [index, comparison] of candidates.comparisons.entries()) {
    await page.locator('#comparison-select').selectOption(comparison.id);
    await page.locator('#comparison-left').click();
    await page.locator('#comparison-right').click();
    await page.locator('#comparison-winner').selectOption(winners[index]);
    await page.locator('#comparison-reason').fill(`Round robin ${index + 1}`);
    await page.locator('#record-comparison').click();
  }
  if (await page.locator('#record-tiebreak').isHidden()) throw new Error('Tie-break control was not exposed for tied standings');
  for (const [comparisonId, winner] of [['comparison.a-b', 'task-focus'], ['comparison.a-c', 'task-focus']]) {
    await page.locator('#comparison-select').selectOption(comparisonId);
    await page.locator('#comparison-left').click();
    await page.locator('#comparison-right').click();
    await page.locator('#comparison-winner').selectOption(winner);
    await page.locator('#comparison-reason').fill('同率首位の決勝比較');
    await page.locator('#record-tiebreak').click();
  }
  if (!(await page.locator('#visual-review-live').textContent()).includes('最終候補が決まりました')) throw new Error('Tie-break comparisons did not resolve the winner');
  console.log('Verified pairwise review controls and export guards');
} finally {
  await browser.close();
}

if (pageErrors.length) throw new Error(`Visual capture found page errors:\n${pageErrors.join('\n')}`);
writeFileSync(join(outputDirectory, 'manifest.json'), `${JSON.stringify({
  schemaVersion: '0.1.0',
  conceptId: candidates.conceptId,
  sourceDigests: {
    html: digestFile('examples/generated/team-invitation.phase2.html'),
    candidates: digestFile('examples/phase-2/team-invitation.visual-candidates.json'),
    rubric: digestFile('design/visual-quality-rubric.json'),
  },
  captures,
}, null, 2)}\n`);
