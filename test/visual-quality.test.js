const test = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync, statSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { join } = require('node:path');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const readJson = (path) => JSON.parse(read(path));

test('Visual Quality Rubric has a complete 100-point decision model', () => {
  const rubric = readJson('design/visual-quality-rubric.json');
  assert.equal(rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0), 100);
  assert.equal(new Set(rubric.criteria.map((criterion) => criterion.id)).size, rubric.criteria.length);
  assert.equal(rubric.decisionPolicy.humanComparisonRequired, true);
  for (const criterion of rubric.criteria) assert.deepEqual(Object.keys(criterion.anchors), ['1', '3', '5']);
});

test('P0 keeps one baseline and exactly three structurally different candidates', () => {
  const candidates = readJson('examples/phase-2/team-invitation.visual-candidates.json');
  assert.equal(candidates.candidates.filter((candidate) => candidate.kind === 'baseline').length, 1);
  assert.equal(candidates.candidates.filter((candidate) => candidate.kind === 'candidate').length, 3);
  assert.equal(new Set(candidates.candidates.map((candidate) => candidate.layout)).size, 4);
  for (const candidate of candidates.candidates.filter((item) => item.kind === 'candidate')) {
    assert.equal(candidate.repairRounds.length, 2);
    assert.equal(candidate.provisionalScores.length, 9);
  }
});

test('visual relations reject duplicate structures and malformed repair rounds', async () => {
  const { validateVisualQualityRelations } = await import('../scripts/lib/visual-quality.mjs');
  const rubric = readJson('design/visual-quality-rubric.json');
  const candidates = readJson('examples/phase-2/team-invitation.visual-candidates.json');
  assert.doesNotThrow(() => validateVisualQualityRelations({ rubric, candidates, conceptId: candidates.conceptId }));

  const duplicateLayout = structuredClone(candidates);
  duplicateLayout.candidates[2].layout = duplicateLayout.candidates[1].layout;
  assert.throws(() => validateVisualQualityRelations({ rubric, candidates: duplicateLayout, conceptId: candidates.conceptId }), /structurally distinct/);

  const duplicateRound = structuredClone(candidates);
  duplicateRound.candidates[1].repairRounds[1].round = 1;
  assert.throws(() => validateVisualQualityRelations({ rubric, candidates: duplicateRound, conceptId: candidates.conceptId }), /unique and contiguous/);

  const noRepairNeeded = structuredClone(candidates);
  noRepairNeeded.candidates[1].repairRounds = [];
  noRepairNeeded.candidates[1].critiqueStatus = 'repair-not-required';
  assert.doesNotThrow(() => validateVisualQualityRelations({ rubric, candidates: noRepairNeeded, conceptId: candidates.conceptId }));

  const falseResolution = structuredClone(candidates);
  falseResolution.candidates[1].repairRounds[0].repairs[0].findingIds = ['task-focus.action-distance'];
  assert.throws(() => validateVisualQualityRelations({ rubric, candidates: falseResolution, conceptId: candidates.conceptId }), /either repaired or unresolved/);

  const changedSeverity = structuredClone(candidates);
  changedSeverity.candidates[1].repairRounds[1].findings[0].severity = 'note';
  assert.throws(() => validateVisualQualityRelations({ rubric, candidates: changedSeverity, conceptId: candidates.conceptId }), /changed severity/);

  const softenedUnresolved = structuredClone(candidates);
  softenedUnresolved.candidates[1].repairRounds[0].unresolvedFindings[0].severity = 'note';
  assert.throws(() => validateVisualQualityRelations({ rubric, candidates: softenedUnresolved, conceptId: candidates.conceptId }), /unresolved finding .* changed severity/);

  const duplicateScore = structuredClone(candidates);
  duplicateScore.candidates[1].provisionalScores.push(structuredClone(duplicateScore.candidates[1].provisionalScores[0]));
  assert.throws(() => validateVisualQualityRelations({ rubric, candidates: duplicateScore, conceptId: candidates.conceptId }), /exactly once/);
});

test('provisional visual gate improves over baseline but remains human-gated', () => {
  const report = readJson('examples/generated/team-invitation.visual-review.json');
  const baseline = report.candidates.find((candidate) => candidate.id === 'baseline');
  const preferred = report.candidates.find((candidate) => candidate.id === report.provisionalPreference);
  assert.ok(preferred.weightedScore > baseline.weightedScore);
  assert.equal(preferred.passesProvisionalGate, true);
  assert.equal(report.status, 'awaiting-human-comparison');
  assert.equal(report.humanDecisionRequired, true);
});

