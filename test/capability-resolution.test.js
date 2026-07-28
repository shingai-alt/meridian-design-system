import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  compareAdapterResolutions,
  resolveCapabilityPlan,
  validateAdapterRegistry,
  validateAdapterResolution,
  validateCapabilityPlan,
  validateCapabilityTaxonomy,
} from '../scripts/lib/capability-resolution.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const taxonomy = readJson('design/capability-taxonomy.json');
const registry = readJson('design/adapter-registry.json');
const tokenMapping = readJson('design/generated/adapter-token-mapping.json');
const config = readJson('meridian.design.json');
const plan = readJson('examples/ui-generation/team-invitation.capability-plan.json');
const resolution = readJson('examples/ui-generation/team-invitation.adapter-resolution.json');
const directionSet = readJson('examples/ui-generation/team-invitation.direction-set.json');
const responsibilities = readJson('examples/ui-generation/team-invitation.screen-responsibilities.json');
const allocation = readJson('examples/ui-generation/team-invitation.requirement-allocation.json');
const digestValue = (value) => `sha256-${createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex')}`;

function materializeResolverInputs(planValue, registryValue, extraFiles = {}, tokenMappingValue = tokenMapping) {
  const tempRoot = mkdtempSync(join(tmpdir(), 'meridian-capability-resolution-'));
  const planRef = 'plan.json';
  const registryRef = 'registry.json';
  const tokenMappingRef = 'token-mapping.json';
  writeFileSync(join(tempRoot, planRef), `${JSON.stringify(planValue, null, 2)}\n`);
  writeFileSync(join(tempRoot, registryRef), `${JSON.stringify(registryValue, null, 2)}\n`);
  writeFileSync(join(tempRoot, tokenMappingRef), `${JSON.stringify(tokenMappingValue, null, 2)}\n`);
  for (const [ref, value] of Object.entries(extraFiles)) {
    mkdirSync(dirname(join(tempRoot, ref)), { recursive: true });
    writeFileSync(join(tempRoot, ref), typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`);
  }
  return {
    root: tempRoot,
    capabilityPlanRef: planRef,
    capabilityPlanDigest: digestValue(planValue),
    adapterRegistryRef: registryRef,
    adapterRegistryDigest: digestValue(registryValue),
    tokenMappingRef,
    tokenMappingDigest: digestValue(tokenMappingValue),
    tokenMapping: tokenMappingValue,
  };
}

function approvedExternalDecision(adapterId) {
  return {
    kind: 'ui-generation-research-decision',
    decision: {
      status: 'approved',
      recommendedCandidateId: adapterId,
      approval: { actorType: 'human', actorId: 'owner', approvedAt: '2026-07-27T08:00:00Z', notes: 'Approved.' },
    },
  };
}

test('M5 taxonomy, Capability Plan, Adapter Registry, and resolution satisfy schemas and semantic contracts', () => {
  const pairs = [
    [taxonomy, 'schemas/capability-taxonomy.schema.json'],
    [registry, 'schemas/adapter-registry.schema.json'],
    [plan, 'schemas/capability-plan.schema.json'],
    [resolution, 'schemas/adapter-resolution.schema.json'],
  ];
  for (const [value, schemaPath] of pairs) {
    assert.deepEqual(validateAgainstSchema(value, readJson(schemaPath)), []);
  }
  assert.deepEqual(validateCapabilityTaxonomy(taxonomy), []);
  assert.deepEqual(validateCapabilityPlan(plan, directionSet, taxonomy, responsibilities, allocation, { root }), []);
  const components = readdirSync(join(root, 'design/contracts/components'))
    .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
    .map((name) => name.replace(/\.contract\.json$/, ''));
  assert.deepEqual(validateAdapterRegistry(registry, taxonomy, config, { root, knownComponentRefs: components }), []);
  assert.deepEqual(validateAdapterResolution(resolution, plan, registry, {
    root,
    tokenMapping,
    stableProjectTargetRefs: [],
  }), []);
});

test('Capability Plan is library-independent and covers every product requirement', () => {
  assert.ok(plan.requirements.every((item) => !('componentRef' in item) && !('adapterRef' in item) && !('targetRefs' in item)));
  assert.deepEqual(plan.coverage.uncoveredRequirementRefs, []);
  assert.equal(
    new Set(plan.coverage.coveredRequirementRefs).size,
    allocation.requirements.length,
  );
});

test('unapproved Direction cannot silently become a ready Capability Plan', () => {
  const broken = clone(plan);
  broken.meta.status = 'ready';
  assert.match(
    validateCapabilityPlan(broken, directionSet, taxonomy, responsibilities, allocation, { root }).join('\n'),
    /unapproved Direction Set requires blocked status/,
  );
});

test('Capability Plan cannot omit a taxonomy-mandatory semantic', () => {
  const broken = clone(plan);
  broken.requirements.find((item) => item.id === 'capability_primary_actions').requiredSemantics = ['accessible-name'];
  assert.match(
    validateCapabilityPlan(broken, directionSet, taxonomy, responsibilities, allocation, { root }).join('\n'),
    /omits mandatory semantic native-activation/,
  );
});

test('an approved Direction Set cannot retain recommendation-basis planning', () => {
  const approvedDirection = clone(directionSet);
  approvedDirection.meta.status = 'approved';
  approvedDirection.review.status = 'approved';
  approvedDirection.review.approval = {
    actorType: 'human',
    actorId: 'owner',
    role: 'design-owner',
    decision: 'approved',
    selectedDirectionRef: 'direction_compact_drawer',
    decidedAt: '2026-07-27T08:00:00Z',
    notes: 'Approved alternate.',
    directionSetDigest: 'sha256-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  };
  assert.match(
    validateCapabilityPlan(plan, approvedDirection, taxonomy, responsibilities, allocation, { root }).join('\n'),
    /approved Direction Set requires human-approval selectionBasis/,
  );
});

test('strict resolver rejects pending adapters and never guesses an unknown capability', () => {
  const withUnknown = clone(plan);
  withUnknown.requirements.push({
    ...clone(withUnknown.requirements[0]),
    id: 'capability_unknown',
    capabilityRef: 'input.unknown',
  });
  const inputs = materializeResolverInputs(withUnknown, registry);
  const actual = resolveCapabilityPlan(withUnknown, registry, {
    ...inputs,
    adapterRefs: ['meridian_react_pilot'],
    generatedAt: '2026-07-27T07:05:00Z',
  });
  assert.deepEqual(actual.policy.eligibleAdapterRefs, []);
  assert.ok(actual.results.every((item) => item.status === 'unresolved'));
  assert.equal(actual.generationGate.status, 'blocked');
});

test('partial support is explicit and blocks generation', () => {
  const partialRegistry = clone(registry);
  partialRegistry.adapters[0].bindings[0].supportedStates = ['default'];
  const inputs = materializeResolverInputs(plan, partialRegistry);
  const actual = resolveCapabilityPlan(plan, partialRegistry, {
    ...inputs,
    generatedAt: '2026-07-27T07:05:00Z',
  });
  const action = actual.results.find((item) => item.capabilityRequirementRef === 'capability_primary_actions');
  assert.equal(action.status, 'partial');
  assert.deepEqual(action.missingStates, ['loading', 'disabled']);
  assert.equal(actual.generationGate.status, 'blocked');
});

test('the same plan can be re-resolved through a different approved adapter and diffed', () => {
  const switchedRegistry = clone(registry);
  const alternate = clone(switchedRegistry.adapters[0]);
  alternate.id = 'alternate_test_adapter';
  alternate.kind = 'project';
  alternate.priority = 1;
  alternate.approval = { status: 'project-existing', decisionRef: 'test-project-config' };
  alternate.bindings = alternate.bindings.map((binding) => ({
    ...binding,
    maturity: 'stable',
    targetRefs: binding.targetRefs.map((target) => `alternate/${target}`),
  }));
  switchedRegistry.adapters.push(alternate);
  const inputs = materializeResolverInputs(plan, switchedRegistry);
  const switched = resolveCapabilityPlan(plan, switchedRegistry, {
    ...inputs,
    adapterRefs: ['alternate_test_adapter'],
    generatedAt: '2026-07-27T07:05:00Z',
  });
  assert.ok(switched.results.every((item) => item.adapterRef === 'alternate_test_adapter'));
  assert.ok(compareAdapterResolutions(resolution, switched).every((item) => item.changed));
});

test('project-existing-first cannot be inverted by a lower external priority', () => {
  const mixed = clone(registry);
  const external = clone(mixed.adapters[0]);
  external.id = 'external_test_adapter';
  external.kind = 'external';
  external.priority = 0;
  external.approval = { status: 'approved', decisionRef: 'decision.json' };
  external.bindings = external.bindings.map((binding) => ({
    ...binding,
    maturity: 'stable',
    targetRefs: binding.targetRefs.map((target) => `external/${target}`),
  }));
  mixed.adapters.push(external);
  const inputs = materializeResolverInputs(plan, mixed, {
    'decision.json': approvedExternalDecision('external_test_adapter'),
  });
  const actual = resolveCapabilityPlan(plan, mixed, {
    ...inputs,
    generatedAt: '2026-07-27T07:05:00Z',
  });
  assert.ok(actual.results.every((item) => item.adapterRef === 'meridian_html_runtime'));
});

test('an external adapter cannot claim approval without the exact Human research decision', () => {
  const invalidConfig = clone(config);
  invalidConfig.designSystem.adapters.push({
    id: 'external_test_adapter',
    kind: 'external',
    status: 'available',
    priority: 1,
    root: null,
    packageName: null,
    componentSources: [],
    tokenSources: [],
    themeSources: [],
    iconSources: [],
    catalogSources: [],
  });
  const invalidRegistry = clone(registry);
  const external = clone(invalidRegistry.adapters[0]);
  external.id = 'external_test_adapter';
  external.kind = 'external';
  external.priority = 1;
  external.approval = {
    status: 'approved',
    decisionRef: 'design/research-decisions/ui-generation-reference-adapter.research.json',
  };
  invalidRegistry.adapters.push(external);
  assert.match(
    validateAdapterRegistry(invalidRegistry, taxonomy, invalidConfig, { root }).join('\n'),
    /requires a Human-approved research decision|is not the approved recommended candidate/,
  );
});

test('strict resolver rejects a self-asserted external approval when its decision is missing', () => {
  const fakeRegistry = clone(registry);
  fakeRegistry.adapters[0].availability = 'disabled';
  const external = clone(registry.adapters[0]);
  external.id = 'external_test_adapter';
  external.kind = 'external';
  external.approval = { status: 'approved', decisionRef: 'missing-decision.json' };
  fakeRegistry.adapters.push(external);
  const inputs = materializeResolverInputs(plan, fakeRegistry);
  const actual = resolveCapabilityPlan(plan, fakeRegistry, {
    ...inputs,
    generatedAt: '2026-07-27T07:05:00Z',
  });
  assert.deepEqual(actual.policy.eligibleAdapterRefs, []);
  assert.ok(actual.results.every((item) => item.status === 'unresolved'));
});

test('project bindings cannot promote draft component contracts to stable', () => {
  const promoted = clone(registry);
  promoted.adapters[0].bindings.forEach((binding) => {
    binding.maturity = 'stable';
  });
  const components = readdirSync(join(root, 'design/contracts/components'))
    .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
    .map((name) => {
      const id = name.replace(/\.contract\.json$/, '');
      return [id, readJson(`design/contracts/components/${name}`).status];
    });
  assert.match(
    validateAdapterRegistry(promoted, taxonomy, config, {
      root,
      knownComponentRefs: components.map(([id]) => id),
      componentStatuses: components,
    }).join('\n'),
    /cannot mark non-stable project component/,
  );
  const inputs = materializeResolverInputs(plan, promoted);
  const actual = resolveCapabilityPlan(plan, promoted, {
    ...inputs,
    generatedAt: '2026-07-27T07:05:00Z',
  });
  assert.equal(actual.summary.resolved, 0);
  assert.equal(actual.summary.provisional, 9);
  assert.equal(actual.summary.partial, 0);
});

test('strict resolver rejects caller objects that differ from digest-bound sources', () => {
  const inputs = materializeResolverInputs(plan, registry);
  const mutated = clone(registry);
  mutated.adapters[0].priority = 999;
  assert.throws(
    () => resolveCapabilityPlan(plan, mutated, { ...inputs, generatedAt: '2026-07-27T07:05:00Z' }),
    /Adapter Registry object differs from its digest-bound source/,
  );
});
