import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  assertGenerationReady,
  validateGenerationManifest,
  validateLayoutRecipeRegistry,
  validateVisualProfileRegistry,
} from '../scripts/lib/generic-generation.mjs';
import {
  compileGenericReview,
  validateCompiledReview,
} from '../scripts/lib/generic-review-compiler.mjs';
import { renderGenericReviewHtml } from '../scripts/lib/generic-review-renderer.mjs';
import { browserRuntimeSource } from '../packages/html-runtime/src/index.mjs';
import { computeDirectionReviewDigest } from '../scripts/lib/structure-planning.mjs';
import {
  computeGenerationReportReviewDigest,
  createGenerationReport,
  validateGenerationReport,
} from '../scripts/lib/generation-report.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (ref) => readFileSync(join(root, ref), 'utf8');
const readJson = (ref) => JSON.parse(read(ref));
const clone = (value) => structuredClone(value);

const layoutRegistry = readJson('design/layout-recipe-registry.json');
const visualProfileRegistry = readJson('design/ui-generation-visual-profiles.json');
const manifest = readJson('examples/ui-generation/team-invitation.generation-manifest.json');
const issueManifest = readJson('test/fixtures/ui-generation/issue-triage.generation-manifest.json');
const sourceObjects = {
  adapterResolution: readJson(manifest.source.adapterResolution.ref),
  screenResponsibilities: readJson(manifest.source.screenResponsibilities.ref),
  patternSelection: readJson(manifest.source.patternSelection.ref),
  directionSet: readJson(manifest.source.directionSet.ref),
  visualProfiles: visualProfileRegistry,
  layoutRecipes: layoutRegistry,
  componentRegistry: readJson(manifest.source.componentRegistry.ref),
};

function readyFixture() {
  const value = clone(manifest);
  value.meta.mode = 'fixture';
  value.meta.status = 'ready';
  value.output = {
    reviewUi: 'test/fixtures/generated/team-invitation.review.html',
    reviewModel: 'test/fixtures/generated/team-invitation.review-model.json',
    usageManifest: 'test/fixtures/generated/team-invitation.usage.json',
  };
  const sources = clone(sourceObjects);
  sources.adapterResolution.meta.status = 'resolved';
  sources.adapterResolution.generationGate = { status: 'pass', reasons: [] };
  sources.directionSet.meta.status = 'approved';
  sources.directionSet.review = {
    status: 'approved',
    requiredRole: 'design-owner',
    approval: {
      actorType: 'human',
      actorId: 'test-design-owner',
      role: 'design-owner',
      decision: 'approved',
      selectedDirectionRef: value.directionRef,
      directionSetDigest: '',
      decidedAt: '2026-07-27T08:00:00Z',
    },
  };
  sources.directionSet.review.approval.directionSetDigest = computeDirectionReviewDigest(sources.directionSet);
  return { manifest: value, sources };
}

test('M6 Layout Recipe Registry and Generation Manifest satisfy standalone schemas', () => {
  assert.deepEqual(
    validateAgainstSchema(layoutRegistry, readJson('schemas/layout-recipe-registry.schema.json')),
    [],
  );
  assert.deepEqual(
    validateAgainstSchema(manifest, readJson('schemas/generation-manifest.schema.json')),
    [],
  );
});

test('visual profiles are explicit, adapter-independent, and structure-preserving', () => {
  assert.deepEqual(
    validateAgainstSchema(visualProfileRegistry, readJson('schemas/visual-profile-registry.schema.json')),
    [],
  );
  assert.deepEqual(validateVisualProfileRegistry(visualProfileRegistry), []);
  assert.deepEqual(
    visualProfileRegistry.profiles.map((profile) => profile.id),
    ['calm-utility', 'dense-operations', 'expressive-workspace'],
  );
  const unknown = clone(manifest);
  unknown.visualProfileRef = 'invented-profile';
  assert.match(validateGenerationManifest(unknown, { root }).join('\n'), /unknown visual profile/);
});

