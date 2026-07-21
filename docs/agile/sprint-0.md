# Sprint 0 Plan

Sprint 0 の目的は、Meridian を AI-assisted Agile で継続開発できる状態にすること。

これは通常の機能開発スプリントではない。Product Goal、Backlog、GitHub Project、Issue/PR運用、Definition of Ready、Definition of Done、レビュー/監査、AIの責任範囲を先に決め、Sprint 1 以降で安全に開発速度を上げるための作業スプリント。

## Product Goal

Meridianを、世界中のプロダクトチームが信頼して使える、AIと共同で根拠あるUI/UX設計を生成・検証できるデザインシステム基盤にする。

## Sprint 0 Goal

Meridianを継続的に開発・検証できるように、GitHub Project、Issue/PR運用、Definition of Ready / Done、レビュー/監査フロー、Sprint 1候補バックログを整備する。

## Guiding Principles

- GitHub Project を single source of truth にする。
- すべての作業は Issue に紐づける。
- すべての変更は PR を通す。
- AI は計画、分解、実装、自己レビュー、監査ドラフトを支援する。
- 人間は Product Owner / Design Director / Merge Approver として、方向性、優先順位、重要な設計判断、merge 可否を承認する。
- Builder と Reviewer の観点を分ける。実装したAIが自己レビューするだけで終わらせない。
- Sprint は短く始める。最初は 1 週間を標準にする。
- Done は「動いた」ではなく、文書化、検証、レビュー、監査ログまで含む。
- AI は現在の Issue の `Scope` を勝手に広げない。Scope 外で見つけた重要な改善案は、実装せず Backlog Issue として残す。
- ユーザーが開発の専門家でなくても Product Goal に向かう道筋を判断できるように、AI は不足タスク、品質リスク、将来必要な作業を見える形で提案する。

## Sources Behind This Plan

- Scrum は Sprint Goal、Sprint Planning、Sprint Review、Retrospective、Product Backlog、Sprint Backlog、Increment、Definition of Done を中核にする。
- GitHub Projects は Issue / PR と同期し、custom fields、iteration、views、automation、charts を使って作業を可視化できる。
- GitHub は大きな Issue を小さな Issue に分解し、小さい PR にすることを推奨している。
- AI agent 開発では、速度よりも検証可能性、レビュー分離、人間の品質ゲート、PR retrospective が重要になる。

## Roles

### Human

- Product Owner: 最終ゴール、優先順位、スプリントゴールを承認する。
- Design Director: UI/UX、デザイン原則、体験品質を承認する。
- Merge Approver: PR の最終 merge を判断する。

### AI

- Planner: Issue 分解、Sprint Backlog 下書き、Acceptance Criteria 作成。
- Implementer: ブランチ作成、コード/ドキュメント編集、テスト実行。
- Reviewer: 差分レビュー、リスク、抜け漏れ、代替案の指摘。
- Auditor: Definition of Done、DESIGN.md、design/rules.json、CI、アクセシビリティ観点の確認。
- Scribe: Sprint Review / Retrospective の記録。

## GitHub Project Setup

Project name:

```text
Meridian Roadmap
```

Recommended fields:

```text
Status (GitHub fixed field):
バックログ / 準備完了 / 作業中 / レビュー中 / 監査中 / 完了 / ブロック

スプリント:
Sprint 0 / Sprint 1 / Sprint 2 / ...

種別:
方針 / 運用 / 基盤 / ドキュメント / デザインシステム / コンポーネント / AI仕様 / 生成機能 / 品質確認 / レビュー

優先度:
P0 必須 / P1 重要 / P2 通常 / P3 いつか

リスク:
低 / 中 / 高

AI適性:
AI向き / AI+レビュー / 人間主導

受け入れ状態:
未定義 / 定義済み / 検証済み

対象:
GitHub Project / 運用ドキュメント / リポジトリ文書 / スキーマ / 静的サイト / React / トークン / CI / テスト / デザインルール
```

Recommended views:

1. `Sprint Board`
   - Purpose: current sprint execution.
   - Layout: Board.
   - Filter: `スプリント` is `Sprint 0`.
   - Group by: `Status`.
   - Sort: `優先度`.
   - Fields: `優先度`, `種別`, `リスク`, `AI適性`, `受け入れ状態`.

