# Meridian UI Generation — Product Goal and Delivery Roadmap

- Status: Active
- Established: 2026-07-27
- Scope: Research, specification, implementation, validation, and governed rollout
- Related: `VISION.md`, `docs/ai-generation/specs.md`, `docs/ai-generation/phase-1-design.md`, `docs/ai-generation/phase-2-design.md`

## 1. Product Goal

Meridianに、プロジェクト既存または選定済みの外部Design Systemを交換可能なAdapterとして利用し、次の閉路を一貫して再現・検証できる正式なUI生成機能を実装する。

```text
User request
  -> Project inspection
  -> Design intake
  -> Impact-based clarification
  -> Requirement allocation
  -> Screen responsibility
  -> Product UI pattern selection
  -> Structurally different directions
  -> Human direction approval
  -> Capability plan
  -> Design System adapter resolution
  -> Review UI generation
  -> Browser quality evaluation
  -> Layer-aware repair
  -> Human review
  -> Generation report
```

AIは未承認のComponent、Pattern、Design System変更を正本へ自動昇格できない。主要な技術判断は、一次資料、比較可能な候補、実装Spike、明示的なHuman Decisionを持つResearch Gateを通過しなければならない。

## 2. Product Boundaries

### 2.1 In scope

- SaaS、管理画面、業務ツール、AI WorkspaceのScreen / Flow設計
- Project既存Design Systemの優先利用
- 外部Design Systemの交換可能なAdapter利用
- Capabilityベースの中間仕様
- Design System固有Componentへの決定論的な解決
- Review用の操作可能なUI生成
- Desktop、Tablet、Mobileの主要タスク検証
- Loading、Empty、Error、Permissionなど主要状態の設計
- 設計理由、代替案、制約、未解決事項の追跡
- Structured FeedbackとGeneration Report

### 2.2 Out of scope until explicitly promoted

- AIによるDesign System正本の自動変更
- Human Approvalを省略したVisual Directionの確定
- すべてのFrameworkへの同時対応
- 生成コードを無条件にProduction Readyと宣言すること
- 全業界、全UIジャンルへの初期対応
- Adapter変更時のDOM、Props、Visualの完全一致保証

## 3. Non-negotiable Invariants

1. 中間仕様は特定UI LibraryのComponent名へ依存しない。
2. Screen Responsibility、Primary Task、Requirement AllocationはVisual Craft Passで変更しない。
3. Project既存ComponentとDesign SystemをDefault Adapterより優先する。
4. Capabilityを満たさないComponentへ黙ってFallbackしない。
5. 新規Componentは`screen-local`、`provisional`、`unresolved`を経ずに正式Registryへ追加しない。
6. Direction採用、例外承認、正本変更はHuman Decisionを必須とする。
7. 生成物にはSource、Decision、Component、Contract、Adapter VersionのProvenanceを残す。
8. Browser評価の問題は原因となる設計層へ戻し、すべてをCSS修正で処理しない。
9. Token交換はDTCG形式を共通境界とし、Vendor固有値を正本にしない。
10. Research結果には採用理由、却下理由、制約、再評価条件を残す。

## 4. Outcome Measures

正式機能の完了時に、少なくとも次を測定可能にする。

| Measure | Target |
|---|---:|
| Requirement allocation coverage | 100% |
| Screen responsibility coverage | 100% |
| Blocking unknowns before generation | 0 |
| Generated component capability coverage | 100% or explicitly unresolved |
| Unapproved component invention | 0 |
| Major browser findings before human review | 0 |
| Required viewport coverage | Desktop / Tablet / Mobile |
| Required state coverage | Default / Loading / Empty / Error / Permission |
| Direction alternatives | 2–3 structurally distinct options |
| Human direction decision | Required |
| Artifact provenance coverage | 100% |
| Pilot coverage | Team Invitation + one structurally different pilot |

## 5. Delivery Principles

- 小さな縦切りで進め、Schemaだけ、UIだけ、Promptだけを孤立して完成させない。
- 各Milestoneは独立したAcceptance Criteriaと自動検証を持つ。
- Researchは実装を無期限に止める活動ではなく、Decisionに必要な比較とSpikeへ限定する。
- 既存のPhase 1、Phase 2、Component Harness、Visual Design Loopを移行元として再利用する。
- 互換性を維持できない場合は、暗黙変換ではなくVersioned Migrationを用意する。
- 最初のReference Adapterは最終的なMeridian独自Component Libraryを意味しない。

