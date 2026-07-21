# Meridian Design System 102項目ブラッシュアップ実施レポート

- 報告日: 2026-07-14
- 主な作業日: 2026-07-13 - 2026-07-14
- 対象: Overview 6項目、Foundations 10項目、Tokens 12項目、Components 74項目
- 台帳: `design/system-registry.json`
- 結果: 102 / 102項目の初回ブラッシュアップサイクル完了

## まず結論

Meridianに登録されている102項目すべてについて、現在の文書・JSON・HTML・CSS・JavaScript・生成物を確認し、判断を記録し、必要な更新を行い、検証まで終えました。

今回完成したのは、次の2つです。

1. OverviewからComponentsまでを一貫した基準で改善するための土台
2. 102項目すべてに対する最初の実レビューと更新

一方で、これは「Reactコンポーネントライブラリまで製品として完成した」という意味ではありません。現在の74コンポーネントcontractは、今後のReact実装や完全なtoken bindingを受け止められる`draft`です。今回の完了は「現状を確認せず機械的にチェックを付けた」のではなく、「今ある設計システムを一周レビューし、次の実装へ進める状態にした」という意味です。

## 現在地

| Domain | 対象数 | 完了 | 再レビュー待ち | Research pending |
|---|---:|---:|---:|---:|
| Overview | 6 | 6 | 0 | 0 |
| Foundations | 10 | 10 | 0 | 0 |
| Tokens | 12 | 12 | 0 | 0 |
| Components | 74 | 74 | 0 | 0 |
| 合計 | 102 | 102 | 0 | 0 |

最新reviewのResearch Gateは、外部調査を実施したものが47件、対象固有の理由を記録して調査不要と判断したものが55件、保留が0件です。

review cycleは108件あります。102項目の初回cycleに加え、Buttonのpilot後の再レビューが1件、後続変更の影響を受けたColor、Elevation、Accessibility、Token Overview、Theme Tokensのfollow-upが5件あるためです。過去の判断は削除せず、最新cycleから前回cycleへたどれる追記型の履歴にしています。

## 何が問題だったか

着手前は、HTMLのドキュメント、設計方針、token、コンポーネント例が存在していても、次の点が十分ではありませんでした。

- 誰が何を正本として直すのかが一意ではない
- md、contract JSON、HTMLの内容差を継続検出できない
- Overviewの判断がFoundation、Token、Componentへどう伝わるか追えない
- PC用とSP用を別部品にするか、同じ部品を適応させるかの共通方針がない
- Component tokenを作る条件が人やAIにとって曖昧
- 外部調査が必要な場面と、根拠の残し方が統一されていない
- 「レビューを終えた」と「実装がstableになった」が混同されやすい
- 生成物の古さ、未定義token参照、アクセシビリティ構造の欠落をまとめて検査できない

そこで、個別ページだけを直すのではなく、今後も同じ手順で回せる仕組みを先に整え、その仕組みを使って102項目を一周しました。

## 作った改善ループ

改善は次の順序で行います。

```text
Overviewの目的と判断
  -> Foundationsの設計原則
  -> Tokensの機械可読な値とalias
  -> Componentsのmd / contract / HTML
  -> 生成物と実装
  -> 検証とreview record
  -> 影響を受けた上位・下位項目を再レビュー
```

中心となる仕組みは次の通りです。

| 仕組み | 役割 |
|---|---|
| `design/system-registry.json` | 102項目、順序、依存関係、読むsource、route、最新reviewを管理する唯一の台帳 |
| `design/reviews/*.review.json` | 読んだもの、調査、判断、差分、変更、検証、影響先をcycleごとに保存 |
| `design/research-policy.json` | いつ調査するか、一次資料をどう扱うか、調査不要をどう説明するかを規定 |
| `design/token-policy.json` | Reference、Semantic、Component token、modifier、bindingの所有ルールを規定 |
| `docs/system/refinement-workflow.md` | 全Domain共通の作業手順と完了条件 |
| `docs/system/templates/*.md` | Overview、Foundation、Token、Componentごとの確認テンプレート |
| `docs/components/spec-workflow.md` | md、contract、HTMLを同期するComponent専用手順 |

