function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function hasConcreteText(value, minimumLength = 1) {
  return typeof value === 'string' && value.trim().length >= minimumLength;
}

export function validateResearchGate({
  research,
  reviewStatus,
  decisionIds,
  policy,
  itemId,
  reviewedSources,
  policyPath,
}) {
  const errors = [];
  const scope = research.scope ?? {};
  const sources = reviewedSources ?? [];
  const allowedTriggers = new Set(policy.gate.researchRequiredWhen.map((trigger) => trigger.id));
  const allowedSourceTypes = new Set(policy.sourcePolicy.allowedTypes);

  if (!sources.includes(policyPath)) errors.push(`reviewedSources must include ${policyPath}`);
  if (scope.itemId !== itemId) errors.push(`research scope itemId must match ${itemId}`);
  if (reviewStatus !== 'in-progress' && !hasConcreteText(scope.summary, 10)) {
    errors.push('closed review requires a concrete research scope summary');
  }

  for (const trigger of research.triggers) {
    if (!allowedTriggers.has(trigger)) errors.push(`unknown research trigger ${trigger}`);
  }

  const evidenceIds = new Set();
  const evidenceUrls = new Set();
  for (const evidence of research.evidence) {
    if (evidenceIds.has(evidence.id)) errors.push(`duplicate research evidence id ${evidence.id}`);
    if (evidenceUrls.has(evidence.url)) errors.push(`duplicate research evidence URL ${evidence.url}`);
    evidenceIds.add(evidence.id);
    evidenceUrls.add(evidence.url);
    if (!hasConcreteText(evidence.title)) errors.push(`research evidence ${evidence.id} requires a title`);
    if (!hasConcreteText(evidence.summary)) errors.push(`research evidence ${evidence.id} requires a summary`);
    if (!isIsoDate(evidence.accessedAt)) errors.push(`research evidence ${evidence.id} requires a valid YYYY-MM-DD accessedAt date`);
    if (!allowedSourceTypes.has(evidence.sourceType)) errors.push(`unsupported research source type ${evidence.sourceType}`);
    if (evidence.sourceType === 'secondary-analysis' && evidence.authority !== 'secondary') {
      errors.push(`secondary analysis ${evidence.id} must use secondary authority`);
    }
    for (const decisionId of evidence.supportedDecisions) {
      if (!hasConcreteText(decisionId)) errors.push(`research evidence ${evidence.id} contains an empty decision id`);
      if (!decisionIds.has(decisionId)) errors.push(`research evidence ${evidence.id} references unknown decision ${decisionId}`);
    }
  }

  if (reviewStatus === 'complete' && research.status === 'pending') {
    errors.push('complete review cannot leave research pending');
  }

  if (research.status === 'complete') {
    const minimum = policy.sourcePolicy.minimumEvidence;
    const primaryCount = research.evidence.filter((evidence) => evidence.authority === 'primary').length;
    if (research.triggers.length === 0) errors.push('completed research requires at least one trigger');
    if (research.questions.length === 0) errors.push('completed research requires at least one question');
    if (research.questions.some((question) => !hasConcreteText(question))) errors.push('completed research questions cannot be blank');
    if (research.evidence.length < minimum.total) errors.push(`completed research requires at least ${minimum.total} evidence source(s)`);
    if (primaryCount < minimum.primary) errors.push(`completed research requires at least ${minimum.primary} primary source(s)`);
    if (!hasConcreteText(research.synthesis, 20)) errors.push('completed research requires a concrete synthesis');
    if (!hasConcreteText(research.decisionImpact, 20)) errors.push('completed research requires a concrete decision impact');
    if (research.notRequiredReason !== null) errors.push('completed research cannot define notRequiredReason');
  }

  if (research.status === 'not-required') {
    if (!hasConcreteText(research.notRequiredReason, 20)) errors.push('not-required research requires a concrete scope-specific reason');
    if (research.triggers.length > 0) errors.push('not-required research cannot contain required-research triggers');
    if (research.questions.length > 0) errors.push('not-required research cannot contain research questions');
    if (research.evidence.length > 0) errors.push('not-required research cannot contain evidence');
    if (research.synthesis.trim() || research.decisionImpact.trim()) {
      errors.push('not-required research cannot contain synthesis or decision impact');
    }
  }

  return errors;
}
