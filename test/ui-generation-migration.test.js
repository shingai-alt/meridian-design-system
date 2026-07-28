import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import { validateUiGenerationMigrationMap } from '../scripts/lib/ui-generation-migration.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const schema = readJson('schemas/ui-generation-migration-map.schema.json');
const policy = readJson('design/ui-generation-session-policy.json');
const fixture = readJson('examples/ui-generation/team-invitation.migration.json');

test('Team Invitation migration map satisfies schema and semantic integrity', () => {
  assert.deepEqual(validateAgainstSchema(fixture, schema), []);
  assert.deepEqual(validateUiGenerationMigrationMap(fixture, policy, { root }), []);
});

test('Migration inventory preserves every named Phase 1 and Phase 2 artifact family', () => {
  const kinds = new Set(fixture.sourceArtifacts.map((artifact) => artifact.legacyKind));
  assert.deepEqual(kinds, new Set([
    'phase-1-package',
    'screen-spec',
    'flow-spec',
    'phase-2-concept',
    'component-composition',
    'component-usage',
    'review-ui',
    'visual-review',
  ]));
  assert.equal(fixture.sourceArtifacts.filter((artifact) => artifact.legacyKind === 'screen-spec').length, 4);
});

test('Migration map rejects stale source evidence and unmapped legacy artifacts', () => {
  const stale = clone(fixture);
  stale.sourceArtifacts[0].digest = `sha256-${'0'.repeat(64)}`;
  assert.match(validateUiGenerationMigrationMap(stale, policy, { root }).join('\n'), /digest is stale/);

  const unmapped = clone(fixture);
  const sourceId = unmapped.sourceArtifacts.at(-1).id;
  for (const mapping of unmapped.mappings) {
    mapping.sourceArtifactRefs = mapping.sourceArtifactRefs.filter((ref) => ref !== sourceId);
  }
  assert.match(validateUiGenerationMigrationMap(unmapped, policy, { root }).join('\n'), new RegExp(`source artifact ${sourceId} is not preserved`));
});

test('Target coverage must cover the complete Session artifact taxonomy', () => {
  const incomplete = clone(fixture);
  incomplete.targetCoverage.pop();
  assert.match(validateUiGenerationMigrationMap(incomplete, policy, { root }).join('\n'), /target coverage is missing generation_report/);

  const invalidReady = clone(fixture);
  const projectContext = invalidReady.targetCoverage.find((coverage) => coverage.targetArtifactType === 'project_context');
  projectContext.status = 'ready';
  assert.match(validateUiGenerationMigrationMap(invalidReady, policy, { root }).join('\n'), /ready coverage project_context cannot retain a gap/);
});

test('Migration cannot place a session in a state whose required targets are incomplete', () => {
  const unsafe = clone(fixture);
  unsafe.placement.recommendedState = 'project_inspected';
  assert.match(validateUiGenerationMigrationMap(unsafe, policy, { root }).join('\n'), /cannot enter project_inspected/);
});

test('Legacy progress remains explicit instead of claiming new-workflow completion', () => {
  assert.equal(fixture.placement.recommendedState, 'created');
  assert.equal(fixture.placement.nextState, 'project_inspected');
  assert.ok(fixture.placement.blockingTargetTypes.includes('project_context'));
  assert.ok(fixture.targetCoverage.some((coverage) => coverage.status === 'missing'));
  assert.ok(fixture.blockers.some((blocker) => blocker.targetArtifactTypes.includes('browser_quality_report')));
});
