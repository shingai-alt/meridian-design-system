# Component Specification Workflow

この文書は、Meridian のコンポーネントを誰がいつ更新しても同じ品質で進められるようにするための作業手順です。全体の親workflowは `docs/system/refinement-workflow.md` で、この手順はそのComponents phaseを詳しくしたものです。

目的は、`components/*.md`、`design/contracts/components/*.contract.json`、HTML docs の3つを同じ設計判断に揃えることです。

## Source Roles

| Source | Role |
|---|---|
| `components/*.md` | 人間と AI が読む設計仕様。判断、使い方、禁止事項、PC/SP/touch の振る舞いを決める。 |
| `design/contracts/components/*.contract.json` | AI、lint、将来の renderer が読む機械可読 contract。md で決めた判断を構造化する。 |
| `design/token-policy.json` | Semanticを直接使う条件と、Component tokenへ昇格する条件。 |
| `design/research-policy.json` | Component reviewで調査を必須にする条件、source優先順位、evidence要件。 |
| `design/reviews/components.*.review.json` | 読んだsource、判断、差分、検証、上流への影響を残すreview record。 |
| `js/components-registry.js` | HTML docs に表示する要約、Playground 設定、Usage patterns、表示サンプル。 |
| `index.html` / `js/ui-builders.js` | 実際に見える HTML/CSS のショーケース実装。 |
| `js/component-pages.js` | 全コンポーネントページの表示テンプレート。新しい共通セクションを出す場所。 |

原則として、設計判断は md で決め、contract JSON と HTML docs はその判断に同期します。

## One-Pass Workflow

### 0. Select A Ready Component

```sh
npm run refine:status
```

`design/system-registry.json`で対象の`dependsOn`と`sources`を確認します。上流のFoundationやTokenが未確定なら、Component内の例外として閉じず、対応itemをreview recordへ残します。

### 1. Read Current Sources

対象コンポーネントについて、最低限次を確認します。

```sh
sed -n '1,260p' components/<component>.md
sed -n '<relevant-range>p' js/components-registry.js
sed -n '<relevant-range>p' index.html
sed -n '<relevant-range>p' js/ui-builders.js
sed -n '1,260p' design/contracts/components/<component>.contract.json
```

まだ md や contract がない場合は、`components/_template.md` と `design/contracts/components/_template.contract.json` から作ります。

### 2. Research Gate

`design/research-policy.json`の全体triggerに加え、Componentでは次を必ず評価します。

- WAI-ARIA APGやnative HTMLに既知のpatternがあるか
- keyboard、focus、accessible name、target sizeに外部基準があるか
- iOS / Android / touchで別のplatform conventionがあるか
- 類似componentとの選択境界を成熟したdesign systemと比較すべきか
- 新しいvariant、state、prop、polymorphic APIを導入するか

最初に`research.scope`へcomponent item IDと確認範囲を記録します。調査した場合はreview recordの`research.evidence`からdecision IDへ結びます。調査不要の場合もscopeに即した`notRequiredReason`を必須にします。

### 3. Improve The MD First

`components/*.md` は設計判断を確定する場所です。単に既存 HTML を説明するのではなく、現在の見た目や挙動が良いかもここで見直します。

必ず確認する観点:

- 責務が1文で説明できるか
- いつ使うか / 使わないかが似た部品と区別できるか
- Visual Model が明確か
- variant / size / state が用途で説明されているか
- PC / SP / touch の違いが `Responsive / Viewport Behavior` に書かれているか
- Accessibility と keyboard が初期条件になっているか
- AI が選ぶ条件、避ける条件が書かれているか
- Open Questions が残っている場合、何を決めれば stable になるか分かるか

### 4. Review The HTML Visually

HTML docs は「読む仕様書」ではなく、md の判断が視覚的に成立しているか確認する場所です。

確認すること:

- Playground が壊れていないか
- Variants / Sizes / States が md の判断と一致しているか
- Usage patterns がコンポーネントの実際の使い方を示しているか
- PC / SP / touch の振る舞いが HTML 上でも確認できるか
- token 違反、アクセシビリティ違反、意味の薄い装飾がないか

### 5. Classify Differences

md と HTML に差分があったら、次のどれかに分類します。

| Difference | Action |
|---|---|
| md の判断が浅い / 間違っている | md を直す |
| HTML が古い | `js/components-registry.js`、`index.html`、`js/ui-builders.js` を直す |
| 表示テンプレートが足りない | `js/component-pages.js` に共通セクションを追加する |
| token が足りない | `design/token-policy.json`でownerとlayerを判定し、上流itemをreview recordへ残す |
| contract が同期していない | 最後に contract JSON を更新する |
| コンポーネント設計が未確定 | Open Questions に残し、stable にしない |

### 6. Update HTML Docs

HTML には md の全文を載せません。表示するのは、見て判断できる情報に絞ります。

