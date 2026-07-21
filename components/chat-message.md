# Chat Message

## Summary

ユーザー・アシスタント・システムの発話表示。ツール実行やコードを内包する。

Machine-readable contract: `design/contracts/components/chat-message.contract.json`

## Role

AI & Developer領域でChat Messageの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 会話履歴内でuser、assistant、systemの発話を区別するとき。

## When Not To Use

- 採用判断を伴う構造化提案にはAI Response Cardを使う。

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
| `assistant` | AI assistantの応答。 | 意味を変えずに見た目だけを増やさない。 |
| `user` | Userの入力。 | 意味を変えずに見た目だけを増やさない。 |
| `system` | Systemが生成した状態通知。 | 意味を変えずに見た目だけを増やさない。 |

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

- ユーザー発話は面(バブル)、アシスタントは地の文で区別する。
- ストリーミング中もコピー・停止操作を可能にする。
- ツール実行は折りたたみブロックで、結果の成否を明示する。

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

- semanticColor: `--border`, `--border-muted`, `--fg`, `--fg-muted`, `--focus-ring`, `--primary`, `--primary-fg`, `--surface`, `--surface-muted`, `--table-row-hover`
- density: `--cell-y`, `--row-h`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.border-muted.value` | `--border-muted` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.table-row-hover.value` | `--table-row-hover` | `component` | `intrinsic-component-value` | 大量行で反復するTable hoverはsurface tokenより弱い固有濃度を必要とする。 |
| `token.row-h.value` | `--row-h` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.cell-y.value` | `--cell-y` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Chat Messageの公開visual contractで用途tokenとして共有する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Chat MessageのHTML showcaseで実際に参照する公開token。 |
| `token.primary-fg.value` | `--primary-fg` | `semantic` | - | Chat MessageのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<ChatMessage role="assistant">
  <Markdown>{content}</Markdown>

</ChatMessage>
```

Don't:

```tsx
{/* 採用判断を伴う構造化提案にはAI Response Cardを使う。 */}
<ChatMessage />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 会話履歴内でuser、assistant、systemの発話を区別するとき。

AIが避ける条件:

- 採用判断を伴う構造化提案にはAI Response Cardを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<ChatMessage role="assistant">
  <Markdown>{content}</Markdown>

</ChatMessage>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
