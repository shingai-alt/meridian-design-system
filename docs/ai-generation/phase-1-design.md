# Meridian AI-Ready Design System — Phase 1 設計書

- ステータス: Proposal
- バージョン: 0.1.0
- 作成日: 2026-07-14
- 対象: 実装前に合意するプロダクト定義と設計契約
- 関連文書: [`VISION.md`](../../VISION.md)、[`DESIGN.md`](../../DESIGN.md)、[`specs.md`](./specs.md)

## 実装ステータス

最初の検証可能な縦切りとして、次を実装済み。

- `schemas/phase-1-package.schema.json`: Phase 1 artifact一式の統合contract。
- `examples/phase-1/team-invitation.phase1.json`: Team invitationのDesignBrief、ResearchPack、DirectionSet、PatternContract、DesignProposal、Reviewを接続したexample。
- `scripts/validate-system.mjs`: Phase 1 packageのsystem validation。
- `test/phase-1-package.test.js`: Schema、複数案、human approval、feedback governanceの回帰テスト。

この統合contractは最初のpilotでartifact間の関係を検証するためのもの。個別schemaへの分割、HTML renderer、Skill、MCPはまだ未実装。

## 1. 目的

Phase 1では、Meridianを「ドキュメント化されたデザインシステム」から「人間とAIがともに利用できるAI-Ready Design System」へ発展させるための、プロダクト境界と設計契約を定義する。

本書は実装を開始するための指示書ではない。Meridianが何を知識として持つか、AIと人間がどう協働するか、何を成果物として残すか、どこで人間が承認するか、Skill・MCP・renderer・framework packageの構築前に何を合意するかを定める。

Phase 1におけるMeridianのプロダクト定義は次の通り。

> Meridianは、企業内のPdM・エンジニア・デザイナーがAIと対話し、世界の事例と根拠を確認しながら複数のUI/UX案を比較し、本番実装前に動くHTMLとしてレビューするためのAI-Ready Design Systemである。

Phase 1の主成果は本番コードではない。調査、代替案、設計根拠、仕様、状態、動くHTMLを一体化した「レビュー可能な設計判断パッケージ」である。

## 2. 確定済みのプロダクト判断

| 判断項目 | Phase 1の方針 |
|---|---|
| 主な利用者 | 企業内のPdM、エンジニア、デザイナー |
| 主な操作 | 自然言語によるAIとの対話 |
| 最初の成果物 | 検討・レビュー用の動くHTML |
| 外部調査 | 全デザインタスクで必須。深さは新規性とリスクに比例させる |
| 本番実装 | 対象外 |
| React | Phase 1の依存・正本にしない |
| 人間の承認 | 提案、例外、ルールの承認前に必須 |
| アクセシビリティ基準 | WCAG 2.2 AAを基準とし、platform・認知アクセシビリティの関連指針を補う |
| 初期対象 | SaaS、業務ツール、管理画面、設定、分析、チーム管理、AI workspace |

## 3. プロダクト境界

### 3.1 Meridianであるもの

- UI/UX判断を構造化した知識ベース。
- 人間とAIが繰り返し実行できるデザインワークフロー。
- 世界の事例と根拠に基づく提案生成基盤。
- 人間向けガイドと機械可読contractの正本。
- 生成結果を検証し、学習候補を蓄積する仕組み。
- 職種をまたいで「なぜこの設計か」を共有する基盤。

### 3.2 Meridianではないもの

- 1プロンプトで完成画面を出すWebサイト生成器。
- プロダクト戦略やユーザーリサーチの代替。
- AIが自分の提案を自分で承認する仕組み。
- React component libraryを主製品とする仕組み。
- 標準準拠だけでユーザビリティを保証する仕組み。
- 1案件の好みを自動的に全体ルールへ昇格させる仕組み。
- Phase 1で本番アプリケーションを生成する仕組み。

### 3.3 利用者別の価値

#### PdM

