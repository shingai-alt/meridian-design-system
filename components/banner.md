# Banner

## Summary

アプリ全体に関わるお知らせを画面上部に表示する。

Machine-readable contract: `design/contracts/components/banner.contract.json`

## Role

Feedback領域でBannerの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- リリース告知・メンテナンス予告・支払い警告

## When Not To Use

- ページ固有の情報 → Alert

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

- 同時に 1 枚まで。閉じた状態を記憶する。
- 行動が必要な場合は右端にボタンを 1 つだけ置く。

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

- semanticColor: `--border`, `--danger-fg`, `--danger-subtle`, `--fg`, `--fg-muted`, `--info-fg`, `--info-subtle`, `--primary`, `--primary-fg`, `--success-fg`, `--success-subtle`, `--surface`, `--warning-fg`, `--warning-subtle`
- spacing: `--sp-3`
- radius: `--radius-md`
- typography: `--text-label`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.info-subtle.value` | `--info-subtle` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.info-fg.value` | `--info-fg` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.success-subtle.value` | `--success-subtle` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.success-fg.value` | `--success-fg` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.warning-subtle.value` | `--warning-subtle` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.warning-fg.value` | `--warning-fg` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.danger-subtle.value` | `--danger-subtle` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.danger-fg.value` | `--danger-fg` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.sp-3.value` | `--sp-3` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Bannerの公開visual contractで用途tokenとして共有する。 |
| `token.primary.value` | `--primary` | `semantic` | - | BannerのHTML showcaseで実際に参照する公開token。 |
| `token.primary-fg.value` | `--primary-fg` | `semantic` | - | BannerのHTML showcaseで実際に参照する公開token。 |
| `token.text-label.value` | `--text-label` | `semantic` | - | BannerのHTML showcaseで実際に参照する公開token。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<Banner tone="info" dismissible action={{ label: "詳細", href: "/changelog" }}>
  v2.4 リリース: Dynamic color API が利用可能になりました。
</Banner>
```

Don't:

```tsx
{/* ページ固有の情報 → Alert */}
<Banner />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `STATE_NOT_COLOR_ONLY`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- リリース告知・メンテナンス予告・支払い警告

AIが避ける条件:

- ページ固有の情報 → Alert

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<Banner tone="info" dismissible action={{ label: "詳細", href: "/changelog" }}>
  v2.4 リリース: Dynamic color API が利用可能になりました。
</Banner>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
