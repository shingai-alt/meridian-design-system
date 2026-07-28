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

function currentArtifacts(session) {
  return session.artifacts.filter((artifact) => artifact.status === 'current');
}

function validateDigestRefs(refs, artifactsById, label, errors) {
  for (const ref of refs) {
    const artifact = artifactsById.get(ref.artifactId);
    if (!artifact) {
      errors.push(`${label} references unknown artifact ${ref.artifactId}`);
    } else if (artifact.digest !== ref.digest) {
      errors.push(`${label} has stale digest for ${ref.artifactId}`);
    }
  }
}

export function validateUiGenerationSessionPolicy(policy) {
  const errors = [];
  const stateIds = new Set(policy.states.map((state) => state.id));
  const artifactTypeIds = new Set(policy.artifactTypes.map((artifact) => artifact.id));

  for (const id of duplicates(policy.states.map((state) => state.id))) errors.push(`duplicate state id ${id}`);
  for (const id of duplicates(policy.artifactTypes.map((artifact) => artifact.id))) errors.push(`duplicate artifact type id ${id}`);
  for (const id of duplicates(policy.transitions.map((transition) => transition.id))) errors.push(`duplicate transition id ${id}`);

  for (const state of policy.states) {
    for (const type of state.requiredArtifactTypes) {
      if (!artifactTypeIds.has(type)) errors.push(`state ${state.id} requires unknown artifact type ${type}`);
    }
  }

  for (const transition of policy.transitions) {
    if (transition.from !== 'any_active_state' && !stateIds.has(transition.from)) {
      errors.push(`transition ${transition.id} starts from unknown state ${transition.from}`);
    }
    if (!stateIds.has(transition.to)) errors.push(`transition ${transition.id} ends at unknown state ${transition.to}`);
    for (const type of transition.requiredArtifactTypes) {
      if (!artifactTypeIds.has(type)) errors.push(`transition ${transition.id} requires unknown artifact type ${type}`);
    }
    if (transition.gate === 'human' && !transition.requiredApprovalRole) {
      errors.push(`human transition ${transition.id} requires an approval role`);
    }
    if (transition.gate === 'automatic' && transition.requiredApprovalRole !== null) {
      errors.push(`automatic transition ${transition.id} cannot require an approval role`);
    }
  }

  return errors;
}

