export function deriveStatuses(registry, reviewsById, impactReviews = reviewsById.values()) {
  const items = registry.domains.flatMap((domain) => domain.items);
  const statuses = new Map(
    items.map((item) => [item.id, reviewsById.get(item.id)?.status ?? 'not-started']),
  );

  for (const sourceReview of impactReviews) {
    if (sourceReview.status !== 'complete') continue;
    for (const impactedItemId of sourceReview.impactedItems) {
      const targetReview = reviewsById.get(impactedItemId);
      if (
        targetReview?.status === 'complete' &&
        !targetReview.acknowledgedImpacts.includes(sourceReview.cycleId)
      ) {
        statuses.set(impactedItemId, 'needs-review');
      }
    }
  }

  return statuses;
}

export function getReadyItems(registry, statuses) {
  const domainsById = new Map(registry.domains.map((domain) => [domain.id, domain]));
  const startableStatuses = new Set(['not-started', 'needs-review']);
  return registry.domains
    .flatMap((domain) => domain.items)
    .filter(
      (item) =>
        startableStatuses.has(statuses.get(item.id)) &&
        item.dependsOn.every((dependency) => statuses.get(dependency) === 'complete'),
    )
    .sort((a, b) => {
      const aDomain = domainsById.get(a.id.split('.')[0]);
      const bDomain = domainsById.get(b.id.split('.')[0]);
      return aDomain.order - bDomain.order || a.order - b.order;
    });
}