2. `Product Backlog`
   - Purpose: all candidate work that is not done.
   - Layout: Table.
   - Filter: `Status` is not `完了`.
   - Group by: `種別`.
   - Sort: `優先度`, then `リスク`.
   - Fields: `Status`, `優先度`, `種別`, `リスク`, `AI適性`, `受け入れ状態`, `対象`, `スプリント`.

3. `Risk Review`
   - Purpose: high-risk or human-led work requiring explicit attention.
   - Layout: Table.
   - Filter: `リスク` is `高` or `AI適性` is `人間主導`.
   - Group by: `リスク`.
   - Sort: `優先度`.
   - Fields: `Status`, `優先度`, `種別`, `AI適性`, `受け入れ状態`, `対象`, `スプリント`.

4. `Audit Queue`
   - Purpose: final quality checks before `Done`.
   - Layout: Table.
   - Filter: `Status` is `監査中`.
   - Group by: `種別`.
   - Sort: `優先度`.
   - Fields: `優先度`, `リスク`, `AI適性`, `受け入れ状態`, `対象`, `スプリント`.

5. `Done This Sprint`
   - Purpose: sprint review and retrospective.
   - Layout: Table.
   - Filter: `スプリント` is `Sprint 0` and `Status` is `完了`.
   - Group by: `種別`.
   - Sort: recently updated first.
   - Fields: `優先度`, `種別`, `対象`, `受け入れ状態`.

## Issue Structure

Every Issue should be understandable by non-engineers first, then precise enough for AI and engineers to execute.

Issue titles should describe the outcome in plain language before using implementation terms.

Examples:

```text
Good: AIが作った画面設計案をルールに沿ってチェックできるようにする
Avoid: Validate ScreenSpec / FlowSpec examples against schema
```

Every Issue should include:

```text
## Goal

## Why This Matters

## Scope

## Acceptance Criteria

## Validation

## Risks

## Out of Scope

## Technical Notes

## Links
```

Guidelines:

- One Issue should fit in one PR when possible.
- If an Issue needs multiple PRs, split it into sub-issues.
- A task that cannot be reviewed clearly is too large.
- A task with no acceptance criteria is not ready.
- Write the purpose in plain language first. Put file names, commands, and technical terms in `Technical Notes`.
- AI-friendly Issues should state expected behavior, validation steps, constraints, and non-goals.
- Use bullet lists in `Scope` so the task can be split and checked easily.
- Use checkboxes in `Acceptance Criteria` so completion can be verified.
- Always include `Out of Scope` so AI does not expand the task beyond the intended boundary.
- In `Validation`, include both what to check and the expected result.

## Backlog Capture Rule

The Product Backlog is where Meridian keeps work that may help achieve the Product Goal but is not necessarily part of the current Sprint.

When AI or a human discovers a useful improvement during development, the default behavior is:

```text
Do not expand the current Issue.
Capture the idea as a Backlog candidate.
Let the Product Owner decide priority later.
```

AI may create or propose a Backlog Issue when the idea is clearly outside the current `Scope` and helps the Product Goal.

Good Backlog candidates:

- Documentation gaps found while implementing another Issue.
- Missing validation, test, or lint coverage.
- Design-system consistency gaps.
- Accessibility or responsive-quality risks.
- Refactors that would reduce future risk but are not required for the current Issue.
- Follow-up work needed to make an implementation more reusable.

AI should ask for human confirmation before creating or prioritizing a Backlog Issue when:

- The idea could become `P0 必須` or `P1 重要`.
- The idea affects Product Goal, Sprint Goal, product positioning, or design direction.
- The idea affects public API, security-sensitive automation, or source-of-truth design rules.
- The idea is large enough to change the current Sprint focus.

Default Project fields for AI-captured Backlog candidates:

```text
Status: バックログ
受け入れ状態: 未定義
優先度: P2 通常 or P3 いつか
リスク: 低 or 中
AI適性: AI向き or AI+レビュー
```

AI must not implement Backlog candidates until they satisfy Definition of Ready and are moved through the normal status flow.

## Pull Request Structure

Every PR should explain the change in plain language first, then provide technical details for reviewers.

Every PR should include:

```text
## Purpose

## What Changed

## Validation

## Design / UX Notes

## Risks

## Screenshots or Artifacts

## Technical Notes

## Related Issue
```

PR rules:

