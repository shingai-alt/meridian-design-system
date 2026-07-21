const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

test('team invitation Phase 1 package validates against its contract', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = readJson('schemas/phase-1-package.schema.json');
  const value = readJson('examples/phase-1/team-invitation.phase1.json');
  assert.deepEqual(validateAgainstSchema(value, schema), []);
});

test('Phase 1 package keeps research, alternatives, human approval, and feedback governance', () => {
  const value = readJson('examples/phase-1/team-invitation.phase1.json');
  assert.ok(value.researchPack.evidence.length >= 4);
  assert.ok(value.directionSet.directions.length >= 2);
  assert.equal(value.directionSet.humanDecision, 'selected');
  assert.equal(value.directionSet.recommendation, 'batch_page');
  assert.equal(value.review.status, 'approved');
  assert.equal(value.meta.status, 'approved');
  assert.ok(value.review.approvals.some((approval) => approval.includes('project-owner')));
  assert.ok(value.designBrief.constraints.includes('1回最大10人'));
  assert.deepEqual(value.designBrief.openQuestions, []);
  assert.deepEqual(value.review.requiredRoles, ['product-manager', 'designer', 'engineer']);
  assert.ok(value.patternContracts.every((pattern) => pattern.evidenceRefs.length > 0));
});
