# Sprint 0 P0 Issue Drafts

This document contains Sprint 0 P0 Issues that are ready to register in GitHub.

Each Issue is written so non-engineers can understand the purpose first, while AI and engineers still get enough structure to execute safely.

Common project fields for all Issues:

```text
スプリント: Sprint 0
優先度: P0 必須
受け入れ状態: 定義済み
Status: 準備完了
```

## P0-1: Product GoalとSprint 0 Goalを公式な開発基準として残す

Project fields:

```text
種別: 方針
リスク: 中
AI適性: AI+レビュー
対象: 運用ドキュメント
```

## Goal

Meridianが目指す長期的なProduct Goalと、Sprint 0で達成するSprint Goalを、今後の開発判断の基準として残す。

## Why This Matters

Meridianは、世界中のプロダクトチームが信頼して使えるデザインシステム基盤を目指している。
そのため、日々のIssueやPRが目先の作業だけに流れず、Product GoalとSprint Goalに接続している必要がある。

## Scope

- Product Goalを明文化する
- Sprint 0 Goalを明文化する
- Sprint 0の作業が何のための準備なのかを説明する
- 今後のIssueやPRがこのGoalに接続できるようにする

## Acceptance Criteria

- [ ] Product Goalがドキュメントに記載されている
- [ ] Sprint 0 Goalがドキュメントに記載されている
- [ ] 非エンジニアが読んでも、Meridianが何を目指しているか分かる
- [ ] Sprint 0が通常の機能開発ではなく、継続開発の準備スプリントであることが分かる

## Validation

- `docs/agile/sprint-0.md` を読み、Product GoalとSprint 0 Goalが確認できる
- Product GoalとSprint 0 Goalをもとに、Sprint 0のP0 Issueを説明できる

## Risks

- Goalが抽象的すぎると、Issueの優先順位を判断しにくくなる
- Goalが狭すぎると、今後の開発の余地を不必要に制限する

## Out of Scope

- Product Goalそのものの再議論
- MVP、Alpha、Beta、Public releaseの詳細ロードマップ作成
- ブランドコピーや公開サイト向け表現の作成

## Technical Notes

- Primary document: `docs/agile/sprint-0.md`
- This is primarily a planning and documentation Issue.

## Links

- `docs/agile/sprint-0.md`
- `VISION.md`

## P0-2: Meridian Roadmap Projectを作り、Sprint運用できる看板を用意する

Project fields:

```text
種別: 基盤
リスク: 中
AI適性: AI+レビュー
対象: GitHub Project
```

## Goal

Sprint 0以降の作業を、GitHub上の1つのProjectで見える化し、Product BacklogとSprint Boardを切り替えて使えるようにする。

## Why This Matters

Meridianでは、人間とAIが同じ作業状況を見ながら進める。
Issueが散らばると、何が候補で、何が今Sprintの作業で、何がレビュー待ちなのか分かりにくくなる。

## Scope

- GitHub Project `Meridian Roadmap` を作成する
- Status、Iteration、Type、Priority、Risk、AI Suitability、Acceptance、Targetを設定する
- Product Backlog、Sprint Board、Risk Review、Audit Queue、Done This SprintのViewを作成する
- Sprint 0 IssueをProjectに追加できる状態にする

## Acceptance Criteria

- [ ] `Meridian Roadmap` Projectが存在する
- [ ] 合意済みのProject fieldsが設定されている
- [ ] `Sprint Board` Viewが作成されている
- [ ] `Product Backlog` Viewが作成されている
- [ ] `Risk Review` Viewが作成されている
- [ ] `Audit Queue` Viewが作成されている
- [ ] `Done This Sprint` Viewが作成されている
- [ ] Sprint 0のIssueをProject上でStatus別に確認できる

## Validation

- GitHub Projectを開き、各fieldとViewが存在することを確認する
- Sprint 0 Issueを1つ追加し、`Ready -> In Sprint -> In Review -> Audit -> Done` の流れで表示できることを確認する

## Risks

- FieldやViewを増やしすぎると、運用が重くなる
- Viewの役割が曖昧だと、ProjectがただのIssue置き場になる
- GitHub Projectの設定はUI操作が多く、手順が記録されないと再現しにくい

## Out of Scope