- PRs should be small enough to review in one sitting.
- PRs must link to an Issue.
- PRs must state what kind of feedback is desired.
- PRs must include validation commands and results.
- Design-facing PRs should include screenshots, rendered artifacts, or clear before/after notes.
- `What Changed` should be readable without opening the diff.
- `Technical Notes` should include files, commands, implementation details, or migration notes when useful.

## Definition of Ready

Definition of Ready means an Issue is clear enough to move from `バックログ` to `準備完了` and can be selected for a Sprint without the team getting lost.

An Issue can enter `Ready` only when:

- [ ] `Goal` is written in language non-engineers can understand.
- [ ] `Why This Matters` explains how the work connects to the Product Goal or Sprint Goal.
- [ ] `Scope` is written as a bullet list.
- [ ] `Acceptance Criteria` is written as checkboxes.
- [ ] `Validation` includes both how to check the work and the expected result.
- [ ] `Out of Scope` is written so AI and engineers do not expand the task accidentally.
- [ ] `リスク` is set.
- [ ] `AI適性` is set.
- [ ] `優先度` is set.
- [ ] `対象` is set.
- [ ] There is no unresolved product, design, or technical decision that would block the work.

Before moving an Issue to `Ready`, the reviewer should be able to answer:

- What is this work for?
- Can a non-engineer understand the expected outcome?
- Can AI or an engineer understand the scope, acceptance criteria, validation, and non-goals?
- Are the human decision points explicit?
- Can the work reasonably fit in one Sprint and preferably one PR?

## Definition of Done

Definition of Done means the work is not only finished, but verified, understandable, and safe for humans and AI to build on.

A task can move to `Done` only when:

- [ ] The Issue's `Acceptance Criteria` are all satisfied.
- [ ] The PR is linked to the Issue.
- [ ] `What Changed` explains the change in language non-engineers can understand.
- [ ] `Validation` states what was checked and what the result was.
- [ ] Required tests, build, lint, or validation checks pass, or the PR explains why they are not applicable.
- [ ] Relevant docs are updated, or the PR explains why no docs change is needed.
- [ ] Remaining risks, tradeoffs, or follow-up work are documented.
- [ ] AI self-review is complete.
- [ ] Independent review or audit is complete.
- [ ] `リスク: 高` or `AI適性: 人間主導` work has explicit human approval.

Additional requirements for UI, design-system, or generated-screen changes:

- [ ] `Design / UX Notes` explains the design impact and reasoning.
- [ ] Screenshots, rendered artifacts, or before/after notes are attached.
- [ ] Accessibility impact is checked, including keyboard, focus, contrast, and non-color-only state communication where relevant.
- [ ] Responsive behavior is checked, or the PR explains why it is not applicable.
- [ ] `design-lint` is run when generated or edited UI files are involved.
- [ ] `DESIGN.md`, `design/*.json`, tokens, schemas, examples, or docs are synchronized when the source of truth changes.

## Review / Audit Flow

Review checks whether the change is right for the Issue. Audit checks whether the evidence is strong enough to call it Done.

Recommended flow:

```text
Ready -> In Sprint -> In Review -> Audit -> Done
```

Status meanings:

- `準備完了`: The Issue satisfies Definition of Ready and can be selected for a Sprint.
- `作業中`: Work is actively being done.
- `レビュー中`: The PR or artifact is ready for content review.
- `監査中`: The change has passed content review and is being checked against Definition of Done.
- `完了`: The change satisfies Definition of Done.
- `ブロック`: The work is waiting on a decision, dependency, access, or unresolved problem.

### Status Transition Rules

Work must move through the board intentionally. Do not skip readiness or review steps.

Required transition:

```text
バックログ -> 準備完了 -> 作業中 -> レビュー中 -> 監査中 -> 完了
```

Rules:

- Do not start implementation from `バックログ`.
- Before implementation starts, confirm the Issue satisfies Definition of Ready and move it to `準備完了`.
- When implementation starts, move the Issue to `作業中`.
- When implementation is finished, move the Issue to `レビュー中` as part of the same handoff.
- Do not leave completed implementation in `作業中`.
- Do not move work to `監査中` until review has happened.
- Do not move work to `完了` until Definition of Done is satisfied.
- If an Issue is discovered to be not ready after work has started, stop and either move it back to `バックログ` / `準備完了` with a comment, or mark it `ブロック` if a decision is needed.

### In Review

Review answers: "Does this change meet the intent of the Issue?"

