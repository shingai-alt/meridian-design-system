const test = require('node:test');
const assert = require('node:assert/strict');

test('creates a follow-up record that links history and acknowledges current impacts', async () => {
  const { buildReviewRecord, nextCycleId } = await import('../scripts/lib/review-cycle.mjs');
  const existing = new Set(['2026-07-13-overview-target-01']);
  const cycleId = nextCycleId('overview.target', '2026-07-13', existing);
  const reviewHistory = [
    { status: 'complete', cycleId: 'source-1', impactedItems: ['overview.target'] },
    { status: 'complete', cycleId: 'source-2', impactedItems: ['overview.target'] },
    { status: 'complete', cycleId: 'other-1', impactedItems: [] },
  ];

  const record = buildReviewRecord({
    item: { id: 'overview.target', sources: ['js/pages-overview.js'] },
    date: '2026-07-13',
    cycleId,
    currentReview: { cycleId: 'target-1' },
    reviewHistory,
  });

  assert.equal(cycleId, '2026-07-13-overview-target-02');
  assert.equal(record.reviewType, 'follow-up');
  assert.equal(record.supersedesCycleId, 'target-1');
  assert.equal(record.research.status, 'pending');
  assert.deepEqual(record.research.scope, { itemId: 'overview.target', summary: '' });
  assert.deepEqual(record.acknowledgedImpacts, ['source-1', 'source-2']);
  assert.deepEqual(record.reviewedSources, ['design/research-policy.json', 'js/pages-overview.js']);
});
