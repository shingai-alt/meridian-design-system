export function validateImplementationReadiness(contract, policy) {
  const readiness = contract.implementationReadiness;
  const errors = [];
  const prefix = `${contract.id}: implementation readiness`;

  if (contract.tokenBindings?.coverage === 'complete' && !readiness) {
    errors.push(`${prefix} evidence is required when token binding coverage is complete`);
    return errors;
  }
  if (!readiness) return errors;

  if (readiness.policyVersion !== policy.schemaVersion) {
    errors.push(`${prefix} policyVersion must equal ${policy.schemaVersion}`);
  }
  if (contract.tokenBindings?.coverage === 'complete' && readiness.status !== 'ready') {
    errors.push(`${prefix} must be ready when token binding coverage is complete`);
  }
  if (readiness.status !== 'ready') return errors;

  if (!contract.contractVersion) errors.push(`${prefix} requires contractVersion`);
  if (contract.status !== 'draft') errors.push(`${prefix} must remain draft before React and visual regression completion`);
  if (contract.tokenBindings?.coverage !== 'complete') errors.push(`${prefix} requires complete token bindings`);
  if ((contract.tokenBindings?.unboundSlots ?? []).length) errors.push(`${prefix} cannot contain unbound token slots`);
  if ((contract.openQuestions ?? []).length) errors.push(`${prefix} cannot contain contract open questions`);

  for (const field of ['runtime', 'selectionRules', 'negativeExamples', 'requiredScenarios']) {
    if (!contract[field] || (Array.isArray(contract[field]) && contract[field].length === 0)) {
      errors.push(`${prefix} requires ${field}`);
    }
  }

  const expectedCriteria = policy.requiredCriteria.map(({ id }) => id);
  const evidenceByCriterion = new Map((readiness.criteria ?? []).map((criterion) => [criterion.id, criterion]));
  for (const id of expectedCriteria) {
    const criterion = evidenceByCriterion.get(id);
    if (!criterion) errors.push(`${prefix} is missing criterion ${id}`);
    else if (criterion.status !== 'passed') errors.push(`${prefix} criterion ${id} must be passed`);
    else if (!criterion.evidence?.length) errors.push(`${prefix} criterion ${id} requires evidence`);
  }
  for (const id of evidenceByCriterion.keys()) {
    if (!expectedCriteria.includes(id)) errors.push(`${prefix} has unknown criterion ${id}`);
  }
  if (evidenceByCriterion.size !== expectedCriteria.length) errors.push(`${prefix} criteria must match the policy exactly`);
  if (!(readiness.remainingToStable ?? []).length) errors.push(`${prefix} must state what remains before stable`);

  const scenarios = new Set(contract.requiredScenarios ?? []);
  for (const state of contract.states ?? []) {
    if (!scenarios.has(state.id)) errors.push(`${prefix} requiredScenarios must include state ${state.id}`);
  }
  for (const variant of Object.keys(contract.variants ?? {})) {
    if (!scenarios.has(variant)) errors.push(`${prefix} requiredScenarios must include variant ${variant}`);
  }

  const bindingSlots = (contract.tokenBindings?.bindings ?? []).map(({ slot }) => slot);
  if (new Set(bindingSlots).size !== bindingSlots.length) errors.push(`${prefix} token binding slots must be unique`);

  return errors;
}