test('named layout recipes are complete, token-backed, and preserve DOM order', () => {
  assert.deepEqual(validateLayoutRecipeRegistry(layoutRegistry, { css: read('tokens/build/tokens.css') }), []);
  assert.deepEqual(
    layoutRegistry.recipes.map((recipe) => recipe.kind).sort(),
    ['cluster', 'grid', 'responsive-switch', 'section', 'stack'],
  );
  assert.ok(layoutRegistry.recipes.every((recipe) => recipe.preservesDomOrder));
  const responsive = layoutRegistry.recipes.find((recipe) => recipe.id === 'responsive-switch');
  assert.deepEqual(
    responsive.options.map((option) => option.name),
    ['breakpoint', 'wide-layout', 'narrow-layout'],
  );
});

test('blocked Team Invitation manifest remains structurally valid but cannot generate Review UI', () => {
  assert.deepEqual(validateGenerationManifest(manifest, { root }), []);
  assert.throws(() => assertGenerationReady(manifest, { root }), { code: 'GENERATION_GATE_BLOCKED' });
});

test('a passing fixture can validate without mutating production source artifacts', () => {
  const fixture = readyFixture();
  assert.deepEqual(validateGenerationManifest(fixture.manifest, {
    root,
    sources: fixture.sources,
    allowFixtureSourceOverrides: true,
  }), []);
  assert.equal(assertGenerationReady(fixture.manifest, {
    root,
    sources: fixture.sources,
    allowFixtureSourceOverrides: true,
  }), true);
  assert.equal(sourceObjects.adapterResolution.generationGate.status, 'blocked');
  assert.equal(sourceObjects.directionSet.review.status, 'pending');
});

test('production generation cannot inject an unapproved source override', () => {
  const forged = clone(sourceObjects.adapterResolution);
  forged.generationGate = { status: 'pass', reasons: [] };
  assert.match(
    validateGenerationManifest(manifest, {
      root,
      sources: { adapterResolution: forged },
      allowFixtureSourceOverrides: true,
    }).join('\n'),
    /source object overrides are allowed only for explicit fixture validation/,
  );
});

test('ready generation cannot bypass the exact Human-selected Direction', () => {
  const fixture = readyFixture();
  fixture.manifest.directionRef = 'direction_contextual_panel';
  assert.match(validateGenerationManifest(fixture.manifest, {
    root,
    sources: fixture.sources,
    allowFixtureSourceOverrides: true,
  }).join('\n'), /exact Human-selected Direction/);
});

test('manifest rejects raw implementation values, unknown recipes, and invalid recipe options', () => {
  const raw = clone(manifest);
  raw.screens[0].root.children[0].style = 'color: #fff; margin: 8px';
  assert.match(validateGenerationManifest(raw, { root }).join('\n'), /forbidden raw implementation field|raw color|raw dimension/);

  const unknown = clone(manifest);
  unknown.screens[0].root.recipeRef = 'invented-layout';
  assert.match(validateGenerationManifest(unknown, { root }).join('\n'), /unknown layout recipe/);

  const invalidOption = clone(manifest);
  invalidOption.screens[0].root.options[0].value = 'huge';
  assert.match(validateGenerationManifest(invalidOption, { root }).join('\n'), /value huge is not allowed/);

  for (const unsafe of [
    '<style>body{color:red}</style>',
    '#abcdef',
    'margin: 16px',
    'var(--private-token)',
  ]) {
    const arrayString = clone(manifest);
    arrayString.decisions[0].sourceRefs[0] = unsafe;
    assert.match(
      validateGenerationManifest(arrayString, { root }).join('\n'),
      /raw HTML|raw color|raw dimension|raw CSS/,
      `array string should be rejected: ${unsafe}`,
    );
  }
});

test('manifest rejects incomplete state coverage and incompatible capability use', () => {
  const missingState = clone(manifest);
  missingState.stateFixtures.pop();
  assert.match(validateGenerationManifest(missingState, { root }).join('\n'), /state fixtures must cover/);

  const wrongPresentation = clone(manifest);
  wrongPresentation.screens[0].root.children[1].presentation = 'action';
  assert.match(validateGenerationManifest(wrongPresentation, { root }).join('\n'), /requires action.trigger/);

  const fixture = readyFixture();
  const unresolved = fixture.manifest;
  fixture.sources.adapterResolution.results.find((item) =>
    item.capabilityRequirementRef === 'capability_invitation_statuses').status = 'unresolved';
  assert.match(validateGenerationManifest(unresolved, {
    root,
    sources: fixture.sources,
    allowFixtureSourceOverrides: true,
  }).join('\n'), /not generation-compatible/);
});

