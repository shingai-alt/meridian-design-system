#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from './lib/schema-validator.mjs';
import { validateResearchGate } from './lib/research-gate.mjs';
import { validatePhaseTwoCoverage } from './lib/phase-2-validation.mjs';
import { validateImplementationReadiness } from './lib/implementation-readiness.mjs';
import { validateUiGenerationResearchDecision } from './lib/ui-generation-research-decision.mjs';
import {
  validateUiGenerationSession,
  validateUiGenerationSessionPolicy,
} from './lib/ui-generation-session.mjs';
import { validateUiGenerationMigrationMap } from './lib/ui-generation-migration.mjs';
import {
  validateMeridianDesignConfig,
  validateProjectContext,
} from './lib/project-inspector.mjs';
import {
  validateClarificationRound,
  validateDesignBrief,
} from './lib/design-intake.mjs';
import {
  validateDirectionSet,
  validatePatternSelection,
  validateProductUiPatternRegistry,
  validateRequirementAllocation,
  validateScreenResponsibilities,
} from './lib/structure-planning.mjs';
import {
  validateAdapterRegistry,
  validateAdapterResolution,
  validateCapabilityPlan,
  validateCapabilityTaxonomy,
} from './lib/capability-resolution.mjs';
import { validateAdapterTokenMapping } from './lib/adapter-token-mapping.mjs';
import { validateAdapterBenchmark } from './lib/adapter-benchmark.mjs';
import {
  validateBrowserQaEvidence,
  validateBrowserQaPolicy,
} from './lib/browser-qa.mjs';
import {
  validateGenerationManifest,
  validateLayoutRecipeRegistry,
  validateVisualProfileRegistry,
} from './lib/generic-generation.mjs';
import { validateGenerationReport } from './lib/generation-report.mjs';
import {
  validateAdapterDependencyAudit,
  validateAdapterBrowserEvaluationPlan,
  validateAdapterBrowserEvidence,
  validateShadcnRegistrySnapshot,
} from './lib/adapter-browser-evidence.mjs';
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
import { auditRendererUsage, createUsageManifest, stableStringify, validateComposition } from '../packages/html-runtime/src/harness-core.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];
const phaseTwoRendererSource = readFileSync(join(root, 'scripts/lib/phase-2-renderer.mjs'), 'utf8');

function readJson(relPath) {
  try {
    return JSON.parse(readFileSync(join(root, relPath), 'utf8'));
  } catch (error) {
    errors.push(`${relPath}: ${error.message}`);
    return null;
  }
}

function validateJson(relPath, schemaPath) {
  const value = readJson(relPath);
  const schema = readJson(schemaPath);
  if (!value || !schema) return null;
  errors.push(...validateAgainstSchema(value, schema, { label: relPath }));
  return value;
}

function listJsonFiles(relDir, predicate = () => true) {
  const absDir = join(root, relDir);
  if (!existsSync(absDir)) {
    errors.push(`${relDir}: directory does not exist`);
    return [];
  }
  return readdirSync(absDir)
    .filter((name) => name.endsWith('.json') && predicate(name))
    .map((name) => join(relDir, name));
}

function assertPathExists(relPath, owner) {
  const filePath = relPath.split('#')[0];
  if (filePath.includes('{')) return;
  if (!existsSync(join(root, filePath))) errors.push(`${owner}: referenced path does not exist: ${relPath}`);
}

function assertUnique(values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) errors.push(`${label}: duplicate value ${JSON.stringify(value)}`);
    seen.add(value);
  }
}

const policy = validateJson('design/token-policy.json', 'schemas/token-policy.schema.json');
const meridianDesignConfig = validateJson('meridian.design.json', 'schemas/meridian-design-config.schema.json');
const meridianProjectContext = validateJson('examples/ui-generation/meridian.project-context.json', 'schemas/project-context.schema.json');
const researchPolicy = validateJson('design/research-policy.json', 'schemas/research-policy.schema.json');
const uiGenerationResearchPolicy = validateJson('design/ui-generation-research-policy.json', 'schemas/ui-generation-research-policy.schema.json');
const uiGenerationSessionPolicy = validateJson('design/ui-generation-session-policy.json', 'schemas/ui-generation-session-policy.schema.json');
const clarificationPolicy = validateJson('design/ui-generation-clarification-policy.json', 'schemas/clarification-policy.schema.json');
const productUiPatterns = validateJson('design/product-ui-patterns.json', 'schemas/product-ui-pattern-registry.schema.json');
const capabilityTaxonomy = validateJson('design/capability-taxonomy.json', 'schemas/capability-taxonomy.schema.json');
const adapterRegistry = validateJson('design/adapter-registry.json', 'schemas/adapter-registry.schema.json');
const adapterTokenMapping = validateJson(
  'design/generated/adapter-token-mapping.json',
  'schemas/adapter-token-mapping.schema.json',
);
const adapterBenchmark = validateJson('design/adapter-benchmark.json', 'schemas/adapter-benchmark.schema.json');
const browserQaPolicy = validateJson(
  'design/ui-generation-browser-qa-policy.json',
  'schemas/browser-qa-policy.schema.json',
);
const adapterBrowserPlan = validateJson(
  'design/adapter-browser-evaluation-plan.json',
  'schemas/adapter-browser-evaluation-plan.schema.json',
);
const adapterBrowserEvidence = validateJson(
  'design/evidence/adapter-browser/manifest.json',
  'schemas/adapter-browser-evidence.schema.json',
);
const adapterDependencyAudit = validateJson(
  'design/evidence/adapter-browser/dependency-audit.json',
  'schemas/adapter-dependency-audit.schema.json',
);
const shadcnRegistrySnapshot = validateJson(
  'design/evidence/adapter-browser/shadcn-registry-snapshot.json',
  'schemas/shadcn-registry-snapshot.schema.json',
);
const implementationReadinessPolicy = validateJson('design/implementation-readiness.json', 'schemas/implementation-readiness.schema.json');
const registry = validateJson('design/system-registry.json', 'schemas/system-registry.schema.json');
validateJson('design/iconography.json', 'schemas/iconography.schema.json');
const accessibility = validateJson('design/accessibility.json', 'schemas/accessibility.schema.json');
const contentGuidelines = validateJson('design/content-guidelines.json', 'schemas/content-guidelines.schema.json');
const harnessRegistry = readJson('design/harness/generated/component-registry.json');
const layoutRecipeRegistry = validateJson(
  'design/layout-recipe-registry.json',
  'schemas/layout-recipe-registry.schema.json',
);
const visualProfileRegistry = validateJson(
  'design/ui-generation-visual-profiles.json',
  'schemas/visual-profile-registry.schema.json',
);
const rules = readJson('design/rules.json') ?? [];
const ruleIds = new Set(rules.map((rule) => rule.id));

