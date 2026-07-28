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

function fileDigest(path) {
  return `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

function safePath(root, path) {
  if (isAbsolute(path)) return null;
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  return rel.startsWith('..') || isAbsolute(rel) ? null : absolute;
}

function validateFileDigest(root, path, digest, label, errors) {
  const absolute = safePath(root, path);
  if (!absolute) errors.push(`${label} escapes the project root`);
  else if (!existsSync(absolute)) errors.push(`${label} does not exist: ${path}`);
  else if (fileDigest(absolute) !== digest) errors.push(`${label} digest is stale`);
}

function sameMembers(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

function readVerifiedExternalDecision(adapter, root) {
  if (adapter.kind !== 'external' || adapter.approval.status !== 'approved' || !adapter.approval.decisionRef) return null;
  const decisionPath = safePath(root, adapter.approval.decisionRef);
  if (!decisionPath || !existsSync(decisionPath)) return null;
  try {
    const record = JSON.parse(readFileSync(decisionPath, 'utf8'));
    if (
      record.kind === 'ui-generation-research-decision'
      && record.decision?.status === 'approved'
      && record.decision?.approval?.actorType === 'human'
      && record.decision?.recommendedCandidateId === adapter.id
    ) return record;
  } catch {
    return null;
  }
  return null;
}

function assertBoundResolverInput(root, ref, digest, value, label) {
  const absolute = safePath(root, ref);
  if (!absolute || !existsSync(absolute)) throw new Error(`${label} source does not exist within the project root`);
  if (fileDigest(absolute) !== digest) throw new Error(`${label} source digest is stale`);
  let sourceValue;
  try {
    sourceValue = JSON.parse(readFileSync(absolute, 'utf8'));
  } catch {
    throw new Error(`${label} source is not valid JSON`);
  }
  if (JSON.stringify(sourceValue) !== JSON.stringify(value)) {
    throw new Error(`${label} object differs from its digest-bound source`);
  }
}

export function validateCapabilityTaxonomy(taxonomy) {
  const errors = [];
  for (const id of duplicates(taxonomy.capabilities.map((item) => item.id))) {
    errors.push(`capability taxonomy has duplicate capability ${id}`);
  }
  return errors;
}

export function validateCapabilityPlan(plan, directionSet, taxonomy, responsibilities, allocation, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = plan.meta?.id || 'capability-plan';
  validateFileDigest(root, plan.source.directionSetRef, plan.source.directionSetDigest, `${prefix}: directionSetRef`, errors);
  validateFileDigest(root, plan.source.taxonomyRef, plan.source.taxonomyDigest, `${prefix}: taxonomyRef`, errors);

  const capabilities = new Map(taxonomy.capabilities.map((item) => [item.id, item]));
  const directionIds = new Set(directionSet.directions.map((item) => item.id));
  const responsibilityIds = new Set(responsibilities.responsibilities.map((item) => item.id));
  const requirementIds = new Set(allocation.requirements.map((item) => item.id));
  if (!directionIds.has(plan.direction.directionRef)) errors.push(`${prefix}: directionRef is unknown`);
  if (plan.direction.selectionBasis === 'recommendation' && plan.direction.directionRef !== directionSet.recommendation.directionRef) {
    errors.push(`${prefix}: recommendation selectionBasis must use the recommended direction`);
  }
  if (plan.direction.selectionBasis === 'human-approval') {
    const approval = directionSet.review.approval;
    if (!approval || approval.selectedDirectionRef !== plan.direction.directionRef) {
      errors.push(`${prefix}: human-approval selectionBasis requires the matching Direction Set approval`);
    }
    if (plan.direction.approvalDigest !== approval?.directionSetDigest) {
      errors.push(`${prefix}: approvalDigest does not match the Direction Set approval`);
    }
  } else if (plan.direction.approvalDigest !== null) {
    errors.push(`${prefix}: recommendation selectionBasis cannot claim an approvalDigest`);
  }

  for (const id of duplicates(plan.requirements.map((item) => item.id))) errors.push(`${prefix}: duplicate requirement ${id}`);
  for (const item of plan.requirements) {
    const capability = capabilities.get(item.capabilityRef);
    if (!capability) {
      errors.push(`${prefix}: ${item.id} references unknown capability ${item.capabilityRef}`);
      continue;
    }
    for (const semantic of item.requiredSemantics) {
      if (!capability.requiredSemantics.includes(semantic)) {
        errors.push(`${prefix}: ${item.id} uses undeclared semantic ${semantic}`);
      }
    }
    for (const semantic of capability.requiredSemantics) {
      if (!item.requiredSemantics.includes(semantic)) {
        errors.push(`${prefix}: ${item.id} omits mandatory semantic ${semantic}`);
      }
    }
    for (const ref of item.responsibilityRefs) {
      if (!responsibilityIds.has(ref)) errors.push(`${prefix}: ${item.id} references unknown responsibility ${ref}`);
    }
    for (const ref of item.requirementRefs) {
      if (!requirementIds.has(ref)) errors.push(`${prefix}: ${item.id} references unknown product requirement ${ref}`);
    }
  }

  const requiredRefs = allocation.requirements.map((item) => item.id);
  const coveredRefs = [...new Set(plan.requirements.flatMap((item) => item.requirementRefs))];
  const uncoveredRefs = requiredRefs.filter((id) => !coveredRefs.includes(id));
  if (!sameMembers(plan.coverage.requiredRequirementRefs, requiredRefs)) errors.push(`${prefix}: requiredRequirementRefs is stale`);
  if (!sameMembers(plan.coverage.coveredRequirementRefs, coveredRefs)) errors.push(`${prefix}: coveredRequirementRefs is stale`);
  if (!sameMembers(plan.coverage.uncoveredRequirementRefs, uncoveredRefs)) errors.push(`${prefix}: uncoveredRequirementRefs is stale`);
  if (plan.meta.status === 'ready' && uncoveredRefs.length) errors.push(`${prefix}: ready plan requires full product requirement coverage`);
  if (directionSet.meta.status !== 'approved') {
    if (plan.meta.status !== 'blocked') errors.push(`${prefix}: an unapproved Direction Set requires blocked status`);
    if (!plan.blockers.some((item) => item.includes('Direction'))) {
      errors.push(`${prefix}: blocked plan must name the Direction approval blocker`);
    }
  } else {
    if (plan.direction.selectionBasis !== 'human-approval') {
      errors.push(`${prefix}: an approved Direction Set requires human-approval selectionBasis`);
    }
    if (plan.meta.status === 'blocked' && plan.blockers.length === 0) {
      errors.push(`${prefix}: blocked plan requires at least one blocker`);
    }
  }
  return errors;
}

export function validateAdapterRegistry(registry, taxonomy, config, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const capabilityIds = new Set(taxonomy.capabilities.map((item) => item.id));
  const configAdapters = new Map(config.designSystem.adapters.map((item) => [item.id, item]));
  const knownComponentRefs = new Set(options.knownComponentRefs ?? []);
  const componentStatuses = new Map(options.componentStatuses ?? []);
  for (const id of duplicates(registry.adapters.map((item) => item.id))) errors.push(`adapter registry has duplicate adapter ${id}`);
  for (const adapter of registry.adapters) {
    const configured = configAdapters.get(adapter.id);
    if (!configured) errors.push(`adapter ${adapter.id} is not declared in meridian.design.json`);
    else {
      if (configured.kind !== adapter.kind) errors.push(`adapter ${adapter.id} kind differs from meridian.design.json`);
      if (configured.priority !== adapter.priority) errors.push(`adapter ${adapter.id} priority differs from meridian.design.json`);
      if (configured.status !== adapter.availability) errors.push(`adapter ${adapter.id} availability differs from meridian.design.json`);
    }
    if (adapter.kind === 'external' && adapter.approval.status === 'approved') {
      if (!adapter.approval.decisionRef) {
        errors.push(`external adapter ${adapter.id} requires an approval decisionRef`);
      } else {
        const decisionPath = safePath(root, adapter.approval.decisionRef);
        if (!decisionPath || !existsSync(decisionPath)) {
          errors.push(`external adapter ${adapter.id} approval decision does not exist`);
        } else {
          let decision = null;
          try {
            decision = JSON.parse(readFileSync(decisionPath, 'utf8'));
          } catch {
            errors.push(`external adapter ${adapter.id} approval decision is not valid JSON`);
          }
          if (decision) {
            if (decision.kind !== 'ui-generation-research-decision') {
              errors.push(`external adapter ${adapter.id} approval is not a UI Generation research decision`);
            }
            if (decision.decision?.status !== 'approved' || decision.decision?.approval?.actorType !== 'human') {
              errors.push(`external adapter ${adapter.id} requires a Human-approved research decision`);
            }
            if (decision.decision?.recommendedCandidateId !== adapter.id) {
              errors.push(`external adapter ${adapter.id} is not the approved recommended candidate`);
            }
          }
        }
      }
    }
    if (adapter.kind === 'external' && adapter.approval.status === 'project-existing') {
      errors.push(`external adapter ${adapter.id} cannot use project-existing eligibility`);
    }
    if (adapter.kind === 'project' && adapter.availability === 'available' && adapter.approval.status !== 'project-existing') {
      errors.push(`available project adapter ${adapter.id} must use project-existing eligibility`);
    }
    for (const sourceRef of adapter.sourceRefs) {
      const absolute = safePath(root, sourceRef);
      if (!absolute || !existsSync(absolute)) errors.push(`adapter ${adapter.id} source does not exist: ${sourceRef}`);
    }
    if (adapter.kind === 'project') {
      const runtimePackagePath = adapter.runtimePackageRef ? safePath(root, adapter.runtimePackageRef) : null;
      if (!runtimePackagePath || !existsSync(runtimePackagePath)) {
        errors.push(`project adapter ${adapter.id} runtimePackageRef does not exist`);
      }
    }
    for (const capabilityRef of duplicates(adapter.bindings.map((item) => item.capabilityRef))) {
      errors.push(`adapter ${adapter.id} has duplicate binding for ${capabilityRef}`);
    }
    for (const [index, binding] of adapter.bindings.entries()) {
      if (!capabilityIds.has(binding.capabilityRef)) errors.push(`adapter ${adapter.id} binding ${index} has unknown capability`);
      const taxonomyItem = taxonomy.capabilities.find((item) => item.id === binding.capabilityRef);
      if (taxonomyItem && !taxonomyItem.allowedResolutionKinds.includes(binding.resolutionKind)) {
        errors.push(`adapter ${adapter.id} binding ${index} uses forbidden resolution kind`);
      }
      if (adapter.kind === 'project' && knownComponentRefs.size > 0) {
        for (const targetRef of binding.targetRefs) {
          if (!knownComponentRefs.has(targetRef)) errors.push(`adapter ${adapter.id} binding ${index} references unknown project component ${targetRef}`);
        }
        const nonStableTargets = binding.targetRefs.filter((targetRef) => componentStatuses.get(targetRef) !== 'stable');
        if (binding.maturity === 'stable' && nonStableTargets.length > 0) {
          errors.push(`adapter ${adapter.id} binding ${index} cannot mark non-stable project component(s) as stable: ${nonStableTargets.join(', ')}`);
        }
      }
    }
  }
  return errors;
}

export function resolveCapabilityPlan(plan, registry, options = {}) {
  const root = resolve(options.root || process.cwd());
  assertBoundResolverInput(
    root,
    options.capabilityPlanRef,
    options.capabilityPlanDigest,
    plan,
    'Capability Plan',
  );
  assertBoundResolverInput(
    root,
    options.adapterRegistryRef,
    options.adapterRegistryDigest,
    registry,
    'Adapter Registry',
  );
  assertBoundResolverInput(
    root,
    options.tokenMappingRef,
    options.tokenMappingDigest,
    options.tokenMapping,
    'Adapter Token Mapping',
  );
  const requested = options.adapterRefs ?? [];
  const requestedSet = new Set(requested);
  const stableProjectTargetRefs = new Set(options.stableProjectTargetRefs ?? []);
  const candidates = registry.adapters
    .filter((adapter) => adapter.availability === 'available')
    .filter((adapter) => (
      adapter.kind === 'project'
        ? adapter.approval.status === 'project-existing'
        : Boolean(readVerifiedExternalDecision(adapter, root))
    ))
    .filter((adapter) => requested.length === 0 || requestedSet.has(adapter.id))
    .sort((left, right) => {
      if (registry.selectionPolicy === 'project-existing-first' && left.kind !== right.kind) {
        return left.kind === 'project' ? -1 : 1;
      }
      return left.priority - right.priority || left.id.localeCompare(right.id);
    });
  const results = plan.requirements.map((requirement) => {
    let bestPartial = null;
    for (const adapter of candidates) {
      const bindingIndex = adapter.bindings.findIndex((item) => item.capabilityRef === requirement.capabilityRef);
      if (bindingIndex < 0) continue;
      const binding = adapter.bindings[bindingIndex];
      const missingSemantics = requirement.requiredSemantics.filter((item) => !binding.supportedSemantics.includes(item));
      const missingStates = requirement.requiredStates.filter((item) => !binding.supportedStates.includes(item));
      const adapterMapping = options.tokenMapping.adapters.find((item) => item.adapterRef === adapter.id);
      const compatibilityReasons = [];
      if (!adapterMapping) {
        compatibilityReasons.push(`Adapter ${adapter.id} has no token and runtime compatibility mapping.`);
      } else {
        for (const targetRef of binding.targetRefs) {
          const target = adapterMapping.targets.find((item) => item.targetRef === targetRef);
          if (!target) {
            compatibilityReasons.push(`Target ${targetRef} is absent from the adapter compatibility mapping.`);
            continue;
          }
          if (!target.runtimeImplemented) compatibilityReasons.push(`Target ${targetRef} is not implemented by adapter runtime ${adapterMapping.runtime.version}.`);
          else if (!target.runtimeCompatible) compatibilityReasons.push(`Target ${targetRef} is incompatible with adapter runtime ${adapterMapping.runtime.version}.`);
          const unmapped = target.requiredOutputRefs.filter((outputRef) => adapterMapping.unmappedOutputRefs.includes(outputRef));
          if (unmapped.length) compatibilityReasons.push(`Target ${targetRef} has unmapped token outputs: ${unmapped.join(', ')}.`);
        }
      }
      const effectiveMaturity = adapter.kind === 'project'
        && !binding.targetRefs.every((targetRef) => stableProjectTargetRefs.has(targetRef))
        ? 'provisional'
        : binding.maturity;
      const candidate = {
        capabilityRequirementRef: requirement.id,
        capabilityRef: requirement.capabilityRef,
        status: missingSemantics.length || missingStates.length || compatibilityReasons.length
          ? 'partial'
          : effectiveMaturity === 'provisional' ? 'provisional' : 'resolved',
        adapterRef: adapter.id,
        resolutionKind: binding.resolutionKind,
        targetRefs: binding.targetRefs,
        missingSemantics,
        missingStates,
        compatibility: {
          status: compatibilityReasons.length ? 'incompatible' : 'compatible',
          reasons: compatibilityReasons,
        },
        provenance: { adapterVersion: adapter.version, bindingIndex },
      };
      if (candidate.status !== 'partial') return candidate;
      if (!bestPartial) bestPartial = candidate;
    }
    return bestPartial ?? {
      capabilityRequirementRef: requirement.id,
      capabilityRef: requirement.capabilityRef,
      status: 'unresolved',
      adapterRef: null,
      resolutionKind: null,
      targetRefs: [],
      missingSemantics: requirement.requiredSemantics,
      missingStates: requirement.requiredStates,
      compatibility: { status: 'not-evaluated', reasons: ['No eligible Adapter binding was available.'] },
      provenance: { adapterVersion: null, bindingIndex: null },
    };
  });
  const count = (status) => results.filter((item) => item.status === status).length;
  const summary = {
    total: results.length,
    resolved: count('resolved'),
    provisional: count('provisional'),
    partial: count('partial'),
    unresolved: count('unresolved'),
  };
  const reasons = [];
  if (plan.meta.status !== 'ready') reasons.push('Capability Plan is not ready because its structural direction is not Human-approved.');
  if (summary.partial) reasons.push(`${summary.partial} capability requirement(s) are only partially supported.`);
  if (summary.unresolved) reasons.push(`${summary.unresolved} capability requirement(s) are unresolved.`);
  return {
    meta: {
      schemaVersion: '0.1.0',
      kind: 'adapter-resolution',
      id: options.id ?? `resolution_${plan.meta.id}`,
      status: reasons.length ? 'blocked' : 'resolved',
      generatedAt: options.generatedAt ?? new Date().toISOString(),
    },
    source: {
      capabilityPlanRef: options.capabilityPlanRef,
      capabilityPlanDigest: options.capabilityPlanDigest,
      adapterRegistryRef: options.adapterRegistryRef,
      adapterRegistryDigest: options.adapterRegistryDigest,
      tokenMappingRef: options.tokenMappingRef,
      tokenMappingDigest: options.tokenMappingDigest,
    },
    policy: {
      selectionPolicy: registry.selectionPolicy,
      requestedAdapterRefs: requested,
      eligibleAdapterRefs: candidates.map((item) => item.id),
    },
    results,
    summary,
    generationGate: { status: reasons.length ? 'blocked' : 'pass', reasons },
  };
}

export function validateAdapterResolution(resolution, plan, registry, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = resolution.meta?.id || 'adapter-resolution';
  validateFileDigest(root, resolution.source.capabilityPlanRef, resolution.source.capabilityPlanDigest, `${prefix}: capabilityPlanRef`, errors);
  validateFileDigest(root, resolution.source.adapterRegistryRef, resolution.source.adapterRegistryDigest, `${prefix}: adapterRegistryRef`, errors);
  validateFileDigest(root, resolution.source.tokenMappingRef, resolution.source.tokenMappingDigest, `${prefix}: tokenMappingRef`, errors);
  const expected = resolveCapabilityPlan(plan, registry, {
    id: resolution.meta.id,
    generatedAt: resolution.meta.generatedAt,
    adapterRefs: resolution.policy.requestedAdapterRefs,
    capabilityPlanRef: resolution.source.capabilityPlanRef,
    capabilityPlanDigest: resolution.source.capabilityPlanDigest,
    adapterRegistryRef: resolution.source.adapterRegistryRef,
    adapterRegistryDigest: resolution.source.adapterRegistryDigest,
    tokenMappingRef: resolution.source.tokenMappingRef,
    tokenMappingDigest: resolution.source.tokenMappingDigest,
    tokenMapping: options.tokenMapping,
    root,
    stableProjectTargetRefs: options.stableProjectTargetRefs,
  });
  if (JSON.stringify(resolution) !== JSON.stringify(expected)) errors.push(`${prefix}: output is stale or was not produced by the strict resolver`);
  return errors;
}

export function compareAdapterResolutions(left, right) {
  const rightByRequirement = new Map(right.results.map((item) => [item.capabilityRequirementRef, item]));
  return left.results.map((item) => {
    const other = rightByRequirement.get(item.capabilityRequirementRef);
    return {
      capabilityRequirementRef: item.capabilityRequirementRef,
      changed: !other
        || item.status !== other.status
        || item.adapterRef !== other.adapterRef
        || item.resolutionKind !== other.resolutionKind
        || !sameMembers(item.targetRefs, other.targetRefs),
      from: { status: item.status, adapterRef: item.adapterRef, resolutionKind: item.resolutionKind, targetRefs: item.targetRefs },
      to: other
        ? { status: other.status, adapterRef: other.adapterRef, resolutionKind: other.resolutionKind, targetRefs: other.targetRefs }
        : null,
    };
  });
}
