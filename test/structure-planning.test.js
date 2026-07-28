import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  approveDirection,
  validateDirectionSet,
  validatePatternSelection,
  validateProductUiPatternRegistry,
  validateRequirementAllocation,
  validateScreenResponsibilities,
} from '../scripts/lib/structure-planning.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const brief = readJson('examples/ui-generation/team-invitation.design-brief.json');
const allocation = readJson('examples/ui-generation/team-invitation.requirement-allocation.json');
const responsibilities = readJson('examples/ui-generation/team-invitation.screen-responsibilities.json');
const patterns = readJson('design/product-ui-patterns.json');
const selection = readJson('examples/ui-generation/team-invitation.pattern-selection.json');
const directionSet = readJson('examples/ui-generation/team-invitation.direction-set.json');

test('M3 policy and Team Invitation structure artifacts satisfy their standalone schemas', () => {
  const pairs = [
    [patterns, 'schemas/product-ui-pattern-registry.schema.json'],
    [allocation, 'schemas/requirement-allocation.schema.json'],
    [responsibilities, 'schemas/screen-responsibilities.schema.json'],
    [selection, 'schemas/pattern-selection.schema.json'],
    [directionSet, 'schemas/direction-set.schema.json'],
  ];
  for (const [value, schemaPath] of pairs) {
    assert.deepEqual(validateAgainstSchema(value, readJson(schemaPath)), []);
  }
});

test('Pattern registry separates user-task patterns from component accessibility patterns', () => {
  assert.deepEqual(validateProductUiPatternRegistry(patterns), []);
  assert.ok(patterns.principles.some((principle) => principle.includes('WAI-ARIA APG')));
  assert.ok(patterns.patterns.every((pattern) => !('components' in pattern)));
});

test('Requirement Allocation covers every Brief action, constraint, and risk at 100 percent', () => {
  assert.deepEqual(validateRequirementAllocation(allocation, brief, { root }), []);
  assert.equal(allocation.coverage.required, allocation.coverage.allocated);
  assert.deepEqual(allocation.coverage.unallocatedRequirementRefs, []);
});

test('Requirement Allocation rejects missing source coverage and unallocated requirements', () => {
  const broken = clone(allocation);
  broken.requirements = broken.requirements.filter((requirement) => requirement.id !== 'req_duplicate_send');
  broken.allocations = broken.allocations.filter((item) => item.requirementRef !== 'req_duplicate_send');
  broken.coverage.required -= 1;
  broken.coverage.allocated -= 1;
  assert.match(
    validateRequirementAllocation(broken, brief, { root }).join('\n'),
    /risk:risk_duplicate_send is not represented/,
  );

  const unallocated = clone(allocation);
  unallocated.allocations = unallocated.allocations.filter((item) => item.requirementRef !== 'req_send');
  assert.match(
    validateRequirementAllocation(unallocated, brief, { root }).join('\n'),
    /unallocatedRequirementRefs is stale|requires 100% requirement coverage/,
  );
});

test('Screen Responsibilities own every allocated requirement and state explicit exclusions', () => {
  assert.deepEqual(validateScreenResponsibilities(responsibilities, allocation, { root }), []);
  assert.ok(responsibilities.responsibilities.every((item) => item.notResponsibleFor.length > 0));
});

test('Persistent or workflow placement cannot escape the declared responsibility boundary', () => {
  const broken = clone(allocation);
  broken.allocations[0].responsibilityRef = 'responsibility_manage';
  assert.match(
    validateScreenResponsibilities(responsibilities, broken, { root }).join('\n'),
    /places requirement outside responsibility/,
  );
});

test('Pattern Selection resolves registry patterns, evidence, requirements, and responsibilities', () => {
  assert.deepEqual(validatePatternSelection(selection, allocation, responsibilities, patterns, { root }), []);
});

test('Direction Set has three pairwise distinct structures with complete coverage', () => {
  assert.deepEqual(validateDirectionSet(directionSet, allocation, responsibilities, selection, patterns, { root }), []);
  assert.equal(directionSet.directions.length, 3);
  assert.equal(directionSet.review.status, 'pending');
  assert.equal(directionSet.review.approval, null);
});

test('Direction comparison rejects cosmetic alternatives that preserve the same structure', () => {
  const cosmetic = clone(directionSet);
  cosmetic.directions[1].structure = clone(cosmetic.directions[0].structure);
  assert.match(
    validateDirectionSet(cosmetic, allocation, responsibilities, selection, patterns, { root }).join('\n'),
    /differ in only 0 structural dimensions/,
  );
});

test('Only a Design Owner human can approve an exact Direction Set digest', () => {
  const approved = approveDirection(directionSet, {
    actorType: 'human',
    actorId: 'design-owner-1',
    role: 'design-owner',
    decision: 'approved',
    selectedDirectionRef: 'direction_dedicated_stages',
    decidedAt: '2026-07-27T06:00:00Z',
    notes: 'The dedicated staged workspace is selected.',
  }, patterns);
  assert.deepEqual(validateDirectionSet(approved, allocation, responsibilities, selection, patterns, { root }), []);

  const stale = clone(approved);
  stale.directions[0].hypothesis = 'Changed after approval.';
  assert.match(
    validateDirectionSet(stale, allocation, responsibilities, selection, patterns, { root }).join('\n'),
    /direction approval digest is stale/,
  );

  assert.throws(
    () => approveDirection(directionSet, {
      actorType: 'ai',
      actorId: 'generator',
      role: 'design-owner',
      decision: 'approved',
      selectedDirectionRef: 'direction_dedicated_stages',
      decidedAt: '2026-07-27T06:00:00Z',
      notes: 'Automated selection.',
    }, patterns),
    /AI cannot approve/,
  );
});
