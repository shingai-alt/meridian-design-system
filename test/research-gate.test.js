const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const policy = {
  gate: { researchRequiredWhen: [{ id: 'uncertainty' }] },
  sourcePolicy: {
    allowedTypes: ['standard', 'secondary-analysis'],
    minimumEvidence: { total: 1, primary: 1 },
  },
};

function completeResearch() {
  return {
    status: 'complete',
    scope: { itemId: 'overview.target', summary: 'Overview targetの判断と関連sourceを確認する。' },
    triggers: ['uncertainty'],
    questions: ['どの判断が一次資料と整合するか。'],
    evidence: [
      {
        id: 'source',
        title: 'Primary standard',
        url: 'https://example.com/standard',
        sourceType: 'standard',
        authority: 'primary',
        accessedAt: '2026-07-13',
        summary: 'The source defines the behavior used by the decision.',
        supportedDecisions: ['decision-1'],
      },
    ],
    synthesis: '一次資料を比較し、対象の判断に適用できる共通要件を特定した。',
    decisionImpact: '一次資料の要件をdecision-1へ反映し、仕様上の判断境界を明文化した。',
    notRequiredReason: null,
  };
}

function validate(research, overrides = {}) {
  return import('../scripts/lib/research-gate.mjs').then(({ validateResearchGate }) =>
    validateResearchGate({
      research,
      reviewStatus: 'complete',
      decisionIds: new Set(['decision-1']),
      policy,
      itemId: 'overview.target',
      reviewedSources: ['design/research-policy.json'],
      policyPath: 'design/research-policy.json',
      ...overrides,
    }),
  );
}

function reviewRecord(research) {
  return {
    $schema: '../../schemas/review-record.schema.json',
    schemaVersion: '0.1.0',
    itemId: 'overview.target',
    cycleId: '2026-07-13-overview-target-01',
    supersedesCycleId: null,
    reviewType: 'full',
    status: 'complete',
    startedAt: '2026-07-13',
    completedAt: '2026-07-13',
    reviewedSources: ['design/research-policy.json'],
    research,
    decisions: [{ id: 'decision-1', summary: 'Adopt the standard.', rationale: 'The primary source supports it.' }],
    differences: [],
    changes: [],
    validations: [],
    openQuestions: [],
    acknowledgedImpacts: [],
    impactedItems: [],
    nextRecommendedItems: [],
  };
}

test('accepts completed research with primary evidence and decision linkage', async () => {
  assert.deepEqual(await validate(completeResearch()), []);
});

test('valid completed research satisfies both the review schema and gate', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = JSON.parse(readFileSync(join(__dirname, '../schemas/review-record.schema.json'), 'utf8'));
  assert.deepEqual(validateAgainstSchema(reviewRecord(completeResearch()), schema, { label: 'review' }), []);
  assert.deepEqual(await validate(completeResearch()), []);
});

test('schema and gate jointly reject empty source metadata and policy omission', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = JSON.parse(readFileSync(join(__dirname, '../schemas/review-record.schema.json'), 'utf8'));
  const research = completeResearch();
  research.evidence[0].title = ' ';
  research.evidence[0].summary = ' ';
  research.evidence[0].accessedAt = 'not-a-date';
  const review = reviewRecord(research);
  review.reviewedSources = [];

  const errors = [
    ...validateAgainstSchema(review, schema, { label: 'review' }),
    ...await validate(research, { reviewedSources: [] }),
  ];
  assert.match(errors.join('\n'), /reviewedSources/);
  assert.match(errors.join('\n'), /title/);
  assert.match(errors.join('\n'), /summary/);
  assert.match(errors.join('\n'), /accessedAt/);
});

test('requires the research policy among reviewed sources', async () => {
  const errors = await validate(completeResearch(), { reviewedSources: [] });
  assert.match(errors.join('\n'), /reviewedSources must include/);
});

test('requires scope to identify the reviewed item', async () => {
  const research = completeResearch();
  research.scope.itemId = 'overview.other';
  const errors = await validate(research);
  assert.match(errors.join('\n'), /scope itemId must match/);
});

test('rejects blank questions, invalid dates, blank summaries, and unknown decisions', async () => {
  const research = completeResearch();
  research.questions = ['  '];
  research.evidence[0].accessedAt = 'not-a-date';
  research.evidence[0].summary = ' ';
  research.evidence[0].supportedDecisions = ['unknown-decision'];
  const errors = await validate(research);
  assert.match(errors.join('\n'), /questions cannot be blank/);
  assert.match(errors.join('\n'), /valid YYYY-MM-DD/);
  assert.match(errors.join('\n'), /requires a summary/);
  assert.match(errors.join('\n'), /unknown decision/);
});

test('requires primary evidence for completed research', async () => {
  const research = completeResearch();
  research.evidence[0].authority = 'secondary';
  const errors = await validate(research);
  assert.match(errors.join('\n'), /primary source/);
});

test('requires a concrete scope-specific reason when research is not required', async () => {
  const research = {
    status: 'not-required',
    scope: { itemId: 'overview.target', summary: 'Overview targetの内部sourceだけを確認する。' },
    triggers: [],
    questions: [],
    evidence: [],
    synthesis: '',
    decisionImpact: '',
    notRequiredReason: '短い',
  };
  const errors = await validate(research, { decisionIds: new Set() });
  assert.match(errors.join('\n'), /scope-specific reason/);
});

test('not-required cannot retain research questions, triggers, or evidence', async () => {
  const research = completeResearch();
  research.status = 'not-required';
  research.notRequiredReason = '内部sourceの同期だけが対象であり、外部の判断基準を変更しないため調査不要とした。';
  const errors = await validate(research);
  assert.match(errors.join('\n'), /cannot contain required-research triggers/);
  assert.match(errors.join('\n'), /cannot contain research questions/);
  assert.match(errors.join('\n'), /cannot contain evidence/);
});

test('complete reviews cannot leave research pending, while blocked reviews can', async () => {
  const research = {
    status: 'pending',
    scope: { itemId: 'overview.target', summary: 'Overview targetの外部標準との整合を確認する。' },
    triggers: ['uncertainty'],
    questions: ['一次資料を取得できるか。'],
    evidence: [],
    synthesis: '',
    decisionImpact: '',
    notRequiredReason: null,
  };
  assert.match((await validate(research)).join('\n'), /cannot leave research pending/);
  assert.deepEqual(await validate(research, { reviewStatus: 'blocked' }), []);
});
