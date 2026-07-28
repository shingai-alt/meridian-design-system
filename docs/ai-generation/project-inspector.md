# Meridian Project Inspector 0.1

- Status: Implementation spike complete; configuration decision awaiting Human Approval
- Configuration: `meridian.design.json`
- Configuration schema: `schemas/meridian-design-config.schema.json`
- Project Context schema: `schemas/project-context.schema.json`
- Inspector: `scripts/lib/project-inspector.mjs`
- Generated fixture: `examples/ui-generation/meridian.project-context.json`
- Research Decision: `design/research-decisions/ui-generation-project-config.research.json`

## Purpose

Project Inspectorは、対象Projectがすでに持つFramework、runtime、styling、tokens、themes、components、forms、tables、icons、catalog、Design System adapter候補を、後続のUI生成が検証できるProject Contextへ変換する。

明示設定を最優先し、未指定項目だけをpackage manifestとsource evidenceから推測する。明示設定と推測結果を同じ確度で扱わない。

## Configuration boundary

実装Spikeでは、次の3候補を同じ基準で比較した。

| Candidate | Main result |
|---|---|
| Dedicated `meridian.design.json` | Strict schema、標準JSON parser、package metadataとの責務分離を同時に満たす |
| Custom `package.json` field | 追加parserは不要だが、package publication・module semanticsとUI Generation ownershipが混在する |
| Dedicated YAML | 人間には簡潔だが、現在のNode runtimeへparser dependencyと別serialization boundaryを追加する |

推奨はDedicated JSON sidecarである。ただしResearch Decisionは`decision-ready`であり、Human Approval前はstable public contractとして扱わない。

根拠となる一次資料：

- JSON Schema Draft 2020-12: `https://json-schema.org/draft/2020-12`
- Node.js package metadata: `https://nodejs.org/api/packages.html`
- npm package.json: `https://docs.npmjs.com/files/package.json/`
- YAML 1.2.2: `https://yaml.org/spec/1.2.2/`
- DTCG Format 2025.10: `https://www.designtokens.org/tr/2025.10/format/`

## Evidence model

Project Contextのfindingは次を必須とする。

- category
- values
- `explicit`または`inferred`
- confidence
- 1件以上のrepository-relative evidence path
- evidence source type
- observation

`explicit` findingのconfidenceは`1`でなければならない。`inferred` findingはcertaintyを主張できない。Evidence pathが存在しない推測はvalidationで拒否する。

設定が`auto`を指定した場合、Inspectorはpackage dependenciesとsource extensionから候補を推測する。検出不能な場合は値を作らず、blockingな`unresolved`を生成する。

## Project-existing-first

Adapter selectionは次の順序で決定する。

1. Evidenceが揃った`available`なProject Adapter
2. Evidenceが揃った`available`なExternal Adapter
3. 解決不能として`selectedAdapterId: null`

外部Adapterの数値priorityが高くても、availableなProject Adapterを上書きできない。`candidate`、`disabled`、source欠落のAdapterは選択対象にならない。

Meridian自身のinspection結果：

- Selected: `meridian_html_runtime`
- Project candidate: `meridian_react_pilot`
- Token format: `dtcg-2025.10`
- Theme modes: Light / Dark
- Contrast modes: Standard / High
- Density modes: Compact / Default / Comfortable
- Required viewports: Desktop / Tablet / Mobile
- Required states: Default / Loading / Empty / Error / Permission

## Determinism and safety

- ConfigとEvidence pathはProject root外へ出られない。
- Configured sourceが存在しなければConfig validationを失敗させる。
- Project ContextはConfig SHA-256 digestを保持する。
- Config変更後にProject Contextを再生成していなければ`check:project`を失敗させる。
- Inspector出力は同じConfigとProject sourceに対してbyte-deterministicである。
- `npm run inspect:project`で生成し、`npm run check:project`でstalenessを検証する。

## Current gate

Implementation Spikeと比較評価は完了しているが、Config DecisionのHuman Approvalが未完了である。このためReference SessionはProject Contextを保持しているものの、`inspect_project` transitionをopen Research Blockerで停止している。
