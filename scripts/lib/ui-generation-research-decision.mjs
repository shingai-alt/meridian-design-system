function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
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

export function validateUiGenerationResearchDecision(record, policy) {
  const errors = [];
  const prefix = record.id || 'research decision';
  const candidateIds = new Set(record.candidates.map((candidate) => candidate.id));
  const criterionIds = new Set(record.criteria.map((criterion) => criterion.id));
  const evidenceIds = new Set(record.evidence.map((evidence) => evidence.id));
  const spikeIds = new Set(record.spikes.map((spike) => spike.id));

  for (const duplicate of duplicates(record.criteria.map((criterion) => criterion.id))) {
    errors.push(`${prefix}: duplicate criterion id ${duplicate}`);
  }
  for (const duplicate of duplicates(record.candidates.map((candidate) => candidate.id))) {
    errors.push(`${prefix}: duplicate candidate id ${duplicate}`);
  }
  for (const duplicate of duplicates(record.evidence.map((evidence) => evidence.id))) {
    errors.push(`${prefix}: duplicate evidence id ${duplicate}`);
  }
  for (const duplicate of duplicates(record.spikes.map((spike) => spike.id))) {
    errors.push(`${prefix}: duplicate spike id ${duplicate}`);
  }

  const totalWeight = record.criteria.reduce((total, criterion) => total + criterion.weight, 0);
  if (totalWeight !== policy.scoring.requiredTotalWeight) {
    errors.push(`${prefix}: criterion weights must total ${policy.scoring.requiredTotalWeight}, received ${totalWeight}`);
  }

  if (policy.comparison.requiredFor.includes(record.category) && record.candidates.length < policy.comparison.minimumCandidates) {
    errors.push(`${prefix}: ${record.category} requires at least ${policy.comparison.minimumCandidates} candidates`);
  }

  for (const candidate of record.candidates) {
    if (candidate.disposition === 'eliminated' && !hasText(candidate.eliminationReason)) {
      errors.push(`${prefix}: eliminated candidate ${candidate.id} requires an elimination reason`);
    }
    if (candidate.disposition !== 'eliminated' && candidate.eliminationReason !== null) {
      errors.push(`${prefix}: non-eliminated candidate ${candidate.id} cannot retain an elimination reason`);
    }
    for (const evidenceRef of candidate.evidenceRefs) {
      if (!evidenceIds.has(evidenceRef)) errors.push(`${prefix}: candidate ${candidate.id} references unknown evidence ${evidenceRef}`);
    }
    const assessmentCriteria = candidate.assessments.map((assessment) => assessment.criterionId);
    for (const duplicate of duplicates(assessmentCriteria)) {
      errors.push(`${prefix}: candidate ${candidate.id} assesses criterion ${duplicate} more than once`);
    }
    for (const assessment of candidate.assessments) {
      if (!criterionIds.has(assessment.criterionId)) {
        errors.push(`${prefix}: candidate ${candidate.id} assesses unknown criterion ${assessment.criterionId}`);
      }
      for (const evidenceRef of assessment.evidenceRefs) {
        if (!evidenceIds.has(evidenceRef)) errors.push(`${prefix}: candidate ${candidate.id} assessment references unknown evidence ${evidenceRef}`);
      }
      for (const spikeRef of assessment.spikeRefs) {
        if (!spikeIds.has(spikeRef)) errors.push(`${prefix}: candidate ${candidate.id} assessment references unknown spike ${spikeRef}`);
      }
    }
  }

  for (const evidence of record.evidence) {
    for (const candidateRef of evidence.candidateRefs) {
      if (!candidateIds.has(candidateRef)) errors.push(`${prefix}: evidence ${evidence.id} references unknown candidate ${candidateRef}`);
    }
    for (const criterionRef of evidence.criterionRefs) {
      if (!criterionIds.has(criterionRef)) errors.push(`${prefix}: evidence ${evidence.id} references unknown criterion ${criterionRef}`);
    }
  }

  for (const spike of record.spikes) {
    for (const candidateRef of spike.candidateRefs) {
      if (!candidateIds.has(candidateRef)) errors.push(`${prefix}: spike ${spike.id} references unknown candidate ${candidateRef}`);
    }
    if (spike.status === 'complete') {
      if (spike.findings.length === 0) errors.push(`${prefix}: completed spike ${spike.id} requires findings`);
      if (spike.artifactRefs.length === 0) errors.push(`${prefix}: completed spike ${spike.id} requires artifact evidence`);
    }
  }

  const recommendationId = record.decision.recommendedCandidateId;
  if (recommendationId !== null && !candidateIds.has(recommendationId)) {
    errors.push(`${prefix}: decision recommends unknown candidate ${recommendationId}`);
  }
  for (const rejectedId of record.decision.rejectedCandidateIds) {
    if (!candidateIds.has(rejectedId)) errors.push(`${prefix}: decision rejects unknown candidate ${rejectedId}`);
    if (rejectedId === recommendationId) errors.push(`${prefix}: recommended candidate ${rejectedId} cannot also be rejected`);
  }

  if (record.status === 'researching') {
    if (record.decision.status !== 'pending') errors.push(`${prefix}: researching record must keep decision status pending`);
    if (recommendationId !== null) errors.push(`${prefix}: researching record cannot recommend a candidate`);
    if (record.decision.approval !== null) errors.push(`${prefix}: researching record cannot contain approval`);
  }

  if (record.status === 'decision-ready' || record.status === 'approved') {
    const activeCandidates = record.candidates.filter((candidate) => candidate.disposition !== 'eliminated');
    if (recommendationId === null) errors.push(`${prefix}: ${record.status} record requires a recommended candidate`);
    if (!hasText(record.decision.rationale)) errors.push(`${prefix}: ${record.status} record requires decision rationale`);
    if (record.decision.revisitTriggers.length === 0) errors.push(`${prefix}: ${record.status} record requires revisit triggers`);

    for (const candidate of activeCandidates) {
      const assessedIds = new Set(candidate.assessments.map((assessment) => assessment.criterionId));
      for (const criterion of record.criteria) {
        if (!assessedIds.has(criterion.id)) {
          errors.push(`${prefix}: candidate ${candidate.id} is missing assessment for ${criterion.id}`);
        }
      }
      for (const assessment of candidate.assessments) {
        if (assessment.score === null) errors.push(`${prefix}: candidate ${candidate.id} has unresolved score for ${assessment.criterionId}`);
        if (assessment.evidenceRefs.length === 0 && assessment.spikeRefs.length === 0) {
          errors.push(`${prefix}: candidate ${candidate.id} assessment ${assessment.criterionId} requires evidence or spike references`);
        }
      }
      const primaryEvidence = record.evidence.filter((evidence) =>
        evidence.authority === 'primary' && evidence.candidateRefs.includes(candidate.id)
      );
      if (primaryEvidence.length < policy.sourcePolicy.minimumPrimaryPerCandidate) {
        errors.push(`${prefix}: candidate ${candidate.id} requires at least ${policy.sourcePolicy.minimumPrimaryPerCandidate} primary evidence source(s)`);
      }
    }

    if (policy.spikes.requiredFor.includes(record.category)) {
      const completeComparativeSpike = record.spikes.some((spike) =>
        spike.status === 'complete' && activeCandidates.every((candidate) => spike.candidateRefs.includes(candidate.id))
      );
      if (!completeComparativeSpike) {
        errors.push(`${prefix}: ${record.category} requires a completed comparative spike covering every active candidate`);
      }
    }
  }

  if (record.status === 'decision-ready' && record.decision.status !== 'recommended') {
    errors.push(`${prefix}: decision-ready record requires decision status recommended`);
  }

  if (record.status === 'approved') {
    if (record.decision.status !== 'approved') errors.push(`${prefix}: approved record requires decision status approved`);
    if (record.decision.approval === null) {
      errors.push(`${prefix}: approved record requires human approval`);
    } else if (record.decision.approval.actorType !== 'human') {
      errors.push(`${prefix}: AI cannot approve a UI Generation research decision`);
    }
  } else if (record.decision.status === 'approved' || record.decision.approval !== null) {
    errors.push(`${prefix}: only an approved record may contain approval`);
  }

  return errors;
}
