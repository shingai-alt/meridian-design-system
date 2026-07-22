const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const policy = readJson('design/implementation-readiness.json');
const contracts = readdirSync(join(root, 'design/contracts/components'))
  .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
  .map((name) => readJson(`design/contracts/components/${name}`));

test('implementation-ready contracts satisfy the shared machine gate', async () => {
  const { validateImplementationReadiness } = await import('../scripts/lib/implementation-readiness.mjs');
  const errors = contracts.flatMap((contract) => validateImplementationReadiness(contract, policy));
  assert.deepEqual(errors, []);
});

test('the shared gate uses one exact criterion set for every ready contract', () => {
  const expected = policy.requiredCriteria.map(({ id }) => id);
  const ready = contracts.filter((contract) => contract.implementationReadiness?.status === 'ready');
  assert.ok(ready.length, 'at least one contract must exercise the readiness gate');
  for (const contract of ready) {
    assert.deepEqual(contract.implementationReadiness.criteria.map(({ id }) => id), expected, `${contract.id} criterion drift`);
  }
});

test('complete token bindings cannot bypass the shared gate with candidate evidence', async () => {
  const { validateImplementationReadiness } = await import('../scripts/lib/implementation-readiness.mjs');
  const button = structuredClone(contracts.find((contract) => contract.id === 'button'));
  button.implementationReadiness.status = 'candidate';

  assert.ok(
    validateImplementationReadiness(button, policy).some((error) => error.includes('must be ready')),
    'a complete contract must not bypass the gate by downgrading its evidence status',
  );
});

test('ready evidence fails when a criterion or required state scenario is missing', async () => {
  const { validateImplementationReadiness } = await import('../scripts/lib/implementation-readiness.mjs');
  const button = structuredClone(contracts.find((contract) => contract.id === 'button'));
  button.implementationReadiness.criteria = button.implementationReadiness.criteria.slice(1);
  button.requiredScenarios = button.requiredScenarios.filter((scenario) => scenario !== 'focus');

  const errors = validateImplementationReadiness(button, policy);
  assert.ok(errors.some((error) => error.includes('missing criterion intent-boundary')));
  assert.ok(errors.some((error) => error.includes('requiredScenarios must include state focus')));
});