下流の変更が完了済み項目へ影響した場合、台帳はその項目を自動的に`needs-review`へ戻します。今回も5項目が実際にqueueへ戻り、follow-up cycleで影響確認を終えてから102 / 102へ戻しました。

## Overview 6項目

| 項目 | 主な整理内容 |
|---|---|
| Introduction | SaaSなどの業務ツールから消費者向けアプリまでを対象とすること、AI-readyな設計仕様を持つこと、React packageは今後追加することを明示 |
| Principles | 既存の7原則を維持し、各原則に判断基準、Red flags、Related rules、AI・contract・docsへの適用を追加 |
| Getting Started | 未提供機能を利用可能に見せず、現在使える成果物から始めるDesigner・Engineer別の導線へ変更 |
| System Architecture | inputと3つのtoken layer、直交するmodifier、bindingを先に検討するComponent token昇格ルールへ整理 |
| For Designers | 現在の成果物を前提に、設計開始、token選択、responsive判断、handoffまでを実務フロー化 |
| For Engineers | 現在提供しているCSS・JSON・contractと将来のReact APIを分け、contract-firstの実装順序を明示 |

大きな判断は、将来像と現在使えるものを分けたことです。React packageは目標に含めていますが、現時点で存在するようには記述していません。

## Foundations 10項目

| 項目 | 主な整理内容 |
|---|---|
| Color | OKLCHを使う生成境界、Light / Dark x Standard / Highの4 context、Semantic roleの安定性、組み合わせ単位のcontrast検証を整理 |
| Typography | 17のSemantic roleを正本化し、UI本文と長文Readingを分離、行長、density非依存、letter-spacing 0の原則を追加 |
| Spacing | 4pxを基本とする16段scale、用途metadata、Semantic優先、densityとviewportの分離、target clearanceを整理 |
| Layout | shell、content、overlayの幅とpaddingをtoken化し、content-driven breakpoint、reflow、局所overflow、PC/SP共通contractを規定 |
| Radius | 9段scale、静的Card・Panelの8px上限、roleによる大きなradius、nested radiusの順序を規定 |
| Elevation | shadow geometryをtheme間で固定し、色とalphaをtheme所有に分離、High contrastではborderを維持、静的Cardのshadowを禁止 |
| Motion | duration、easing、distanceをtyped token化し、reduced motionを単なる短縮ではなく代替表現として定義 |
| Iconography | 33 glyphの機械可読registry、size、意味、accessible nameの所有、選択的RTL mirroringを整備 |
| Accessibility | WCAG 2.2を基準とし、4 context、keyboard、focus、name、status、24px最小targetと44px touch preferenceをcontractへ接続 |
| Content Guidelines | voice、23 rules、7 message patterns、12 terms、localization、AIの透明性と制御、5 quality gatesを機械可読化 |

各Foundationは説明ページだけでなく、正本JSON、生成metadata、CSS、AI向け`DESIGN.md`、テストのどこが所有者かを整理しました。

## Tokens 12項目

| 項目 | 主な整理内容 |
|---|---|
| Token Overview | DTCG 2025.10を基準に、Reference、Semantic、Component、modifier、4つのresolved bundleの関係を整理 |
| Color Tokens | 103 Reference、62 Semanticのcatalogと4 contextのpath一致、DTCG sRGB出力、contrast検証を追加 |
| Typography Tokens | 17 roleのcomposite、CSS API、Densityとの所有境界を同期 |
| Spacing Tokens | 16 stepのdimensionとLayout・Density aliasをtyped valueとして同期 |
| Radius Tokens | 9 step、CSS名、用途、8px静的surface上限を同期 |
| Shadow Tokens | 5 levelとtheme-owned color role、transient surfaceのlevel map、静的surface禁止を同期 |
| Motion Tokens | duration、easing、distance、reduced-motion overrideをDTCGとCSSで同期 |
| Component Tokens | 必要な場合だけ作る昇格条件、明示的な例外理由、未使用token拒否、Semantic aliasとの接続を規定 |
| Theme Tokens | ThemeとContrastを別軸にし、Theme -> Contrastの解決順と4 context、forced-colorsとの違いを明示 |
| Density Tokens | Compact / Default / Comfortableをviewportではなく利用文脈で選び、24px最小controlを全modeで保証 |
| CSS Variables | 生成済みCSSを現在の公開CSS contractとし、examplesやdocsの古い変数名を同期 |
| JSON Tokens | 4 context bundle、alias保持、path・type parity、alias型検証、consumer解決手順を整備 |