HTML に載せるべきもの:

- Summary
- Playground
- Usage patterns
- Variants
- Sizes
- States
- Props / API
- Design tokens
- Accessibility
- Keyboard interaction
- Do / Don't
- Responsive behavior
- Related components

HTML に載せすぎないもの:

- 長い設計思想
- 全ての禁止事項の詳細
- AI 向け判断の全文
- 未確定議論の長いメモ

### 7. Sync The Contract JSON

md と HTML の判断がまとまってから、contract JSON を同期します。

contract に入れるべきもの:

- `intent`
- `anatomy`
- `variants`
- `sizes`
- `states`
- `props`
- `tokenRefs`
- `tokenBindings` (`coverage` / `bindings` / `unboundSlots`)
- `accessibility`
- `keyboardInteractions`
- `usagePatterns`
- `responsiveBehavior`
- `rules`
- `qualityChecks`
- `examples`
- `openQuestions`

contract JSON は、AI とツールが迷わないように短く構造化します。長い説明は md に残します。`status: stable`にするには`tokenBindings.coverage: complete`かつ`unboundSlots: []`が必要です。

md、contract、HTMLを更新したら、台帳、実装token依存、HTML表示用metaをこの順で同期します。

```sh
npm run sync:component-registry
npm run sync:component-tokens
npm run build:component-meta
```

`sync:component-tokens`は全variant / stateのHTML showcaseを実際にrenderし、`var(--*)`参照を`tokenRefs`と`tokenBindings`へ戻します。自動追加されたbindingも設計判断なしで確定扱いにせず、Component tokenへの昇格条件がないことをreviewで確認します。

### 8. Validate

全体検証は次の1コマンドを必須にします。

```sh
npm run check:system
```

変更範囲に応じて、対象mdのlintとJS構文確認も実行します。

```sh
npm run design:lint -- components/<component>.md
node --check js/components-registry.js
node --check js/component-pages.js
```

HTML を更新した場合は、Playwright screenshot などで対象ページを確認します。

```sh
node --test test/component-specs.test.js
```

このtestは74件の全variant / stateをrenderし、空表示、壊れたタグ、raw color、未命名icon action、未宣言token依存と、既知の複合ARIA patternを検査します。利用環境でブラウザ操作が可能な場合は、加えてDesktop / Mobileのviewport、Light / Dark、Standard / High contrast、3 densityを目視確認します。ブラウザ操作が使えない場合も構造検査を省略せず、視覚確認を未実施としてreview recordへ明記します。

既存 JS ファイル全体に `design:lint` をかけると、古い inline style の違反も拾うことがあります。その場合は、今回の差分なのか既存負債なのかを分けて報告します。

### 9. Close The Review Record

`design/reviews/_template.review.json`を元に、新しいcycle専用の`design/reviews/components.<component>.<cycle-id>.review.json`へ次を残します。既存recordは上書きせず、`supersedesCycleId`で前回cycleへつなぎ、`design/system-registry.json`の`reviewRecord`を新しいファイルへ更新します。

- 確定した判断と根拠
- Research Gateのscope、判定、evidence、synthesis、decision impact
- 差分分類と解決状況
- 変更ファイル
- 実行した検証と視覚確認
- 未解決事項のownerとexit criteria
- 今回取り込んだ上流reviewのcycle ID (`acknowledgedImpacts`)
- 影響するFoundation / Token / Component
- 次に着手するitem

最後に`npm run refine:status`を再実行し、queueが進んだことを確認します。

## Done Criteria

対象コンポーネントを「一周できた」と言える条件:

- md がテンプレート構成に沿っている
- HTML docs が md の主要判断を視覚的に確認できる
- contract JSON が md / HTML の判断と同期している
- 全visual slotが`tokenBindings.bindings`または`unboundSlots`に記録されている
- HTML showcaseが実際に参照する全tokenが`tokenRefs`と`tokenBindings`に記録されている
- `status: stable`の場合はtoken binding coverageがcompleteである
- `Responsive / Viewport Behavior` が PC / SP / touch を分けて説明している
- Open Questions が残っている場合、未確定として明示されている
- review recordに決定、差分、検証、影響先が記録されている
- Research Gateが`complete`または理由付き`not-required`で閉じている
- `npm run check:system`と対象範囲のlint / syntax checkが通っている
- ブラウザ目視確認の実施状況がreview recordに記録され、未実施なら理由と残存riskが明記されている

## Recommended Rollout Order

1. Button
2. Text Field
3. Form Field
4. Select
5. Dialog
6. Badge
7. Alert
8. Tabs
9. Table
10. Sidebar / Top Bar

完全な順序と依存関係は`design/system-registry.json`を唯一の台帳とします。まずコア数個でテンプレートの使いやすさを検証してから、Forms、Feedback、Navigation、Data Display、SaaS、AI & Developer の順に広げます。
