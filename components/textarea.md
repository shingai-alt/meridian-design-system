# Textarea

## Summary

複数行のテキスト入力。行数の目安を rows で示す。

Machine-readable contract: `design/contracts/components/textarea.contract.json`

## Role

Forms領域でTextareaの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 説明文・コメントなどの長文入力

## When Not To Use

- 1 行で収まる入力 → Text Field

## Visual Model

Control boundary and focus indicator. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Control boundary and focus indicator. |
| control | Yes | Native input or textarea that owns the value. |
| adornment | No | Prefix, suffix, clear, attachment, or submit action. |
| message | No | Help, count, loading, or validation feedback. |

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
| `focus` | focus-visibleで明確なringを表示する。 |
| `error` | 色だけでなくmessageとaria stateで問題を伝える。 |
| `disabled` | 操作不能である理由を周辺文脈から理解できるようにする。 |

## Behavior

- 最大文字数がある場合はカウンタを表示する。
- 縦リサイズのみ許可し、レイアウト崩れを防ぐ。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- Form文脈では利用可能幅まで広げ、複数controlを無理に横へ詰めない。

## Responsive / Viewport Behavior

### Desktop

- 周辺layoutに応じたintrinsic widthを基本にし、formではlabelとの整列を保つ。
- Keyboard focusとhoverを別々に確認する。

### Mobile

- Form文脈では利用可能幅まで広げ、複数controlを無理に横へ詰めない。
- 同じpropとstate contractを維持する。

### Touch

- Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。
- Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。

## Accessibility

- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Native <textarea>をlabelとcounterへ関連付ける。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Tab`: 順序どおりにfocusを移動する。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--surface`, `--border`, `--fg`, `--input-bg`, `--input-border`, `--input-border-focus`, `--primary`, `--input-placeholder`, `--fg-subtle`, `--fg-muted`, `--fg-disabled`, `--danger`, `--focus-ring`
- density: `--ctl-md`, `--input-x`
- radius: `--radius-sm`
- motion: `--dur-fast`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.input-bg.value` | `--input-bg` | `component` | - | Dark themeでは入力面を周囲から識別するためsurface-sunkenへ切り替える。 |
| `token.input-border.value` | `--input-border` | `component` | - | High contrastでは入力境界だけをborder-strongへ強める。 |
| `token.input-border-focus.value` | `--input-border-focus` | `component` | - | Inputのfocus border slotをcomponent contractで固定する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.input-placeholder.value` | `--input-placeholder` | `component` | - | Input固有のplaceholder anatomyへ安定してbindingする。 |
| `token.fg-subtle.value` | `--fg-subtle` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.fg-disabled.value` | `--fg-disabled` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.danger.value` | `--danger` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-md.value` | `--ctl-md` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.input-x.value` | `--input-x` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.radius-sm.value` | `--radius-sm` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |
| `token.dur-fast.value` | `--dur-fast` | `semantic` | - | Textareaの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<Textarea label="説明" rows={4} maxLength={500} />
```

Don't:

```tsx
{/* 1 行で収まる入力 → Text Field */}
<Textarea />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `FOCUS_VISIBLE_REQUIRED`に反する実装。
- `NO_POSITIVE_TABINDEX`に反する実装。
- `TARGET_SIZE_MINIMUM`に反する実装。
- `INTERACTIVE_NAME_REQUIRED`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 説明文・コメントなどの長文入力

AIが避ける条件:

- 1 行で収まる入力 → Text Field

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<Textarea label="説明" rows={4} maxLength={500} />
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
