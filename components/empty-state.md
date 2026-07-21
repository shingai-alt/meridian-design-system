# Empty State

## Summary

データが無い状態を、次のアクションへの導線として設計する。

Machine-readable contract: `design/contracts/components/empty-state.contract.json`

## Role

Core領域でEmpty Stateの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- 初回利用・データ 0 件
- 検索結果 0 件(文言を変える)

## When Not To Use

- エラーによる非表示 → Error 表示で原因と回復手段を示す

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
| `default` | 標準文脈。 | 意味を変えずに見た目だけを増やさない。 |

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

- 「何が無いのか」「作るとどうなるか」「最初の一歩」の 3 点を必ず含める。
- 検索 0 件では「条件を変える・クリアする」導線を出す。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- 1列へreflowし、heading、content、actionの順序を保つ。

## Responsive / Viewport Behavior

### Desktop

- Gridまたはsectionのreading orderに沿って配置し、同種itemの寸法を揃える。
- 面の入れ子を増やさない。

### Mobile

- 1列へreflowし、heading、content、actionの順序を保つ。
- Actionが複数ある場合は縦積みまたはmenuへ整理する。

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
| `token.surface.value` | `--surface` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.info-subtle.value` | `--info-subtle` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.info-fg.value` | `--info-fg` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.success-subtle.value` | `--success-subtle` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.success-fg.value` | `--success-fg` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.warning-subtle.value` | `--warning-subtle` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.warning-fg.value` | `--warning-fg` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.danger-subtle.value` | `--danger-subtle` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.danger-fg.value` | `--danger-fg` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.sp-3.value` | `--sp-3` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Empty Stateの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<EmptyState
  icon={<FolderIcon />}
  title="プロジェクトがありません"
  description="最初のプロジェクトを作成すると、ここにダッシュボードが表示されます。"
  action={<Button size="sm">プロジェクトを作成</Button>}
/>
```

Don't:

```tsx
{/* エラーによる非表示 → Error 表示で原因と回復手段を示す */}
<EmptyState />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `STATE_NOT_COLOR_ONLY`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 初回利用・データ 0 件
- 検索結果 0 件(文言を変える)

AIが避ける条件:

- エラーによる非表示 → Error 表示で原因と回復手段を示す

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<EmptyState
  icon={<FolderIcon />}
  title="プロジェクトがありません"
  description="最初のプロジェクトを作成すると、ここにダッシュボードが表示されます。"
  action={<Button size="sm">プロジェクトを作成</Button>}
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