Check:

- The change matches the Issue `Goal`.
- The change satisfies the `Acceptance Criteria`.
- The change stays within `Scope` and does not include accidental extra work.
- `What Changed` is understandable without opening the diff.
- Risks, tradeoffs, or follow-up work are stated.
- UI / UX changes include useful `Design / UX Notes` and artifacts.

### Audit

Audit answers: "Is there enough evidence to move this to Done?"

Check:

- The PR is linked to the Issue.
- `Validation` includes what was checked and the result.
- Required tests, build, lint, or validation checks pass or are explained as not applicable.
- Relevant docs are updated or explained as not needed.
- AI self-review is complete.
- Independent review or audit is complete.
- `リスク: 高` or `AI適性: 人間主導` work has explicit human approval.
- UI, design-system, or generated-screen changes satisfy the additional Definition of Done requirements.

### AI Auto-Review Completion Rule

AI review is allowed to move work to `Done` without human approval only when all of the following are true:

- `リスク` is `低`.
- `AI適性` is `AI向き`.
- The Issue's `Acceptance Criteria` are satisfied.
- `Validation` is complete and the result is recorded.
- Definition of Done is satisfied.
- The work does not involve product direction, design direction, public API commitments, security-sensitive automation, or other human-led decisions.

If any of the following are true, AI can review and audit the work, but human approval is required before `Done`:

- `リスク` is `中` or `高`.
- `AI適性` is `AI+レビュー` or `人間主導`.
- `種別` is `方針`.
- The work changes Product Goal, Sprint Goal, design direction, design-system source of truth, public API, or security-sensitive automation.

### Manual Codex Review Action

Sprint 0 uses an explicit Codex review workflow. It does not run on a schedule and does not constantly monitor the Project.

Trigger:

- The user asks Codex to review current `レビュー中` items.

Behavior:

- Codex checks `Meridian Roadmap` for items with `Status: レビュー中`.
- Codex reviews the Issue body, Project fields, relevant docs, and local changes when needed.
- Codex posts or summarizes a review result with:
  - review result
  - checked acceptance criteria
  - validation evidence
  - risks or missing items
  - whether human approval is required
- If the work is `リスク: 低` and `AI適性: AI向き` and Done conditions pass, Codex may move it to `監査中`, then `完了`, and set `受け入れ状態: 検証済み`.
- Otherwise, Codex may move passing work to `監査中`, but leaves a human approval note and does not move it to `完了`.

Why this is manual for now:

- The current plan does not assume OpenAI API Platform billing or an `OPENAI_API_KEY`.
- ChatGPT/Codex access and OpenAI API Platform billing are separate.
- Avoiding GitHub Actions AI calls keeps Sprint 0 review usable without extra API setup.

### Roles

- AI Implementer: creates the change, writes the PR, and runs validation.
- AI Reviewer: reviews the diff or artifact for bugs, gaps, scope drift, and risks.
- AI Auditor: checks Definition of Done before the work moves to `Done`.
- Human: approves Product Goal, Sprint Goal, design direction, high-risk work, human-led work, and merge decisions.

## AI Suitability Rules

### Good for AI

- Documentation improvements.
- Schema examples.
- Validation scripts.
- Small refactors with clear tests.
- CI wiring.
- Component implementation with existing local patterns.

### AI with review

- React component API design.
- Accessibility behavior.
- Pattern/template changes.
- Token or semantic naming changes.
- Generated UI renderer behavior.

### Human-led

- Product positioning.
- Major visual direction.
- Breaking design-system rules.
- Public API commitments.
- Security-sensitive automation.
- Changes to design source of truth without prior approval.

## Sprint 0 Backlog

GitHub-ready P0 Issue drafts are maintained in [`docs/agile/sprint-0-issues.md`](./sprint-0-issues.md).

### P0

1. Product GoalとSprint 0 Goalを公式な開発基準として残す。
2. Meridian Roadmap Projectを作り、Sprint運用できる看板を用意する。
3. タスクを始める前に必要な情報が毎回揃うIssueテンプレートを作る。
4. PRレビューに必要な情報が毎回揃うPRテンプレートを作る。
5. Sprintに入れてよいタスクか判断できるReady基準を整える。
6. タスクを完了にしてよいか判断できるDone基準を整える。
7. ReviewとAuditの役割を分け、Doneまでの確認フローを整える。
8. Sprint 1で取り組む候補タスクを判断できる状態にする。

