# Meridian AI Component Index

- Translation Pack: `sha256-543b8641662656715407ff1cd9ab3d599e8a14aa54ac0ba32c558148b755fa84`
- Runtime: `0.1.0`
- Generated from Contract, Token policy, and Accessibility policy. Do not edit.

## Button `button`

- Status: draft
- Contract: 0.2.0
- Source: `design/contracts/components/button.contract.json`
- Source digest: `sha256-33a67f96b1c8cf06d1f1753a74a4c4bbd4f182a8acd027952796fa71daa5651a`
- Variants: primary, secondary, tertiary, ghost, danger
- States: default, hover, active, focus, disabled, loading
- Sizes: xs, sm, md, lg, xl
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: default, disabled, loading, focus, primary, secondary, tertiary, ghost, danger, with-leading-icon, with-trailing-icon, full-width, form-submit

Use when:
- フォームを送信する。
- 設定変更を保存する。
- 新しいリソースを作成する。
- ダイアログ内で操作を確定またはキャンセルする。
- テーブル行やツールバーで補助操作を実行する。
- 削除、権限変更、取り消し不能な操作を明示する。

Avoid when:
- ページ遷移や外部参照だけが目的の場合は Link を使う。
- 2 から 4 個の表示モードを切り替える場合は Segmented Control を使う。
- 複数の排他選択肢を提示する場合は Radio Group を使う。
- 即時反映する設定の ON/OFF は Switch を使う。
- アイコンだけで意味が明確な補助操作は Icon Button を使う。
- ただ目立たせたいだけのテキストやラベルには使わない。

Negative examples:
- 未登録variantや独自classでButtonを強調する。 — action hierarchyとToken bindingを迂回するため。 (NO_RAW_HEX_COLOR)
- 可視ラベルなしのButtonを作る。 — Icon-only actionの責務をIcon Buttonから奪い、音声入力と認知上の手掛かりを弱めるため。 (FOCUS_VISIBLE_REQUIRED)

Accessibility:
- native button 要素を既定にする
- 操作結果を予測できる可視ラベルを必須にし、アイコンだけの操作はIcon Buttonを使う
- loading 中もラベルnode、accessible name、Button幅を失わず、handler側でも再実行を防ぐ
- 色だけで danger の意味を伝えない
- 操作targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする

## Text Field `text-field`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/text-field.contract.json`
- Source digest: `sha256-295408ed9d748a7ff13e7fd8f7b52db74f01290ae2bfeccdfa964a3c5bd7be03`
- Variants: default
- States: default, hover, focus, error, disabled, readonly
- Sizes: sm, md, lg
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: default, error, disabled, readonly, focus

Use when:
- 短い自由入力(名前・URL・メール)

Avoid when:
- 長文 → Textarea
- 限られた選択肢 → Select / Radio

Negative examples:
- labelをplaceholderだけで代用する。 — 入力後にaccessible labelが失われるため。 (INTERACTIVE_NAME_REQUIRED)

Accessibility:
- label 要素と htmlFor で関連付ける
- エラーは aria-describedby + aria-invalid で通知する
- focus ring はコントラスト比 3:1 以上
- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。

## Select `select`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/select.contract.json`
- Source digest: `sha256-c23aebeb937531580b78c7824ede5265ab520e1334e55ecbeaffabb5c16de465`
- Variants: default
- States: default, focus, error, disabled
- Sizes: sm, md, lg
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: default, error, disabled, focus

Use when:
- 選択肢が 5 個以上で 1 つだけ選ぶ

Avoid when:
- 4 個以下 → Radio / Segmented Control
- 検索が必要な多数の選択肢 → Combobox

Negative examples:
- native selectをdivとclick handlerで再実装する。 — keyboardとname/value semanticsを失うため。 (INTERACTIVE_NAME_REQUIRED)

Accessibility:
- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。

## Form Field `form-field`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/form-field.contract.json`
- Source digest: `sha256-6d4e90d69b4d1d23d431494e57b0d9b8d6a37ee38c63baba4df956905ee25228`
- Variants: default
- States: default, error
- Sizes: none
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: default, error, labelledby, describedby