- GitHub Project automationの詳細設定
- GitHub ActionsやCIの設定
- ラベルの詳細設計
- 複数Projectへの分割

## Technical Notes

- Project name: `Meridian Roadmap`
- Recommended fields and views are documented in `docs/agile/sprint-0.md`
- Some setup may need to be done manually in GitHub UI.

## Links

- `docs/agile/sprint-0.md`

## P0-3: タスクを始める前に必要な情報が毎回揃うIssueテンプレートを作る

Project fields:

```text
種別: 運用
リスク: 低
AI適性: AI向き
対象: 運用ドキュメント
```

## Goal

Sprintで扱うタスクについて、目的、範囲、完了条件、確認方法が毎回揃うようにする。

## Why This Matters

Meridianでは、人間とAIが同じIssueを見て作業する。
Issueの情報が不足していると、AIがスコープを広げすぎたり、人間が完了判断できなくなる。

## Scope

- GitHub Issueテンプレートを追加する
- テンプレートに `Goal`、`Why This Matters`、`Scope`、`Acceptance Criteria`、`Validation`、`Risks`、`Out of Scope`、`Technical Notes`、`Links` を含める
- 各見出しに、何を書けばよいかの短い説明を入れる
- 非エンジニアにも分かる目的説明と、AIが実行しやすい構造を両立する

## Acceptance Criteria

- [ ] Issue作成時にテンプレートを使える
- [ ] テンプレートに必要な見出しが含まれている
- [ ] 各見出しに短い説明がある
- [ ] `Scope`を箇条書きで書ける
- [ ] `Acceptance Criteria`をチェックボックスで書ける
- [ ] `Out of Scope`を書ける
- [ ] `Technical Notes`に技術詳細を分離できる

## Validation

- GitHubで新しいIssueを作成し、テンプレートが表示されることを確認する
- テンプレートを使ってSprint 0のIssueを1つ作成できることを確認する

## Risks

- テンプレートが重すぎると、Issue作成が面倒になる
- 技術的な説明が多すぎると、非エンジニアが読みづらくなる
- 説明が少なすぎると、AIが実行時に迷う

## Out of Scope

- 複数種類の高度なIssueフォーム作成
- ラベルの自動付与
- GitHub Projectへの自動追加
- Issueテンプレート以外のGitHub設定

## Technical Notes

- `.github/ISSUE_TEMPLATE/` 配下に追加する想定
- GitHub Issue Formsを使うか、Markdownテンプレートを使うかは実装時に判断する

## Links

- `docs/agile/sprint-0.md`

## P0-4: PRレビューに必要な情報が毎回揃うPRテンプレートを作る

Project fields:

```text
種別: 運用
リスク: 低
AI適性: AI向き
対象: 運用ドキュメント
```

## Goal

PRをレビューするときに、目的、変更内容、確認結果、リスク、関連Issueが毎回分かるようにする。

## Why This Matters

Meridianでは、PRは「何を変えたか」だけでなく、「なぜ変えたか」「どう確認したか」「Doneにしてよいか」を判断する場所になる。
PRの情報が不足すると、ReviewやAuditが形だけになりやすい。

## Scope

- PRテンプレートを追加する
- テンプレートに `Purpose`、`What Changed`、`Validation`、`Design / UX Notes`、`Risks`、`Screenshots or Artifacts`、`Technical Notes`、`Related Issue` を含める
- 非エンジニアにも分かる変更概要を書けるようにする
- UIやデザインシステム変更時に、成果物や設計意図を残せるようにする

## Acceptance Criteria

- [ ] PR作成時にテンプレートが表示される
- [ ] `Purpose`で目的を書ける
- [ ] `What Changed`で非エンジニアにも分かる変更概要を書ける
- [ ] `Validation`で確認内容と結果を書ける
- [ ] `Design / UX Notes`でUI/UX影響を書ける
- [ ] `Screenshots or Artifacts`で成果物を残せる
- [ ] `Related Issue`でIssueに紐づけられる

## Validation

- GitHubで新しいPRを作成し、テンプレートが表示されることを確認する
- テンプレートを使って、Sprint 0の作業PRの説明が書けることを確認する

## Risks

- テンプレートが長すぎると、PR作成時に形だけ埋められる可能性がある
- `Validation`が実行結果ではなく予定だけになりやすい
- UI変更でスクリーンショットや成果物が抜けると、レビュー品質が下がる

