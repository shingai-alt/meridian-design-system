#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from './lib/schema-validator.mjs';
import { renderPhase2Html } from './lib/phase-2-renderer.mjs';
import { validatePhaseTwoCoverage } from './lib/phase-2-validation.mjs';
import { createVisualReviewReport, validateVisualCaptureManifest, validateVisualQualityRelations } from './lib/visual-quality.mjs';
import {
  assertGroundingReady,
  createGroundingReport,
  validateCandidateStrategyRelations,
  validatePrincipleRelations,
  validateReferenceRetrieval,
  validateStrategyRelations,
  validateVisualCritiqueRelations,
} from './lib/design-intelligence.mjs';
import { browserRuntimeSource } from '../packages/html-runtime/src/index.mjs';
import { auditRendererUsage, createUsageManifest } from '../packages/html-runtime/src/harness-core.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checkOnly = process.argv.includes('--check');
const manifestPaths = ['examples/phase-2/team-invitation.phase2.json'];

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), 'utf8'));
}

function assertValid(value, schemaPath, label) {
  const errors = validateAgainstSchema(value, readJson(schemaPath), { label });
  if (errors.length) throw new Error(errors.join('\n'));
}

function assertConceptRelations(manifest, phaseOne) {
  if (phaseOne.meta.id !== manifest.source.sourcePackageId) {
    throw new Error(`${manifest.meta.id}: sourcePackageId does not match ${phaseOne.meta.id}`);
  }
  if (phaseOne.meta.status !== 'approved' || phaseOne.review.status !== 'approved') {
    throw new Error(`${manifest.meta.id}: Phase 1 source and human review must be approved`);
  }
  const scenarioIds = manifest.prototype.scenarios.map((scenario) => scenario.id);
  if (new Set(scenarioIds).size !== scenarioIds.length) throw new Error(`${manifest.meta.id}: scenario IDs must be unique`);
  if (!scenarioIds.includes(manifest.prototype.startScenario)) throw new Error(`${manifest.meta.id}: startScenario does not exist`);
  const coverageErrors = validatePhaseTwoCoverage(manifest);
  if (coverageErrors.length) throw new Error(`${manifest.meta.id}: ${coverageErrors.join(`\n${manifest.meta.id}: `)}`);
}

const tokensCss = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const runtimeCss = readFileSync(join(root, 'packages/html-runtime/styles/components.css'), 'utf8');
const registry = readJson('design/harness/generated/component-registry.json');
const rendererSource = readFileSync(join(root, 'scripts/lib/phase-2-renderer.mjs'), 'utf8');
let changed = 0;

function writeGenerated(relPath, content) {
  const outputPath = join(root, relPath);
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null;
  if (current === content) return;
  changed += 1;
  if (checkOnly) {
    console.error(`${relPath}: generated output is stale`);
  } else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, content);
    console.log(`Generated ${relative(root, outputPath)}`);
  }
}

for (const manifestPath of manifestPaths) {
  const manifest = readJson(manifestPath);
  assertValid(manifest, 'schemas/phase-2-concept.schema.json', manifestPath);
  const phaseOne = readJson(manifest.source.phaseOnePackage);
  assertValid(phaseOne, 'schemas/phase-1-package.schema.json', manifest.source.phaseOnePackage);
  assertConceptRelations(manifest, phaseOne);
  const composition = readJson(manifest.generation.componentComposition);
  assertValid(composition, 'schemas/component-composition.schema.json', manifest.generation.componentComposition);
  registry.sourcePackageIds = [phaseOne.meta.id];
  const renderSites = auditRendererUsage({ source: rendererSource, composition });
  const usage = createUsageManifest({ composition, registry, concept: manifest, sourcePackageId: phaseOne.meta.id, renderSites });
  assertValid(usage, 'schemas/component-usage.schema.json', manifest.generation.usageOutput);
  const referenceManifest = readJson(manifest.generation.referenceManifest);
  const designPrinciples = readJson(manifest.generation.designPrinciples);
  const designStrategies = readJson(manifest.generation.designStrategies);
  assertValid(referenceManifest, 'schemas/reference-retrieval.schema.json', manifest.generation.referenceManifest);
  assertValid(designPrinciples, 'schemas/design-principles-pack.schema.json', manifest.generation.designPrinciples);
  assertValid(designStrategies, 'schemas/design-strategies.schema.json', manifest.generation.designStrategies);
  validateReferenceRetrieval({ manifest: referenceManifest, conceptId: manifest.meta.id, sourcePackageId: phaseOne.meta.id, root });
  validatePrincipleRelations({ principles: designPrinciples, references: referenceManifest, conceptId: manifest.meta.id, referenceManifestRef: manifest.generation.referenceManifest });
  validateStrategyRelations({ strategies: designStrategies, principles: designPrinciples, conceptId: manifest.meta.id, principlesRef: manifest.generation.designPrinciples });
  const grounding = createGroundingReport({ strategies: designStrategies, registry, strategiesRef: manifest.generation.designStrategies });
  assertValid(grounding, 'schemas/grounding-report.schema.json', manifest.generation.groundingOutput);
  assertGroundingReady(grounding);
  const visualRubric = readJson(manifest.generation.visualRubric);
  const visualCandidates = readJson(manifest.generation.visualCandidates);
  const visualCritique = readJson(manifest.generation.visualCritique);
  assertValid(visualRubric, 'schemas/visual-quality-rubric.schema.json', manifest.generation.visualRubric);
  assertValid(visualCandidates, 'schemas/visual-candidates.schema.json', manifest.generation.visualCandidates);
  assertValid(visualCritique, 'schemas/visual-critique.schema.json', manifest.generation.visualCritique);
  validateVisualQualityRelations({ rubric: visualRubric, candidates: visualCandidates, conceptId: manifest.meta.id });
  validateCandidateStrategyRelations({ candidates: visualCandidates, strategies: designStrategies, principles: designPrinciples });
  const html = renderPhase2Html({ manifest, phaseOne, tokensCss, runtimeCss, registry, usage, browserRuntime: browserRuntimeSource(registry, composition), referenceManifest, designPrinciples, designStrategies, grounding, visualRubric, visualCandidates });
  writeGenerated(manifest.generation.output, html);
  writeGenerated(manifest.generation.usageOutput, `${JSON.stringify(usage, null, 2)}\n`);
  writeGenerated(manifest.generation.groundingOutput, `${JSON.stringify(grounding, null, 2)}\n`);

  const visualCaptureManifest = readJson('examples/generated/visual-review/manifest.json');
  validateVisualCaptureManifest({
    manifest: visualCaptureManifest,
    candidates: visualCandidates,
    conceptId: manifest.meta.id,
    expectedScenarioId: manifest.prototype.startScenario,
    root,
    sourcePaths: { html: manifest.generation.output, candidates: manifest.generation.visualCandidates, rubric: manifest.generation.visualRubric },
  });
  validateVisualCritiqueRelations({ critique: visualCritique, captureManifest: visualCaptureManifest, candidates: visualCandidates, rubric: visualRubric });
  const visualReview = createVisualReviewReport({ rubric: visualRubric, candidates: visualCandidates, visualCritique });
  assertValid(visualReview, 'schemas/visual-review-report.schema.json', manifest.generation.visualReviewOutput);

  writeGenerated(manifest.generation.visualReviewOutput, `${JSON.stringify(visualReview, null, 2)}\n`);
}

if (checkOnly && changed) process.exitCode = 1;
if (checkOnly && !changed) console.log(`Phase 2 generation check passed: ${manifestPaths.length} concept(s), Component Harness ${registry.runtimeVersion}.`);
