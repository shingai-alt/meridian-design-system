# Meridian UI Generation — External Design System Adapter Research

- Status: Contract and automated browser comparison complete; manual platform checks and selection pending
- Milestone: M4
- Research Decision: `design/research-decisions/ui-generation-reference-adapter.research.json`
- Machine-readable benchmark: `design/adapter-benchmark.json`
- Browser plan: `design/adapter-browser-evaluation-plan.json`
- Browser evidence: `design/evidence/adapter-browser/manifest.json`

## 1. Decision boundary

M4は最初のReference Adapter候補を同じ条件で比較する。Reference Adapterは、Projectに既存Design Systemがない場合に使用できる既定候補であり、Meridianの正本Design Systemにはならない。

Project Inspectorの`project-existing-first` policyはM4でも維持する。外部候補の評価が高くても、Evidence付きで利用可能なProject Adapterを自動的に上書きしない。

Research Decisionは現在`researching`である。Contract coverageと自動Browser Matrixは比較済みだが、VoiceOver、ブラウザUIの200% zoom、Windows High Contrast、weighted assessmentが未完了であるため、推奨候補とHuman Approvalは記録していない。

## 2. Candidate types

候補は同じ種類ではない。

| Candidate | Type | Pinned boundary |
|---|---|---|
| shadcn/ui | Open-code distribution | CLI 4.8.3、2026-07-27 registry snapshot |
| Radix Primitives | Unstyled primitives | `radix-ui` 1.6.7 |
| React Aria Components | Unstyled components | `react-aria-components` 1.19.0 |
| Material UI / MUI X | Visual Design System | `@mui/material` 9.2.0、`@mui/x-data-grid` 9.10.1 |
| Carbon Design System | Visual Design System | `@carbon/react` 1.112.0 |

Visual Design Systemは完成した外観とComponent coverageを提供しやすい。一方、unstyled foundationはDTCG TokenとMeridian profileを適用しやすいが、Visual Adapterの実装量が増える。Open-code distributionは生成sourceを所有できるが、upstream update、license、security、drift管理もProjectへ移る。

## 3. Shared benchmark method

Team InvitationとIssue Triageを、同じMachine-readable Capability集合で全候補へ評価する。

Coverage status:

| Status | Meaning |
|---|---|
| `native` | 公式packageの安定APIが直接提供する |
| `composition` | 同Candidateの公開APIを組み合わせて解決する |
| `extension` | Meridian codeまたは別dependencyが必要 |
| `commercial` | 有料license境界を越える |
| `unresolved` | 安全な解決が確認できない |
| `generator-owned` | Responsive layoutなど、Component Adapterへ委譲すべきでない |

`native`件数は品質Scoreではない。Candidateの種類によって粒度が異なるためである。たとえばReact Ariaのunstyled componentとMUI Data Gridの完成済みvisual componentを、単純な有無で同一評価してはいけない。

## 4. Pilot profiles

### Team Invitation

- Field input
- Option selection
- Boolean confirmation
- Modal focus lifecycle
- Repeatable editor
- Async status and partial result
- Token and theme mapping
- Responsive reflow
- RTL and locale

### Issue Triage

- Sortable collection
- Multi-selection
- Filtering
- Pagination
- Row actions
- Detail disclosure
- Density control
- Virtualization
- Keyboard collection behavior
- Responsive master-detail
- Token and theme mapping
- RTL and locale

Issue TriageはTeam Invitationと構造が異なる第二Pilotとして、data-intensive collectionの不足を露出させる。まだ正式Design BriefやSession Artifactではなく、M4比較用のresearch fixtureである。

## 5. Current contract findings

| Candidate | Coverage | Current blocking boundary |
|---|---:|---|
| shadcn/ui | 21 / 21 represented | Data Table、virtualization、collection keyboard behaviorはcomposition / extension |
| Radix Primitives | 17 / 21 represented | Sorting、pagination、virtualization、collection keyboardがunresolved |
| React Aria Components | 21 / 21 represented | Visual styling、density、pagination、virtualizationはAdapter / extension work |
| Material UI / MUI X | 20 / 21 non-commercial | Direct detail panelはMUI X commercial boundary |
| Carbon | 18 / 21 represented | RTLとvirtualizationが未確認 |

この表だけで候補を選ばない。`composition`と`extension`は実装・保守コストが異なり、公式のaccessibility claimもMeridianが生成する最終compositionの品質を保証しない。

## 6. License and ownership findings

- shadcn/uiは公式sourceがMITでも、選択Base、registry item、icon、table engineなどを個別追跡する。
- Radix PrimitivesはMITだが、欠けるdata capabilityを補うdependencyは別Decisionになる。
- React Aria ComponentsはApache-2.0で、Meridianがvisual stylingとToken mappingを所有する。
- Material UIとMUI X CommunityはMIT。Pro / Premium機能はcommercial license、license key、application / seat条件を持つ。
- Carbon ReactはApache-2.0。Sass build、font、Carbon visual conventionへの適応コストを含める。

