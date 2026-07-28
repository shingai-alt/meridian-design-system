const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const policy = readJson('design/ui-generation-research-policy.json');
const fixture = readJson('design/research-decisions/ui-generation-reference-adapter.research.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function validate(record) {
  const { validateUiGenerationResearchDecision } = await import('../scripts/lib/ui-generation-research-decision.mjs');
  return validateUiGenerationResearchDecision(record, policy);
}

test('research decision policy and initial adapter research satisfy their schemas', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const policySchema = readJson('schemas/ui-generation-research-policy.schema.json');
  const decisionSchema = readJson('schemas/ui-generation-research-decision.schema.json');
  assert.deepEqual(validateAgainstSchema(policy, policySchema, { label: 'policy' }), []);
  assert.deepEqual(validateAgainstSchema(fixture, decisionSchema, { label: 'fixture' }), []);
});

test('researching adapter decision records evidence and in-progress spikes without claiming a recommendation', async () => {
  assert.equal(fixture.status, 'researching');
  assert.equal(fixture.decision.status, 'pending');
  assert.equal(fixture.decision.recommendedCandidateId, null);
  assert.equal(fixture.decision.approval, null);
  assert.equal(fixture.candidates.length, 5);
  assert.ok(fixture.evidence.every((item) => item.authority === 'primary'));
  assert.ok(fixture.spikes.every((item) => item.status === 'in-progress'));
  assert.deepEqual(await validate(fixture), []);
});

test('criterion weights must form one complete comparison model', async () => {
  const record = clone(fixture);
  record.criteria[0].weight -= 1;
  assert.match((await validate(record)).join('\n'), /weights must total 100/);
});

test('references across candidates, evidence, assessments, and spikes must resolve', async () => {
  const record = clone(fixture);
  record.candidates[0].evidenceRefs.push('missing-evidence');
  record.evidence[0].candidateRefs.push('missing-candidate');
  record.spikes[0].candidateRefs.push('missing-candidate');
  const errors = (await validate(record)).join('\n');
  assert.match(errors, /unknown evidence/);
  assert.match(errors, /evidence .* unknown candidate/);
  assert.match(errors, /spike .* unknown candidate/);
});

test('researching records cannot recommend or approve a candidate', async () => {
  const record = clone(fixture);
  record.decision.status = 'approved';
  record.decision.recommendedCandidateId = 'shadcn-ui';
  record.decision.approval = {
    actorType: 'ai',
    actorId: 'generator',
    approvedAt: '2026-07-27T12:00:00+09:00',
    notes: 'Self-approved.',
  };
  const errors = (await validate(record)).join('\n');
  assert.match(errors, /researching record must keep decision status pending/);
  assert.match(errors, /cannot recommend/);
  assert.match(errors, /cannot contain approval/);
});

test('decision-ready adapter research requires equal assessment coverage, primary evidence, and a comparative spike', async () => {
  const record = clone(fixture);
  record.status = 'decision-ready';
  record.decision.status = 'recommended';
  record.decision.recommendedCandidateId = 'shadcn-ui';
  record.decision.rationale = 'Initial recommendation pending human approval.';
  const errors = (await validate(record)).join('\n');
  assert.match(errors, /missing assessment/);
  assert.match(errors, /completed comparative spike/);
});

test('only a human can approve a decision-ready research record', async () => {
  const record = clone(fixture);
  record.status = 'approved';
  record.decision.status = 'approved';
  record.decision.recommendedCandidateId = 'shadcn-ui';
  record.decision.rationale = 'Approved after comparison.';
  record.decision.approval = {
    actorType: 'ai',
    actorId: 'generator',
    approvedAt: '2026-07-27T12:00:00+09:00',
    notes: 'Automated approval.',
  };
  const errors = (await validate(record)).join('\n');
  assert.match(errors, /AI cannot approve/);
});

test('eliminated candidates require a concrete reason', async () => {
  const record = clone(fixture);
  record.candidates[0].disposition = 'eliminated';
  assert.match((await validate(record)).join('\n'), /requires an elimination reason/);
});
