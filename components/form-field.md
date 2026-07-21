# Form Field

## Summary

ラベル・コントロール・ヘルプ・エラーを束ねるレイアウトプリミティブ。

Machine-readable contract: `design/contracts/components/form-field.contract.json`

## Role

Forms領域でForm Fieldの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- すべてのフォームコントロールの配置

## When Not To Use

- 表示だけのlabel/value対にはDescription Listを使う。

## Visual Model

Semantic display root. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Semantic display root. |
| content | Yes | Primary perceivable content. |
| supporting | No | Optional metadata or visual reinforcement. |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | 標準文脈。 | 意味を変えずに見た目だけを増やさない。 |

## Sizes / Density

| Size | Token | Typical use |
|---|---|---|
| Dedicated size propなし | Density token | 周辺layoutのdensityに従う。 |

Compact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。

## Icon Rules

このcomponentは必須のicon slotを持ちません。追加する場合も情報をiconだけへ閉じ込めません。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。意味、label、valueを省略しない。 |
| `error` | 色だけでなくmessageとaria stateで問題を伝える。 |

## Behavior

- ラベル → コントロール → ヘルプ/エラー の縦順を固定する。
- 必須マークは * とし、フォーム冒頭で意味を説明する。
- エラー発生時はヘルプをエラーに置き換え、二重表示しない。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- 意味とDOM順を変えず、wrapとavailable widthで適応する。

## Responsive / Viewport Behavior

### Desktop

- Contentと周辺layoutに応じたintrinsic sizeを使う。
- Viewportだけを理由にdensityを変更しない。

### Mobile

- 意味とDOM順を変えず、wrapとavailable widthで適応する。
- 省略した情報へ別経路から到達できるようにする。

### Touch

- 表示専用rootをtab順へ追加しない。
- 内包する操作がある場合だけ、その操作targetを24px minimum、主要touch操作を原則44px以上にする。

## Accessibility

- label / aria-describedby / aria-invalid の関連付けを一元管理する
- 表示専用rootを不要にtab順へ追加しない。
- 状態は色だけで表さずtext、icon、shapeを併用する。
- Native semanticsを優先し、ARIAは不足する関係と状態だけを補う。
- Nested controlがある場合だけ、そのcontrolがfocusを受け取る。

Keyboard:

- Component root固有のkeyboard interactionは持たない。Nested controlは各componentのcontractに従う。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--surface`, `--border`, `--fg`, `--fg-muted`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Form Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Form Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Form Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Form Fieldの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<FormField label="API キー名" required error={errors.name}>
  <TextField placeholder="production-key" />
  <FormField.Help>用途が分かる名前を付けてください。</FormField.Help>
</FormField>
```

Don't:

```tsx
{/* 表示だけのlabel/value対にはDescription Listを使う。 */}
<FormField />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- すべてのフォームコントロールの配置

AIが避ける条件:

- 表示だけのlabel/value対にはDescription Listを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<FormField label="API キー名" required error={errors.name}>
  <TextField placeholder="production-key" />
  <FormField.Help>用途が分かる名前を付けてください。</FormField.Help>
</FormField>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