if (meridianDesignConfig) {
  for (const configError of validateMeridianDesignConfig(meridianDesignConfig, { root })) {
    errors.push(`meridian.design.json: ${configError}`);
  }
}
if (meridianProjectContext) {
  for (const contextError of validateProjectContext(meridianProjectContext, { root })) {
    errors.push(`examples/ui-generation/meridian.project-context.json: ${contextError}`);
  }
}
if (productUiPatterns) {
  for (const registryError of validateProductUiPatternRegistry(productUiPatterns)) {
    errors.push(`design/product-ui-patterns.json: ${registryError}`);
  }
}
if (capabilityTaxonomy) {
  for (const taxonomyError of validateCapabilityTaxonomy(capabilityTaxonomy)) {
    errors.push(`design/capability-taxonomy.json: ${taxonomyError}`);
  }
}
if (adapterRegistry && capabilityTaxonomy && meridianDesignConfig) {
  const componentStatusEntries = readdirSync(join(root, 'design/contracts/components'))
    .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
    .map((name) => {
      const contract = readJson(`design/contracts/components/${name}`);
      return [name.replace(/\.contract\.json$/, ''), contract?.status];
    });
  for (const registryError of validateAdapterRegistry(adapterRegistry, capabilityTaxonomy, meridianDesignConfig, {
    root,
    knownComponentRefs: componentStatusEntries.map(([id]) => id),
    componentStatuses: componentStatusEntries,
  })) {
    errors.push(`design/adapter-registry.json: ${registryError}`);
  }
}
if (adapterTokenMapping && adapterRegistry) {
  for (const mappingError of validateAdapterTokenMapping(adapterTokenMapping, adapterRegistry, { root })) {
    errors.push(`design/generated/adapter-token-mapping.json: ${mappingError}`);
  }
}
if (adapterBenchmark) {
  for (const benchmarkError of validateAdapterBenchmark(adapterBenchmark)) {
    errors.push(`design/adapter-benchmark.json: ${benchmarkError}`);
  }
}
if (browserQaPolicy) {
  for (const policyError of validateBrowserQaPolicy(browserQaPolicy)) {
    errors.push(`design/ui-generation-browser-qa-policy.json: ${policyError}`);
  }
}
if (adapterBrowserPlan && adapterBenchmark) {
  for (const planError of validateAdapterBrowserEvaluationPlan(adapterBrowserPlan, adapterBenchmark)) {
    errors.push(`design/adapter-browser-evaluation-plan.json: ${planError}`);
  }
}
if (adapterBrowserEvidence && adapterBrowserPlan && adapterBenchmark) {
  for (const evidenceError of validateAdapterBrowserEvidence(
    adapterBrowserEvidence,
    adapterBrowserPlan,
    adapterBenchmark,
    { root },
  )) {
    errors.push(`design/evidence/adapter-browser/manifest.json: ${evidenceError}`);
  }
}
if (adapterDependencyAudit && adapterBrowserPlan) {
  for (const auditError of validateAdapterDependencyAudit(adapterDependencyAudit, adapterBrowserPlan, {
    root,
  })) {
    errors.push(`design/evidence/adapter-browser/dependency-audit.json: ${auditError}`);
  }
}
if (shadcnRegistrySnapshot) {
  for (const snapshotError of validateShadcnRegistrySnapshot(shadcnRegistrySnapshot, { root })) {
    errors.push(`design/evidence/adapter-browser/shadcn-registry-snapshot.json: ${snapshotError}`);
  }
}
if (layoutRecipeRegistry) {
  for (const recipeError of validateLayoutRecipeRegistry(layoutRecipeRegistry, {
    css: readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8'),
  })) {
    errors.push(`design/layout-recipe-registry.json: ${recipeError}`);
  }
}
if (visualProfileRegistry) {
  for (const profileError of validateVisualProfileRegistry(visualProfileRegistry)) {
    errors.push(`design/ui-generation-visual-profiles.json: ${profileError}`);
  }
}

const reviewPaths = listJsonFiles('design/reviews', (name) => name.endsWith('.review.json') && !name.startsWith('_'));
validateJson('design/reviews/_template.review.json', 'schemas/review-record.schema.json');
const reviewRecords = [];
const reviewsByPath = new Map();
const reviewsByCycle = new Map();
for (const reviewPath of reviewPaths) {
  const review = validateJson(reviewPath, 'schemas/review-record.schema.json');
  if (review) {
    if (reviewsByCycle.has(review.cycleId)) errors.push(`${reviewPath}: duplicate cycleId ${review.cycleId}`);
    const entry = { review, reviewPath };
    reviewRecords.push(entry);
    reviewsByPath.set(reviewPath, entry);
    reviewsByCycle.set(review.cycleId, entry);
  }
}
const successorByCycle = new Map();
for (const { review, reviewPath } of reviewRecords) {
  if (!review.supersedesCycleId) continue;
  if (successorByCycle.has(review.supersedesCycleId)) {
    errors.push(`${reviewPath}: cycle ${review.supersedesCycleId} already has a follow-up`);
  } else {
    successorByCycle.set(review.supersedesCycleId, review.cycleId);
  }
}

