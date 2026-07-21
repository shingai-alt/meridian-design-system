# Status Indicator

## Summary

リソースの状態を色ドット+ラベルで示す。色のみに依存しない。

Machine-readable contract: `design/contracts/components/status-indicator.contract.json`

## Role

Feedback領域でStatus Indicatorの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 稼働、接続、実行など短いresource状態を反復表示するとき。

## When Not To Use

- 説明や回復actionが必要な状態にはAlertを使う。

## Visual Model

Status message boundary. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Status message boundary. |
| indicator | No | Icon or shape that reinforces tone. |
| message | Yes | Concise status and recovery guidance. |
| action | No | Recovery, undo, or dismiss control. |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `success` | 完了または肯定的状態。 | 意味を変えずに見た目だけを増やさない。 |
| `running` | runningという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `warning` | 注意と判断が必要な状態。 | 意味を変えずに見た目だけを増やさない。 |
| `error` | errorという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |
| `idle` | idleという明示的な意味を持つ文脈。 | 意味を変えずに見た目だけを増やさない。 |

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

- ラベルを必ず併記する。ドット単体は凡例がある表内のみ許容。
- 点滅アニメーションは「実行中」に限定する。

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

- semanticColor: `--surface`, `--border`, `--fg`, `--fg-muted`, `--info-subtle`, `--info-fg`, `--success-subtle`, `--success-fg`, `--warning-subtle`, `--warning-fg`, `--danger-subtle`, `--danger-fg`
- spacing: `--sp-3`
- radius: `--radius-md`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.info-subtle.value` | `--info-subtle` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.info-fg.value` | `--info-fg` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.success-subtle.value` | `--success-subtle` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.success-fg.value` | `--success-fg` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.warning-subtle.value` | `--warning-subtle` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.warning-fg.value` | `--warning-fg` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.danger-subtle.value` | `--danger-subtle` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.danger-fg.value` | `--danger-fg` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.sp-3.value` | `--sp-3` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Status Indicatorの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<StatusIndicator status="success" label="Running" />
```

Don't:

```tsx
{/* 説明や回復actionが必要な状態にはAlertを使う。 */}
<StatusIndicator />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `STATE_NOT_COLOR_ONLY`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 稼働、接続、実行など短いresource状態を反復表示するとき。

AIが避ける条件:

- 説明や回復actionが必要な状態にはAlertを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<StatusIndicator status="success" label="Running" />
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