## Out of Scope

- PR自動チェックの導入
- CI必須化
- CODEOWNERS設定
- Merge ruleの設定

## Technical Notes

- `.github/pull_request_template.md` を追加する想定
- Existing GitHub settings should not be changed unless needed.

## Links

- `docs/agile/sprint-0.md`

## P0-5: Sprintに入れてよいタスクか判断できるReady基準を整える

Project fields:

```text
種別: 運用
リスク: 低
AI適性: AI向き
対象: 運用ドキュメント
```

## Goal

IssueをSprintに入れてよいか判断できるように、Definition of Readyを整える。

## Why This Matters

Ready基準がないと、目的や完了条件が曖昧なIssueがSprintに入り、作業中に迷いや手戻りが増える。
Meridianでは、人間にもAIにも分かるIssueだけをSprintに入れることで、開発の速度と品質を両立したい。

## Scope

- Definition of Readyを文書化する
- `Backlog`から`Ready`へ移す条件をチェックリストにする
- 非エンジニアが目的を理解できることをReady条件に含める
- AIやエンジニアがScope、Acceptance Criteria、Validation、Out of Scopeを理解できることをReady条件に含める

## Acceptance Criteria

- [ ] Definition of Readyがドキュメントに記載されている
- [ ] Readyに移す条件がチェックボックスで書かれている
- [ ] 非エンジニアが読んでも、Issueの目的と期待結果が分かることが条件に含まれている
- [ ] AIが勝手にスコープを広げないための条件が含まれている
- [ ] 未解決の重要判断が残っているIssueをReadyにしない条件が含まれている

## Validation

- Sprint 0のIssueを1つ選び、Definition of Readyに照らしてReadyにできるか確認する
- ReadyにできないIssueがある場合、何が不足しているか説明できる

## Risks

- Ready基準を厳しくしすぎると、Issue作成が重くなる
- Ready基準が緩すぎると、Sprint中に曖昧さが残る

## Out of Scope

- Definition of Doneの詳細化
- Review / Audit Flowの詳細化
- Story pointや見積もりルールの導入

## Technical Notes

- Primary document: `docs/agile/sprint-0.md`
- This Issue is documentation/process focused.

## Links

- `docs/agile/sprint-0.md`

## P0-6: タスクを完了にしてよいか判断できるDone基準を整える

Project fields:

```text
種別: 運用
リスク: 中
AI適性: AI+レビュー
対象: 運用ドキュメント
```

## Goal

IssueやPRをDoneにしてよいか判断できるように、Definition of Doneを整える。

## Why This Matters

Meridianでは、作業が終わっただけではなく、検証され、説明され、次の人間やAIが安心して使える状態になっていることが重要。
Done基準が曖昧だと、品質確認やドキュメント更新が抜けやすくなる。

## Scope

- Definition of Doneを文書化する
- 全タスク共通のDone条件をチェックリストにする
- UI、デザインシステム、生成画面の変更だけに必要な追加条件を分けて書く
- Validation、docs、review、audit、人間承認の要否をDone条件に含める

## Acceptance Criteria

- [ ] Definition of Doneがドキュメントに記載されている
- [ ] 全タスク共通のDone条件がチェックボックスで書かれている
- [ ] UIやデザインシステム変更だけに必要な追加条件が分けて書かれている
- [ ] Validation結果、docs更新、review、auditがDone条件に含まれている
- [ ] High riskまたはHuman-ledの作業に人間承認が必要であることが分かる

## Validation

- Sprint 0のPRまたはIssueを1つ選び、Definition of Doneに照らしてDoneにできるか確認する
- UI変更ではないIssueに、UI向け追加条件を無理に適用しないことを確認する

## Risks

- Done基準が重すぎると、小さなdocs変更まで過剰な手順になる
- Done基準が軽すぎると、Meridianの信頼性に必要な品質証拠が残らない

## Out of Scope

- CIの必須チェック設定
- 自動監査ツールの実装
- Release approval processの詳細化

## Technical Notes

- Primary document: `docs/agile/sprint-0.md`
- UI and design-system changes have additional Done requirements.

## Links

- `docs/agile/sprint-0.md`

## P0-7: ReviewとAuditの役割を分け、Doneまでの確認フローを整える