const contractPaths = listJsonFiles('design/contracts/components', (name) => name.endsWith('.contract.json') && !name.startsWith('_'));
validateJson('design/contracts/components/_template.contract.json', 'schemas/component-contract.schema.json');
const contracts = [];
for (const contractPath of contractPaths) {
  const contract = validateJson(contractPath, 'schemas/component-contract.schema.json');
  if (contract) {
    contracts.push({ contract, contractPath });
    if (implementationReadinessPolicy) errors.push(...validateImplementationReadiness(contract, implementationReadinessPolicy));
  }
}

const patternPaths = listJsonFiles('design/contracts/patterns', (name) => name.endsWith('.pattern.json'));
for (const patternPath of patternPaths) {
  const pattern = validateJson(patternPath, 'schemas/pattern-contract.schema.json');
  if (!pattern) continue;
  for (const componentId of pattern.components) {
    if (!contracts.some(({ contract }) => contract.id === componentId)) {
      errors.push(`${patternPath}: unknown component ${componentId}`);
    }
  }
}

const uiGenerationResearchDecisionPaths = listJsonFiles(
  'design/research-decisions',
  (name) => name.endsWith('.research.json')
);
let uiGenerationResearchDecisionCount = 0;
for (const decisionPath of uiGenerationResearchDecisionPaths) {
  const decision = validateJson(decisionPath, 'schemas/ui-generation-research-decision.schema.json');
  if (!decision) continue;
  uiGenerationResearchDecisionCount += 1;
  if (uiGenerationResearchPolicy) {
    for (const decisionError of validateUiGenerationResearchDecision(decision, uiGenerationResearchPolicy)) {
      errors.push(`${decisionPath}: ${decisionError}`);
    }
  }
  for (const spike of decision.spikes.filter((item) => item.status === 'complete')) {
    for (const artifactRef of spike.artifactRefs) assertPathExists(artifactRef, `${decisionPath} spike ${spike.id}`);
  }
}

const uiGenerationSessionPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.session.json')
);
let uiGenerationSessionCount = 0;
for (const sessionPath of uiGenerationSessionPaths) {
  const session = validateJson(sessionPath, 'schemas/ui-generation-session.schema.json');
  if (!session) continue;
  uiGenerationSessionCount += 1;
  if (uiGenerationSessionPolicy) {
    for (const sessionError of validateUiGenerationSession(session, uiGenerationSessionPolicy, { root })) {
      errors.push(`${sessionPath}: ${sessionError}`);
    }
  }
}

const uiGenerationMigrationPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.migration.json')
);
let uiGenerationMigrationCount = 0;
for (const migrationPath of uiGenerationMigrationPaths) {
  const migration = validateJson(migrationPath, 'schemas/ui-generation-migration-map.schema.json');
  if (!migration) continue;
  uiGenerationMigrationCount += 1;
  if (uiGenerationSessionPolicy) {
    for (const migrationError of validateUiGenerationMigrationMap(migration, uiGenerationSessionPolicy, { root })) {
      errors.push(`${migrationPath}: ${migrationError}`);
    }
  }
}

const designBriefPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.design-brief.json')
);
const designBriefsByPath = new Map();
let designBriefCount = 0;
for (const briefPath of designBriefPaths) {
  const brief = validateJson(briefPath, 'schemas/design-brief.schema.json');
  if (!brief) continue;
  designBriefCount += 1;
  designBriefsByPath.set(briefPath, brief);
  for (const briefError of validateDesignBrief(brief, { root, policy: clarificationPolicy })) {
    errors.push(`${briefPath}: ${briefError}`);
  }
}

const requirementAllocationPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.requirement-allocation.json')
);
const requirementAllocationsByPath = new Map();
let requirementAllocationCount = 0;
for (const allocationPath of requirementAllocationPaths) {
  const allocation = validateJson(allocationPath, 'schemas/requirement-allocation.schema.json');
  if (!allocation) continue;
  requirementAllocationCount += 1;
  requirementAllocationsByPath.set(allocationPath, allocation);
  const brief = designBriefsByPath.get(allocation.source.designBriefRef) ?? readJson(allocation.source.designBriefRef);
  if (brief) {
    for (const allocationError of validateRequirementAllocation(allocation, brief, { root })) {
      errors.push(`${allocationPath}: ${allocationError}`);
    }
  }
}

const screenResponsibilityPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.screen-responsibilities.json')
);
const screenResponsibilitiesByPath = new Map();
let screenResponsibilitiesCount = 0;
for (const responsibilityPath of screenResponsibilityPaths) {
  const responsibilities = validateJson(responsibilityPath, 'schemas/screen-responsibilities.schema.json');
  if (!responsibilities) continue;
  screenResponsibilitiesCount += 1;
  screenResponsibilitiesByPath.set(responsibilityPath, responsibilities);
  const allocation = requirementAllocationsByPath.get(responsibilities.source.requirementAllocationRef)
    ?? readJson(responsibilities.source.requirementAllocationRef);
  if (allocation) {
    for (const responsibilityError of validateScreenResponsibilities(responsibilities, allocation, { root })) {
      errors.push(`${responsibilityPath}: ${responsibilityError}`);
    }
  }
}

const patternSelectionPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.pattern-selection.json')
);
const patternSelectionsByPath = new Map();
let patternSelectionCount = 0;
for (const selectionPath of patternSelectionPaths) {
  const selection = validateJson(selectionPath, 'schemas/pattern-selection.schema.json');
  if (!selection) continue;
  patternSelectionCount += 1;
  patternSelectionsByPath.set(selectionPath, selection);
  const allocation = requirementAllocationsByPath.get(selection.source.requirementAllocationRef)
    ?? readJson(selection.source.requirementAllocationRef);
  const responsibilities = screenResponsibilitiesByPath.get(selection.source.screenResponsibilitiesRef)
    ?? readJson(selection.source.screenResponsibilitiesRef);
  if (allocation && responsibilities && productUiPatterns) {
    for (const selectionError of validatePatternSelection(selection, allocation, responsibilities, productUiPatterns, { root })) {
      errors.push(`${selectionPath}: ${selectionError}`);
    }
  }
}

const directionSetPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.direction-set.json')
);
const directionSetsByPath = new Map();
let directionSetCount = 0;
for (const directionPath of directionSetPaths) {
  const directionSet = validateJson(directionPath, 'schemas/direction-set.schema.json');
  if (!directionSet) continue;
  directionSetCount += 1;
  directionSetsByPath.set(directionPath, directionSet);
  const allocation = requirementAllocationsByPath.get(directionSet.source.requirementAllocationRef)
    ?? readJson(directionSet.source.requirementAllocationRef);
  const responsibilities = screenResponsibilitiesByPath.get(directionSet.source.screenResponsibilitiesRef)
    ?? readJson(directionSet.source.screenResponsibilitiesRef);
  const patternSelection = patternSelectionsByPath.get(directionSet.source.patternSelectionRef)
    ?? readJson(directionSet.source.patternSelectionRef);
  if (allocation && responsibilities && patternSelection && productUiPatterns) {
    for (const directionError of validateDirectionSet(directionSet, allocation, responsibilities, patternSelection, productUiPatterns, { root })) {
      errors.push(`${directionPath}: ${directionError}`);
    }
  }
}

const capabilityPlanPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.capability-plan.json')
);
const capabilityPlansByPath = new Map();
let capabilityPlanCount = 0;
for (const planPath of capabilityPlanPaths) {
  const plan = validateJson(planPath, 'schemas/capability-plan.schema.json');
  if (!plan) continue;
  capabilityPlanCount += 1;
  capabilityPlansByPath.set(planPath, plan);
  const directionSet = directionSetsByPath.get(plan.source.directionSetRef) ?? readJson(plan.source.directionSetRef);
  const allocation = directionSet
    ? requirementAllocationsByPath.get(directionSet.source.requirementAllocationRef) ?? readJson(directionSet.source.requirementAllocationRef)
    : null;
  const responsibilities = directionSet
    ? screenResponsibilitiesByPath.get(directionSet.source.screenResponsibilitiesRef) ?? readJson(directionSet.source.screenResponsibilitiesRef)
    : null;
  if (directionSet && allocation && responsibilities && capabilityTaxonomy) {
    for (const planError of validateCapabilityPlan(plan, directionSet, capabilityTaxonomy, responsibilities, allocation, { root })) {
      errors.push(`${planPath}: ${planError}`);
    }
  }
}

const adapterResolutionPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.adapter-resolution.json')
);
let adapterResolutionCount = 0;
for (const resolutionPath of adapterResolutionPaths) {
  const resolution = validateJson(resolutionPath, 'schemas/adapter-resolution.schema.json');
  if (!resolution) continue;
  adapterResolutionCount += 1;
  const plan = capabilityPlansByPath.get(resolution.source.capabilityPlanRef) ?? readJson(resolution.source.capabilityPlanRef);
  if (plan && adapterRegistry) {
    const stableProjectTargetRefs = readdirSync(join(root, 'design/contracts/components'))
      .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
      .filter((name) => readJson(`design/contracts/components/${name}`)?.status === 'stable')
      .map((name) => name.replace(/\.contract\.json$/, ''));
    for (const resolutionError of validateAdapterResolution(resolution, plan, adapterRegistry, {
      root,
      stableProjectTargetRefs,
      tokenMapping: adapterTokenMapping,
    })) {
      errors.push(`${resolutionPath}: ${resolutionError}`);
    }
  }
}

const generationManifestPaths = [
  ...listJsonFiles('examples/ui-generation', (name) => name.endsWith('.generation-manifest.json')),
  ...listJsonFiles('test/fixtures/ui-generation', (name) => name.endsWith('.generation-manifest.json')),
];
const generationManifestsByPath = new Map();
let generationManifestCount = 0;
for (const manifestPath of generationManifestPaths) {
  const manifest = validateJson(manifestPath, 'schemas/generation-manifest.schema.json');
  if (!manifest) continue;
  generationManifestCount += 1;
  generationManifestsByPath.set(manifestPath, manifest);
  for (const manifestError of validateGenerationManifest(manifest, { root })) {
    errors.push(`${manifestPath}: ${manifestError}`);
  }
  if (manifest.meta.status === 'ready') {
    assertPathExists(manifest.output.reviewUi, manifestPath);
    assertPathExists(manifest.output.reviewModel, manifestPath);
    validateJson(manifest.output.usageManifest, 'schemas/component-usage.schema.json');
  }
}

const generationReportPaths = listJsonFiles(
  'test/fixtures/generated/generation-reports',
  (name) => name.endsWith('.report.json'),
);
for (const reportPath of generationReportPaths) {
  const report = validateJson(reportPath, 'schemas/generation-report.schema.json');
  if (!report) continue;
  const manifest = generationManifestsByPath.get(report.source.generationManifest.ref)
    ?? readJson(report.source.generationManifest.ref);
  if (!manifest) continue;
  const sources = Object.fromEntries(
    Object.entries(manifest.source).map(([name, binding]) => [name, readJson(binding.ref)]),
  );
  if (Object.values(sources).some((value) => !value)) continue;
  const browserEvidence = report.source.browserQa
    ? validateJson(report.source.browserQa.ref, 'schemas/browser-qa-evidence.schema.json')
    : null;
  const repairRecord = report.source.repairRecord
    ? validateJson(report.source.repairRecord.ref, 'schemas/ui-generation-repair-record.schema.json')
    : null;
  for (const reportError of validateGenerationReport(report, manifest, sources, {
    root,
    browserEvidence,
    repairRecord,
    policy: browserQaPolicy,
    policyRef: 'design/ui-generation-browser-qa-policy.json',
  })) {
    errors.push(`${reportPath}: ${reportError}`);
  }
}

