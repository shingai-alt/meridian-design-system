# Data Grid

## Summary

ソート・フィルタ・列リサイズ・仮想スクロールを備えた高機能テーブル。

Machine-readable contract: `design/contracts/components/data-grid.contract.json`

## Role

Data Display領域でData Gridの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 数千行規模のデータ操作
- インライン編集

## When Not To Use

- 単純な一覧 → Table(実装コストが 1/10)

## Visual Model

Collection container with an explicit reading order. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Collection container with an explicit reading order. |
| item | Yes | Repeated row, event, node, message, or entry. |
| primary-content | Yes | Main scannable value. |
| metadata | No | Secondary state, time, owner, or count. |
| actions | No | Item-level operations with independent names. |

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

- 列の表示/非表示・並び順はユーザーごとに保存する。
- ソート状態は URL クエリに同期し、共有可能にする。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- 意味のある列や項目を潰さず、横scroll、優先列、detail viewのいずれかを明示的に選ぶ。

## Responsive / Viewport Behavior

### Desktop

- 列・項目の比較可能性を保ち、必要な幅を確保する。
- Keyboard focusと選択状態をscroll位置から失わない。

### Mobile

- 意味のある列や項目を潰さず、横scroll、優先列、detail viewのいずれかを明示的に選ぶ。
- Scroll領域の外にも現在位置や操作の手掛かりを残す。

### Touch

- Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。
- Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。

## Accessibility

- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Interactive cell navigationがある場合だけgrid semanticsを使う。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Arrow keys`: Grid cell間を移動する。
- `Home / End`: 行またはgrid端へ移動する。
- `Enter / F2`: 編集可能cellの編集を開始する。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--border`, `--border-muted`, `--border-strong`, `--fg`, `--fg-muted`, `--fg-subtle`, `--focus-ring`, `--surface`, `--surface-muted`, `--table-row-hover`
- density: `--cell-y`, `--row-h`
- radius: `--radius-2xs`
- typography: `--text-small`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.border-muted.value` | `--border-muted` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.table-row-hover.value` | `--table-row-hover` | `component` | `intrinsic-component-value` | 大量行で反復するTable hoverはsurface tokenより弱い固有濃度を必要とする。 |
| `token.row-h.value` | `--row-h` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.cell-y.value` | `--cell-y` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Data Gridの公開visual contractで用途tokenとして共有する。 |
| `token.border-strong.value` | `--border-strong` | `semantic` | - | Data GridのHTML showcaseで実際に参照する公開token。 |
| `token.fg-subtle.value` | `--fg-subtle` | `semantic` | - | Data GridのHTML showcaseで実際に参照する公開token。 |
| `token.radius-2xs.value` | `--radius-2xs` | `semantic` | - | Data GridのHTML showcaseで実際に参照する公開token。 |
| `token.text-small.value` | `--text-small` | `semantic` | - | Data GridのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<DataGrid
  columns={columns}
  rows={rows}
  sortModel={sort}
  onSortChange={setSort}
  virtualized
/>
```

Don't:

```tsx
{/* 単純な一覧 → Table(実装コストが 1/10) */}
<DataGrid />
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

- 数千行規模のデータ操作
- インライン編集

AIが避ける条件:

- 単純な一覧 → Table(実装コストが 1/10)

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<DataGrid
  columns={columns}
  rows={rows}
  sortModel={sort}
  onSortChange={setSort}
  virtualized
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