### P1

9. Codexに明示依頼してレビュー中IssueをAIレビューできる運用を作る。
   - Outcome: ユーザーが依頼したときだけCodexがレビュー中Issueを確認し、AIだけで完了できるものと人間承認が必要なものを分けられる。
   - Type: Review / Process
   - AI Suitability: AI with review

10. 開発中に見つかったScope外の改善案をBacklog Issueとして登録できる仕組みを作る。
   - Outcome: AIがScope外改善案を勝手に実装せず、Product Goalに沿ったBacklog候補として残せる。
   - Type: Process / GitHub Project
   - AI Suitability: AI with review

11. Add `scripts/validate-spec.mjs`.
   - Outcome: `examples/specs/*.json` can be validated against `schemas/*.schema.json`.
   - Type: AI Spec / QA
   - AI Suitability: Good for AI

12. Add spec validation to CI.
   - Outcome: CI fails when ScreenSpec / FlowSpec examples drift from schema.
   - Type: Infra / QA
   - AI Suitability: Good for AI

13. Create review/audit checklist.
   - Outcome: AI and human reviewers share the same checklist.
   - Type: Review
   - AI Suitability: Good for AI

14. Create Sprint Review / Retrospective template.
   - Outcome: Every sprint captures shipped increment, risks, decisions, and process improvements.
   - Type: Process
   - AI Suitability: Good for AI

### P2

15. Create release roadmap draft.
    - Outcome: Milestones from current 14% progress toward MVP, alpha, beta, public release are visible.
    - Type: Vision / Planning
    - AI Suitability: AI with review

16. Define labels.
    - Outcome: Labels align with Type, Priority, Risk, and AI Suitability.
    - Type: Process
    - AI Suitability: Good for AI

17. Create branch and commit conventions.
    - Outcome: Branch names and commit messages are predictable.
    - Type: Process
    - AI Suitability: Good for AI

## Sprint 0 Acceptance Criteria

Sprint 0 is complete when:

- GitHub Project exists and can track current work.
- Project fields and views support sprint planning, review, audit, and roadmap views.
- Issue templates exist.
- PR template exists.
- Definition of Ready and Definition of Done are documented.
- Sprint 1 candidate backlog exists.
- Review and audit checklist exists.
- The user can approve Sprint 1 goal without reading every implementation detail.

## Recommended Sprint 1 Goal

Make ScreenSpec / FlowSpec enforceable.

Candidate Sprint 1 backlog:

1. Add `scripts/validate-spec.mjs`.
2. Validate `examples/specs/*.json` against the schemas.
3. Add `npm run check:specs`.
4. Add spec validation to CI.
5. Update `docs/ai-generation/specs.md` with validation workflow.
6. Create one intentionally invalid fixture for validator tests if practical.

## Risks

- AI may create too many low-value issues unless Product Goal and Priority are enforced.
- Review can become the bottleneck if PRs are too large.
- Documentation generated by AI may look polished while hiding ambiguity.
- Component implementation can drift from docs unless docs and code share validation.
- Human approval can become performative if acceptance criteria are vague.
- Automation without security boundaries can introduce risk.

## Operating Cadence

### Weekly Sprint

- Day 1: Sprint Planning and Issue selection.
- Day 1-4: Implementation, review, audit.
- Day 5: Sprint Review, Retrospective, next backlog refinement.

### Daily Lightweight Check

For solo human + AI collaboration, a formal daily standup is unnecessary. Instead, use a short status note:

```text
Yesterday / Completed:
Today / Next:
Blocked:
Needs human decision:
Risk changes:
```

## Human Approval Gates

Human approval is required for:

- Sprint Goal.
- Product Goal changes.
- VISION.md changes.
- DESIGN.md / design/*.json source-of-truth changes.
- Public API changes.
- High-risk PR merge.
- Visual direction changes.
- Sprint Review acceptance.

## Sprint 0 Output Checklist

- [ ] GitHub Project created.
- [ ] Project fields configured.
- [ ] Project views configured.
- [ ] Issue templates added.
- [ ] PR template added.
- [ ] Definition of Ready documented.
- [ ] Definition of Done documented.
- [ ] Review / audit checklist added.
- [ ] Sprint Review / Retrospective template added.
- [ ] Sprint 1 candidate backlog drafted.
