# Code Diff

## Summary

変更差分の表示。追加・削除・変更行を色+記号で示す。

Machine-readable contract: `design/contracts/components/code-diff.contract.json`

## Role

AI & Developer領域でCode Diffの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 変更前後のcodeを行単位でreviewするとき。

## When Not To Use

- 完成したcodeの参照にはCode Blockを使う。

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

- +/− 記号を必ず併記し、色のみに依存しない。
- ファイルヘッダーに変更量(+2 −1)とパスコピーを置く。
- 大きな差分はファイル単位で折りたたむ。

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

- 表示専用rootをtab順へ追加しない。
- 内包する操作がある場合だけ、その操作targetを24px minimum、主要touch操作を原則44px以上にする。

## Accessibility

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

- semanticColor: `--surface`, `--border`, `--fg`, `--surface-muted`, `--fg-muted`, `--border-muted`, `--table-row-hover`, `--focus-ring`
- density: `--row-h`, `--cell-y`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.border-muted.value` | `--border-muted` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.table-row-hover.value` | `--table-row-hover` | `component` | - | 大量行で反復するTable hoverはsurface tokenより弱い固有濃度を必要とする。 |
| `token.row-h.value` | `--row-h` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.cell-y.value` | `--cell-y` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Code Diffの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<CodeDiff
  file="src/lib/sort.ts"
  hunks={hunks}
  collapsible
  onComment={addComment}
/>
```

Don't:

```tsx
{/* 完成したcodeの参照にはCode Blockを使う。 */}
<CodeDiff />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 変更前後のcodeを行単位でreviewするとき。

AIが避ける条件:

- 完成したcodeの参照にはCode Blockを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<CodeDiff
  file="src/lib/sort.ts"
  hunks={hunks}
  collapsible
  onComment={addComment}
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