## 6. Delivery Status

| Small goal | Status | Implemented evidence |
|---|---|---|
| M0.1 Goal and roadmap | Complete | This document and the `README.md` entry point |
| M0.2 Research decision model | Complete | `design/ui-generation-research-policy.json`, Research Decision schema, semantic validator, external Design System research fixture, automated tests |
| M0.3 Generation session model | Complete | `design/ui-generation-session-policy.json`, Session schema, semantic validator, reference session, automated tests |
| M0.4 Existing artifact migration map | Complete | Migration schema and validator, lossless Team Invitation inventory, restored ScreenSpecs, explicit target gaps |
| M1.1 Design configuration contract | Decision-ready | JSON sidecar comparison, implementation Spike, and recommendation complete; Human Approval pending |
| M1.2–M1.6 Project inspection | Implemented | Project Context, explicit/inferred provenance, package/source inspection, confidence/unresolved, project-existing-first selection |
| M1 Formal exit | Pending | Human Approval of `ui-generation-project-config` Research Decision |
| M2.1–M2.6 Design intake and clarification | Implemented | Design Brief and Clarification schemas, impact policy, deterministic question ranking, answer merge, assumption conversion, Human-only approval |
| M2 Formal exit | Pending | M1 Config Decision approval, formal `inspect_project` transition, and Human Approval of the Team Invitation Design Brief |
| M3.1–M3.8 Structure planning | Implemented | 100% Requirement Allocation, logical Screen Responsibilities, task-first Pattern Registry and selection, three pairwise-distinct Directions, Human-only digest approval |
| M3 Formal exit | Pending | M1/M2 approvals, Product Pattern Research Decision approval, and Human Design Owner selection of the Team Invitation Direction |
| M4.1–M4.6 External Adapter contract comparison | Implemented | Five pinned candidates, shared Team Invitation and Issue Triage capability matrix, explicit native/composition/extension/commercial/unresolved boundaries |
| M4.7 Automated browser comparison | Implemented | Isolated pinned workspace, 5 candidates × 2 Pilots × 3 viewports, source/build/screenshot digests, RTL/forced-colors/CSS zoom, keyboard/focus/touch checks, raw-bound dependency audit |
| M4.8 Manual accessibility and platform comparison | Pending | shadcn registry-source compiled parity is complete; VoiceOver + Chrome, browser UI 200% zoom, and Windows High Contrast remain |
| M4.9 Weighted recommendation and Human selection | Pending | Equal-criteria assessment, explicit rejection reasons, recommendation, Human approval |
| M5.1–M5.8 Capability contract and strict resolver | Implemented | Library-independent taxonomy and Plan, project-first versioned Adapter Registry, deterministic resolution, partial/unresolved stop, approval enforcement, provenance, switch diff |
| M5.9 Token mapping and target compatibility | Implemented | 84 required outputs mapped to DTCG paths with 4 theme/contrast contexts and 3 densities; contract/runtime version and catalog implementation checks feed Strict Resolution |
| M5.10 Formal provenance exit | In progress | HTML Runtime 0.2.0 target coverage is complete; approved external Reference Adapter, provisional promotion evidence, and formal Human-gated exit remain |
| M6.1–M6.8 Generic Review UI Generator | Implemented | Digest-bound Generation Manifest, five Named Layout Recipes, deterministic compiler and renderer, five states, three viewports, usage/provenance, blocked production gate, independent Issue Triage fixture |
| M6.5 Visual Profile contract | Implemented | Adapter-independent Calm Utility, Dense Operations, and Expressive Workspace profiles; explicit Manifest selection; token-only presentation changes; locked structure preserved |
| M6 Formal exit | Pending | Production Team Invitation Direction and Adapter approvals; fixture evidence cannot satisfy Human Gate |
| M7.1–M7.4 Browser QA contract | Implemented; capture pending | Digest-bound policy/evidence schemas, derived Screen × State × Viewport matrix, semantic/keyboard/focus/provenance checks, screenshot environment qualification |
| M7.5–M7.7 Repair control | Implemented | Finding layers, locked-structure digest, original workflow limits (5/2/2/1), AI locked-layer prohibition, Human escalation |
| M7.8–M7.10 Generation Report | Implemented; evidence-gated | Cross-artifact report, source digests, fixes/unresolved, Human design-owner approval digest; current fixture reports remain evidence-missing |
| M7 Formal exit | Pending | Real Browser QA capture for both Pilots, repair if required, and Human final review |