- component名を知らなくても課題から相談できる。
- 抜けているプロダクト判断を質問として受け取れる。
- 1つの完成風UIではなく、方向性の違う案を比較できる。
- 仮定、リスク、フロー、トレードオフをUIと同時にレビューできる。

#### エンジニア

- 状態、挙動、データ前提、権限、responsive ruleを確認できる。
- 実装開始前に要求の不足を発見できる。
- 設計意図とprototype都合の実装を区別できる。
- UIの各部をMeridian contractへ追跡できる。

#### デザイナー

- AIの思考を推測せず、課題設定、根拠、代替案、準拠状況をレビューできる。
- 最終的な視覚品質、例外、再利用ルールの決定権を維持できる。
- 繰り返されるレビュー指摘を、管理されたデザインシステム知識へ変換できる。
- 承認責任を手放さず、AIで探索量を増やせる。

## 4. 運用原則

1. **画面より課題を先に決める。** ユーザー課題、主要タスク、成功条件が明確になるまで画面案を確定しない。
2. **好みより根拠を優先する。** 外部根拠、Meridian内部知識、仮定、審美的判断を区別する。
3. **推奨前に代替案を出す。** 意味の異なる方向性を検討してから1案を推す。
4. **成果物の近くに理由を置く。** 重要な判断を影響するUIと対応づける。
5. **発明前にシステムを検索する。** 新規componentやpatternの前に既存資産を確認する。
6. **成功画面ではなく体験を設計する。** Loading、Empty、Error、Permission、Recovery、Cancelを含める。
7. **Accessibilityをbriefに含める。** 最終監査ではなく設計条件として扱う。
8. **不確実性を隠さない。** 不明点は仮定、質問、未解決事項のいずれかとして残す。
9. **ステータス変更は人間が承認する。** AIは提案できるが、design、例外、global ruleを承認できない。
10. **学習を統治する。** Feedbackは適用範囲と再利用価値を確認してからMeridianへ反映する。

## 5. 人間とAIの責任分担

| 活動 | AIの責任 | 人間の責任 |
|---|---|---|
| 課題整理 | 依頼を構造化し、曖昧さとリスクを提示する | 実際の課題と事業境界を確認する |
| 質問 | 影響度の高い質問から提示する | 制約、判断、AIが取得できない情報を提供する |
| 調査 | 根拠を収集、分類、比較、引用する | 情報の妥当性、機密性、許可されたsourceを判断する |
| 発散 | 異なる案とtrade-offを作る | 弱い方向を却下し、戦略的文脈を補う |
| 推奨 | 根拠と不確実性つきで1案を推す | 採用、方向転換、再探索を決める |
| 仕様化 | ScreenSpec / FlowSpec候補を作る | 挙動、権限、データ、edge caseを確認する |
| Prototype | レビュー用HTMLを作る | 体験と視覚品質を評価する |
| 検証 | 構造検査と批判的AIレビューを行う | usability、domain、visual、最終designをレビューする |
| Feedback | 繰り返される修正を検出しrule候補を作る | local / pattern / globalの適用範囲を決める |

## 6. 標準ワークフロー

```text
User request
  -> Intake
  -> DesignBrief
  -> Clarification Gate
  -> Research Plan
  -> ResearchPack
  -> Problem Definition Gate
  -> Direction A / B / C
  -> Recommendation Gate
  -> ScreenSpec / FlowSpec
  -> DesignProposal
  -> Interactive HTML concept
  -> Automated checks
  -> Adversarial AI review
  -> Human design review
  -> Approved proposal / Revision request
  -> FeedbackCandidate
```

### 6.1 Intake

最初に次を分類する。

- New flow、new screen、extension、redesign、defect correctionのどれか。
- User-facing、internal operation、administration、system UIのどれか。
- Single screenかmulti-screen flowか。
- 主なroleとpermission boundary。
- 意思決定の期限。
- 既存PRD、仕様、ユーザーリサーチの有無。
- 機密性と外部調査可能範囲。

