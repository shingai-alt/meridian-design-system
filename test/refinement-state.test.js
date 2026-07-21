const test = require('node:test');
const assert = require('node:assert/strict');

const registry = {
  domains: [
    {
      id: 'overview',
      order: 1,
      items: [
        { id: 'overview.source', order: 1, dependsOn: [] },
        { id: 'overview.target', order: 2, dependsOn: ['overview.source'] },
      ],
    },
  ],
};

test('returns a completed target to the queue for an unacknowledged impact', async () => {
  const { deriveStatuses, getReadyItems } = await import('../scripts/lib/refinement-state.mjs');
  const reviews = new Map([
    [
      'overview.source',
      { status: 'complete', cycleId: 'source-2', impactedItems: ['overview.target'], acknowledgedImpacts: [] },
    ],
    [
      'overview.target',
      { status: 'complete', cycleId: 'target-1', impactedItems: [], acknowledgedImpacts: ['source-1'] },
    ],
  ]);

  const statuses = deriveStatuses(registry, reviews);
  assert.equal(statuses.get('overview.target'), 'needs-review');
  assert.deepEqual(getReadyItems(registry, statuses).map((item) => item.id), ['overview.target']);
});

test('keeps a completed target closed after it acknowledges the impact cycle', async () => {
  const { deriveStatuses, getReadyItems } = await import('../scripts/lib/refinement-state.mjs');
  const reviews = new Map([
    [
      'overview.source',
      { status: 'complete', cycleId: 'source-2', impactedItems: ['overview.target'], acknowledgedImpacts: [] },
    ],
    [
      'overview.target',
      { status: 'complete', cycleId: 'target-2', impactedItems: [], acknowledgedImpacts: ['source-2'] },
    ],
  ]);

  const statuses = deriveStatuses(registry, reviews);
  assert.equal(statuses.get('overview.target'), 'complete');
  assert.deepEqual(getReadyItems(registry, statuses), []);
});

test('does not start another cycle while an item is in progress or blocked', async () => {
  const { deriveStatuses, getReadyItems } = await import('../scripts/lib/refinement-state.mjs');
  const inProgress = new Map([
    ['overview.source', { status: 'complete', cycleId: 'source-1', impactedItems: [], acknowledgedImpacts: [] }],
    ['overview.target', { status: 'in-progress', cycleId: 'target-1', impactedItems: [], acknowledgedImpacts: [] }],
  ]);
  assert.deepEqual(getReadyItems(registry, deriveStatuses(registry, inProgress)), []);

  inProgress.set('overview.target', {
    status: 'blocked',
    cycleId: 'target-1',
    impactedItems: [],
    acknowledgedImpacts: [],
  });
  assert.deepEqual(getReadyItems(registry, deriveStatuses(registry, inProgress)), []);
});

test('keeps unacknowledged impacts from superseded source cycles in the queue', async () => {
  const { deriveStatuses } = await import('../scripts/lib/refinement-state.mjs');
  const currentReviews = new Map([
    ['overview.source', { status: 'complete', cycleId: 'source-2', impactedItems: [], acknowledgedImpacts: [] }],
    ['overview.target', { status: 'complete', cycleId: 'target-1', impactedItems: [], acknowledgedImpacts: [] }],
  ]);
  const history = [
    { status: 'complete', cycleId: 'source-1', impactedItems: ['overview.target'] },
    ...currentReviews.values(),
  ];

  const statuses = deriveStatuses(registry, currentReviews, history);
  assert.equal(statuses.get('overview.target'), 'needs-review');
});
