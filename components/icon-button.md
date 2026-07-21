# Icon Button

## Summary

アイコンのみのコンパクトなアクション。ツールバーや行内操作に使う。

Machine-readable contract: `design/contracts/components/icon-button.contract.json`

## Role

Core領域でIcon Buttonの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- ツールバー・カードヘッダーの補助操作
- スペースが限られたテーブル行内

## When Not To Use

- 意味がアイコンだけでは伝わらない主要アクション → ラベル付き Button

## Visual Model

Native interactive root or navigation target. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Native interactive root or navigation target. |
| label | Yes | Predictable accessible action or destination name. |
| icon | No | Meaning reinforcement; decorative icons stay hidden from assistive technology. |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `ghost` | 面を増やさない補助action。 | 意味を変えずに見た目だけを増やさない。 |
| `secondary` | 主要actionを補助する標準表現。 | 意味を変えずに見た目だけを増やさない。 |
| `primary` | 主要actionまたは最優先の選択。 | 意味を変えずに見た目だけを増やさない。 |

## Sizes / Density

| Size | Token | Typical use |
|---|---|---|
| `xs` | `--ctl-xs` | 周辺密度とtask priorityに合わせる。 |
| `sm` | `--ctl-sm` | 周辺密度とtask priorityに合わせる。 |
| `md` | `--ctl-md` | 標準文脈。 |
| `lg` | `--ctl-lg` | 周辺密度とtask priorityに合わせる。 |

Compact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。

## Icon Rules

意味を補強するiconはtext labelと併用し、装飾iconはassistive technologyから隠します。Icon-only actionには見えるtooltipとprogrammatic accessible nameを付けます。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。意味、label、valueを省略しない。 |
| `hover` | Pointer hoverの補助変化。意味をhoverだけに依存させない。 |
| `disabled` | 操作不能である理由を周辺文脈から理解できるようにする。 |

## Behavior

- 必ず aria-label とツールチップを併用する。
- 操作ターゲットは 24px 以上を最低条件とし、タッチ中心の主要操作は原則 44px 以上にする。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- Form文脈では利用可能幅まで広げ、複数controlを無理に横へ詰めない。

## Responsive / Viewport Behavior

### Desktop

- 周辺layoutに応じたintrinsic widthを基本にし、formではlabelとの整列を保つ。
- Keyboard focusとhoverを別々に確認する。

### Mobile

- Form文脈では利用可能幅まで広げ、複数controlを無理に横へ詰めない。
- 同じpropとstate contractを維持する。

### Touch

- Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。
- Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。

## Accessibility

- aria-label を必須にする
- ツールチップはフォーカス時にも表示する
- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Native <button>と必須のaria-labelを使う。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Enter / Space`: Actionを実行する。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--surface`, `--border`, `--fg`, `--surface-muted`, `--fg-disabled`, `--border-strong`, `--primary`, `--primary-hover`, `--primary-active`, `--primary-fg`, `--focus-ring`
- density: `--ctl-md`, `--ctl-xs`, `--ctl-sm`, `--ctl-lg`, `--text-label`
- spacing: `--sp-2`
- radius: `--radius-sm`
- motion: `--dur-fast`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.surface-muted.value` | `--surface-muted` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.fg-disabled.value` | `--fg-disabled` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.border-strong.value` | `--border-strong` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.primary.value` | `--primary` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.primary-hover.value` | `--primary-hover` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.primary-active.value` | `--primary-active` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.primary-fg.value` | `--primary-fg` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-md.value` | `--ctl-md` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.sp-2.value` | `--sp-2` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.radius-sm.value` | `--radius-sm` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.dur-fast.value` | `--dur-fast` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-xs.value` | `--ctl-xs` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-sm.value` | `--ctl-sm` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.ctl-lg.value` | `--ctl-lg` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |
| `token.text-label.value` | `--text-label` | `semantic` | - | Icon Buttonの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<IconButton variant="ghost" size="md" aria-label="追加">
  <PlusIcon />
</IconButton>
```

Don't:

```tsx
{/* 意味がアイコンだけでは伝わらない主要アクション → ラベル付き Button */}
<IconButton />
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

- ツールバー・カードヘッダーの補助操作
- スペースが限られたテーブル行内

AIが避ける条件:

- 意味がアイコンだけでは伝わらない主要アクション → ラベル付き Button

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<IconButton variant="ghost" size="md" aria-label="追加">
  <PlusIcon />
</IconButton>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
