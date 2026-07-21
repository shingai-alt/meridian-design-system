# Agent Status

## Summary

エージェントの実行状態(Idle〜Cancelled の 7 状態)を一目で伝える。

Machine-readable contract: `design/contracts/components/agent-status.contract.json`

## Role

AI & Developer領域でAgent Statusの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- agent全体の現在状態と停止・再試行actionを示すとき。

## When Not To Use

- 個別stepの履歴にはExecution Timelineを使う。

## Visual Model

Progress or execution status boundary. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Progress or execution status boundary. |
| indicator | Yes | Current state, track, or active step. |
| label | Yes | Accessible status text. |
| value | No | Numeric progress, duration, or quota. |
| action | No | Stop, retry, or inspect action. |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `idle` | idleという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `thinking` | thinkingという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `running` | runningという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `waiting` | waitingという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `succeeded` | succeededという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `failed` | failedという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `cancelled` | cancelledという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |

## Sizes / Density

| Size | Token | Typical use |
|---|---|---|
| Dedicated size propなし | Density token | 周辺layoutのdensityに従う。 |

Compact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。

## Icon Rules

意味を補強するiconはtext labelと併用し、装飾iconはassistive technologyから隠します。Icon-only actionには見えるtooltipとprogrammatic accessible nameを付けます。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。意味、label、valueを省略しない。 |

## Behavior

- Running / Thinking では停止操作を常に提供する。
- Waiting(承認待ち)は warning トーンで、必要な操作を明示する。
- Failed は失敗ステップへのリンクを持つ。

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

- semanticColor: `--border`, `--danger`, `--fg`, `--fg-muted`, `--primary`, `--success`, `--surface`, `--surface-muted`, `--warning`
- spacing: `--sp-2`, `--sp-25`, `--sp-3`
- radius: `--radius-full`
- motion: `--dur-normal`
- typography: `--text-label`, `--text-small`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.success.value` | `--success` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.warning.value` | `--warning` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.danger.value` | `--danger` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.sp-2.value` | `--sp-2` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.radius-full.value` | `--radius-full` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.dur-normal.value` | `--dur-normal` | `semantic` | - | Agent Statusの公開visual contractで用途tokenとして共有する。 |
| `token.sp-25.value` | `--sp-25` | `semantic` | - | Agent StatusのHTML showcaseで実際に参照する公開token。 |
| `token.sp-3.value` | `--sp-3` | `semantic` | - | Agent StatusのHTML showcaseで実際に参照する公開token。 |
| `token.text-label.value` | `--text-label` | `semantic` | - | Agent StatusのHTML showcaseで実際に参照する公開token。 |
| `token.text-small.value` | `--text-small` | `semantic` | - | Agent StatusのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<AgentStatus status="idle" step={2} totalSteps={5} onCancel={cancel} />
```

Don't:

```tsx
{/* 個別stepの履歴にはExecution Timelineを使う。 */}
<AgentStatus />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `STATE_NOT_COLOR_ONLY`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- agent全体の現在状態と停止・再試行actionを示すとき。

AIが避ける条件:

- 個別stepの履歴にはExecution Timelineを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<AgentStatus status="idle" step={2} totalSteps={5} onCancel={cancel} />
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
