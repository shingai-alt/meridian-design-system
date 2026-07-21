# Switch

## Summary

即時に反映される ON/OFF。保存ボタンを伴う設定には Checkbox を使う。

Machine-readable contract: `design/contracts/components/switch.contract.json`

## Role

Forms領域でSwitchの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 切り替えた瞬間に反映される設定

## When Not To Use

- フォーム送信で確定する項目 → Checkbox

## Visual Model

Selection control boundary. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Selection control boundary. |
| value | Yes | Current value or selected option. |
| indicator | Yes | Selection, thumb, check, or disclosure indicator. |
| popup | No | Option list or calendar when the pattern opens one. |

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
| `checked` | 選択状態をvisualとprogrammatic stateの両方で同期する。 |
| `disabled` | 操作不能である理由を周辺文脈から理解できるようにする。 |

## Behavior

- 切り替え結果はトーストなどで軽くフィードバックする。
- ラベルは状態ではなく対象を書く(「自動保存」であり「ON」ではない)。

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
- role="switch"または同等native controlとaria-checkedを同期する。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Space`: On / Offを切り替える。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--surface`, `--border`, `--fg`, `--surface-muted`, `--fg-muted`, `--border-strong`, `--primary`, `--primary-subtle`, `--focus-ring`
- density: `--ctl-md`
- spacing: `--sp-2`
- radius: `--radius-sm`
- motion: `--dur-fast`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.border-strong.value` | `--border-strong` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.primary-subtle.value` | `--primary-subtle` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-md.value` | `--ctl-md` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.sp-2.value` | `--sp-2` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.radius-sm.value` | `--radius-sm` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |
| `token.dur-fast.value` | `--dur-fast` | `semantic` | - | Switchの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<Switch label="自動保存" onChange={...} />
```

Don't:

```tsx
{/* フォーム送信で確定する項目 → Checkbox */}
<Switch />
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

- 切り替えた瞬間に反映される設定

AIが避ける条件:

- フォーム送信で確定する項目 → Checkbox

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<Switch label="自動保存" onChange={...} />
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