AIは機密システムへのアクセスや成果物の公開権限を推測してはならない。

### 6.2 DesignBrief

対話内容を`DesignBrief`へ正規化する。情報不足は隠さず、影響する判断だけをblockする。視覚探索前に人間がbriefを確認する。

### 6.3 Clarification Gate

質問は次の順で優先する。

1. User goalとprimary task。
2. 取り消せない結果、高リスク操作。
3. Roleとpermission。
4. Data量、可用性、鮮度。
5. Device、locale、accessibility制約。
6. 情報設計を変えるbusiness rule。

Meridianから導出できる見た目の好みは、意味やbrand requirementを変えない限り質問しない。

### 6.4 Research

すべてのタスクでResearch recordを必須にする。規模は変えても、調査の有無を任意にしない。

最低限、次を確認する。

- 直接競合または同等のtaskを持つproduct。
- 成熟したdesign systemの関連pattern。
- 適用されるstandardとplatform guidance。
- Meridian内のcomponent、pattern、template、decision、open question。
- Accessibilityとinclusive designへの影響。
- 関連する地域、言語、法規、domain固有条件。

### 6.5 Direction生成

2〜3案を生成する。案の違いはinformation architecture、interaction model、task sequence、disclosure strategyのいずれかに存在しなければならない。色やspacingだけの差は別案とみなさない。

各案に含めるもの:

- 仮説。
- 適する利用文脈。
- 情報階層。
- 主なinteraction model。
- 利点とリスク。
- Accessibilityへの影響。
- 概念レベルのengineering implication。
- 利用したevidence。
- 案が成立しなくなる条件。

### 6.6 Recommendation Gate

AIは1案を推奨するが、進める案は人間が決める。推奨には次を含める。

- Primary taskを最も支援する理由。
- 支持するevidence。
- 適用したMeridian principle / pattern。
- 意図的に最適化しないもの。
- 残る不確実性。
- 他案を選ばなかった理由。

### 6.7 Specification

方向性の承認後、既存の`ScreenSpec`と`FlowSpec`で仕様化する。両仕様はrenderer非依存を維持する。

### 6.8 Review artifact

最終成果は`DesignProposal`を表現した動くHTMLとする。HTMLはconcept artifactであり、production implementationではない。

## 7. Artifact model

```text
DesignBrief
  -> ResearchPack
  -> DirectionSet
  -> ScreenSpec[]
  -> FlowSpec?
  -> DesignProposal
  -> ReviewRecord
  -> FeedbackCandidate[]
```

全artifactはstable IDとstatusを持つ。

```text
draft -> ready-for-review -> approved | revision-requested -> superseded
```

`approved`へ変更できるのは人間だけとする。

## 8. DesignBrief contract

`DesignBrief`は何を、なぜ設計するかを定義する。既存制約でない限り、特定componentやlayoutを要求事項として固定しない。

| Section | 内容 |
|---|---|
| `meta` | ID、schema version、source、status、timestamp |
| `request` | 原文の依頼と期待する成果 |
| `problem` | User problem、現状、課題の既存根拠 |
| `users` | Primary / secondary user、role、能力、利用文脈 |
| `tasks` | Primary task、secondary task、頻度、緊急度 |
| `outcomes` | User outcome、business outcome、成功指標 |
| `constraints` | Product、technical、legal、organization、brand、time制約 |
| `scope` | 含むもの、含まないもの |
| `channels` | Desktop、mobile、touch、keyboard、AT、locale |
| `data` | 必要情報、量、鮮度、機密性、owner |
| `permissions` | Actor、許可操作、禁止操作、escalation |
| `risks` | User harm、誤操作、誤解、business risk |
| `knownEvidence` | Teamが提供した既存調査と内部根拠 |
| `assumptions` | 仮定、confidence、影響 |
| `openQuestions` | 未回答事項、owner、blocking level |
| `acceptance` | Research / ideationへ進む条件 |

