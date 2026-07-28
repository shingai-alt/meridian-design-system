import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  approveDesignBrief,
  createClarificationRound,
  expectedUnknownPriority,
  mergeClarificationRound,
  validateClarificationRound,
  validateDesignBrief,
} from '../scripts/lib/design-intake.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const brief = readJson('examples/ui-generation/team-invitation.design-brief.json');
const noQuestionsRound = readJson('examples/ui-generation/team-invitation.clarification.json');
const policy = readJson('design/ui-generation-clarification-policy.json');

function blockingUnknown(id, question, topic, structuralImpacts, evidenceRefs = ['evidence_user_request']) {
  const unknown = {
    id,
    question,
    topic,
    structuralImpacts,
    impact: 'blocking',
    priority: 0,
    status: 'open',
    answer: null,
    resolutionRationale: null,
    evidenceRefs,
  };
  unknown.priority = expectedUnknownPriority(unknown, policy);
  return unknown;
}

function persistTemporaryBrief(value) {
  const directory = mkdtempSync(join(tmpdir(), 'meridian-intake-'));
  writeFileSync(join(directory, 'brief.json'), `${JSON.stringify(value, null, 2)}\n`);
  return { root: directory, briefRef: 'brief.json' };
}

test('Standalone Design Brief, Clarification Policy, and no-question round satisfy their schemas', () => {
  assert.deepEqual(validateAgainstSchema(brief, readJson('schemas/design-brief.schema.json')), []);
  assert.deepEqual(validateAgainstSchema(policy, readJson('schemas/clarification-policy.schema.json')), []);
  assert.deepEqual(validateAgainstSchema(noQuestionsRound, readJson('schemas/clarification-round.schema.json')), []);
});

test('Team Invitation brief has evidence-backed actors, goal, task, entities, actions, constraints, risks, assumptions, and unknowns', () => {
  assert.deepEqual(validateDesignBrief(brief, { root, policy }), []);
  assert.ok(brief.actors.length > 0);
  assert.ok(brief.entities.length > 0);
  assert.ok(brief.actions.length > 0);
  assert.ok(brief.constraints.length > 0);
  assert.ok(brief.risks.length > 0);
  assert.ok(brief.assumptions.length > 0);
  assert.ok(brief.unknowns.length > 0);
  assert.equal(brief.meta.status, 'ready-for-review');
  assert.equal(brief.review.approval, null);
});

test('No clarification questions are asked when only non-blocking unknowns remain', () => {
  assert.deepEqual(validateClarificationRound(noQuestionsRound, brief, policy, { root }), []);
  const generated = createClarificationRound(brief, policy, {
    root,
    briefRef: 'examples/ui-generation/team-invitation.design-brief.json',
    createdAt: '2026-07-27T02:05:00Z',
  });
  assert.deepEqual(generated, noQuestionsRound);
});

test('Question ranking selects at most three highest structural impacts and defers the rest', () => {
  const unresolved = clone(brief);
  unresolved.meta.status = 'clarification-required';
  unresolved.unknowns = [
    blockingUnknown('a_irreversible', '送信後に取り消せない操作はありますか。', 'irreversibility', ['irreversible-action']),
    blockingUnknown('b_primary_task', '利用者が日常的に最も多く行う作業は何ですか。', 'primary-task', ['primary-task']),
    blockingUnknown('c_permission', 'この操作を実行できる利用者は誰ですか。', 'permission', ['permission']),
    blockingUnknown('d_screen_boundary', 'この作業は現在の画面から続けたいですか、それとも独立した手順として進めたいですか。', 'screen-boundary', ['screen-count']),
    blockingUnknown('e_work_pattern', '多数の対象を比較する作業と、一件ずつ処理する作業ではどちらが中心ですか。', 'work-mode', ['pattern']),
  ];
  const temporary = persistTemporaryBrief(unresolved);
  const round = createClarificationRound(unresolved, policy, {
    ...temporary,
    createdAt: '2026-07-27T03:00:00Z',
  });
  assert.deepEqual(round.questions.map((question) => question.unknownRef), ['a_irreversible', 'b_primary_task', 'c_permission']);
  assert.deepEqual(round.deferredUnknownRefs, ['d_screen_boundary', 'e_work_pattern']);
  assert.deepEqual(validateClarificationRound(round, unresolved, policy, temporary), []);
});

