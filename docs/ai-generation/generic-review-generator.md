# Generic Review UI Generator

## Status

M6の汎用生成基盤は実装済みである。本番Team InvitationはHuman Gateが未承認のため生成不可、独立PilotのIssue Triageは明示的なtest fixtureとして生成・回帰検証できる。

## Canonical artifacts

- Generation Manifest schema: `schemas/generation-manifest.schema.json`
- Layout Recipe schema: `schemas/layout-recipe-registry.schema.json`
- Named recipes: `design/layout-recipe-registry.json`
- Semantic gate: `scripts/lib/generic-generation.mjs`
- Compiler: `scripts/lib/generic-review-compiler.mjs`
- Generic renderer: `scripts/lib/generic-review-renderer.mjs`
- CLI: `scripts/generate-generic-review.mjs`
- Blocked production pilot: `examples/ui-generation/team-invitation.generation-manifest.json`
- Ready synthetic pilot: `test/fixtures/ui-generation/issue-triage.generation-manifest.json`

## Input boundary

Generation Manifestは次の6 sourceをrepository-relative pathとSHA-256 digestで固定する。

1. Adapter Resolution
2. Screen Responsibilities
3. Pattern Selection
4. Direction Set
5. Layout Recipe Registry
6. Component Registry

Production生成には`meta.status: ready`、Adapter Resolutionの`generationGate.status: pass`、Human-approved Direction Setが必要である。CLIは最初にdisk上のsource digestを検証し、失敗時には出力を一つも書かない。fixture source overrideは単体テスト内部に限り、本番Manifestでは拒否する。

Manifestの`directionRef`はDirection Setに存在し、ready時にはHuman Approvalの`selectedDirectionRef`と一致しなければならない。本番ではactor、role、decision、Direction Set digestまで一致させる。

`visualProfileRef`は、外部Design System Adapterとは独立した表示方針を明示する。標準Profileは`Calm Utility`、運用キュー向けの`Dense Operations`、創作・探索向けの`Expressive Workspace`である。Profileは密度・リズム・強調度だけを変更し、承認済みの責務、画面境界、DOM順序、Pattern、Component capabilityを変更してはならない。暗黙のdefault適用を避けるため、Generation Manifestで常に明示する。

## Generic model

Manifestはraw HTML、raw CSS、script、class名、raw token、色値、寸法値を持たない。構造は以下だけで表現する。

- semantic heading / text
- Library非依存Capability Requirement
- Capabilityに対応する型付きpresentation
- Named Layout Recipeと許可済みoption
- decisionRef

CompilerはStrict Resolutionの`targetRefs`をComponent Usageへ展開する。各instanceにはComponent、contract version、allowed variants / states、decisionRefを記録する。Review Model、Usage Manifest、runtime compositionは同じinstance ID集合を持たなければならない。

## State and responsive review

全ManifestはDefault、Loading、Empty、Error、Permissionをexactly onceで持ち、desktop、tablet、mobileをexactly onceで持つ。Review UIのtoolbarからScreen、State、Viewportを切り替える。State選択肢はfixtureの`screenRefs`に従ってScreenごとに絞り込む。DOM task orderは維持し、狭幅ではNamed Recipeのlayoutだけを変える。Gridの`collapse-at`とResponsive Switchの`breakpoint`、`wide-layout`、`narrow-layout`は許可値とCSS挙動を一致させる。

Issue Triageでは以下をBrowser上で確認した。

- Default: filter、status evidence、actions
- Loading: `aria-busy`とrunning status
- Empty: empty tableと明示的empty message
- Error: invalid field、error status、unsafe row actionの無効化
- Permission: inputとactionsの無効化、warning status
- tablet / mobile: viewport属性の切替、document-level horizontal overflowなし
- console error / warningなし

## Commands

```sh
npm run generate:generic-review
npm run check:generic-review
node --test test/generic-generation.test.js
```

任意Manifestは次の形式で指定する。

```sh
node scripts/generate-generic-review.mjs path/to/example.generation-manifest.json
node scripts/generate-generic-review.mjs path/to/example.generation-manifest.json --check
```

## Human Gate boundary

Issue Triageのapprovalは`synthetic-test-fixture-only`であり、本番承認へ転用できない。Team InvitationのDirection、Reference Adapter、Project Config、Design BriefはHuman承認までblockedのままである。GeneratorはComponent、Pattern、Design Systemを自動promotionしない。