const browserQaEvidenceDirectory = 'test/fixtures/generated/browser-qa';
if (browserQaPolicy && existsSync(join(root, browserQaEvidenceDirectory))) {
  const browserQaEvidencePaths = listJsonFiles(
    browserQaEvidenceDirectory,
    (name) => name.endsWith('.evidence.json'),
  );
  for (const evidencePath of browserQaEvidencePaths) {
    const evidence = validateJson(evidencePath, 'schemas/browser-qa-evidence.schema.json');
    if (!evidence) continue;
    const manifest = readJson(evidence.source.generationManifest.ref);
    if (manifest) {
      for (const evidenceError of validateBrowserQaEvidence(evidence, manifest, browserQaPolicy, {
        root,
        manifestRef: evidence.source.generationManifest.ref,
        policyRef: 'design/ui-generation-browser-qa-policy.json',
      })) {
        errors.push(`${evidencePath}: ${evidenceError}`);
      }
    }
  }
}

const clarificationRoundPaths = listJsonFiles(
  'examples/ui-generation',
  (name) => name.endsWith('.clarification.json')
);
let clarificationRoundCount = 0;
for (const roundPath of clarificationRoundPaths) {
  const round = validateJson(roundPath, 'schemas/clarification-round.schema.json');
  if (!round) continue;
  clarificationRoundCount += 1;
  assertPathExists(round.briefRef, roundPath);
  const brief = designBriefsByPath.get(round.briefRef) ?? readJson(round.briefRef);
  if (brief && clarificationPolicy) {
    for (const roundError of validateClarificationRound(round, brief, clarificationPolicy, { root })) {
      errors.push(`${roundPath}: ${roundError}`);
    }
  }
}

const specPaths = listJsonFiles('examples/specs');
let specCount = 0;
for (const specPath of specPaths) {
  if (specPath.endsWith('.screen.json')) {
    if (validateJson(specPath, 'schemas/screen-spec.schema.json')) specCount += 1;
  } else if (specPath.endsWith('.flow.json')) {
    const flow = validateJson(specPath, 'schemas/flow-spec.schema.json');
    if (flow) {
      specCount += 1;
      for (const screen of flow.screens) assertPathExists(screen.screenSpecRef, `${specPath} screen ${screen.screenId}`);
    }
  } else {
    errors.push(`${specPath}: expected .screen.json or .flow.json suffix`);
  }
}

const phaseOnePaths = listJsonFiles('examples/phase-1', (name) => name.endsWith('.phase1.json'));
let phaseOneCount = 0;
for (const artifactPath of phaseOnePaths) {
  const phaseOne = validateJson(artifactPath, 'schemas/phase-1-package.schema.json');
  if (phaseOne) {
    phaseOneCount += 1;
    for (const screenSpecRef of phaseOne.screenSpecRefs) assertPathExists(screenSpecRef, `${artifactPath} screenSpecRefs`);
    if (phaseOne.flowSpecRef !== null) assertPathExists(phaseOne.flowSpecRef, `${artifactPath} flowSpecRef`);
  }
}

const phaseTwoPaths = listJsonFiles('examples/phase-2', (name) => name.endsWith('.phase2.json'));
let phaseTwoCount = 0;
for (const artifactPath of phaseTwoPaths) {
  const concept = validateJson(artifactPath, 'schemas/phase-2-concept.schema.json');
  if (!concept) continue;
  phaseTwoCount += 1;
  assertPathExists(concept.source.phaseOnePackage, artifactPath);
  assertPathExists(concept.generation.output, artifactPath);
  assertPathExists(concept.generation.componentComposition, artifactPath);
  assertPathExists(concept.generation.usageOutput, artifactPath);
  assertPathExists(concept.generation.referenceManifest, artifactPath);
  assertPathExists(concept.generation.designPrinciples, artifactPath);
  assertPathExists(concept.generation.designStrategies, artifactPath);
  assertPathExists(concept.generation.groundingOutput, artifactPath);
  assertPathExists(concept.generation.visualRubric, artifactPath);
  assertPathExists(concept.generation.visualCandidates, artifactPath);
  assertPathExists(concept.generation.visualCritique, artifactPath);
  assertPathExists(concept.generation.visualReviewOutput, artifactPath);
  assertPathExists(concept.feedback.schemaRef, artifactPath);
  const source = readJson(concept.source.phaseOnePackage);
  if (source) {
    if (source.meta?.id !== concept.source.sourcePackageId) errors.push(`${artifactPath}: sourcePackageId does not match source package`);
    if (source.meta?.status !== 'approved' || source.review?.status !== 'approved') errors.push(`${artifactPath}: source package must have approved package and review status`);
  }
  const scenarioIds = concept.prototype.scenarios.map((scenario) => scenario.id);
  assertUnique(scenarioIds, `${artifactPath} scenario IDs`);
  if (!scenarioIds.includes(concept.prototype.startScenario)) errors.push(`${artifactPath}: startScenario does not exist`);
  for (const coverageError of validatePhaseTwoCoverage(concept)) errors.push(`${artifactPath}: ${coverageError}`);
  const composition = validateJson(concept.generation.componentComposition, 'schemas/component-composition.schema.json');
  const usage = validateJson(concept.generation.usageOutput, 'schemas/component-usage.schema.json');
  const referenceManifest = validateJson(concept.generation.referenceManifest, 'schemas/reference-retrieval.schema.json');
  const designPrinciples = validateJson(concept.generation.designPrinciples, 'schemas/design-principles-pack.schema.json');
  const designStrategies = validateJson(concept.generation.designStrategies, 'schemas/design-strategies.schema.json');
  const grounding = validateJson(concept.generation.groundingOutput, 'schemas/grounding-report.schema.json');
  const visualRubric = validateJson(concept.generation.visualRubric, 'schemas/visual-quality-rubric.schema.json');
  const visualCandidates = validateJson(concept.generation.visualCandidates, 'schemas/visual-candidates.schema.json');
  const visualCritique = validateJson(concept.generation.visualCritique, 'schemas/visual-critique.schema.json');
  const visualReview = validateJson(concept.generation.visualReviewOutput, 'schemas/visual-review-report.schema.json');
  const visualCaptureManifest = visualReview ? validateJson(visualReview.screenshotManifest, 'schemas/visual-capture-manifest.schema.json') : null;
  if (composition && harnessRegistry && source) {
    try {
      validateComposition({ composition, registry: harnessRegistry, conceptId: concept.meta.id });
      const renderSites = auditRendererUsage({ source: phaseTwoRendererSource, composition });
      const expectedUsage = createUsageManifest({ composition, registry: harnessRegistry, concept, sourcePackageId: source.meta.id, renderSites });
      if (usage && stableStringify(usage) !== stableStringify(expectedUsage)) {
        errors.push(`${concept.generation.usageOutput}: usage manifest is stale or does not match the composition`);
      }
    } catch (error) {
      errors.push(`${concept.generation.componentComposition}: ${error.message}`);
    }
  }
  if (referenceManifest && designPrinciples && designStrategies && harnessRegistry && source) {
    try {
      validateReferenceRetrieval({ manifest: referenceManifest, conceptId: concept.meta.id, sourcePackageId: source.meta.id, root });
      validatePrincipleRelations({ principles: designPrinciples, references: referenceManifest, conceptId: concept.meta.id, referenceManifestRef: concept.generation.referenceManifest });
      validateStrategyRelations({ strategies: designStrategies, principles: designPrinciples, conceptId: concept.meta.id, principlesRef: concept.generation.designPrinciples });
      const expectedGrounding = createGroundingReport({ strategies: designStrategies, registry: harnessRegistry, strategiesRef: concept.generation.designStrategies });
      assertGroundingReady(expectedGrounding);
      if (grounding && stableStringify(grounding) !== stableStringify(expectedGrounding)) errors.push(`${concept.generation.groundingOutput}: grounding report is stale`);
      if (visualCandidates) validateCandidateStrategyRelations({ candidates: visualCandidates, strategies: designStrategies, principles: designPrinciples });
    } catch (error) {
      errors.push(`${concept.generation.designStrategies}: ${error.message}`);
    }
  }
  if (visualRubric && visualCandidates) {
    try {
      validateVisualQualityRelations({ rubric: visualRubric, candidates: visualCandidates, conceptId: concept.meta.id });
      const expectedVisualReview = createVisualReviewReport({ rubric: visualRubric, candidates: visualCandidates, visualCritique });
      if (visualReview && stableStringify(visualReview) !== stableStringify(expectedVisualReview)) {
        errors.push(`${concept.generation.visualReviewOutput}: visual review report is stale`);
      }
      if (visualReview && visualCaptureManifest) {
        validateVisualCaptureManifest({
          manifest: visualCaptureManifest,
          candidates: visualCandidates,
          conceptId: concept.meta.id,
          expectedScenarioId: concept.prototype.startScenario,
          root,
          sourcePaths: {
            html: concept.generation.output,
            candidates: concept.generation.visualCandidates,
            rubric: concept.generation.visualRubric,
          },
        });
        if (visualCritique) validateVisualCritiqueRelations({ critique: visualCritique, captureManifest: visualCaptureManifest, candidates: visualCandidates, rubric: visualRubric });
      }
    } catch (error) {
      errors.push(`${concept.generation.visualCandidates}: ${error.message}`);
    }
  }
}