品質条件:

- Primary taskが1つ識別できる。
- 課題を特定componentやlayoutで記述しない。
- User outcomeとbusiness outcomeを分ける。
- 仮定をresearch findingとして扱わない。
- 個人情報、機密情報をresearch前に識別する。
- Non-blockingな不明点は残したまま進められる。

## 9. ResearchPack contract

### 9.1 調査レベル

| Level | 用途 | 最低条件 |
|---|---|---|
| Baseline | 全タスク | Meridian検索、比較対象2件、成熟DS 1件、関連standard確認 |
| Extended | New pattern、高リスク、major redesign | 比較対象3〜5件、複数DS、一次standard、a11y / localization review |
| Specialist | 規制、安全、金融、医療、identity、未知のinteraction | Domain expert、法規、user research plan、明示的な限界 |

### 9.2 Source priority

1. Standard、regulation、official platform documentation。
2. First-party product documentationと直接観察したproduct behavior。
3. Research / usage guidanceを持つ成熟design system。
4. Peer-reviewedまたは信頼できる一次研究。
5. 高品質な二次分析。
6. Community discussionは探索の入口に限定し、単独の決定根拠にしない。

### 9.3 Evidence fields

| Field | 内容 |
|---|---|
| `evidenceId` | Stable ID |
| `sourceType` | standard / product / design-system / research / secondary / community |
| `title` | Source title |
| `organization` | Source owner |
| `url` | 直接URL |
| `accessedAt` | 確認日 |
| `locale` | 観察market / locale |
| `deviceContext` | desktop / mobile / native / responsive / unknown |
| `observation` | 直接確認した事実 |
| `interpretation` | 観察からの解釈 |
| `relevance` | 今回の課題との関係 |
| `supportedDecisions` | 支持するcandidate decision |
| `limitations` | 不足context、personalization、古さ、不確実性 |
| `captureRef` | Screenshot / archive参照 |

Observationとinterpretationを分離する。競合を模倣した事実だけをdesign rationaleにしてはならない。

ResearchPackは最後に次を要約する。

- 共通pattern。
- 意味のある差分。
- 繰り返し確認されたfailure mode。
- Accessibility implication。
- Meridianが採用を検討すべき機会。
- 模倣すべきでないpractice。
- Source間の矛盾。
- 残るresearch question。

## 10. DirectionSet contract

Required sections:

- `directions`: 2〜3の意味の異なる案。
- `comparisonCriteria`: DesignBriefから導出した評価軸。
- `comparison`: 全案のevidence-based evaluation。
- `recommendation`: AI推奨とconfidence。
- `rejectedIdeas`: Formal案にしなかったideaと理由。
- `decision`: Humanによる選択、revision、no-go。

既定の比較軸:

- Primary task efficiency。
- 理解しやすさと情報階層。
- Error prevention / recovery。
- Accessibility / inclusive use。
- Responsive / localization耐性。
- Meridian component / pattern適合。
- 概念レベルの実装複雑度。
- 将来stateへの拡張性。
- Evidence strength。

## 11. PatternContract

Patternはvisual templateではなく、繰り返し現れるuser problemに対するbest-practice responseと定義する。

| Section | 内容 |
|---|---|
| `meta` | ID、name、maturity、owner、status、version |
| `userProblem` | 解決する再発性のある課題 |
| `applicability` | 使用を支持する条件 |
| `nonApplicability` | 使用すべきでない条件 |
| `prerequisites` | 必要data、permission、preceding state |
| `informationArchitecture` | 必須hierarchyとgrouping |
| `interactionModel` | Action、sequence、disclosure、system response |
| `components` | Required / optional / incompatible component |
| `states` | Default、loading、empty、error、permission、confirmation、recovery |
| `responsive` | Reflowとinput method |
| `accessibility` | Requirement、risk、keyboard、announcement |
| `content` | Message、label、term、localization concern |
| `evidence` | Patternを支持するresearch |
| `alternatives` | Related patternと選択境界 |
| `failureModes` | よくある失敗 |
| `examples` | Approved exampleとcounterexample |
| `evaluation` | Context内で検証するquestion / check |
| `changeHistory` | 変更根拠とdecision |