M0.2の外部Design System Decisionは、仕組みとしては完成しているが、選定結果そのものは`researching`である。候補を同一条件で評価し、比較Spikeを完了し、Human Approvalを得るまではReference Adapterを確定しない。

M0.3の状態、artifact ownership、Human Gate、digest invalidationの詳細は`docs/ai-generation/ui-generation-session-model.md`を正本とする。

M0.4のlegacy artifact inventory、安全なSession配置、不足contractは`docs/ai-generation/ui-generation-migration.md`と`examples/ui-generation/team-invitation.migration.json`を正本とする。

M1のConfig比較、Project Inspector、Evidence model、Adapter selectionの詳細は`docs/ai-generation/project-inspector.md`を正本とする。実装Spikeは完了しているが、Research DecisionがHuman Approvalを得るまではSessionの`inspect_project` transitionを実行しない。

M2のDesign Brief、Unknown分類、質問ranking、merge、Human Gateは`docs/ai-generation/design-intake.md`を正本とする。Team Invitation成果物は生成済みだが、M1のResearch DecisionとBrief自身が未承認のため、Session stateは`created`から進めない。

M3のRequirement Allocation、Screen Responsibility、Product UI Pattern、Direction distinctness、Human Direction Gateは`docs/ai-generation/structure-planning.md`を正本とする。実装Spikeでは3案を生成済みだが、Research DecisionとDirection SelectionはHuman Approvalまで未確定である。

M4の候補version、license、共通Capability Matrix、Browser plan、自動Evidence、手動確認の不足は`docs/ai-generation/external-adapter-research.md`、`design/adapter-benchmark.json`、`design/evidence/adapter-browser/manifest.json`を正本とする。自動Browser Matrixは完了したが、手動assistive-technology / platform確認とweighted assessmentが完了するまでResearch Decisionは`researching`に留め、候補を自動推薦しない。

M5のlibrary非依存Capability Plan、Adapter eligibility、strict resolution、DTCG Token Mapping、runtime compatibility、provisional / partial / unresolved境界は`docs/ai-generation/capability-resolution.md`を正本とする。Team Invitation previewは12 / 12 Product Requirementをカバーし、84 Token outputはすべてDTCG pathへ対応する。HTML Runtime 0.2.0で12 targetの実装とversion互換を満たし、9 Capabilityはすべてdraft targetによる`provisional`となった。Direction未承認と正式なpromotion evidence不足のためGeneration Gateは引き続きblockedであり、AIはこれらを自動昇格しない。

M6のGeneration Manifest、Named Layout Recipe、CapabilityからComponent Usageへの決定的compile、5状態、3 viewport、provenance、CLIは`docs/ai-generation/generic-review-generator.md`を正本とする。専用Rendererを持たないIssue Triage fixtureで実生成とBrowser操作を確認済みである。本番Team InvitationはHuman Gateが未承認のため、CLIが出力前に拒否する。

M6.5のVisual ProfileとM7のBrowser QA、Repair、Generation Reportは`docs/ai-generation/browser-qa-and-generation-report.md`を正本とする。契約、生成、検証は実装済みだが、実Browser captureは実行環境の起動制限により未取得である。したがってfixture Reportは`evidence-missing`、Human Reviewは`pending`を維持する。

## 7. Milestones

## M0 — Research and Session Foundation

### Outcome

UI Generationの正本、Research Gate、Session State、Artifact ownershipが一意になっている。

### Small goals

#### M0.1 Goal and roadmap

- Product Goalを記録する。
- Scope、Out of scope、Invariants、Outcome Measuresを固定する。
- Milestoneと完了順序を定義する。

#### M0.2 Research decision model