if (policy) {
  const layerIds = policy.layers.map((layer) => layer.id);
  assertUnique(layerIds, 'design/token-policy.json layers');
  if (layerIds.join(',') !== 'reference,semantic,component') {
    errors.push('design/token-policy.json: layers must be ordered reference, semantic, component');
  }
  for (const modifier of policy.modifiers) {
    if (!modifier.contexts.includes(modifier.default)) {
      errors.push(`design/token-policy.json: modifier ${modifier.id} default is not one of its contexts`);
    }
  }
  assertUnique(policy.modifiers.map((modifier) => modifier.id), 'design/token-policy.json modifiers');
  assertUnique(policy.componentTokenDecision.requiredWhen.map((trigger) => trigger.id), 'design/token-policy.json required triggers');
  assertUnique(policy.componentTokenDecision.prohibitedReasons.map((reason) => reason.id), 'design/token-policy.json prohibited reasons');
}

if (researchPolicy) {
  const domains = ['overview', 'foundations', 'tokens', 'components'];
  if (researchPolicy.appliesTo.join(',') !== domains.join(',')) {
    errors.push('design/research-policy.json: appliesTo must include all domains in workflow order');
  }
  assertUnique(researchPolicy.gate.researchRequiredWhen.map((trigger) => trigger.id), 'design/research-policy.json research triggers');
  if (researchPolicy.sourcePolicy.minimumEvidence.total < 1) {
    errors.push('design/research-policy.json: minimum total evidence must be at least 1');
  }
  if (researchPolicy.sourcePolicy.minimumEvidence.primary < 1) {
    errors.push('design/research-policy.json: minimum primary evidence must be at least 1');
  }
  if (researchPolicy.sourcePolicy.minimumEvidence.primary > researchPolicy.sourcePolicy.minimumEvidence.total) {
    errors.push('design/research-policy.json: minimum primary evidence cannot exceed total evidence');
  }
}

if (uiGenerationResearchPolicy) {
  const requiredCategories = [
    'architecture',
    'schema-contract',
    'dependency',
    'design-system-adapter',
    'runtime',
    'browser-quality',
    'accessibility',
    'governance',
    'security',
    'licensing',
  ];
  if (uiGenerationResearchPolicy.appliesTo.join(',') !== requiredCategories.join(',')) {
    errors.push('design/ui-generation-research-policy.json: appliesTo must include every UI Generation decision category in policy order');
  }
  assertUnique(uiGenerationResearchPolicy.scoring.scoreMeaning.map((item) => item.score), 'design/ui-generation-research-policy.json score meanings');
  if (uiGenerationResearchPolicy.scoring.minimumScore >= uiGenerationResearchPolicy.scoring.maximumScore) {
    errors.push('design/ui-generation-research-policy.json: maximum score must be greater than minimum score');
  }
}

