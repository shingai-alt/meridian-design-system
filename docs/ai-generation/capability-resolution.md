# Meridian UI Generation — Capability Plan and Adapter Resolution

- Status: First vertical slice implemented; formal Direction and Adapter decisions pending
- Milestone: M5
- Taxonomy: `design/capability-taxonomy.json`
- Adapter Registry: `design/adapter-registry.json`
- Token Mapping: `design/generated/adapter-token-mapping.json`
- Pilot Plan: `examples/ui-generation/team-invitation.capability-plan.json`
- Pilot Resolution: `examples/ui-generation/team-invitation.adapter-resolution.json`

## 1. Boundary

Capability Planは、承認対象となる構造Directionと、実装に使うDesign Systemの間に置くlibrary非依存contractである。ここでは「Buttonを使う」ではなく、「名前付き操作を一度だけ実行でき、disabledとbusyを表現できる」のような利用者・semantic上の能力を記述する。

Adapter ResolutionだけがCapabilityをComponent、Composition、またはgenerator-owned実装へ変換できる。PlanへVendor名、Component ID、raw HTML、Props、CSS、Token valueを入れないため、同じPlanを別Adapterへ再解決できる。

## 2. Implemented contracts

### Capability taxonomy

各Capabilityは次を持つ。

- 安定したlibrary非依存ID
- action、input、collection、feedback、disclosure、data、navigationのcategory
- User intent
- 解決時に欠落できないsemantic
- 許可されるresolution kind

未知のCapabilityは近い名前のComponentへ推測せず、`unresolved`にする。

### Capability Plan

各RequirementはCapability、Screen Responsibility、Product Requirement、必須semantic、必須state、priority、rationaleを結ぶ。CoverageはRequirement Allocationの全Requirementから再計算され、staleな集計を拒否する。

DirectionがHuman-approvedでない間はPlanを`ready`にできない。現在のTeam Invitationは推奨Directionを使ったpreviewであり、12 / 12 Product Requirementを9 Capability Requirementでカバーするが、Design Owner approval待ちのため`blocked`である。

### Adapter Registry

Adapterはversion、project / external区分、priority、availability、eligibility、source、token strategy、Capability bindingを持つ。Resolverが使えるのは、Project Adapterでは`available + project-existing`、External Adapterでは`available + approved Human Decision`だけである。

`project-existing-first`によりpriorityの小さいProject Adapterを先に評価する。外部候補をregistryへ追加しても、Human Decisionを持たない`pending`候補はeligibleにならない。現在の`meridian_react_pilot`も同じ理由で使用されない。

### Strict resolver

Resolutionは各Capability Requirementについて次を記録する。

- `resolved`: stable bindingがsemanticとstateをすべて満たす
- `provisional`: 必要能力は満たすがtarget contractが未昇格
- `partial`: bindingはあるが必須semanticまたはstateが不足
- `unresolved`: eligible Adapterにbindingがない
- Adapter ID / version、binding index、resolution kind、target refs
- 不足semanticとstate

`partial`または`unresolved`が1件でもあればGeneration Gateを停止する。Direction approvalがない場合も停止する。`provisional`は境界を隠さずReportへ渡すが、それ自体はCapability不足ではない。

### DTCG Token Mapping and runtime compatibility

Project Adapterの全target contractから必要なCSS custom propertyを収集し、生成済みDTCG bundleのtoken pathへ決定的に対応付ける。Mappingはraw color、dimension、CSS valueを複製せず、次だけを保持する。

- DTCG context fileとSHA-256
- Token pathとeffective type
- CSS output reference
- Theme、Contrast、Densityのmodifier
- 利用するtarget component
- Component contract version、digest、status
- Runtime package version、digest、compatibility range
- Runtime catalog上の実装有無

現在のMeridian HTML Runtimeでは84 output refがすべてDTCG pathへ解決され、unmappedは0である。Theme / Contrast依存Tokenは4 context、Density依存Tokenは3 modeのsource pathを保持する。

ただしcontractの存在だけでは実装済みとみなさない。`packages/html-runtime/src/index.mjs`の実装定義と`design/harness/generated/component-registry.json`のRuntime catalogを照合し、両方に存在しないtargetはCapability Resolutionを`partial`へ戻す。Mappingは実装sourceとcatalog双方のSHA-256も保持する。HTML Runtime 0.2.0では`dialog`、`description-list`、`workflow-step`を追加し、現在の12 targetはすべて実装・catalog収録済みかつcontract range互換である。

## 3. Current Team Invitation result

| Result | Count |
|---|---:|
| Total Capability Requirements | 9 |
| Stable resolved | 0 |
| Provisional | 9 |
| Partial | 0 |
| Unresolved | 0 |

全Capabilityには`meridian_html_runtime` bindingがあり、Token output、Runtime target、version compatibilityの欠落はない。9件は必要能力を満たすがtarget contractがdraftのため`provisional`である。Directionも未承認であり、draft targetをAIが自動昇格させることはないため、Generation GateはHuman Decisionと正式なpromotion evidenceが揃うまで停止する。

## 4. Switching and reproducibility

`resolveCapabilityPlan(plan, registry, { adapterRefs })`へ承認済みAdapter IDを渡すと、Planを変更せず再解決できる。`compareAdapterResolutions`はRequirementごとにstatus、Adapter、resolution kind、targetの差を返す。

生成結果はCapability PlanとAdapter RegistryのSHA-256へbindingされる。`npm run check:adapter-resolution`は同じ入力と固定時刻から再生成し、手修正またはstale outputを拒否する。

## 5. Remaining M5 work

- M4でHuman-approvedになったReference External Adapterの正式binding
- `provisional` targetの昇格・例外Decision binding
- Adapter差分Reportの永続artifact schema
- Issue Triage正式Capability Planによるdata-intensive再解決

これらが揃うまでM5 Formal exitにはしない。次のM6 Generatorは、Generation Gateが`pass`したAdapter Resolutionだけを入力として受け取る。

## 6. Verification

```sh
npm run generate:adapter-resolution
npm run generate:adapter-token-mapping
npm run check:adapter-token-mapping
npm run check:adapter-resolution
node --test test/adapter-token-mapping.test.js test/capability-resolution.test.js
npm run validate:system
npm run check:system
```