Maturity:

```text
experimental -> candidate -> supported -> deprecated
```

AIはexperimental patternをsupported patternと同じconfidenceで提示してはならない。

## 12. DesignProposal contract

HTMLに次を含める。

1. Executive summary。
2. Problemとdesired outcome。
3. User、task、constraint。
4. Assumptionとopen question。
5. Research methodとsource summary。
6. Competitive / best-practice finding。
7. Design principleと評価軸。
8. Direction比較。
9. 推奨案とrationale。
10. 動くHTML concept。
11. Information architecture。
12. Screen / flow behavior。
13. State coverage。
14. Responsive / localization behavior。
15. Accessibility plan。
16. Content / terminology decision。
17. Risk、trade-off、unresolved item。
18. Quality gate result。
19. Review decision / comment。
20. Meridian feedback candidate。

Interactive HTMLは次を満たす。

- Meridian tokenと承認済みcomponent semanticsを使う。
- Primary pathをkeyboardでレビューできる。
- 静的な成功画面だけでなくbehaviorを示す。
- Source編集なしで主要なalternate stateを確認できる。
- Simulated dataとnon-functional actionを明示する。
- Network / production systemに依存しない。
- Prototype codeをproduction-readyと表示しない。
- Preview周辺にrationaleとevidenceを保持する。
- 必要に応じdesktop / mobileを確認できる。
- 表現対象ではreduced motion、theme、contrastを尊重する。

## 13. Quality Gate

### Brief Gate

- Primary user / taskが明確。
- Outcome / success signalが定義済み。
- Scope / constraintが可視化されている。
- Blocking questionが解決済み。
- Assumptionがlabelされている。

### Research Gate

- Baseline research完了。
- 関連一次sourceを含む。
- Competitor observationにlocale / contextがある。
- Observation / interpretationが分かれている。
- Evidenceとdecisionが接続されている。
- 矛盾するevidenceを隠していない。
- Limitationsが記録されている。

### Exploration Gate

- 2案以上の意味の異なる方向がある。
- Brief由来の基準で比較している。
- Rejected directionに理由がある。
- Recommendationにtrade-off / uncertaintyがある。

### Specification Gate

- ScreenSpec / FlowSpecが構造検証を通る。
- Component / pattern参照が存在するかunresolvedになっている。
- 必須stateを網羅するかnon-applicable理由がある。
- Permission、error recovery、cancelを定義している。
- Responsive / localeを扱っている。

### Prototype Gate

- Published Meridian tokenだけを使用。
- Primary pathをkeyboardで操作可能。
- Focusが見え、順序が論理的。
- Status / error changeがprogrammatically understandable。
- Colorだけにstateを依存しない。
- Controlにnameと十分なtargetがある。
- Simulated behaviorを開示している。

### Explanation Gate

- 主要IA decisionにrationaleがある。
- Rationaleがuser goal、evidence、principle、constraint、trade-offへ接続されている。
- Evidenceを超えたclaimがない。
- Alternative / uncertaintyが見える。
- 非デザイナーも推奨理由を理解できる。

### Human Review Gate

- PdM: 課題とrequirementの正確性。
- Designer: UX、visual quality、system fit、exception。
- Engineer: feasibility riskとbehavior completeness。

Production code reviewはPhase 1対象外。

## 14. Adversarial AI Review

人間レビュー前に、別の批判的レビューpassを行う。

- 根拠のないclaim。
- 欠けているuser group / permission。
- Happy path bias。
- Dark pattern / coercive default。
- Accessibility failure。
- Consequenceを隠すcontent。
- Mobile、keyboard、locale、data volume failure。
- Task価値のない装飾的複雑さ。
- Contextなしの競合模倣。
- Meridian ruleを機械的に守った結果のUX悪化。