if (uiGenerationSessionPolicy) {
  for (const policyError of validateUiGenerationSessionPolicy(uiGenerationSessionPolicy)) {
    errors.push(`design/ui-generation-session-policy.json: ${policyError}`);
  }
}
if (clarificationPolicy) {
  assertUnique(clarificationPolicy.questionLanguage.prohibitedTerms.map((term) => term.toLocaleLowerCase()), 'design/ui-generation-clarification-policy.json prohibited terms');
  if (clarificationPolicy.structuralImpactWeights.none !== 0) errors.push('design/ui-generation-clarification-policy.json: none impact weight must be 0');
  if (clarificationPolicy.questionLimit.maximum > 3) errors.push('design/ui-generation-clarification-policy.json: no round may ask more than 3 questions');
}

if (accessibility) {
  assertUnique(accessibility.requirements.map((requirement) => requirement.id), 'design/accessibility.json requirement IDs');
  assertUnique(accessibility.qualityGates.map((gate) => gate.id), 'design/accessibility.json quality gate IDs');
  const levels = new Set(accessibility.requirements.flatMap((requirement) => requirement.criteria));
  if (!levels.has('2.5.8')) errors.push('design/accessibility.json: WCAG 2.5.8 target size requirement is missing');
  if (!levels.has('2.4.11')) errors.push('design/accessibility.json: WCAG 2.4.11 focus not obscured requirement is missing');
  if (accessibility.targetSize.preferredCssPx < accessibility.targetSize.minimumCssPx) {
    errors.push('design/accessibility.json: preferred target size cannot be smaller than minimum');
  }
}

if (contentGuidelines) {
  assertUnique(contentGuidelines.voice.map((attribute) => attribute.id), 'design/content-guidelines.json voice IDs');
  assertUnique(contentGuidelines.rules.map((rule) => rule.id), 'design/content-guidelines.json rule IDs');
  assertUnique(contentGuidelines.messagePatterns.map((pattern) => pattern.id), 'design/content-guidelines.json message pattern IDs');
  assertUnique(contentGuidelines.terms.map((term) => term.concept), 'design/content-guidelines.json term concepts');
  assertUnique(contentGuidelines.qualityGates.map((gate) => gate.id), 'design/content-guidelines.json quality gate IDs');
}

const allItems = new Map();
if (registry) {
  assertPathExists(registry.workflowDoc, 'design/system-registry.json');
  assertPathExists(registry.reviewRecordSchema, 'design/system-registry.json');
  assertPathExists(registry.researchPolicy, 'design/system-registry.json');
  assertUnique(registry.domains.map((domain) => domain.id), 'design/system-registry.json domains');
  assertUnique(registry.domains.map((domain) => domain.order), 'design/system-registry.json domain order');

  for (const domain of registry.domains) {
    assertPathExists(domain.template, `domain ${domain.id}`);
    assertUnique(domain.items.map((item) => item.id), `domain ${domain.id} item IDs`);
    assertUnique(domain.items.map((item) => item.order), `domain ${domain.id} item order`);
    assertUnique(domain.items.map((item) => item.route), `domain ${domain.id} routes`);
    for (const item of domain.items) {
      if (allItems.has(item.id)) errors.push(`design/system-registry.json: duplicate item ID ${item.id}`);
      allItems.set(item.id, item);
      if (!item.route.startsWith(domain.routePrefix)) {
        errors.push(`design/system-registry.json: ${item.id} route must start with ${domain.routePrefix}`);
      }
      item.sources.forEach((source) => assertPathExists(source, item.id));
      if (item.reviewRecord) {
        assertPathExists(item.reviewRecord, item.id);
        const currentReview = reviewsByPath.get(item.reviewRecord);
        if (!currentReview) {
          errors.push(`design/system-registry.json: ${item.id} reviewRecord is not a loaded review record`);
        } else if (currentReview.review.itemId !== item.id) {
          errors.push(`design/system-registry.json: ${item.id} points to a review for ${currentReview.review.itemId}`);
        } else if (successorByCycle.has(currentReview.review.cycleId)) {
          errors.push(`design/system-registry.json: ${item.id} reviewRecord does not point to the latest cycle`);
        }
      }
    }
  }

  for (const item of allItems.values()) {
    for (const dependency of item.dependsOn) {
      if (!allItems.has(dependency)) errors.push(`design/system-registry.json: ${item.id} has unknown dependency ${dependency}`);
    }
  }

  const visiting = new Set();
  const visited = new Set();
  function visitItem(itemId, trail = []) {
    if (visiting.has(itemId)) {
      errors.push(`design/system-registry.json: dependency cycle ${[...trail, itemId].join(' -> ')}`);
      return;
    }
    if (visited.has(itemId) || !allItems.has(itemId)) return;
    visiting.add(itemId);
    for (const dependency of allItems.get(itemId).dependsOn) visitItem(dependency, [...trail, itemId]);
    visiting.delete(itemId);
    visited.add(itemId);
  }
  for (const itemId of allItems.keys()) visitItem(itemId);

  for (const { review, reviewPath } of reviewRecords) {
    const itemId = review.itemId;
    const item = allItems.get(itemId);
    if (!item) {
      errors.push(`${reviewPath}: itemId ${itemId} is not registered`);
      continue;
    }
    if (review.status === 'complete' && !review.completedAt) errors.push(`${reviewPath}: complete review requires completedAt`);
    if (review.status !== 'in-progress' && review.decisions.length === 0) errors.push(`${reviewPath}: closed review requires at least one decision`);
    if (review.status !== 'in-progress' && review.differences.length === 0) errors.push(`${reviewPath}: closed review requires at least one difference classification`);
    if (review.status !== 'in-progress' && review.validations.length === 0) errors.push(`${reviewPath}: closed review requires at least one validation`);
    const decisionIdList = review.decisions.map((decision) => decision.id);
    const decisionIds = new Set(decisionIdList);
    assertUnique(decisionIdList, `${reviewPath} decision IDs`);
    if (researchPolicy && review.research) {
      for (const researchError of validateResearchGate({
        research: review.research,
        reviewStatus: review.status,
        decisionIds,
        policy: researchPolicy,
        itemId,
        reviewedSources: review.reviewedSources,
        policyPath: registry.researchPolicy,
      })) {
        errors.push(`${reviewPath}: ${researchError}`);
      }
    }
    for (const relatedId of [...review.impactedItems, ...review.nextRecommendedItems]) {
      if (!allItems.has(relatedId)) errors.push(`${reviewPath}: unknown related item ${relatedId}`);
    }
    for (const cycleId of review.acknowledgedImpacts) {
      const source = reviewsByCycle.get(cycleId);
      if (!source) {
        errors.push(`${reviewPath}: acknowledged impact cycle does not exist: ${cycleId}`);
      } else if (!source.review.impactedItems.includes(itemId)) {
        errors.push(`${reviewPath}: cycle ${cycleId} does not declare ${itemId} as impacted`);
      }
    }
    if (review.reviewType !== 'follow-up' && review.supersedesCycleId !== null) {
      errors.push(`${reviewPath}: only follow-up reviews may supersede another cycle`);
    }
    if (review.reviewType === 'follow-up') {
      const previous = reviewsByCycle.get(review.supersedesCycleId);
      if (!previous) {
        errors.push(`${reviewPath}: follow-up review must supersede an existing cycle`);
      } else if (previous.review.itemId !== itemId) {
        errors.push(`${reviewPath}: superseded cycle belongs to ${previous.review.itemId}, not ${itemId}`);
      }
    }
  }

  for (const { review, reviewPath } of reviewRecords) {
    const chain = new Set();
    let current = review;
    while (current?.supersedesCycleId) {
      if (chain.has(current.cycleId)) {
        errors.push(`${reviewPath}: review history contains a cycle`);
        break;
      }
      chain.add(current.cycleId);
      current = reviewsByCycle.get(current.supersedesCycleId)?.review;
    }
  }
}