- Research question、candidate、criteria、evidence、spike、decision、revisit triggerを定義する。
- 一次資料と実測を区別する。
- Human approvalが必要なDecision categoryを定義する。

#### M0.3 Generation session model

- Session state machineを定義する。
- 各stateで必要なArtifactを定義する。
- 不正なstate transitionを拒否する。
- Artifact digestとversionを追跡する。

#### M0.4 Existing artifact migration map

- Phase 1 Package、ScreenSpec、FlowSpec、Phase 2 Concept、Composition、Usage、Visual Reviewを新Sessionへ対応付ける。
- Team Invitationを最初のmigration fixtureにする。

### Acceptance criteria

- Product GoalとMilestoneが1つの正本から読める。
- Researchなしで固定してはいけないDecisionが列挙されている。
- Session stateとHuman Gateが機械検証可能な形で設計されている。
- 既存Team InvitationのArtifactを失わず移行できる。
- `npm run check:system`が成功する。

## M1 — Project Inspector and Design Configuration

### Outcome

対象ProjectのFramework、Styling、Token、Theme、Component、Layout、Icon、Form、Table、CatalogをEvidence付きで把握できる。

### Small goals

1. `meridian.design.json` contract。
2. Project Context schema。
3. Explicit config loader。
4. Package / source inspector。
5. Confidenceとunresolvedの記録。
6. Project-existing-first selection policy。

### Acceptance criteria

- Meridian repository自身を正しくinspectできる。
- 明示Configと推測結果を区別できる。
- Evidence pathのない推測を確定値として扱わない。
- Project既存Design SystemをDefault Adapterより優先する。

## M2 — Design Intake and Clarification

### Outcome

User RequestをDesign Briefへ構造化し、画面構造を変えるUnknownだけを1–3件ずつ質問できる。

### Small goals

1. Standalone Design Brief schema。
2. Actor、Goal、Task、Entity、Action、Constraint、Risk、Assumption、Unknown。
3. Unknown impact classification。
4. Blocking question ranking。
5. Answer mergeとAssumption conversion。
6. Brief approval gate。

### Acceptance criteria

- Blocking unknownが残る間はDirection生成へ進まない。
- Non-blocking unknownはAssumptionとして明示できる。
- 質問は技術用語ではなく利用者の行動として提示される。
- HumanがBriefを承認または差し戻せる。

## M3 — Allocation, Responsibility, Pattern, and Direction

### Outcome

Requirementを適切なSurfaceへ配置し、各Screenの責務を確定してから、構造の異なる方向性を比較できる。

### Small goals

1. Requirement Allocation schema。
2. Screen Responsibility contract。
3. Product UI Pattern taxonomy。
4. Machine-readable Pattern registry。
5. Pattern selection report。
6. Design System Profile。
7. Structurally distinct direction generation。
8. Human direction approval。

### Acceptance criteria

- 全Requirementが1つ以上のAllocationを持つ。
- 各Screenが1文のResponsibilityと`notResponsibleFor`を持つ。
- Persistent領域に責務外情報を置けない。
- 2–3案がTask Model、IA、Navigation、Disclosure、Action、Screen Boundaryのいずれかで異なる。
- Human Approval後に構造Decisionがlockされる。

## M4 — External Design System Research and Reference Adapter Selection

### Outcome

外部Design System候補を同じCriteriaとPilotで比較し、最初のReference Adapterを根拠付きで選定できる。

### Small goals

1. Candidate shortlist。
2. Weighted scorecard。
3. License / maintenance / security review。
4. Capability coverage matrix。
5. Team Invitation spike。
6. Issue Triage spike。
7. Desktop / Tablet / Mobile comparison。
8. Accessibility and localization comparison。
9. Human selection decision。

### Initial candidates

- shadcn/ui
- Radix Primitives
- React Aria Components
- Material UI / MUI X
- Researchで必要と判断したenterprise candidate

### Acceptance criteria

- Candidateごとに公式Evidenceとversionを持つ。
- 同一RequirementとCapability Planで比較する。
- License制約と有料機能を隠さない。
- 選定結果に却下理由とrevisit triggerを持つ。
- Reference AdapterをHumanが承認する。