Use when:
- すべてのフォームコントロールの配置

Avoid when:
- 表示だけのlabel/value対にはDescription Listを使う。

Negative examples:
- error messageをcontrolとIDで関連付けない。 — 支援技術が入力エラーを特定できないため。 (INTERACTIVE_NAME_REQUIRED)

Accessibility:
- label / aria-describedby / aria-invalid の関連付けを一元管理する
- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。

## Validation Message `validation-message`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/validation-message.contract.json`
- Source digest: `sha256-9bd8e87486735307b3f8341f3e6b85edd450ce2e9cdb7a0e44a5df3030062066`
- Variants: error, success, warning
- States: default
- Sizes: none
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: error, warning, success, describedby

Use when:
- フィールド単位の検証結果

Avoid when:
- フォーム全体・API 起因のエラー → Alert

Negative examples:
- border色だけで入力エラーを示す。 — 状態が色だけに依存するため。 (STATE_NOT_COLOR_ONLY)

Accessibility:
- role="alert" または aria-live="polite" で通知する
- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。

## Checkbox `checkbox`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/checkbox.contract.json`
- Source digest: `sha256-1709689ff5bab3533c360a492c463a810dd5df7df73a6f41682b3068bacc6934`
- Variants: default
- States: default, checked, disabled
- Sizes: none
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: default, checked, disabled, focus

Use when:
- 複数選択リスト
- 利用規約への同意

Avoid when:
- 即時に反映されるトグル → Switch
- 排他選択 → Radio

Negative examples:
- visible labelのないcheckboxを出力する。 — 操作の目的を識別できないため。 (INTERACTIVE_NAME_REQUIRED)

Accessibility:
- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。

## Alert `alert`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/alert.contract.json`
- Source digest: `sha256-149c310306e8bec9115ac31c77cc3cdbbb1693aa91404637d3afd461537d068c`
- Variants: info, success, warning, danger
- States: default
- Sizes: none
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: info, success, warning, danger, labelledby

Use when:
- フォーム全体のエラー
- セクションに関する注意・状態

Avoid when:
- 一時的な操作結果 → Toast
- サイト全体のお知らせ → Banner

Negative examples:
- 任意のHTML文字列をAlert bodyへ挿入する。 — Contract外DOMとinjectionを許すため。 (NO_RAW_HEX_COLOR)

Accessibility:
- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。

## Status Indicator `status-indicator`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/status-indicator.contract.json`
- Source digest: `sha256-25d69eee9af012c2e597776efc0269ae7d603edcb1106835b90a164639efebce`
- Variants: success, running, warning, error, idle
- States: default
- Sizes: none
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: success, running, warning, error, idle

Use when:
- 稼働、接続、実行など短いresource状態を反復表示するとき。

Avoid when:
- 説明や回復actionが必要な状態にはAlertを使う。

Negative examples:
- 色ドットだけでstatusを示す。 — 状態が色だけに依存するため。 (STATE_NOT_COLOR_ONLY)

Accessibility:
- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。

## Table `table`

- Status: draft
- Contract: 0.1.0
- Source: `design/contracts/components/table.contract.json`
- Source digest: `sha256-b6ca0a72a8bd9cc995a8a02fa070f2362504f7ffd9a9a0813ea8e394db3579b9`
- Variants: default
- States: default, selected, loading, empty
- Sizes: none
- Runtime compatibility: >=0.1.0 <1.0.0
- Pilot scope: team-invitation
- Required scenarios: default, loading, empty, caption, column-headers, mobile-reflow

Use when:
- 属性を比較しながら走査する一覧

Avoid when:
- カード的な閲覧が主 → Card grid
- 編集・仮想スクロールが必要 → Data Grid

Negative examples:
- divだけでtable visualを再現する。 — captionとheader relationを失うため。 (INTERACTIVE_NAME_REQUIRED)

Accessibility:
- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。