test('generic compiler expands capabilities into digest-bound Component usage and provenance', () => {
  const fixture = readyFixture();
  const compiled = compileGenericReview({
    manifest: fixture.manifest,
    sources: fixture.sources,
    root,
  });
  assert.deepEqual(validateCompiledReview({
    ...compiled,
    manifest: fixture.manifest,
    registry: fixture.sources.componentRegistry,
  }), []);
  assert.deepEqual(
    validateAgainstSchema(compiled.usage, readJson('schemas/component-usage.schema.json')),
    [],
  );
  assert.ok(compiled.usage.instances.length > fixture.manifest.screens.length);
  assert.ok(compiled.usage.instances.every((instance) =>
    instance.contractVersion && instance.decisionRef && instance.allowedVariants.length && instance.allowedStates.length));
  assert.deepEqual(
    new Set(compiled.usage.instances.map((instance) => instance.component)),
    new Set(['alert', 'button', 'description-list', 'dialog', 'form-field', 'select', 'status-indicator', 'table', 'text-field', 'validation-message', 'workflow-step']),
  );
});

test('generic renderer produces the same Review UI from the same inputs', () => {
  const fixture = readyFixture();
  const compiled = compileGenericReview({
    manifest: fixture.manifest,
    sources: fixture.sources,
    root,
  });
  const runtimeSource = browserRuntimeSource(fixture.sources.componentRegistry, compiled.composition);
  const render = () => renderGenericReviewHtml({
    model: compiled.model,
    usage: compiled.usage,
    runtimeSource,
    tokensCss: read('tokens/build/tokens.css'),
    runtimeCss: read('packages/html-runtime/styles/components.css'),
    layoutRegistry,
  });
  const first = render();
  const second = render();
  assert.equal(first, second);
  assert.match(first, /MERIDIAN_GENERIC_MODEL/);
  assert.match(first, /data-meridian-visual-profile="calm-utility"/);
  assert.match(first, /data-meridian-layout-recipe/);
  assert.match(first, /availableFixtures/);
  assert.match(first, /fixture\.screenRefs\.includes\(screenId\)/);
  assert.match(first, /data-collapse-at="tablet"/);
  assert.match(first, /data-breakpoint="mobile"/);
  assert.doesNotMatch(first, /describedBy:c\.description/);
  assert.match(first, /desktop/);
  assert.match(first, /tablet/);
  assert.match(first, /mobile/);
  assert.doesNotMatch(first, /phase-2-renderer|renderTeamInvitation/);
});