Component tokenは、Semantic tokenと並べて無制限に増やす設計にはしていません。まずSemantic bindingで表現し、複数variant・stateにまたがる内部slotの契約、独立した変更理由、再利用性など、policyのtriggerを満たしたときだけ昇格させます。

## Components 74項目

74項目すべてに対し、次を実施しました。

1. 既存HTMLとregistryの内容を確認
2. 用途と似た部品との選択境界を判断
3. `components/<id>.md`を共通テンプレートで作成または更新
4. `design/contracts/components/<id>.contract.json`を作成または更新
5. variants、sizes、states、props、keyboard、responsive、Do / Don'tを構造化
6. HTML showcaseの意味構造とtoken参照を修正
7. 全variant・stateを静的renderして検査
8. 項目固有のreview recordを保存

### 対象一覧

| グループ | 完了したコンポーネント |
|---|---|
| 1 - 20 | Button、Text Field、Form Field、Select、Dialog、Badge、Alert、Tabs、Table、Sidebar、Top Bar、Icon Button、Link、Text、Tag、Avatar、Tooltip、Divider、Spinner、Skeleton |
| 21 - 40 | Empty State、Textarea、Combobox、Checkbox、Radio、Switch、Slider、Date Picker、Search Field、Input Group、Validation Message、Breadcrumb、Segmented Control、Pagination、Command Menu、Navigation Item、Product Switcher、Toast、Banner、Drawer |
| 41 - 60 | Popover、Progress、Status Indicator、Data Grid、List、Card、Stat Card、Timeline、Activity Feed、Description List、Code Block、Key Value Row、Prompt Input、Chat Message、AI Response Card、Agent Status、Run Log、Code Diff、File Tree、Model Selector |
| 61 - 74 | Usage Meter、Workflow Step、Execution Timeline、KPI Card、Analytics Chart Container、Settings Panel、Billing Plan Card、User Menu、Notification Center、Invite Member Dialog、Project Card、Issue Row、Task Board Card、Integration Card |

### 横断的に直したこと

- PC用とSP用を別コンポーネントにせず、原則として同じ責務・名前・APIを維持する方針を全contractへ反映
- viewportで変えるのはlayout、表示密度、overlay形式、labelの見せ方などに限定
- native HTMLまたはWAI-ARIA patternに合わせ、label、name、description、role、state、keyboardを明示
- Text Fieldのlabel・error関連、Tabs、Combobox、Dialog、Drawer、File Tree、Menu、Listbox、Tooltip、Switch、Toast、Tableなどの意味構造を修正
- Task Board Cardにpointer操作だけへ依存しないkeyboard move手段を追加
- icon-only actionへaccessible nameを要求
- raw colorをSemantic tokenへ置換し、Cardのradiusとelevation policyを統一
- ButtonとIcon Buttonのtarget表現を24px minimum、touchでは44px preferenceへ統一
- 全showcaseの実装token参照をcontractの`tokenRefs`と`tokenBindings`へ同期

### 現時点のcontract状態

| 指標 | 現在値 | 意味 |
|---|---:|---|
| contract数 | 74 | 全登録componentに機械可読仕様がある |
| `status: draft` | 74 | 設計レビュー済みだがReact packageまでstableではない |
| `tokenBindings.coverage: partial` | 74 | 実装参照は記録済みだが、全visual slotの最終binding確定前 |
| open question | 77 | 主にReact API、binding、visual baselineを確定するための条件 |