このreviewはrevisionを要求できるがapproveはできない。

## 15. Feedbackと学習

人間の修正は直接ルール変更せず、`FeedbackCandidate`として記録する。

Scope:

- `proposal-local`: 今回のみ。
- `product-local`: 同一product / organization内で再利用。
- `pattern`: 再発するUX patternを改善。
- `component`: Component選択・behaviorを改善。
- `foundation`: System横断rule、token、content、a11y policyを変更。

昇格前に確認する。

1. 同じ問題が複数回発生したか。
2. 1productのbusiness ruleから独立しているか。
3. 外部evidenceが支持するか。
4. どの既存guidanceを置換・限定するか。
5. Validなdesignを過剰に制約しないか。
6. Complianceを検証できるか。
7. 将来のownerは誰か。

AIはupdate案を作れるが、scopeと最終文言は人間が承認する。

## 16. 知識の優先順位

矛盾時の基本優先度:

1. 適用されるlaw / regulation。
2. Stable web / platform standard。
3. Approved Meridian foundation / accessibility policy。
4. Approved PatternContract。
5. Stable component contract。
6. Product-specific requirement / approved exception。
7. Research finding。
8. AI inference。

下位sourceを優先する場合はconflict recordへ理由を残す。人間向け文書を説明の正本とし、AI向けsummary / indexは正本から生成しstalenessを検査する。

## 17. Global readiness

- Locale / languageをmetadataに持つ。
- Text expansionとlong labelを考慮する。
- Date、time、number、currency、address、name formatを固定しない。
- Writing directionとselective icon mirroringを表現できる。
- Color / icon meaningを文化横断で自明と仮定しない。
- Keyboard、pointer、touch、assistive technologyを別contextとして扱う。
- Research recordにmarket / product versionを残す。
- Legal guidanceをjurisdictionへscopeする。
- Universal guidanceとmarket-specific decisionを区別する。

Phase 1では英語文書の完成を必須にしないが、多言語化を妨げるcontractにしない。

## 18. 概念上の情報構造

これはownership modelであり、Phase 1中のfile移動指示ではない。

```text
Meridian
├── constitution
│   ├── principles
│   ├── rules
│   └── decision-priorities
├── foundations
│   ├── tokens
│   ├── accessibility
│   ├── content
│   ├── iconography
│   └── localization
├── components
│   ├── human-specs
│   └── contracts
├── patterns
│   ├── contracts
│   ├── evidence
│   └── examples
├── workflow
│   ├── design-brief
│   ├── research-pack
│   ├── direction-set
│   ├── design-proposal
│   └── review
├── generation
│   ├── screen-spec
│   ├── flow-spec
│   └── html-concept
├── quality
│   ├── validation
│   ├── adversarial-review
│   └── evaluation
└── learning
    ├── feedback-candidates
    ├── decisions
    └── change-history
```

## 19. 既存資産の扱い

| Asset | Phase 1判断 |
|---|---|
| `VISION.md` | North Starとして維持 |
| `DESIGN.md` | 生成AI constitutionとして維持。全workflowは入れない |
| `design/*.json` | 構造化foundationの正本として維持 |
| `tokens/` | Framework非依存の正本として維持 |
| `components/*.md` | 人間向けcomponent guidanceとして維持 |
| `design/contracts/components/` | AI向けcomponent knowledgeとして維持 |
| ScreenSpec / FlowSpec schema | Phase 1 review後に必要箇所だけ拡張 |
| `js/pages-patterns.js` | 移行input。将来のpattern SSOTにはしない |
| `js/templates.js` | Example / prototype materialへ位置づける |
| `design/reviews/` | DS refinement用として維持し、proposal reviewとは分ける |
| `FEEDBACK_LOG.jsonl` | Audit historyとして維持。将来はcandidate承認を前段に置く |
| `packages/react/` | Deferred adapterとして凍結 |
| Documentation site | 人間向けKnowledge Portalとして維持 |