Project fields:

```text
種別: レビュー
リスク: 中
AI適性: AI+レビュー
対象: 運用ドキュメント
```

## Goal

PRや成果物を確認するときに、内容レビューと完了判定を分けて行えるようにする。

## Why This Matters

AIが速く実装できても、レビューと監査が曖昧だと、目的からズレた変更や検証不足の変更がDoneになってしまう。
Meridianでは、Reviewは「目的に合っているか」、Auditは「Doneにしてよい証拠が揃っているか」を見る役割に分ける。

## Scope

- `Ready -> In Sprint -> In Review -> Audit -> Done` の流れを文書化する
- `In Review`で見ることを定義する
- `Audit`で見ることを定義する
- AI Implementer、AI Reviewer、AI Auditor、Humanの役割を定義する
- High riskやHuman-ledの作業で人間承認が必要なことを明確にする

## Acceptance Criteria

- [ ] Review / Audit Flowがドキュメントに記載されている
- [ ] `In Review`と`Audit`の違いが分かる
- [ ] Reviewで確認する項目が書かれている
- [ ] Auditで確認する項目が書かれている
- [ ] AIと人間の役割分担が書かれている
- [ ] High riskまたはHuman-ledの作業で人間承認が必要なことが分かる

## Validation

- Sprint 0のIssueを1つ選び、`In Review`で見ることと`Audit`で見ることを説明できる
- Definition of DoneとReview / Audit Flowが矛盾していないことを確認する

## Risks

- ReviewとAuditを分けすぎると、小さな変更では手順が重くなる
- ReviewとAuditを曖昧にすると、Done判定の品質が下がる
- AI self-reviewだけで終わると、見落としが残る可能性がある

## Out of Scope

- GitHub branch protection ruleの設定
- CODEOWNERSの設定
- 自動レビューbotの導入
- 外部レビュアー運用の詳細化

## Technical Notes

- Primary document: `docs/agile/sprint-0.md`
- This Issue defines process, not automation.

## Links

- `docs/agile/sprint-0.md`

## P0-8: Sprint 1で取り組む候補タスクを判断できる状態にする

Project fields:

```text
種別: 運用
リスク: 中
AI適性: AI+レビュー
対象: 運用ドキュメント
```

## Goal

Sprint 1で何に取り組むかを判断できるように、候補Issueを4-7件に整理する。

## Why This Matters

Sprint 0の目的は、Sprint 1以降を安全に進める準備をすること。
Sprint 1候補が曖昧なままだと、Sprint Planningで何を優先すべきか判断しにくくなる。

## Scope

- Sprint 1候補Issueを4-7件作成する
- 各候補にGoal、Why This Matters、Scope、Acceptance Criteria、Validation、Risks、Out of Scopeを入れる
- 各候補にPriority、Risk、AI Suitability、Targetを設定する
- Sprint 1 Goal案を提示する
- 候補Issueを優先順位順に並べる

## Acceptance Criteria

- [ ] Sprint 1 Goal案が書かれている
- [ ] Sprint 1候補Issueが4-7件ある
- [ ] 各候補IssueがDefinition of Readyに近い粒度で書かれている
- [ ] 各候補IssueにPriority、Risk、AI Suitability、Targetがある
- [ ] 非エンジニアが読んでも、Sprint 1で何を目指すか判断できる

## Validation

- Sprint 1候補Issueを読み、どれをSprint 1に入れるか判断できる
- Product GoalとSprint 0 Goalに照らして、Sprint 1候補のつながりを説明できる

## Risks

- 候補Issueが多すぎると、Sprint 1の焦点がぼやける
- 候補Issueが技術寄りすぎると、非エンジニアが優先順位を判断しにくくなる
- Sprint 1 Goalが大きすぎると、1週間Sprintで完了しにくくなる

## Out of Scope

- Sprint 1の最終コミットメント
- Sprint 2以降の詳細バックログ作成
- Release roadmapの詳細化
- CIやvalidatorの実装そのもの

## Technical Notes

- Recommended Sprint 1 direction in `docs/agile/sprint-0.md`: make design specs enforceable.
- Candidate Issues should avoid implementation-only titles and explain user/project value first.

## Links

- `docs/agile/sprint-0.md`
- `docs/ai-generation/specs.md`