`draft`や`partial`を隠して`stable`にしていないことは、今回の重要な成果です。AIが「仕様がある」ことと「本番実装が確定している」ことを区別できます。

## PC・SPの方針

PC用とSP用でコンポーネントを分けるのを標準にはしません。同じ操作目的なら、同じコンポーネントがviewportとinput modalityに適応します。

分ける可能性があるのは、単なる見た目の差ではなく、責務や操作モデルそのものが変わる場合です。たとえばDesktopのPopoverがMobileでDrawerになる場合も、利用者から見た目的が同じなら、まず同じ上位contractのresponsive presentationとして扱います。

全component specにはDesktop、Mobile、Touchの観点を入れました。Densityも画面幅に自動連動させず、業務画面の情報密度やtouch中心などの利用文脈で選びます。

## アクセシビリティ

基準をWCAG 2.2へ揃え、次を文書、contract、HTML、testへ接続しました。

- textとUI componentのcontrast
- keyboard操作とfocus移動
- accessible nameとdescription
- error、status、live region
- focus appearanceとfocusが隠れないこと
- 24 x 24 CSS pxの最小targetと、主要touch操作での44px preference
- Light / Dark x Standard / Highの4 context
- `prefers-reduced-motion`とforced colors

複合widgetはWAI-ARIA APGを参照しつつ、native HTMLで表現できる場合はnativeを優先しています。

## 機械可読性と生成物

今回、AIや将来のtoolingがHTMLだけを推測しなくてもよい構造を整えました。

- component md: 人間とAIが読む設計判断
- component contract JSON: renderer、lint、React実装が読む構造化仕様
- design policy JSON: 原則、アクセシビリティ、content、icon、token、researchの共通ルール
- token source JSON: 値とaliasの正本
- generated metadata: HTML docsが正本から表示するための中間成果物
- review JSON: いつ、何を読み、なぜ決めたかの履歴

生成対象にはToken CSS、4つのDTCG context bundle、Semantic・Typography・Foundation・Iconography・Accessibility・Content・Component metadata、`DESIGN.md`が含まれます。`--check`で再生成差分が出た場合はCIが失敗します。

## 追加した主なコマンド

```sh
npm run refine:status
npm run refine:start -- <item-id>
npm run validate:system
npm run sync:component-registry
npm run sync:component-tokens
npm run build:component-meta
npm run check:system
```

- `refine:status`: 102項目の状態、Research Gate、次に着手できる項目を表示
- `refine:start`: 過去recordを消さず、新しいcycleを開始
- `validate:system`: registry、review、contract、AI specのschemaと依存関係を検証
- `sync:component-registry`: md・contract・HTMLの台帳情報を同期
- `sync:component-tokens`: 全showcaseをrenderし、実際のCSS variable参照をcontractへ同期
- `check:system`: 生成物、schema、JavaScript、全testを一括検証

全項目完了時の`refine:status`は、誤解を招く「ready itemがない」表示ではなく、`All 102 items are complete.`と表示するよう修正しました。

## 検証結果

最終確認で`npm run check:system`は成功しました。

| 検証 | 結果 |
|---|---|
| Registry | 102項目を認識 |
| Review cycles | 108件をschema検証 |
| Component contracts | 74件をschema・metadata同期検証 |
| AI specs | 4件を検証 |
| JavaScript syntax | 45ファイル成功 |
| Automated tests | 105 / 105成功 |
| Token generated outputs | 全て最新 |
| `DESIGN.md` | 正本からの生成結果が最新 |
| Component token re-sync | 0 contracts updated、0 bindings added |
| `git diff --check` | 問題なし |

105 testsには、次の確認が含まれます。

- color変換、palette生成、contrast
- 4 theme・contrast contextのpathとtype一致
- spacing、radius、shadow、motion、typography、densityのsource・CSS・DTCG同期
- 未定義CSS variable参照の検出
- 74 componentのmd・contract完全対応
- 全74 componentの全宣言variant・stateの静的render
- 空render、壊れたtag、raw color、未命名icon actionの検出
- HTMLが使うtokenとcontract宣言の一致
- Tabs、Combobox、Dialog、Tree、Tableなど主要patternの意味関係
- review impactで完了項目をqueueへ戻す処理
- Research Gateとreview schema

