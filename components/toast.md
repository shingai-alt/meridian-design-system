# Toast

## Summary

操作結果の一時的な通知。自動で消え、作業を妨げない。

Machine-readable contract: `design/contracts/components/toast.contract.json`

## Role

Feedback領域でToastの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 保存・作成・削除など操作の完了通知

## When Not To Use

- ユーザーの判断が必要な情報 → Dialog
- 恒常的な警告 → Banner / Alert

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
| `info` | 中立的な補足情報。 | 意味を変えずに見た目だけを増やさない。 |
| `danger` | 破壊的または回復困難な操作・状態。 | 意味を変えずに見た目だけを増やさない。 |

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

- 4〜6 秒で自動消滅し、閉じるボタンも必ず付ける。
- 取り消し可能な操作には「元に戻す」アクションを載せる。
- 同時表示は 3 件まで。古いものから消す。

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

- role="status"(エラーは role="alert")で読み上げる
- ホバー中は自動消滅タイマーを停止する
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

- semanticColor: `--border`, `--danger`, `--danger-fg`, `--danger-subtle`, `--fg`, `--fg-muted`, `--info`, `--info-fg`, `--info-subtle`, `--success`, `--success-fg`, `--success-subtle`, `--surface`, `--warning-fg`, `--warning-subtle`
- spacing: `--sp-3`
- radius: `--radius-md`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.info-subtle.value` | `--info-subtle` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.info-fg.value` | `--info-fg` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.success-subtle.value` | `--success-subtle` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.success-fg.value` | `--success-fg` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.warning-subtle.value` | `--warning-subtle` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.warning-fg.value` | `--warning-fg` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.danger-subtle.value` | `--danger-subtle` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.danger-fg.value` | `--danger-fg` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.sp-3.value` | `--sp-3` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Toastの公開visual contractで用途tokenとして共有する。 |
| `token.danger.value` | `--danger` | `semantic` | - | ToastのHTML showcaseで実際に参照する公開token。 |
| `token.info.value` | `--info` | `semantic` | - | ToastのHTML showcaseで実際に参照する公開token。 |
| `token.success.value` | `--success` | `semantic` | - | ToastのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
toast.success({
  title: "プロジェクトを作成しました",
  action: { label: "元に戻す", onClick: undo },
});
```

Don't:

```tsx
{/* ユーザーの判断が必要な情報 → Dialog */}
<Toast />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `STATE_NOT_COLOR_ONLY`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 保存・作成・削除など操作の完了通知

AIが避ける条件:

- ユーザーの判断が必要な情報 → Dialog
- 恒常的な警告 → Banner / Alert

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
toast.success({
  title: "プロジェクトを作成しました",
  action: { label: "元に戻す", onClick: undo },
});
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