test('Clarification rejects Product UI Pattern and implementation terminology in user-facing questions', () => {
  const unresolved = clone(brief);
  unresolved.meta.status = 'clarification-required';
  unresolved.unknowns = [
    blockingUnknown('queue_choice', 'Task QueueとMaster–Detailのどちらを使いますか。', 'work-mode', ['pattern']),
  ];
  const temporary = persistTemporaryBrief(unresolved);
  const round = createClarificationRound(unresolved, policy, {
    ...temporary,
    createdAt: '2026-07-27T03:00:00Z',
  });
  const errors = validateClarificationRound(round, unresolved, policy, temporary).join('\n');
  assert.match(errors, /uses prohibited implementation term Task Queue/);
  assert.match(errors, /uses prohibited implementation term Master–Detail/);
});

test('Answer merge updates allowlisted fields and converts an unresolved answer into an explicit assumption', () => {
  const unresolved = clone(brief);
  unresolved.meta.status = 'clarification-required';
  unresolved.unknowns = [
    ...brief.unknowns,
    blockingUnknown('work_mode', '多数を比較する作業と、一件ずつ処理する作業ではどちらが中心ですか。', 'work-mode', ['pattern']),
    blockingUnknown('device_priority', '日常作業は主にどの端末で行いますか。', 'device', ['device']),
  ];
  const temporary = persistTemporaryBrief(unresolved);
  const round = createClarificationRound(unresolved, policy, {
    ...temporary,
    createdAt: '2026-07-27T03:00:00Z',
  });
  round.meta.status = 'answered';
  round.responses = [
    {
      unknownRef: 'work_mode',
      resolution: 'answered',
      answer: '複数の招待対象を並べて比較する作業が中心です。',
      rationale: '主要作業モデルを比較型として確定する。',
      assumption: null,
      briefUpdates: [{ targetSection: 'primary-task', targetId: null, field: 'workMode', value: 'compare' }],
    },
    {
      unknownRef: 'device_priority',
      resolution: 'assumed',
      answer: 'Desktop中心として進め、TabletとMobileでも完了可能にします。',
      rationale: '利用端末の回答待ちで構造検討を止めず、全required viewportは維持する。',
      assumption: { id: 'assumption_desktop_primary', statement: '日常作業はDesktop中心である。', impact: 'medium' },
      briefUpdates: [],
    },
  ];
  assert.deepEqual(validateClarificationRound(round, unresolved, policy, temporary), []);
  const merged = mergeClarificationRound(unresolved, round, policy, {
    ...temporary,
    roundRef: 'clarification_work_mode_1',
    mergedAt: '2026-07-27T03:10:00Z',
  });
  assert.equal(merged.primaryTask.workMode, 'compare');
  assert.equal(merged.unknowns.find((unknown) => unknown.id === 'work_mode').status, 'answered');
  assert.equal(merged.unknowns.find((unknown) => unknown.id === 'device_priority').status, 'assumed');
  assert.ok(merged.assumptions.some((assumption) => assumption.sourceUnknownRef === 'device_priority'));
  assert.equal(merged.meta.status, 'ready-for-review');
  assert.deepEqual(validateDesignBrief(merged, { root, policy }), []);
});

test('Brief cannot become review-ready while a blocking unknown remains', () => {
  const invalid = clone(brief);
  invalid.unknowns.push(blockingUnknown('primary_task_unknown', '日常的な主要作業は何ですか。', 'primary-task', ['primary-task']));
  assert.match(validateDesignBrief(invalid, { root, policy }).join('\n'), /ready-for-review brief cannot retain open blocking unknowns/);
});

test('Only the required human role can approve the exact reviewable Brief digest', () => {
  const approved = approveDesignBrief(brief, {
    actorType: 'human',
    actorId: 'project-owner-1',
    role: 'product-owner',
    decision: 'approved',
    decidedAt: '2026-07-27T04:00:00Z',
    notes: 'Actor, goal, task, scope, risks, and assumptions are accepted.',
  });
  assert.equal(approved.meta.status, 'approved');
  assert.deepEqual(validateDesignBrief(approved, { root, policy }), []);

  const stale = clone(approved);
  stale.primaryGoal.statement = 'Changed after approval';
  assert.match(validateDesignBrief(stale, { root, policy }).join('\n'), /brief approval digest is stale/);

  assert.throws(
    () => approveDesignBrief(brief, {
      actorType: 'ai',
      actorId: 'generator',
      role: 'product-owner',
      decision: 'approved',
      decidedAt: '2026-07-27T04:00:00Z',
      notes: 'Automated approval.',
    }),
    /AI cannot approve/
  );
});
