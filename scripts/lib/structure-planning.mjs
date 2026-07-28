import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function safePath(root, path) {
  if (isAbsolute(path)) return null;
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  return rel.startsWith('..') || isAbsolute(rel) ? null : absolute;
}

function fileDigest(path) {
  return `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

function validateFileDigest(root, path, expectedDigest, label, errors) {
  const absolute = safePath(root, path);
  if (!absolute) errors.push(`${label} escapes the project root`);
  else if (!existsSync(absolute)) errors.push(`${label} does not exist: ${path}`);
  else if (fileDigest(absolute) !== expectedDigest) errors.push(`${label} digest is stale`);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalDigest(value) {
  return `sha256-${createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')}`;
}

function validateRefs(refs, known, label, errors) {
  for (const ref of refs) {
    if (!known.has(ref)) errors.push(`${label} references unknown ${ref}`);
  }
}

export function validateProductUiPatternRegistry(registry) {
  const errors = [];
  const patternIds = new Set(registry.patterns.map((pattern) => pattern.id));
  const evidenceIds = new Set(registry.evidence.map((evidence) => evidence.id));
  for (const id of duplicates([...patternIds])) errors.push(`duplicate pattern id ${id}`);
  for (const id of duplicates(registry.evidence.map((evidence) => evidence.id))) errors.push(`duplicate pattern evidence id ${id}`);
  for (const pattern of registry.patterns) {
    validateRefs(pattern.evidenceRefs, evidenceIds, `pattern ${pattern.id}`, errors);
  }
  if (registry.directionPolicy.minimum > registry.directionPolicy.maximum) {
    errors.push('direction policy minimum cannot exceed maximum');
  }
  if (patternIds.size !== registry.patterns.length) errors.push('pattern ids must be unique');
  return errors;
}

export function validateRequirementAllocation(allocation, brief, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = allocation.meta?.id || 'requirement-allocation';
  validateFileDigest(root, allocation.source.designBriefRef, allocation.source.designBriefDigest, `${prefix}: designBriefRef`, errors);
  const requirementIds = new Set(allocation.requirements.map((requirement) => requirement.id));
  const sourceIds = new Set([
    ...brief.actions.map((item) => `action:${item.id}`),
    ...brief.constraints.map((item) => `constraint:${item.id}`),
    ...brief.risks.map((item) => `risk:${item.id}`),
  ]);
  for (const id of duplicates(allocation.requirements.map((item) => item.id))) errors.push(`${prefix}: duplicate requirement id ${id}`);
  for (const id of duplicates(allocation.allocations.map((item) => item.id))) errors.push(`${prefix}: duplicate allocation id ${id}`);
  for (const requirement of allocation.requirements) {
    validateRefs(requirement.sourceRefs, sourceIds, `${prefix}: requirement ${requirement.id}`, errors);
  }
  const representedSources = new Set(allocation.requirements.flatMap((requirement) => requirement.sourceRefs));
  for (const sourceId of sourceIds) {
    if (!representedSources.has(sourceId)) errors.push(`${prefix}: Design Brief source ${sourceId} is not represented by a requirement`);
  }
  const allocated = new Set();
  for (const item of allocation.allocations) {
    if (!requirementIds.has(item.requirementRef)) errors.push(`${prefix}: allocation ${item.id} references unknown requirement ${item.requirementRef}`);
    allocated.add(item.requirementRef);
  }
  const unallocated = [...requirementIds].filter((id) => !allocated.has(id)).sort();
  if (allocation.coverage.required !== requirementIds.size) errors.push(`${prefix}: coverage.required is stale`);
  if (allocation.coverage.allocated !== allocated.size) errors.push(`${prefix}: coverage.allocated is stale`);
  if (JSON.stringify([...allocation.coverage.unallocatedRequirementRefs].sort()) !== JSON.stringify(unallocated)) {
    errors.push(`${prefix}: unallocatedRequirementRefs is stale`);
  }
  if (allocation.meta.status === 'ready-for-review' && unallocated.length > 0) {
    errors.push(`${prefix}: ready-for-review allocation requires 100% requirement coverage`);
  }
  return errors;
}

export function validateScreenResponsibilities(responsibilities, allocation, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = responsibilities.meta?.id || 'screen-responsibilities';
  validateFileDigest(root, responsibilities.source.designBriefRef, responsibilities.source.designBriefDigest, `${prefix}: designBriefRef`, errors);
  validateFileDigest(root, responsibilities.source.requirementAllocationRef, responsibilities.source.requirementAllocationDigest, `${prefix}: requirementAllocationRef`, errors);
  const requirementIds = new Set(allocation.requirements.map((requirement) => requirement.id));
  const responsibilityIds = new Set(responsibilities.responsibilities.map((item) => item.id));
  for (const id of duplicates(responsibilities.responsibilities.map((item) => item.id))) errors.push(`${prefix}: duplicate responsibility id ${id}`);
  for (const responsibility of responsibilities.responsibilities) {
    validateRefs(responsibility.supportsRequirementRefs, requirementIds, `${prefix}: responsibility ${responsibility.id}`, errors);
    const sentenceCount = responsibility.responsibility.split('。').filter((part) => part.trim()).length;
    if (sentenceCount !== 1 || !responsibility.responsibility.endsWith('。')) {
      errors.push(`${prefix}: responsibility ${responsibility.id} must be exactly one sentence`);
    }
  }
  for (const item of allocation.allocations) {
    const responsibility = responsibilities.responsibilities.find((candidate) => candidate.id === item.responsibilityRef);
    if (!responsibility) {
      errors.push(`${prefix}: allocation ${item.id} references unknown responsibility ${item.responsibilityRef}`);
    } else if (!responsibility.supportsRequirementRefs.includes(item.requirementRef)) {
      errors.push(`${prefix}: allocation ${item.id} places requirement outside responsibility ${responsibility.id}`);
    }
  }
  const covered = new Set(responsibilities.responsibilities.flatMap((item) => item.supportsRequirementRefs));
  for (const requirementId of requirementIds) {
    if (!covered.has(requirementId)) errors.push(`${prefix}: requirement ${requirementId} has no screen responsibility`);
  }
  if (responsibilityIds.size !== responsibilities.responsibilities.length) errors.push(`${prefix}: responsibility ids must be unique`);
  return errors;
}

export function validatePatternSelection(selection, allocation, responsibilities, registry, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = selection.meta?.id || 'pattern-selection';
  validateFileDigest(root, selection.source.requirementAllocationRef, selection.source.requirementAllocationDigest, `${prefix}: requirementAllocationRef`, errors);
  validateFileDigest(root, selection.source.screenResponsibilitiesRef, selection.source.screenResponsibilitiesDigest, `${prefix}: screenResponsibilitiesRef`, errors);
  const registryPath = safePath(root, selection.source.registryRef);
  if (!registryPath || !existsSync(registryPath)) errors.push(`${prefix}: registryRef does not exist within project root`);
  const patternIds = new Set(registry.patterns.map((pattern) => pattern.id));
  const evidenceIds = new Set(registry.evidence.map((evidence) => evidence.id));
  const requirementIds = new Set(allocation.requirements.map((requirement) => requirement.id));
  const responsibilityIds = new Set(responsibilities.responsibilities.map((item) => item.id));
  for (const id of duplicates(selection.selections.map((item) => item.id))) errors.push(`${prefix}: duplicate selection id ${id}`);
  for (const item of selection.selections) {
    if (!patternIds.has(item.patternRef)) errors.push(`${prefix}: selection ${item.id} references unknown pattern ${item.patternRef}`);
    validateRefs(item.requirementRefs, requirementIds, `${prefix}: selection ${item.id}`, errors);
    validateRefs(item.responsibilityRefs, responsibilityIds, `${prefix}: selection ${item.id}`, errors);
    validateRefs(item.evidenceRefs, evidenceIds, `${prefix}: selection ${item.id}`, errors);
    for (const alternative of item.rejectedAlternatives) {
      if (!patternIds.has(alternative.patternRef)) errors.push(`${prefix}: selection ${item.id} rejects unknown pattern ${alternative.patternRef}`);
      if (alternative.patternRef === item.patternRef) errors.push(`${prefix}: selection ${item.id} cannot reject its selected pattern`);
    }
  }
  const selectedResponsibilities = new Set(selection.selections.flatMap((item) => item.responsibilityRefs));
  for (const responsibilityId of responsibilityIds) {
    if (!selectedResponsibilities.has(responsibilityId)) errors.push(`${prefix}: responsibility ${responsibilityId} has no selected pattern`);
  }
  return errors;
}

export function computeDirectionReviewDigest(directionSet) {
  const reviewable = structuredClone(directionSet);
  reviewable.meta.status = 'ready-for-review';
  reviewable.review = {
    status: 'pending',
    requiredRole: directionSet.review.requiredRole,
    approval: null,
  };
  return canonicalDigest(reviewable);
}

function structuralDifferenceCount(left, right) {
  return Object.keys(left.structure).filter((key) => left.structure[key] !== right.structure[key]).length;
}

export function validateDirectionSet(directionSet, allocation, responsibilities, patternSelection, registry, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = directionSet.meta?.id || 'direction-set';
  const sourceBindings = [
    ['designBriefRef', 'designBriefDigest'],
    ['requirementAllocationRef', 'requirementAllocationDigest'],
    ['screenResponsibilitiesRef', 'screenResponsibilitiesDigest'],
    ['patternSelectionRef', 'patternSelectionDigest'],
  ];
  for (const [refField, digestField] of sourceBindings) {
    validateFileDigest(root, directionSet.source[refField], directionSet.source[digestField], `${prefix}: ${refField}`, errors);
  }
  const requirementIds = new Set(allocation.requirements.map((item) => item.id));
  const responsibilityIds = new Set(responsibilities.responsibilities.map((item) => item.id));
  const directionIds = new Set(directionSet.directions.map((item) => item.id));
  for (const id of duplicates(directionSet.directions.map((item) => item.id))) errors.push(`${prefix}: duplicate direction id ${id}`);
  if (directionSet.directions.length < registry.directionPolicy.minimum || directionSet.directions.length > registry.directionPolicy.maximum) {
    errors.push(`${prefix}: direction count violates policy`);
  }
  for (const direction of directionSet.directions) {
    validateRefs(direction.requirementRefs, requirementIds, `${prefix}: direction ${direction.id}`, errors);
    const directionRequirements = new Set(direction.requirementRefs);
    for (const requirementId of requirementIds) {
      if (!directionRequirements.has(requirementId)) errors.push(`${prefix}: direction ${direction.id} does not cover requirement ${requirementId}`);
    }
    const placed = direction.responsibilityPlacement.map((item) => item.responsibilityRef);
    validateRefs(placed, responsibilityIds, `${prefix}: direction ${direction.id}`, errors);
    for (const responsibilityId of responsibilityIds) {
      if (!placed.includes(responsibilityId)) errors.push(`${prefix}: direction ${direction.id} does not place responsibility ${responsibilityId}`);
    }
    for (const id of duplicates(placed)) errors.push(`${prefix}: direction ${direction.id} places responsibility ${id} more than once`);
    for (const sequence of duplicates(direction.responsibilityPlacement.map((item) => item.sequence))) {
      errors.push(`${prefix}: direction ${direction.id} repeats sequence ${sequence}`);
    }
  }
  for (let left = 0; left < directionSet.directions.length; left += 1) {
    for (let right = left + 1; right < directionSet.directions.length; right += 1) {
      const differenceCount = structuralDifferenceCount(directionSet.directions[left], directionSet.directions[right]);
      if (differenceCount < registry.directionPolicy.minimumPairwiseDifferences) {
        errors.push(`${prefix}: directions ${directionSet.directions[left].id} and ${directionSet.directions[right].id} differ in only ${differenceCount} structural dimensions`);
      }
    }
  }
  if (!directionIds.has(directionSet.recommendation.directionRef)) errors.push(`${prefix}: recommendation references unknown direction`);
  if (patternSelection.selections.length === 0) errors.push(`${prefix}: directions require at least one selected Product UI Pattern`);
  if (directionSet.meta.status === 'ready-for-review' && (directionSet.review.status !== 'pending' || directionSet.review.approval !== null)) {
    errors.push(`${prefix}: ready-for-review direction set must have pending Human Review`);
  }
  if (directionSet.meta.status === 'approved') {
    const approval = directionSet.review.approval;
    if (directionSet.review.status !== 'approved' || !approval) {
      errors.push(`${prefix}: approved direction set requires Human Approval`);
    } else {
      if (approval.actorType !== 'human') errors.push(`${prefix}: AI cannot approve a Direction`);
      if (approval.role !== registry.directionPolicy.humanApprovalRole) errors.push(`${prefix}: direction approval requires role ${registry.directionPolicy.humanApprovalRole}`);
      if (approval.decision !== 'approved') errors.push(`${prefix}: approved direction set has a non-approval decision`);
      if (!directionIds.has(approval.selectedDirectionRef)) errors.push(`${prefix}: approval selects unknown direction`);
      if (approval.directionSetDigest !== computeDirectionReviewDigest(directionSet)) errors.push(`${prefix}: direction approval digest is stale`);
    }
  } else if (directionSet.review.status === 'approved' || directionSet.review.approval?.decision === 'approved') {
    errors.push(`${prefix}: only an approved direction set may contain approval`);
  }
  return errors;
}

export function approveDirection(directionSet, approval, registry) {
  if (directionSet.meta.status !== 'ready-for-review') throw new Error('Only a ready-for-review Direction Set can be approved');
  if (approval.actorType !== 'human') throw new Error('AI cannot approve a Direction');
  if (approval.role !== registry.directionPolicy.humanApprovalRole) {
    throw new Error(`Direction approval requires role ${registry.directionPolicy.humanApprovalRole}`);
  }
  if (!directionSet.directions.some((direction) => direction.id === approval.selectedDirectionRef)) {
    throw new Error(`Unknown selected Direction ${approval.selectedDirectionRef}`);
  }
  const approved = structuredClone(directionSet);
  approved.meta.revision += 1;
  approved.meta.updatedAt = approval.decidedAt;
  approved.meta.status = approval.decision === 'approved' ? 'approved' : approval.decision;
  approved.review.status = approval.decision;
  approved.review.approval = {
    ...approval,
    directionSetDigest: computeDirectionReviewDigest(approved),
  };
  return approved;
}
