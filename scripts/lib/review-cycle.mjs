export function nextCycleId(itemId, date, existingCycleIds) {
  const base = `${date}-${itemId.replaceAll('.', '-')}`;
  let sequence = 1;
  while (existingCycleIds.has(`${base}-${String(sequence).padStart(2, '0')}`)) sequence += 1;
  return `${base}-${String(sequence).padStart(2, '0')}`;
}

export function buildReviewRecord({ item, date, cycleId, currentReview, reviewHistory }) {
  const acknowledgedImpacts = [...reviewHistory]
    .filter(
      (review) =>
        review.status === 'complete' &&
        review.impactedItems.includes(item.id),
    )
    .map((review) => review.cycleId)
    .sort();

  return {
    $schema: '../../schemas/review-record.schema.json',
    schemaVersion: '0.1.0',
    itemId: item.id,
    cycleId,
    supersedesCycleId: currentReview?.cycleId ?? null,
    reviewType: currentReview ? 'follow-up' : 'full',
    status: 'in-progress',
    startedAt: date,
    completedAt: null,
    reviewedSources: [...new Set(['design/research-policy.json', ...item.sources])],
    research: {
      status: 'pending',
      scope: {
        itemId: item.id,
        summary: '',
      },
      triggers: [],
      questions: [],
      evidence: [],
      synthesis: '',
      decisionImpact: '',
      notRequiredReason: null,
    },
    decisions: [],
    differences: [],
    changes: [],
    validations: [],
    openQuestions: [],
    acknowledgedImpacts,
    impactedItems: [],
    nextRecommendedItems: [],
  };
}