if (policy) {
  const allowedTriggers = new Set(policy.componentTokenDecision.requiredWhen.map((trigger) => trigger.id));
  const prohibitedReasons = new Set(policy.componentTokenDecision.prohibitedReasons.map((reason) => reason.id));
  const allowedLiterals = new Set(policy.bindingRules.scopes.literal.allowedLiterals);

  for (const { contract, contractPath } of contracts) {
    assertPathExists(contract.source.humanDoc, contractPath);
    for (const ruleId of contract.rules) {
      if (!ruleIds.has(ruleId)) errors.push(`${contractPath}: unknown design rule ${ruleId}`);
    }

    const declaredTokenRefs = new Set(Object.values(contract.tokenRefs).flat());
    const slots = contract.tokenBindings.bindings.map((binding) => binding.slot);
    assertUnique(slots, `${contractPath} token binding slots`);
    assertUnique(contract.tokenBindings.unboundSlots.map((slot) => slot.slot), `${contractPath} unbound slots`);
    const overlap = contract.tokenBindings.unboundSlots.filter((slot) => slots.includes(slot.slot));
    for (const slot of overlap) errors.push(`${contractPath}: slot ${slot.slot} is both bound and unbound`);

    if (contract.status === 'stable' && contract.tokenBindings.coverage !== 'complete') {
      errors.push(`${contractPath}: stable contract requires complete token binding coverage`);
    }
    if (contract.tokenBindings.coverage === 'complete' && contract.tokenBindings.unboundSlots.length > 0) {
      errors.push(`${contractPath}: complete token binding coverage cannot contain unbound slots`);
    }

    for (const binding of contract.tokenBindings.bindings) {
      const prefix = `${contractPath}: binding ${binding.slot}`;
      if (binding.scope !== 'literal' && !declaredTokenRefs.has(binding.source)) {
        errors.push(`${prefix} source ${binding.source} is not declared in tokenRefs`);
      }
      if (binding.scope === 'semantic') {
        if (binding.componentToken !== null || binding.aliases !== null || binding.trigger !== null) {
          errors.push(`${prefix} semantic scope must not define component metadata`);
        }
      }
      if (binding.scope === 'component') {
        if (binding.componentToken !== binding.source) errors.push(`${prefix} componentToken must equal source`);
        if (!binding.aliases && binding.trigger !== 'intrinsic-component-value') errors.push(`${prefix} component scope requires an alias unless the value is intrinsic`);
        if (binding.aliases && !declaredTokenRefs.has(binding.aliases)) {
          errors.push(`${prefix} alias ${binding.aliases} is not declared in tokenRefs`);
        }
        if (!allowedTriggers.has(binding.trigger)) errors.push(`${prefix} has unknown component-token trigger ${binding.trigger}`);
      }
      if (binding.scope === 'reference') {
        if (binding.componentToken !== null || binding.aliases !== null) errors.push(`${prefix} reference scope must not define component metadata`);
        if (binding.trigger !== 'intrinsic-component-value') errors.push(`${prefix} reference scope requires intrinsic-component-value trigger`);
      }
      if (binding.scope === 'literal') {
        if (!allowedLiterals.has(binding.source)) errors.push(`${prefix} literal ${binding.source} is not allowed by token policy`);
        if (binding.componentToken !== null || binding.aliases !== null || binding.trigger !== null) {
          errors.push(`${prefix} literal scope must not define component metadata`);
        }
      }
      if (binding.trigger && prohibitedReasons.has(binding.trigger)) errors.push(`${prefix} uses a prohibited reason as trigger`);
    }
  }
}

if (errors.length > 0) {
  console.error(`System validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
console.log(`System validation passed: ${allItems.size} registry items, ${reviewRecords.length} review cycles, ${contracts.length} component contracts, ${specCount} AI specs, ${phaseOneCount} Phase 1 packages, ${phaseTwoCount} Phase 2 concepts, ${uiGenerationResearchDecisionCount} UI Generation research decisions, ${uiGenerationSessionCount} UI Generation sessions, ${uiGenerationMigrationCount} UI Generation migration maps, ${designBriefCount} Design Briefs, ${clarificationRoundCount} Clarification Rounds, ${requirementAllocationCount} Requirement Allocations, ${screenResponsibilitiesCount} Screen Responsibility sets, ${patternSelectionCount} Pattern Selections, ${directionSetCount} Direction Sets, ${capabilityPlanCount} Capability Plans, ${adapterResolutionCount} Adapter Resolutions.`);
}
