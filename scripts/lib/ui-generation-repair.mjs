import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const CATEGORY_TO_LIMIT = {
  'deterministic-validation': 'deterministicValidation',
  'structural-repair': 'structuralRepair',
  'visual-repair': 'visualRepair',
  'pattern-reselection': 'patternReselection',
};

const LOCKED_TARGETS = new Set([
  'requirements',
  'screen-responsibilities',
  'selected-patterns',
  'selected-direction',
  'capability-plan',
  'adapter-selection',
]);

function digest(value) {
  return `sha256-${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function structuralNode(node) {
  return {
    id: node.id,
    kind: node.kind,
    decisionRef: node.decisionRef,
    ...(node.recipeRef ? { recipeRef: node.recipeRef } : {}),
    ...(node.options ? { options: node.options } : {}),
    ...(node.capabilityRequirementRef ? { capabilityRequirementRef: node.capabilityRequirementRef } : {}),
    ...(node.presentation ? { presentation: node.presentation } : {}),
    ...(node.children ? { children: node.children.map(structuralNode) } : {}),
  };
}

function validateBinding(binding, root, label, errors) {
  if (isAbsolute(binding.ref)) {
    errors.push(`${label} must be repository-relative`);
    return null;
  }
  const absolute = resolve(root, binding.ref);
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    errors.push(`${label} escapes the repository`);
    return null;
  }
  if (!existsSync(absolute)) {
    errors.push(`${label} does not exist`);
    return null;
  }
  const bytes = readFileSync(absolute);
  const actual = `sha256-${createHash('sha256').update(bytes).digest('hex')}`;
  if (actual !== binding.digest) errors.push(`${label} digest is stale`);
  try {
    return JSON.parse(bytes);
  } catch {
    errors.push(`${label} is not valid JSON`);
    return null;
  }
}

export function computeLockedStructureDigest(manifest) {
  return digest({
    directionRef: manifest.directionRef,
    adapterResolution: manifest.source.adapterResolution,
    screenResponsibilities: manifest.source.screenResponsibilities,
    patternSelection: manifest.source.patternSelection,
    directionSet: manifest.source.directionSet,
    screens: manifest.screens.map((screen) => ({
      id: screen.id,
      responsibilityRef: screen.responsibilityRef,
      patternRef: screen.patternRef,
      root: structuralNode(screen.root),
    })),
  });
}

export function validateRepairRecord(record, manifest, policy, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  let boundInitialFindingRefs = [];
  if (options.validateSourceBindings !== false) {
    const boundSources = Object.fromEntries(
      Object.entries(record.source).map(([name, binding]) => [
        name,
        validateBinding(binding, root, `Repair source ${name}`, errors),
      ]),
    );
    const initialManifestDigest = boundSources.initialBrowserQa?.source?.generationManifest?.digest;
    if (initialManifestDigest && initialManifestDigest !== record.source.generationManifest.digest) {
      errors.push('Initial Browser QA is not bound to the Repair generation manifest');
    }
    boundInitialFindingRefs = boundSources.initialBrowserQa?.scenarios?.flatMap((scenario) =>
      scenario.findings.map((item) => item.id)) ?? [];
  }
  const expectedLockedDigest = computeLockedStructureDigest(manifest);
  if (record.lockedStructureDigest !== expectedLockedDigest) {
    errors.push('Repair record locked structure digest is stale');
  }
  const sequences = record.attempts.map((attempt) => attempt.sequence);
  if (duplicates(sequences).length) errors.push('Repair attempt sequences must be unique');
  if (!sequences.every((value, index) => value === index + 1)) {
    errors.push('Repair attempt sequences must be contiguous and ordered');
  }

  const counts = {
    deterministicValidation: 0,
    structuralRepair: 0,
    visualRepair: 0,
    patternReselection: 0,
  };
  for (const attempt of record.attempts) {
    const countKey = CATEGORY_TO_LIMIT[attempt.category];
    counts[countKey] += 1;
    if (
      attempt.lockedStructureDigestBefore !== expectedLockedDigest
      || attempt.lockedStructureDigestAfter !== expectedLockedDigest
    ) {
      errors.push(`${attempt.id}: repair changed or used stale locked structure`);
    }
    if (attempt.actorType === 'ai' && LOCKED_TARGETS.has(attempt.targetLayer)) {
      errors.push(`${attempt.id}: AI cannot repair locked layer ${attempt.targetLayer}`);
    }
    if (
      ['structural-repair', 'pattern-reselection'].includes(attempt.category)
      && attempt.outcome !== 'escalated'
    ) {
      errors.push(`${attempt.id}: ${attempt.category} must be escalated to Human review`);
    }
    if (attempt.outcome === 'resolved' && attempt.changedRefs.length === 0) {
      errors.push(`${attempt.id}: resolved repair must name changed artifacts`);
    }
  }
  for (const [key, count] of Object.entries(counts)) {
    if (count > policy.repair.limits[key]) errors.push(`${key} exceeds repair limit ${policy.repair.limits[key]}`);
    if (record.summary[key] !== count) errors.push(`Repair summary ${key} is stale`);
  }
  if (counts.visualRepair > policy.repair.maximumRounds) {
    errors.push(`visualRepair exceeds maximum Browser QA rounds ${policy.repair.maximumRounds}`);
  }

  const initialFindingRefs = new Set(options.initialFindingRefs ?? boundInitialFindingRefs);
  const resolved = new Set(record.summary.resolvedFindingRefs);
  const unresolved = new Set(record.summary.unresolvedFindingRefs);
  for (const ref of [...resolved, ...unresolved]) {
    if (initialFindingRefs.size && !initialFindingRefs.has(ref)) errors.push(`Repair summary references unknown finding ${ref}`);
  }
  for (const ref of resolved) if (unresolved.has(ref)) errors.push(`Finding ${ref} cannot be both resolved and unresolved`);
  const resolvedByAttempt = new Set(record.attempts
    .filter((attempt) => attempt.outcome === 'resolved')
    .flatMap((attempt) => attempt.findingRefs));
  for (const ref of resolved) {
    if (!resolvedByAttempt.has(ref)) errors.push(`Resolved finding ${ref} has no successful repair attempt`);
  }
  if (initialFindingRefs.size && [...initialFindingRefs].some((ref) => !resolved.has(ref) && !unresolved.has(ref))) {
    errors.push('Repair summary does not account for every initial finding');
  }

  if (record.meta.status === 'repaired' && record.summary.unresolvedFindingRefs.length) {
    errors.push('Repaired status cannot contain unresolved findings');
  }
  if (record.meta.status === 'not-required' && record.attempts.length) {
    errors.push('Not-required repair record cannot contain attempts');
  }
  if (
    record.meta.status === 'human-review-required'
    && !record.attempts.some((attempt) => attempt.outcome === 'escalated')
  ) {
    errors.push('Human-review-required status needs an escalated attempt');
  }
  return errors;
}
