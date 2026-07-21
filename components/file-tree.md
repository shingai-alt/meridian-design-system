# File Tree

## Summary

階層構造のファイル表示。アクティブ・変更インジケータ・検索を持つ。

Machine-readable contract: `design/contracts/components/file-tree.contract.json`

## Role

AI & Developer領域でFile Treeの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 階層fileを展開し、選択や変更状態を確認するとき。

## When Not To Use

- flatな少数fileにはListを使う。

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

- 変更のあるファイルにはドットを付ける。
- 深い階層はインデント+ガイド線で示す。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- 主情報を先にしてmetadataを折り返し、非表示情報にはdetail viewから到達できるようにする。

## Responsive / Viewport Behavior

### Desktop

- CompactまたはDefault densityで走査性を優先し、metadataとactionの列を安定させる。
- Hover actionはfocusでも表示する。

### Mobile

- 主情報を先にしてmetadataを折り返し、非表示情報にはdetail viewから到達できるようにする。
- 行全体clickだけに依存せず明示的なtargetを残す。

### Touch

- Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。
- Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。

## Accessibility

- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Interactive hierarchyはtree / treeitem semanticsとexpanded stateを同期する。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Arrow Up / Down`: Visible nodeを移動する。
- `Arrow Right / Left`: Nodeを展開 / 折りたたむ。
- `Enter`: Focused fileを開く。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--surface`, `--border`, `--fg`, `--surface-muted`, `--fg-muted`, `--border-muted`, `--table-row-hover`, `--focus-ring`
- density: `--row-h`, `--cell-y`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.border-muted.value` | `--border-muted` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.table-row-hover.value` | `--table-row-hover` | `component` | - | 大量行で反復するTable hoverはsurface tokenより弱い固有濃度を必要とする。 |
| `token.row-h.value` | `--row-h` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.cell-y.value` | `--cell-y` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | File Treeの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<FileTree
  data={tree}
  activePath="src/components/data-table.tsx"
  modified={changedFiles}
  searchable
/>
```

Don't:

```tsx
{/* flatな少数fileにはListを使う。 */}
<FileTree />
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

- 階層fileを展開し、選択や変更状態を確認するとき。

AIが避ける条件:

- flatな少数fileにはListを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<FileTree
  data={tree}
  activePath="src/components/data-table.tsx"
  modified={changedFiles}
  searchable
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