Adapter Resolutionは、commercial機能を無料機能へ見せかけたり、unresolved capabilityへ似たComponentを黙って割り当てたりしてはならない。

## 7. Automated browser evidence

DocumentationだけではCandidateの意図とAPI境界しか証明できないため、隔離workspace `spikes/external-adapters`を実装した。固定lockfileとローカルChromeを使い、5 Candidate × 2 Pilot × 3 Viewportの30 scenarioを同じrunnerで評価している。

自動対象:

- Team Invitationのreview、Escape、focus restoration、partial success / failure
- Issue Triageのsort、selection、detail、Escape、focus restoration、pagination
- Accessibility snapshot上のinteractive nameとtree presence、最大80 stopのTab cycle、focused / unfocused style差分によるvisible focus
- Pointer clickに置き換えないKeyboard journeyによるsort、selection、detail、pagination、Dialog実行
- visible interactive controlの24×24 CSS px touch target geometry
- Desktop 1440×1000、Tablet 768×1024 RTL、Mobile 375×812 forced-colors
- long Japanese、document overflow、Desktop CSS zoom 200%
- console / runtime error、screenshot digest、候補別build closure
- Runner、Pilot、Adapter、CSS、設定、lockfileのsource digestと、build artifactのbyte size / gzip size / SHA-256

初回の自動runはcritical / major finding 0だったが、画像の人間確認でTablet RTL tableの狭い列が縦に分断される問題を発見した。document overflowだけでは検出できない視覚品質問題だったため、generator-owned responsive boundaryを修正し、820px以下を共通card presentationへ変更して全30 scenarioを再生成した。修正後は全候補が6 / 6 scenarioを通過している。

この合格は、各CandidateがすべてのCapabilityを`native`に持つことを意味しない。Spikeは`composition`、`extension`、`generator-owned` fallbackを明示的に実装している。Contract Matrixの`commercial`と`unresolved`はBrowser journeyが通っても消えない。

### Build closure

共通Pilot shellとReact runtimeを含む比較用closureであり、Production bundle予測ではない。

| Candidate | Raw | Gzip | Notable boundary |
|---|---:|---:|---|
| shadcn/ui captured registry source | 381,670 B | 118,982 B | 9件のnew-york-v4 TSXを変更せずTailwind v4でcompile |
| Radix Primitives | 307,817 B | 101,534 B | 最小closureだがdata capabilityのextensionが多い |
| React Aria Components | 480,854 B | 150,154 B | behaviorは豊富だがvisual adapterを所有する |
| Material UI / MUI X | 945,364 B | 287,960 B | 最大JavaScript closure、commercial境界あり |
| Carbon | 1,173,640 B | 190,044 B | 大きなCSS closureとvisual convention |

shadcnの9 registry itemは公式`new-york-v4` endpointから取得し、file contentごとのSHA-256を`shadcn-registry-snapshot.json`へ記録した。Build前にsnapshotを決定的にmaterializeし、公式Vite構成に合わせてReact 19、Tailwind CSS v4、`@tailwindcss/vite`、`@/*` aliasでTSXを変更せずcompileする。現行shadcn Candidateはこのcaptured sourceを直接利用し、Meridian Adapterは業務CompositionとProject Theme Token境界だけを所有する。compiled parity Gateは完了し、同じ30 scenarioへ含まれる。

Dependency auditはhigh / critical 0、moderate 3である。3件はshadcn開発CLIの同一transitive chainに集約され、本番runtimeへCLIを含めない境界を設けている。ただし供給網の保守コストとして最終比較から除外しない。要約値はnpm version、実行条件、registry、未加工`npm audit --json`結果のSHA-256へ結び付け、validatorがseverity、dependency count、advisory URLを再照合する。

## 8. Remaining manual gate

次は以下を同じlockfileとbuildに対して実施する。

- VoiceOver + Chromeで両Pilotのprimary journey、Dialog、Table / Card reading order
- ブラウザUIの200% zoom（自動CSS zoomは補助Evidence）
- Windows High Contrast（macOS上のforced-colors emulationは補助Evidence）
- 自動Evidence、手動Evidence、Contract coverage、license、maintenance、bundleを同じweighted criteriaへ割り当てる

これらが揃うまで`browserEvaluation.status`は`in-progress`、Evidenceは`automated-complete`、`decisionEligible`は`false`である。AIは未承認CandidateをReference Adapterへ昇格できない。

## 9. Verification

```sh
npm run build:adapter-spike
npm run evaluate:adapter-spike
node --test test/adapter-benchmark.test.js test/adapter-browser-evidence.test.js test/ui-generation-research-decision.test.js
node scripts/validate-system.mjs
npm run check:system
```
