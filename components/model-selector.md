# Model Selector

## Summary

AI モデルの切り替えメニュー。特性の説明を添えて選択を助ける。

Machine-readable contract: `design/contracts/components/model-selector.contract.json`

## Role

AI & Developer領域でModel Selectorの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 複数AI modelの特性を比較して実行contextを選ぶとき。

## When Not To Use

- modelが固定の体験では選択UIを表示しない。

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

## Behavior

- モデル名は等幅フォントで表示する。
- 速度・精度などのトレードオフを 1 行で説明する。
- 会話中の切替はシステムメッセージとして履歴に残す。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- Hover起点を使わずtapまたはfocusで開き、狭い幅ではsheet presentationを選べる。

## Responsive / Viewport Behavior

### Desktop

- Triggerへ位置付け、viewport端ではplacementを反転またはshiftする。
- Pointerとkeyboardの両方で同じ内容へ到達できる。

### Mobile

- Hover起点を使わずtapまたはfocusで開き、狭い幅ではsheet presentationを選べる。
- Triggerとsurfaceを同時に画面外へ追い出さない。

### Touch

- Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。
- Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。

## Accessibility

- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Native semanticsを優先し、ARIAは不足する関係と状態だけを補う。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Arrow Up / Down`: Model optionを移動する。
- `Enter`: Modelを選択する。
- `Escape`: Menuを閉じる。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--border`, `--border-strong`, `--fg`, `--fg-muted`, `--fg-subtle`, `--focus-ring`, `--primary`, `--primary-subtle`, `--surface`, `--surface-muted`
- density: `--ctl-md`
- spacing: `--sp-2`
- radius: `--radius-sm`
- motion: `--dur-fast`
- typography: `--font-mono`, `--text-micro`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.border-strong.value` | `--border-strong` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.primary-subtle.value` | `--primary-subtle` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-md.value` | `--ctl-md` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.sp-2.value` | `--sp-2` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.radius-sm.value` | `--radius-sm` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.dur-fast.value` | `--dur-fast` | `semantic` | - | Model Selectorの公開visual contractで用途tokenとして共有する。 |
| `token.fg-subtle.value` | `--fg-subtle` | `semantic` | - | Model SelectorのHTML showcaseで実際に参照する公開token。 |
| `token.font-mono.value` | `--font-mono` | `semantic` | - | Model SelectorのHTML showcaseで実際に参照する公開token。 |
| `token.text-micro.value` | `--text-micro` | `semantic` | - | Model SelectorのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<ModelSelector
  models={models}
  value="claude-sonnet-4-6"
  onChange={setModel}
/>
```

Don't:

```tsx
{/* modelが固定の体験では選択UIを表示しない。 */}
<ModelSelector />
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

- 複数AI modelの特性を比較して実行contextを選ぶとき。

AIが避ける条件:

- modelが固定の体験では選択UIを表示しない。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<ModelSelector
  models={models}
  value="claude-sonnet-4-6"
  onChange={setModel}
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