## M5 — Capability Registry, Adapter, and Strict Resolver

### Outcome

Library非依存Capabilityを、Projectまたは選定AdapterのComponentへ安全に解決できる。

### Small goals

1. Capability taxonomy。
2. Capability Plan schema。
3. Adapter interface。
4. Adapter registry。
5. Project component adapter。
6. Reference external adapter。
7. Resolution report。
8. Strict resolver。
9. Token mapping。
10. Provenance。

### Acceptance criteria

- 未登録Capabilityを暗黙解釈しない。
- Capability不足を`partial`または`unresolved`として止める。
- Component、Composition、Provisional、Unresolvedの境界を追跡できる。
- Adapterを変更して同じCapability Planを再解決できる。
- Adapter差分をReportできる。

## M6 — Generic Review UI Generator

### Outcome

Team Invitation専用Rendererを脱し、Pattern、Layout Recipe、Resolved ComponentからReview UIを決定論的に生成できる。

### Small goals

1. Generic generation manifest。
2. Named layout recipes。
3. Pattern composition。
4. State fixtures。
5. Responsive presentation。
6. Review lenses。
7. Generated usage manifest。
8. Source and decision provenance。

### Acceptance criteria

- Team Invitation以外のPilotを生成できる。
- Manifestへraw HTML、raw CSS、raw token valueを埋め込めない。
- Default、Loading、Empty、Error、Permissionを確認できる。
- Component usageとDecisionを双方向に追跡できる。
- 同じ入力から同じ出力を生成できる。

## M7 — Browser QA, Repair, and Generation Report

### Outcome

生成結果を実Browserで評価し、問題を正しい設計層へ戻して修正し、Human Review可能な最終Reportを出力できる。

### Small goals

1. Desktop / 768px / 375px capture。
2. Long Japanese、High-density、Loading、Empty、Error fixtures。
3. Keyboard / focus / semantics checks。
4. Screenshot digest。
5. Visual quality rubric。
6. Layer-aware finding classification。
7. Repair limit enforcement。
8. Human final review（Directionのpairwise comparisonと選択はM3で完了させる）。
9. Structured feedback。
10. Generation report。

### Acceptance criteria

- 必須ViewportとStateのEvidenceが揃う。
- Stale screenshotを拒否する。
- Major findingが残る場合はHuman Reviewへ進めない。
- Visual修正がlocked structureを変更しない。
- Repair上限到達時に未解決理由を報告する。
- Team InvitationとIssue Triageの2 Pilotが完了する。

## 7. Milestone Exit Rule

Milestoneを完了できるのは、次がすべて成立した場合だけとする。

1. Acceptance Criteriaを満たす。
2. Required schemaとfixturesが検証される。
3. Generated artifactsが最新である。
4. Automated checksが成功する。
5. Known limitationsを記録する。
6. Required Human Decisionが存在する。
7. 次Milestoneが依存する公開contractをversion化する。

テスト成功だけでMilestoneを完了扱いにしない。未承認Decision、未実施Browser Matrix、未解決Capabilityがある場合は、その状態を明示する。

## 8. First Delivery Slice

最初の実装順は次の通り。

```text
M0.1 Goal and roadmap
  -> M0.2 Research decision model
  -> M0.3 Generation session model
  -> M0.4 Team Invitation migration map
  -> M1.1 meridian.design.json contract
```

最初の価値提供は「UIを生成すること」ではなく、Project Context、Research Decision、Session Stateを再現可能にし、その後のすべての生成判断を検証可能にすること。

## 9. Completion Definition

Product Goalは、次の条件をすべて満たしたときにのみ達成とする。

- Project既存または外部Design SystemをAdapterとして選択できる。
- Adapterを変更して同じCapability Planを再解決できる。
- RequirementからGeneration ReportまでのArtifact chainが途切れない。
- Human ApprovalなしにDirection、Exception、Design System正本を確定できない。
- 2つの異なるPilotで主要タスクをDesktop、Tablet、Mobileから完了できる。
- Browser QAとRepair履歴が再現可能である。
- 生成結果のComponent、Token、Decision、Evidence、Limitationを説明できる。
- `npm run check:system`が全UI Generation Gateを含んで成功する。
