#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from './lib/schema-validator.mjs';
import { validateResearchGate } from './lib/research-gate.mjs';
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
const researchPolicy = validateJson('design/research-policy.json', 'schemas/research-policy.schema.json');
const registry = validateJson('design/system-registry.json', 'schemas/system-registry.schema.json');
validateJson('design/iconography.json', 'schemas/iconography.schema.json');
const accessibility = validateJson('design/accessibility.json', 'schemas/accessibility.schema.json');
const contentGuidelines = validateJson('design/content-guidelines.json', 'schemas/content-guidelines.schema.json');
const harnessRegistry = readJson('design/harness/generated/component-registry.json');
const rules = readJson('design/rules.json') ?? [];
const ruleIds = new Set(rules.map((rule) => rule.id));

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
  if (contract) contracts.push({ contract, contractPath });
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

const specPaths = listJsonFiles('examples/specs');
let specCount = 0;
for (const specPath of specPaths) {
  if (specPath.endsWith('.screen.json')) {
    if (validateJson(specPath, 'schemas/screen-spec.schema.json')) specCount += 1;
  } else if (specPath.endsWith('.flow.json')) {
    if (validateJson(specPath, 'schemas/flow-spec.schema.json')) specCount += 1;
  } else {
    errors.push(`${specPath}: expected .screen.json or .flow.json suffix`);
  }
}

const phaseOnePaths = listJsonFiles('examples/phase-1', (name) => name.endsWith('.phase1.json'));
let phaseOneCount = 0;
for (const artifactPath of phaseOnePaths) {
  if (validateJson(artifactPath, 'schemas/phase-1-package.schema.json')) phaseOneCount += 1;
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
console.log(`System validation passed: ${allItems.size} registry items, ${reviewRecords.length} review cycles, ${contracts.length} component contracts, ${specCount} AI specs, ${phaseOneCount} Phase 1 packages, ${phaseTwoCount} Phase 2 concepts.`);
}