export function validateUiGenerationSession(session, policy, options = {}) {
  const errors = [];
  const prefix = session.meta?.id || 'ui-generation-session';
  const root = resolve(options.root || process.cwd());
  const statesById = new Map(policy.states.map((state) => [state.id, state]));
  const transitionsById = new Map(policy.transitions.map((transition) => [transition.id, transition]));
  const artifactTypesById = new Map(policy.artifactTypes.map((artifact) => [artifact.id, artifact]));
  const approvalsById = new Map(session.approvals.map((approval) => [approval.id, approval]));
  const artifactsById = new Map(session.artifacts.map((artifact) => [artifact.id, artifact]));
  const currentArtifactContents = new Map();

  for (const id of duplicates(session.artifacts.map((artifact) => artifact.id))) errors.push(`${prefix}: duplicate artifact id ${id}`);
  for (const id of duplicates(session.approvals.map((approval) => approval.id))) errors.push(`${prefix}: duplicate approval id ${id}`);
  for (const id of duplicates(session.transitionHistory.map((transition) => transition.id))) errors.push(`${prefix}: duplicate transition history id ${id}`);

  const currentByType = new Map();
  const revisionsByType = new Map();
  for (const artifact of session.artifacts) {
    if (!artifactTypesById.has(artifact.type)) {
      errors.push(`${prefix}: artifact ${artifact.id} has unknown type ${artifact.type}`);
      continue;
    }
    const expectedOwnership = artifactTypesById.get(artifact.type).ownership;
    if (artifact.ownership !== expectedOwnership) {
      errors.push(`${prefix}: artifact ${artifact.id} ownership must be ${expectedOwnership}`);
    }
    const revisions = revisionsByType.get(artifact.type) ?? [];
    revisions.push(artifact.revision);
    revisionsByType.set(artifact.type, revisions);
  }

  for (const artifact of currentArtifacts(session)) {
    if (!artifactTypesById.has(artifact.type)) continue;
    if (currentByType.has(artifact.type)) {
      errors.push(`${prefix}: artifact type ${artifact.type} has more than one current artifact`);
    } else {
      currentByType.set(artifact.type, artifact);
    }

    const absolute = resolve(root, artifact.path);
    const rel = relative(root, absolute);
    if (isAbsolute(artifact.path) || rel.startsWith('..') || isAbsolute(rel)) {
      errors.push(`${prefix}: artifact ${artifact.id} path escapes the repository`);
    } else if (!existsSync(absolute)) {
      errors.push(`${prefix}: artifact ${artifact.id} path does not exist: ${artifact.path}`);
    } else if (fileDigest(absolute) !== artifact.digest) {
      errors.push(`${prefix}: artifact ${artifact.id} digest is stale`);
    } else {
      try {
        currentArtifactContents.set(artifact.id, JSON.parse(readFileSync(absolute, 'utf8')));
      } catch {
        errors.push(`${prefix}: artifact ${artifact.id} is not valid JSON`);
      }
    }
  }
  for (const [type, revisions] of revisionsByType) {
    if (duplicates(revisions).length > 0) errors.push(`${prefix}: artifact type ${type} has duplicate revisions`);
    const current = currentByType.get(type);
    if (current && current.revision !== Math.max(...revisions)) {
      errors.push(`${prefix}: current artifact type ${type} must have the highest revision`);
    }
  }

  const currentBrief = currentByType.get('design_brief');
  const briefContent = currentBrief ? currentArtifactContents.get(currentBrief.id) : null;
  if (briefContent?.meta?.kind === 'design-brief') {
    const sourceBindings = [
      {
        type: 'user_request',
        refField: 'requestRef',
        digestField: 'requestDigest',
      },
      {
        type: 'project_context',
        refField: 'projectContextRef',
        digestField: 'projectContextDigest',
      },
    ];
    for (const binding of sourceBindings) {
      const sourceArtifact = currentByType.get(binding.type);
      if (!sourceArtifact) {
        errors.push(`${prefix}: design brief requires current artifact type ${binding.type}`);
        continue;
      }
      if (briefContent.source?.[binding.refField] !== sourceArtifact.path) {
        errors.push(`${prefix}: design brief ${binding.refField} does not bind current ${binding.type} artifact`);
      }
      if (briefContent.source?.[binding.digestField] !== sourceArtifact.digest) {
        errors.push(`${prefix}: design brief ${binding.digestField} is stale for current ${binding.type} artifact`);
      }
    }
  }

  const artifactSourceBindings = [
    {
      ownerType: 'requirement_allocation',
      ownerKind: 'requirement-allocation',
      bindings: [
        { sourceType: 'design_brief', refField: 'designBriefRef', digestField: 'designBriefDigest' },
      ],
    },
    {
      ownerType: 'screen_responsibilities',
      ownerKind: 'screen-responsibilities',
      bindings: [
        { sourceType: 'design_brief', refField: 'designBriefRef', digestField: 'designBriefDigest' },
        { sourceType: 'requirement_allocation', refField: 'requirementAllocationRef', digestField: 'requirementAllocationDigest' },
      ],
    },
    {
      ownerType: 'pattern_selection',
      ownerKind: 'pattern-selection',
      bindings: [
        { sourceType: 'requirement_allocation', refField: 'requirementAllocationRef', digestField: 'requirementAllocationDigest' },
        { sourceType: 'screen_responsibilities', refField: 'screenResponsibilitiesRef', digestField: 'screenResponsibilitiesDigest' },
      ],
    },
    {
      ownerType: 'direction_set',
      ownerKind: 'direction-set',
      bindings: [
        { sourceType: 'design_brief', refField: 'designBriefRef', digestField: 'designBriefDigest' },
        { sourceType: 'requirement_allocation', refField: 'requirementAllocationRef', digestField: 'requirementAllocationDigest' },
        { sourceType: 'screen_responsibilities', refField: 'screenResponsibilitiesRef', digestField: 'screenResponsibilitiesDigest' },
        { sourceType: 'pattern_selection', refField: 'patternSelectionRef', digestField: 'patternSelectionDigest' },
      ],
    },
  ];
  for (const contract of artifactSourceBindings) {
    const ownerArtifact = currentByType.get(contract.ownerType);
    const ownerContent = ownerArtifact ? currentArtifactContents.get(ownerArtifact.id) : null;
    if (ownerContent?.meta?.kind !== contract.ownerKind) continue;
    for (const binding of contract.bindings) {
      const sourceArtifact = currentByType.get(binding.sourceType);
      if (!sourceArtifact) {
        errors.push(`${prefix}: ${contract.ownerKind} requires current artifact type ${binding.sourceType}`);
        continue;
      }
      if (ownerContent.source?.[binding.refField] !== sourceArtifact.path) {
        errors.push(`${prefix}: ${contract.ownerKind} ${binding.refField} does not bind current ${binding.sourceType} artifact`);
      }
      if (ownerContent.source?.[binding.digestField] !== sourceArtifact.digest) {
        errors.push(`${prefix}: ${contract.ownerKind} ${binding.digestField} is stale for current ${binding.sourceType} artifact`);
      }
    }
  }

  const state = statesById.get(session.meta.state);
  if (!state) {
    errors.push(`${prefix}: unknown current state ${session.meta.state}`);
  } else {
    for (const type of state.requiredArtifactTypes) {
      if (!currentByType.has(type)) errors.push(`${prefix}: state ${state.id} requires current artifact type ${type}`);
    }
  }

  const first = session.transitionHistory[0];
  if (first?.id !== 'initialize_session' || first.from !== null || first.to !== 'created') {
    errors.push(`${prefix}: transition history must start with initialize_session from null to created`);
  }
  if (first?.actorType !== 'system' || first.approvalRef !== null) {
    errors.push(`${prefix}: initialize_session must be an automatic system transition`);
  }
  if (session.meta.revision < session.transitionHistory.length) {
    errors.push(`${prefix}: session revision cannot be lower than transition history length`);
  }
  if (session.meta.updatedAt < session.meta.createdAt) {
    errors.push(`${prefix}: updatedAt cannot precede createdAt`);
  }

  let previousTo = null;
  let previousOccurredAt = null;
  const usedApprovalRefs = [];
  for (const [index, record] of session.transitionHistory.entries()) {
    validateDigestRefs(record.inputArtifactDigests, artifactsById, `${prefix}: transition ${record.id}`, errors);
    if (previousOccurredAt !== null && record.occurredAt < previousOccurredAt) {
      errors.push(`${prefix}: transition ${record.id} occurredAt is not chronological`);
    }
    if (record.occurredAt > session.meta.updatedAt) {
      errors.push(`${prefix}: transition ${record.id} occurred after session updatedAt`);
    }
    previousOccurredAt = record.occurredAt;
    if (index === 0) {
      previousTo = record.to;
      continue;
    }

    const transition = transitionsById.get(record.id);
    if (!transition) {
      errors.push(`${prefix}: transition history references unknown transition ${record.id}`);
      previousTo = record.to;
      continue;
    }
    if (record.from !== previousTo) errors.push(`${prefix}: transition ${record.id} does not continue from ${previousTo}`);
    if (transition.from !== 'any_active_state' && transition.from !== record.from) {
      errors.push(`${prefix}: transition ${record.id} cannot start from ${record.from}`);
    }
    if (transition.from === 'any_active_state' && statesById.get(record.from)?.terminal) {
      errors.push(`${prefix}: transition ${record.id} cannot start from terminal state ${record.from}`);
    }
    if (transition.to !== record.to) errors.push(`${prefix}: transition ${record.id} cannot end at ${record.to}`);
    const transitionArtifactTypes = new Set([
      ...transition.requiredArtifactTypes,
      ...(statesById.get(transition.to)?.requiredArtifactTypes ?? []),
    ]);
    const transitionDigestIds = new Set(record.inputArtifactDigests.map((ref) => ref.artifactId));
    for (const type of transitionArtifactTypes) {
      const artifact = currentByType.get(type);
      if (!artifact) {
        errors.push(`${prefix}: transition ${record.id} requires current artifact type ${type}`);
      } else if (!transitionDigestIds.has(artifact.id)) {
        errors.push(`${prefix}: transition ${record.id} does not bind required artifact ${artifact.id}`);
      }
    }

    if (transition.gate === 'human') {
      if (record.approvalRef !== null) usedApprovalRefs.push(record.approvalRef);
      const approval = approvalsById.get(record.approvalRef);
      if (!approval) {
        errors.push(`${prefix}: human transition ${record.id} requires a matching approval`);
      } else {
        if (approval.transitionId !== record.id) errors.push(`${prefix}: approval ${approval.id} does not approve transition ${record.id}`);
        if (approval.actor.type !== 'human') errors.push(`${prefix}: approval ${approval.id} must be authored by a human`);
        if (approval.actor.role !== transition.requiredApprovalRole) {
          errors.push(`${prefix}: approval ${approval.id} requires role ${transition.requiredApprovalRole}`);
        }
        if (approval.decision !== 'approved') errors.push(`${prefix}: approval ${approval.id} did not approve the transition`);
        validateDigestRefs(approval.artifactDigests, artifactsById, `${prefix}: approval ${approval.id}`, errors);
        const approvalDigestIds = new Set(approval.artifactDigests.map((ref) => ref.artifactId));
        for (const type of transitionArtifactTypes) {
          const artifact = currentByType.get(type);
          if (artifact && !approvalDigestIds.has(artifact.id)) {
            errors.push(`${prefix}: approval ${approval.id} does not bind required artifact ${artifact.id}`);
          }
        }
      }
      if (record.actorType !== 'human') errors.push(`${prefix}: human transition ${record.id} must be executed by a human actor`);
    } else if (record.approvalRef !== null) {
      errors.push(`${prefix}: automatic transition ${record.id} cannot use a human approval`);
    }
    previousTo = record.to;
  }
  for (const approvalRef of duplicates(usedApprovalRefs)) {
    errors.push(`${prefix}: approval ${approvalRef} cannot authorize more than one transition occurrence`);
  }
  for (const approval of session.approvals) {
    if (!usedApprovalRefs.includes(approval.id)) errors.push(`${prefix}: approval ${approval.id} is not used by transition history`);
  }

  if (previousTo !== session.meta.state) errors.push(`${prefix}: current state does not match final transition destination`);

  const expectedStatus = session.meta.state === 'completed'
    ? 'completed'
    : session.meta.state === 'cancelled'
      ? 'cancelled'
      : session.meta.state === 'failed'
        ? 'failed'
        : 'active';
  if (session.meta.status !== expectedStatus && session.meta.status !== 'superseded') {
    errors.push(`${prefix}: status ${session.meta.status} does not match state ${session.meta.state}`);
  }
  if (session.meta.state === 'completed' && session.blockers.some((blocker) => blocker.status === 'open')) {
    errors.push(`${prefix}: completed session cannot retain open blockers`);
  }

  for (const approval of session.approvals) {
    if (!transitionsById.has(approval.transitionId)) {
      errors.push(`${prefix}: approval ${approval.id} references unknown transition ${approval.transitionId}`);
    }
    validateDigestRefs(approval.artifactDigests, artifactsById, `${prefix}: approval ${approval.id}`, errors);
  }

  for (const blocker of session.blockers) {
    for (const artifactRef of blocker.artifactRefs) {
      if (!artifactsById.has(artifactRef)) errors.push(`${prefix}: blocker ${blocker.id} references unknown artifact ${artifactRef}`);
    }
    for (const transitionId of blocker.blocksTransitions) {
      if (!transitionsById.has(transitionId)) errors.push(`${prefix}: blocker ${blocker.id} references unknown transition ${transitionId}`);
      if (blocker.status === 'open' && session.transitionHistory.some((record) => record.id === transitionId)) {
        errors.push(`${prefix}: open blocker ${blocker.id} forbids transition ${transitionId}`);
      }
    }
  }

  return errors;
}
