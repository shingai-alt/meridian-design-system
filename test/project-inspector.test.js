import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import { validateUiGenerationResearchDecision } from '../scripts/lib/ui-generation-research-decision.mjs';
import {
  inspectProject,
  inferTechnology,
  loadMeridianDesignConfig,
  selectProjectAdapter,
  validateMeridianDesignConfig,
  validateProjectContext,
} from '../scripts/lib/project-inspector.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const config = readJson('meridian.design.json');
const context = readJson('examples/ui-generation/meridian.project-context.json');
const configDecision = readJson('design/research-decisions/ui-generation-project-config.research.json');

test('Meridian design config and generated Project Context satisfy their contracts', () => {
  assert.deepEqual(validateAgainstSchema(config, readJson('schemas/meridian-design-config.schema.json')), []);
  assert.deepEqual(validateMeridianDesignConfig(config, { root }), []);
  assert.deepEqual(validateAgainstSchema(context, readJson('schemas/project-context.schema.json')), []);
  assert.deepEqual(validateProjectContext(context, { root }), []);
});

test('Project configuration recommendation is evidence-backed and remains Human Approval gated', () => {
  assert.deepEqual(
    validateAgainstSchema(configDecision, readJson('schemas/ui-generation-research-decision.schema.json')),
    []
  );
  assert.deepEqual(
    validateUiGenerationResearchDecision(configDecision, readJson('design/ui-generation-research-policy.json')),
    []
  );
  assert.equal(configDecision.status, 'decision-ready');
  assert.equal(configDecision.decision.recommendedCandidateId, 'json-sidecar');
  assert.equal(configDecision.decision.approval, null);
  assert.ok(configDecision.spikes.some((spike) => spike.status === 'complete'));
});

test('Project Inspector deterministically reproduces the checked-in Meridian context', () => {
  assert.deepEqual(inspectProject({ root }), context);
  assert.equal(context.unresolved.length, 0);
});

test('Explicit declarations and inferred observations remain distinguishable', () => {
  const explicit = context.findings.filter((finding) => finding.provenance === 'explicit');
  const inferred = context.findings.filter((finding) => finding.provenance === 'inferred');
  assert.ok(explicit.length > 0);
  assert.ok(inferred.length > 0);
  assert.ok(explicit.every((finding) => finding.confidence === 1));
  assert.ok(inferred.every((finding) => finding.confidence < 1));
  assert.ok(context.findings.every((finding) => finding.evidence.length > 0));
});

test('Meridian inspection finds the HTML runtime, React pilot, tokens, themes, catalogs, and required quality matrix', () => {
  assert.equal(context.adapterSelection.selectedAdapterId, 'meridian_html_runtime');
  assert.equal(context.adapterSelection.candidates.find((candidate) => candidate.id === 'meridian_html_runtime').availability, 'available');
  assert.equal(context.adapterSelection.candidates.find((candidate) => candidate.id === 'meridian_react_pilot').availability, 'candidate');
  assert.deepEqual(context.qualityRequirements.requiredViewports, ['desktop', 'tablet', 'mobile']);
  assert.deepEqual(context.qualityRequirements.requiredStates, ['default', 'loading', 'empty', 'error', 'permission']);
  assert.ok(context.findings.some((finding) => finding.category === 'token-format' && finding.values.includes('dtcg-2025.10')));
  assert.ok(context.findings.some((finding) => finding.category === 'catalog'));
  assert.ok(context.findings.some((finding) => finding.category === 'form-system'));
  assert.ok(context.findings.some((finding) => finding.category === 'table-system'));
});

test('Auto inspection infers technologies only from package and source evidence', () => {
  const manifests = [{ path: 'package.json', value: { dependencies: { react: '^18.0.0' } } }];
  const files = ['index.html', 'tokens/build/tokens.css', 'scripts/validate-system.mjs'];
  const frameworks = inferTechnology('frameworks', manifests, files, { root });
  const styling = inferTechnology('styling', manifests, files, { root });
  const runtime = inferTechnology('runtime', manifests, files, { root });
  assert.deepEqual(frameworks.values, ['react']);
  assert.ok(frameworks.evidence.some((item) => item.path === 'package.json'));
  assert.ok(styling.values.includes('plain-css'));
  assert.ok(styling.values.includes('css-custom-properties'));
  assert.ok(runtime.values.includes('node'));
  assert.ok(runtime.values.includes('browser'));
  assert.ok([...frameworks.evidence, ...styling.evidence, ...runtime.evidence].every((item) => item.path));
});

test('Project-existing-first wins over a higher-priority external adapter', () => {
  const candidates = [
    { id: 'external_default', kind: 'external', availability: 'available', priority: 0 },
    { id: 'project_components', kind: 'project', availability: 'available', priority: 100 },
  ];
  assert.equal(selectProjectAdapter(candidates).selectedAdapterId, 'project_components');
});

test('External adapter is selected only when no project adapter is available', () => {
  const candidates = [
    { id: 'project_candidate', kind: 'project', availability: 'candidate', priority: 0 },
    { id: 'external_default', kind: 'external', availability: 'available', priority: 50 },
  ];
  assert.equal(selectProjectAdapter(candidates).selectedAdapterId, 'external_default');
});

test('Config validation rejects missing sources and invalid explicit versus auto claims', () => {
  const broken = clone(config);
  broken.designSystem.adapters[0].componentSources.push('missing/components');
  broken.technology.frameworks.mode = 'auto';
  const errors = validateMeridianDesignConfig(broken, { root }).join('\n');
  assert.ok(errors.includes('configured path does not exist: missing/components'));
  assert.match(errors, /auto mode cannot claim explicit values/);
});

test('Config loader rejects paths outside the inspected project', () => {
  assert.throws(
    () => loadMeridianDesignConfig({ root, configRef: '../meridian.design.json' }),
    /does not exist within project root/
  );
});

test('Project Context rejects stale config digests and external selection while a project adapter is available', () => {
  const stale = clone(context);
  stale.inspection.configDigest = `sha256-${'0'.repeat(64)}`;
  assert.match(validateProjectContext(stale, { root }).join('\n'), /configuration digest is stale/);

  const wrongSelection = clone(context);
  wrongSelection.adapterSelection.candidates.push({
    id: 'external_default',
    kind: 'external',
    configuredStatus: 'available',
    availability: 'available',
    priority: 0,
    evidencePaths: ['package.json'],
    unresolvedReasons: [],
  });
  wrongSelection.adapterSelection.selectedAdapterId = 'external_default';
  assert.match(validateProjectContext(wrongSelection, { root }).join('\n'), /project-existing-first requires selecting meridian_html_runtime/);
});
