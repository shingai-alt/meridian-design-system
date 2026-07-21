const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

test('reference retrieval keeps three analogy distances and digest-tracked captures', async () => {
  const { validateReferenceRetrieval } = await import('../scripts/lib/design-intelligence.mjs');
  const manifest = readJson('research/references/team-invitation/manifest.json');
  assert.equal(validateReferenceRetrieval({ manifest, conceptId: 'phase2_team_invitation', sourcePackageId: 'phase1_team_invitation', root }), true);
  assert.deepEqual([...new Set(manifest.references.map((item) => item.analogyType))].sort(), ['adjacent', 'direct', 'distant']);
  assert.ok(manifest.references.filter((item) => item.capture).length >= 3);

  const stale = structuredClone(manifest);
  stale.references.find((item) => item.capture).capture.digest = `sha256-${'0'.repeat(64)}`;
  assert.throws(() => validateReferenceRetrieval({ manifest: stale, conceptId: 'phase2_team_invitation', sourcePackageId: 'phase1_team_invitation', root }), /digest is stale/);
});

test('screen principles and strategies are evidence-linked and structurally distinct', async () => {
  const { validatePrincipleRelations, validateStrategyRelations } = await import('../scripts/lib/design-intelligence.mjs');
  const references = readJson('research/references/team-invitation/manifest.json');
  const principles = readJson('research/principles/team-invitation.principles.json');
  const strategies = readJson('examples/phase-2/team-invitation.design-strategies.json');
  assert.equal(validatePrincipleRelations({ principles, references, conceptId: 'phase2_team_invitation' }), true);
  assert.equal(validateStrategyRelations({ strategies, principles, conceptId: 'phase2_team_invitation' }), true);
  assert.equal(new Set(strategies.strategies.map((item) => item.taskModel)).size, 3);

  const unknownEvidence = structuredClone(principles);
  unknownEvidence.principles[0].evidenceRefs.push('unknown-reference');
  assert.throws(() => validatePrincipleRelations({ principles: unknownEvidence, references, conceptId: 'phase2_team_invitation' }), /unknown reference/);
  const wrongPrincipleSource = structuredClone(principles);
  wrongPrincipleSource.referenceManifestRef = 'research/references/other/manifest.json';
  assert.throws(() => validatePrincipleRelations({ principles: wrongPrincipleSource, references, conceptId: 'phase2_team_invitation', referenceManifestRef: 'research/references/team-invitation/manifest.json' }), /expected research\/references\/team-invitation/);
  const wrongStrategySource = structuredClone(strategies);
  wrongStrategySource.principlesRef = 'research/principles/other.json';
  assert.throws(() => validateStrategyRelations({ strategies: wrongStrategySource, principles, conceptId: 'phase2_team_invitation', principlesRef: 'research/principles/team-invitation.principles.json' }), /expected research\/principles\/team-invitation/);
});

test('Meridian Grounding resolves registered components and blocks missing capabilities', async () => {
  const { assertGroundingReady, createGroundingReport } = await import('../scripts/lib/design-intelligence.mjs');
  const strategies = readJson('examples/phase-2/team-invitation.design-strategies.json');
  const registry = readJson('design/harness/generated/component-registry.json');
  const report = createGroundingReport({ strategies, registry, strategiesRef: 'examples/phase-2/team-invitation.design-strategies.json' });
  assert.ok(report.strategies.every((item) => item.status === 'grounded' && item.missingComponents.length === 0));
  assert.equal(assertGroundingReady(report), true);

  const missing = structuredClone(strategies);
  missing.strategies[0].requiredComponents.push('unregistered-super-control');
  const blocked = createGroundingReport({ strategies: missing, registry, strategiesRef: 'test' });
  assert.equal(blocked.strategies[0].status, 'proposal-required');
  assert.deepEqual(blocked.strategies[0].missingComponents, ['unregistered-super-control']);
  assert.throws(() => assertGroundingReady(blocked), /Generation blocked by unregistered components/);
});

test('every alternative candidate is grounded in one strategy and its principles', async () => {
  const { validateCandidateStrategyRelations } = await import('../scripts/lib/design-intelligence.mjs');
  const candidates = readJson('examples/phase-2/team-invitation.visual-candidates.json');
  const strategies = readJson('examples/phase-2/team-invitation.design-strategies.json');
  const principles = readJson('research/principles/team-invitation.principles.json');
  assert.equal(validateCandidateStrategyRelations({ candidates, strategies, principles }), true);
  assert.equal(new Set(candidates.candidates.filter((item) => item.kind === 'candidate').map((item) => item.strategyRef)).size, 3);
  const unrelated = structuredClone(candidates);
  unrelated.candidates.find((item) => item.id === 'task-focus').principleRefs = ['progressive-risk', 'preserve-successful-work'];
  assert.throws(() => validateCandidateStrategyRelations({ candidates: unrelated, strategies, principles }), /missing strategy principles/);
});

test('visual critique is screenshot-grounded and drives the review score', async () => {
  const { validateVisualCritiqueRelations } = await import('../scripts/lib/design-intelligence.mjs');
  const { createVisualReviewReport } = await import('../scripts/lib/visual-quality.mjs');
  const critique = readJson('examples/phase-2/team-invitation.visual-critique.json');
  const captures = readJson('examples/generated/visual-review/manifest.json');
  const candidates = readJson('examples/phase-2/team-invitation.visual-candidates.json');
  const rubric = readJson('design/visual-quality-rubric.json');
  assert.equal(validateVisualCritiqueRelations({ critique, captureManifest: captures, candidates, rubric }), true);

  const report = createVisualReviewReport({ rubric, candidates, visualCritique: critique });
  const mutated = structuredClone(critique);
  mutated.candidateReviews.find((item) => item.candidateId === 'task-focus').rubricScores[0].score = 1;
  const changed = createVisualReviewReport({ rubric, candidates, visualCritique: mutated });
  assert.ok(changed.candidates.find((item) => item.id === 'task-focus').weightedScore < report.candidates.find((item) => item.id === 'task-focus').weightedScore);

  const stale = structuredClone(critique);
  stale.candidateReviews[0].evidence[0].digest = `sha256-${'0'.repeat(64)}`;
  assert.throws(() => validateVisualCritiqueRelations({ critique: stale, captureManifest: captures, candidates, rubric }), /evidence is stale/);
});
