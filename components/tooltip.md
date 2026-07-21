# Tooltip

## Summary

ホバー・フォーカス時に補足情報を表示する。重要情報は入れない。

Machine-readable contract: `design/contracts/components/tooltip.contract.json`

## Role

Core領域でTooltipの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- Icon Button のラベル補足
- ショートカットキーの提示

## When Not To Use

- 操作に必須の情報(タッチでは表示されない)
- 長い説明 → Popover

## Visual Model

Floating or modal surface. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| surface | Yes | Floating or modal surface. |
| header | No | Title and context. |
| content | Yes | Information or controls owned by the surface. |
| actions | No | Confirmation, navigation, or dismiss controls. |
| trigger | No | Element that opens the surface and receives restored focus. |

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

- 表示遅延は 400ms 程度、消える動きは即時にする。
- フォーカスでも表示し、Esc で閉じられるようにする。

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
- Surfaceにrole="tooltip"、triggerにaria-describedbyを使う。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Escape`: Tooltipを閉じてtriggerへfocusを保つ。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--bg`, `--border`, `--fg`, `--fg-muted`, `--focus-ring`, `--overlay`, `--surface-inverse`, `--surface-overlay`, `--tooltip-bg`
- spacing: `--sp-4`
- radius: `--radius-md`, `--radius-xs`
- motion: `--dur-normal`
- shadow: `--shadow-md`, `--shadow-overlay`
- typography: `--text-micro`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.tooltip-bg.value` | `--tooltip-bg` | `component` | `component-anatomy` | Tooltipのinverse surface anatomyをcomponent境界で固定する。 |
| `token.surface-inverse.value` | `--surface-inverse` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.radius-xs.value` | `--radius-xs` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.shadow-md.value` | `--shadow-md` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.surface-overlay.value` | `--surface-overlay` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.overlay.value` | `--overlay` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.shadow-overlay.value` | `--shadow-overlay` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.sp-4.value` | `--sp-4` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.dur-normal.value` | `--dur-normal` | `semantic` | - | Tooltipの公開visual contractで用途tokenとして共有する。 |
| `token.bg.value` | `--bg` | `semantic` | - | TooltipのHTML showcaseで実際に参照する公開token。 |
| `token.text-micro.value` | `--text-micro` | `semantic` | - | TooltipのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<Tooltip content="変更を保存 ⌘S">
  <IconButton aria-label="保存"><SaveIcon /></IconButton>
</Tooltip>
```

Don't:

```tsx
{/* 操作に必須の情報(タッチでは表示されない) */}
<Tooltip />
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

- Icon Button のラベル補足
- ショートカットキーの提示

AIが避ける条件:

- 操作に必須の情報(タッチでは表示されない)
- 長い説明 → Popover

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<Tooltip content="変更を保存 ⌘S">
  <IconButton aria-label="保存"><SaveIcon /></IconButton>
</Tooltip>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