## 調査で参照した主な一次資料

- W3C Web Content Accessibility Guidelines 2.2: <https://www.w3.org/TR/WCAG22/>
- W3C Understanding Target Size (Minimum): <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum>
- W3C Understanding Focus Appearance: <https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance>
- W3C Understanding Focus Not Obscured: <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum>
- WAI-ARIA Authoring Practices patterns: <https://www.w3.org/WAI/ARIA/apg/patterns/>
- WHATWG HTML Living Standard: <https://html.spec.whatwg.org/multipage/>
- Design Tokens Community Group Format Module 2025.10: <https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/>
- Design Tokens Community Group Resolver Module 2025.10: <https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/>

一次資料のURL、確認日、要約、支持するdecisionは、該当する`design/reviews/*.review.json`にも保存しています。

## 現在残っていること

### 1. React package

Reactコンポーネント自体はまだ用意していません。今回整えたmdとcontractを入力として、今後package API、型、DOM、event、controlled / uncontrolled、ref forwardingなどを実装します。

### 2. Contractのstable化

74 contractは全て`draft`、token binding coverageは`partial`です。React実装、全visual slotのbinding、visual regression baselineが揃ったものから個別に`stable`へ上げます。

### 3. ブラウザによる全視覚マトリクス

この作業環境のin-app browserでは、ローカル`file://`ページに対する自動操作がセキュリティポリシーで拒否されたため、Desktop / Mobile、Light / Dark、Standard / High、3 Densityのスクリーンショット比較は完了扱いにしていません。

代わりに、74 componentの全variant・stateを実際にHTMLへ静的renderし、構造、token、主要ARIA関係を検証しました。これは表示崩れの全てを保証するものではないため、視覚確認未実施の理由と残存riskを各component reviewへ記録しています。

### 4. 独立した追加レビュー

全自動検証後に別agentによるread-only code reviewも試みましたが、サービスの利用上限により実行できませんでした。この追加レビューを成功したとは扱っていません。ローカルのschema、生成差分、syntax、105 testsは成功しています。

## 次に行う順序

1. 代表componentで視覚確認matrixを確立する
2. Button、Text Field、Select、Dialog、Tabs、TableからReact APIを設計する
3. React実装とcontractを照合し、token bindingをcompleteへ上げる
4. screenshot baselineとinteraction testを追加する
5. 条件を満たしたcomponentだけ`stable`へ昇格する
6. 上流変更が入ったら`refine:start`で次cycleを回す

次回以降はゼロから調査手順を考える必要はありません。`npm run refine:status`で影響を受けた項目を確認し、該当テンプレートから同じloopを開始できます。

## 証跡の読み方

初めてこのプロジェクトを見る人は、次の順に読むと現在地を把握できます。

1. `VISION.md`: Meridianが目指す範囲
2. `DESIGN.md`: AIと実装者が使う集約仕様
3. `docs/system/refinement-workflow.md`: 改善の回し方
4. `design/system-registry.json`: 102項目の台帳と最新review
5. `design/reviews/<item>...review.json`: 項目ごとの判断履歴
6. `components/<component>.md`: 人間向けcomponent仕様
7. `design/contracts/components/<component>.contract.json`: 機械可読component仕様
8. `index.html`: 現在の視覚ドキュメント

## 完了の定義

今回の102 / 102 completeは、各項目について次が揃ったことを表します。

- 対象sourceを確認した
- Research Gateを判断した
- 現在の内容が妥当か判断した
- 差分を分類した
- 必要な文書、policy、token、HTML、実装を更新した
- validation結果を記録した
- 影響先を記録し、未acknowledged impactを残していない

これは各成果物の成熟度を一律に`stable`と宣言するものではありません。レビューの完了、contractの成熟度、実装packageの提供状況を別々に管理できる状態まで整えたことが、今回の最終成果です。