## 20. Phase 1 deliverables

1. Product definition / responsibility model。
2. DesignBrief field specification。
3. ResearchPack field specification / depth policy。
4. DirectionSet field specification / comparison rule。
5. PatternContract field specification / maturity model。
6. DesignProposal構成 / interactive HTML requirement。
7. ReviewRecord / FeedbackCandidate concept。
8. Quality Gate定義。
9. Knowledge authority / conflict policy。
10. Team invitation flowの非render example package。
11. Manual pilotのevaluation plan。
12. Phase 2実装scopeの人間承認。

## 21. Phase 1 acceptance criteria

- PdM、designer、engineerの責任分担が合意されている。
- 全artifactにowner / lifecycleがある。
- Required / optional fieldがconcept levelで合意されている。
- Researchが必須でevidence-quality policyがある。
- Human approvalをworkflow statusで迂回できない。
- HTML artifactとproduction codeが明確に分かれている。
- ScreenSpec / FlowSpecのpipeline上の位置が決まっている。
- Pattern knowledgeとvisual templateが分離されている。
- Feedbackが自動でglobal ruleにならない。
- Global readiness / WCAG 2.2 AAがbaselineになっている。
- First pilotにReactを必要としない。
- Manual pilotのtask / success measureが限定されている。

## 22. Phase 1後の推奨pilot

Team member invitation flowを最初のpilotとする。

- Multiple role / permission。
- Form input / validation。
- Pending / expired state。
- Error、retry、cancel、confirmation。
- Email / localization。
- Dialog、table / list、status、alert、notification。
- Single / multi-screen reasoning。
- Production backendなしで扱えるsecurity / privacy consideration。

Phase 1のartifact contract承認後に開始し、最初は手動で観察可能なworkflowとして実行する。Automationはpilot evidenceの後に行う。

## 23. Pilot success measures

- Brief承認までのclarification回数。
- Research source品質 / decision linkage。
- 案が意味の異なる方向になっている割合。
- 主要decisionのrationale trace率。
- Component / pattern reference validity。
- State / permission coverage。
- Human review前に検出したa11y issue。
- Designer correction数 / severity。
- Proposal review後のengineer clarification数。
- Requestからreview可能になるまでの時間。
- 再利用可能なFeedbackCandidate数 / 品質。

主成功指標は速度だけではない。Cross-functional teamが欠けた思考を再構築せずdesign decisionを行えることを目標にする。

## 24. Schema設計前のopen decisions

1. 常に3案か、人工的な3案目になる場合は2案を許すか。
2. Organizationごとに誰がproposalをapproveできるか。
3. 機密な競合調査 / screenshotをどう保存・除外するか。
4. Organization固有workflowで内部evidenceを外部researchより優先できる条件。
5. Evidenceの再確認期限。
6. Visual reviewのうち自動化する範囲。
7. Patternのhuman guidanceとmachine contractを同一sourceにするか、共通sourceから生成するか。
8. First HTML conceptの最低interaction fidelity。
9. First pilotを日本語のみとするか、英語 / long-text stress caseを含めるか。
10. Publicにするartifactと企業内利用を想定するartifactの境界。

## 25. References

- [デザイナーの脳内をコピーして、誰でも90点以上のUIを作れるようにする](https://note.com/toitoi1618/n/ndf35dbd2585b)
- [デザイナー以外でも、Claude Codeでデザインを作れるために取り組んだこと](https://blog.tsubotax.com/n/n53863aa059ff)
- [W3C Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/)
- [Design Tokens Community Group Technical Reports](https://www.designtokens.org/technical-reports/)
- [GOV.UK Design System Patterns](https://design-system.service.gov.uk/patterns/)
- [Model Context Protocol — Resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources)
- [Model Context Protocol — Tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