test('Generation Report is evidence-gated and requires digest-bound Human approval', () => {
  const fixture = readyFixture();
  const manifestBinding = {
    ref: 'test/fixtures/ui-generation/team-invitation.generation-manifest.json',
    digest: `sha256-${'0'.repeat(64)}`,
  };
  const policy = readJson('design/ui-generation-browser-qa-policy.json');
  const missing = createGenerationReport({
    manifest: fixture.manifest,
    manifestBinding,
    sources: fixture.sources,
    policy,
  });
  assert.deepEqual(
    validateAgainstSchema(missing, readJson('schemas/generation-report.schema.json')),
    [],
  );
  assert.equal(missing.meta.status, 'evidence-missing');
  assert.equal(missing.validation.status, 'not-run');
  assert.equal(missing.humanReview.approval, null);
  assert.deepEqual(validateGenerationReport(missing, fixture.manifest, fixture.sources, {
    validateSourceBindings: false,
  }), []);

  const browserEvidence = {
    meta: { status: 'pass' },
    scenarios: [],
    summary: {
      expected: 45,
      completed: 45,
      passed: 45,
      blocked: 0,
      criticalFindings: 0,
      majorFindings: 0,
      minorFindings: 0,
    },
  };
  const ready = createGenerationReport({
    manifest: fixture.manifest,
    manifestBinding,
    sources: fixture.sources,
    browserEvidence,
    browserEvidenceBinding: { ref: 'browser.evidence.json', digest: `sha256-${'1'.repeat(64)}` },
    policy,
  });
  assert.equal(ready.meta.status, 'ready-for-human-review');
  assert.equal(ready.validation.status, 'pass');
  assert.equal(ready.design.visualProfileRef, 'calm-utility');
  assert.deepEqual(validateGenerationReport(ready, fixture.manifest, fixture.sources, {
    browserEvidence,
    policy,
    allowSyntheticEvidence: true,
    validateSourceBindings: false,
  }), []);
  const staleAllocation = clone(ready);
  staleAllocation.componentAllocation[0].targetRefs = ['invented-component'];
  assert.match(
    validateGenerationReport(staleAllocation, fixture.manifest, fixture.sources, {
      browserEvidence,
      policy,
      allowSyntheticEvidence: true,
      validateSourceBindings: false,
    }).join('\n'),
    /component allocation is stale/,
  );
  const forgedQa = clone(ready);
  assert.match(
    validateGenerationReport(forgedQa, fixture.manifest, fixture.sources, {
      validateSourceBindings: false,
    }).join('\n'),
    /cannot claim Browser QA without bound evidence/,
  );

  const approved = clone(ready);
  approved.meta.status = 'approved';
  approved.humanReview.status = 'approved';
  approved.humanReview.approval = {
    actorType: 'human',
    actorId: 'test-design-owner',
    role: 'design-owner',
    decision: 'approved',
    reportDigest: '',
    decidedAt: '2026-07-27T12:30:00Z',
  };
  approved.humanReview.approval.reportDigest = computeGenerationReportReviewDigest(approved);
  assert.deepEqual(validateGenerationReport(approved, fixture.manifest, fixture.sources, {
    browserEvidence,
    policy,
    allowSyntheticEvidence: true,
    validateSourceBindings: false,
  }), []);
  approved.humanReview.approval.reportDigest = `sha256-${'f'.repeat(64)}`;
  assert.match(
    validateGenerationReport(approved, fixture.manifest, fixture.sources, {
      browserEvidence,
      policy,
      allowSyntheticEvidence: true,
      validateSourceBindings: false,
    }).join('\n'),
    /approval digest is stale/,
  );
});

test('independent Issue Triage pilot validates and has current generated artifacts', () => {
  assert.deepEqual(
    validateAgainstSchema(issueManifest, readJson('schemas/generation-manifest.schema.json')),
    [],
  );
  assert.equal(assertGenerationReady(issueManifest, { root }), true);
  const result = spawnSync(process.execPath, [
    'scripts/generate-generic-review.mjs',
    'test/fixtures/ui-generation/issue-triage.generation-manifest.json',
    '--check',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);

  const model = readJson(issueManifest.output.reviewModel);
  const usage = readJson(issueManifest.output.usageManifest);
  const html = read(issueManifest.output.reviewUi);
  assert.equal(model.screens[0].id, 'issue-triage');
  assert.equal(model.source.visualProfileRef, 'dense-operations');
  assert.deepEqual(
    new Set(usage.instances.map((instance) => instance.component)),
    new Set(['button', 'form-field', 'status-indicator', 'table', 'text-field', 'validation-message']),
  );
  assert.match(html, /Issue Triage/);
  assert.doesNotMatch(html, /team-invitation|renderIssueTriage/);
});

test('production Team Invitation remains blocked and the CLI cannot write its outputs', () => {
  for (const ref of Object.values(manifest.output)) assert.equal(existsSync(join(root, ref)), false);
  const result = spawnSync(process.execPath, [
    'scripts/generate-generic-review.mjs',
    'examples/ui-generation/team-invitation.generation-manifest.json',
  ], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /GENERATION_GATE_BLOCKED/);
  for (const ref of Object.values(manifest.output)) assert.equal(existsSync(join(root, ref)), false);
});