test('every candidate has digest-tracked Desktop and Mobile captures', () => {
  const candidates = readJson('examples/phase-2/team-invitation.visual-candidates.json');
  const manifest = readJson('examples/generated/visual-review/manifest.json');
  for (const [key, path] of Object.entries({ html: 'examples/generated/team-invitation.phase2.html', candidates: 'examples/phase-2/team-invitation.visual-candidates.json', rubric: 'design/visual-quality-rubric.json' })) {
    const digest = `sha256-${createHash('sha256').update(readFileSync(join(root, path))).digest('hex')}`;
    assert.equal(manifest.sourceDigests[key], digest);
  }
  assert.equal(manifest.captures.length, candidates.candidates.length * 2);
  for (const candidate of candidates.candidates) {
    for (const viewport of ['desktop', 'mobile']) {
      const capture = manifest.captures.find((item) => item.candidateId === candidate.id && item.viewport === viewport);
      assert.ok(capture, `${candidate.id} ${viewport}`);
      assert.equal(capture.candidateLayout, candidate.layout);
      assert.equal(capture.scenarioId, 'primary_path');
      assert.match(capture.digest, /^sha256-[a-f0-9]{64}$/);
      assert.ok(capture.width >= 390);
      if (viewport === 'mobile') assert.ok(capture.width <= 400);
      if (viewport === 'desktop') assert.ok(capture.width >= 1000);
      assert.ok(capture.height >= 600);
      const absolute = join(root, capture.path);
      assert.equal(existsSync(absolute), true);
      assert.ok(statSync(absolute).size > 10_000);
      const bytes = readFileSync(absolute);
      assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
      assert.equal(capture.digest, `sha256-${createHash('sha256').update(bytes).digest('hex')}`);
    }
  }
});

test('system capture validator rejects stale image evidence', async () => {
  const { validateVisualCaptureManifest } = await import('../scripts/lib/visual-quality.mjs');
  const candidates = readJson('examples/phase-2/team-invitation.visual-candidates.json');
  const manifest = readJson('examples/generated/visual-review/manifest.json');
  const args = { manifest, candidates, conceptId: candidates.conceptId, expectedScenarioId: 'primary_path', root, sourcePaths: { html: 'examples/generated/team-invitation.phase2.html', candidates: 'examples/phase-2/team-invitation.visual-candidates.json', rubric: 'design/visual-quality-rubric.json' } };
  assert.equal(validateVisualCaptureManifest(args), true);
  const stale = structuredClone(manifest);
  stale.sourceDigests.html = `sha256-${'0'.repeat(64)}`;
  assert.throws(() => validateVisualCaptureManifest({ ...args, manifest: stale }), /source html is stale/);
  const tampered = structuredClone(manifest);
  tampered.captures[0].digest = `sha256-${'0'.repeat(64)}`;
  assert.throws(() => validateVisualCaptureManifest({ ...args, manifest: tampered }), /digest does not match/);
  const wrongScenario = structuredClone(manifest);
  wrongScenario.captures[0].scenarioId = 'validation_errors';
  assert.throws(() => validateVisualCaptureManifest({ ...args, manifest: wrongScenario }), /captured scenario must be primary_path/);
});

test('generated review UI exposes candidate switching and pairwise review', () => {
  const html = read('examples/generated/team-invitation.phase2.html');
  assert.match(html, /id="candidate-select"/);
  assert.match(html, /id="comparison-select"/);
  assert.match(html, /id="record-comparison"/);
  assert.match(html, /id="record-tiebreak"/);
  assert.match(html, /data-design-candidate="baseline"/);
  assert.match(html, /function applyCandidate/);
});

test('human pairwise export contract rejects unowned reviews', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = readJson('schemas/visual-pairwise-review.schema.json');
  const record = {
    schemaVersion: '0.1.0', kind: 'visual-pairwise-review', conceptId: 'phase2_team_invitation', rubricId: 'meridian-product-ui-v1',
    captureManifestRef: 'examples/generated/visual-review/manifest.json', createdAt: '2026-07-14T00:00:00.000Z', reviewer: 'Reviewer', status: 'in-progress',
    requiredComparisonIds: ['comparison.a-b'], standings: ['baseline', 'task-focus', 'context-aside', 'guided-flow'].map((candidateId) => ({ candidateId, wins: 0 })),
    result: { state: 'incomplete', winner: null }, comparisons: [{ comparisonId: 'comparison.a-b', left: 'task-focus', right: 'context-aside', winner: 'task-focus', reason: 'Task clarityが高い。', reviewer: 'Reviewer', scenarioId: 'primary_path', viewport: 'desktop', evidenceRefs: ['examples/generated/visual-review/task-focus.desktop.png', 'examples/generated/visual-review/context-aside.desktop.png'], recordedAt: '2026-07-14T00:00:00.000Z' }], tieBreakComparisons: [],
  };
  assert.deepEqual(validateAgainstSchema(record, schema, { label: 'pairwise' }), []);
  const invalid = structuredClone(record);
  invalid.reviewer = '';
  assert.ok(validateAgainstSchema(invalid, schema, { label: 'pairwise' }).some((error) => error.includes('at least 1 characters')));
});
