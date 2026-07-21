# Text Field

## Summary

1 行のテキスト入力。ラベル・ヘルプ・エラーは Form Field と組み合わせる。

Machine-readable contract: `design/contracts/components/text-field.contract.json`

## Role

Forms領域でText Fieldの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 短い自由入力(名前・URL・メール)

## When Not To Use

- 長文 → Textarea
- 限られた選択肢 → Select / Radio

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
| `sm` | `--ctl-sm` | 周辺密度とtask priorityに合わせる。 |
| `md` | `--ctl-md` | 標準文脈。 |
| `lg` | `--ctl-lg` | 周辺密度とtask priorityに合わせる。 |

Compact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。

## Icon Rules

このcomponentは必須のicon slotを持ちません。追加する場合も情報をiconだけへ閉じ込めません。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。意味、label、valueを省略しない。 |
| `hover` | Pointer hoverの補助変化。意味をhoverだけに依存させない。 |
| `focus` | focus-visibleで明確なringを表示する。 |
| `error` | 色だけでなくmessageとaria stateで問題を伝える。 |
| `disabled` | 操作不能である理由を周辺文脈から理解できるようにする。 |
| `readonly` | 値を参照・選択できるが変更できない。 |

## Behavior

- Placeholder に必須情報を書かない。入力を始めると消える。
- エラーは具体的に書く。「不正な値」ではなく「@ を含むメールアドレスを入力してください」。
- Disabled は操作不能+送信対象外、Readonly は参照可能+送信対象。区別して使う。

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

- label 要素と htmlFor で関連付ける
- エラーは aria-describedby + aria-invalid で通知する
- focus ring はコントラスト比 3:1 以上
- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Native <input>をlabelとdescription/errorへ関連付ける。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Tab`: 順序どおりにfocusを移動する。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--input-bg`, `--surface`, `--input-border`, `--border`, `--input-border-focus`, `--primary`, `--input-placeholder`, `--fg-subtle`, `--danger`, `--fg`, `--fg-muted`, `--fg-disabled`, `--focus-ring`
- density: `--ctl-md`, `--input-x`, `--ctl-sm`, `--ctl-lg`, `--text-label`
- spacing: `--sp-2`
- radius: `--radius-sm`
- motion: `--dur-fast`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.input-bg.value` | `--input-bg` | `component` | - | Dark themeでは入力面を周囲から識別するためsurface-sunkenへ切り替える。 |
| `token.surface.value` | `--surface` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.input-border.value` | `--input-border` | `component` | - | High contrastでは入力境界だけをborder-strongへ強める。 |
| `token.border.value` | `--border` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.input-border-focus.value` | `--input-border-focus` | `component` | - | Inputのfocus border slotをcomponent contractで固定する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.input-placeholder.value` | `--input-placeholder` | `component` | - | Input固有のplaceholder anatomyへ安定してbindingする。 |
| `token.fg-subtle.value` | `--fg-subtle` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.danger.value` | `--danger` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.radius-sm.value` | `--radius-sm` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-md.value` | `--ctl-md` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.fg-disabled.value` | `--fg-disabled` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.input-x.value` | `--input-x` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.dur-fast.value` | `--dur-fast` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-sm.value` | `--ctl-sm` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-lg.value` | `--ctl-lg` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.text-label.value` | `--text-label` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |
| `token.sp-2.value` | `--sp-2` | `semantic` | - | Text Fieldの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<TextField
  label="Project name"
  placeholder="Acme Dashboard"
  helperText="後から変更できます。"
/>
```

Don't:

```tsx
{/* 長文 → Textarea */}
<TextField />
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

- 短い自由入力(名前・URL・メール)

AIが避ける条件:

- 長文 → Textarea
- 限られた選択肢 → Select / Radio

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<TextField
  label="Project name"
  placeholder="Acme Dashboard"
  helperText="後から変更できます。"
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
