# Icon Button

## Summary

可視ラベルを置かず、単一の明確な補助アクションを実行する正方形のbuttonです。

Machine-readable contract: `design/contracts/components/icon-button.contract.json`

Contract version: `0.2.0`

## Role

Icon Buttonは「認識可能なglyphで表せる補助command」だけを所有します。可視ラベル付きcommandはButton、navigationはLink、selection stateは専用controlへ委譲します。PC用とSP用に別componentを作らず、同じ意味とAPIをsize、spacing、input methodへ適応させます。

## Principles

- Native `<button>`、visible Tooltip、programmatic nameを一体で提供する。
- `label`をTooltipと`aria-label`の単一sourceにし、翻訳や文言変更のdriftを防ぐ。
- 小さく見せる場合もtargetを24px minimum未満にしない。
- `primary`を持たず、主要アクションは可視ラベル付きButtonへ戻す。

## When To Use

- ツールバー、カードヘッダー、テーブル行で意味が広く認識される補助アクションを置く。
- 利用可能幅が限られ、可視ラベル付きButtonを置くと主要contentの走査を妨げる。
- 破壊的な補助アクションをdanger表現と確認フローで明示する。

## When Not To Use

- 主要アクション、初見で意味が推測できない操作、翻訳で意味が変わる操作には可視ラベル付きButtonを使う。
- ページやresourceへの遷移にはLinkを使う。
- ON/OFFや選択状態の保持にはSwitch、Checkbox、Segmented Controlなどのselection controlを使う。

## Visual Model

正方形rootの中央に単一glyphを置きます。Ghostは通常面を持たず、Secondaryは常時境界を示し、Dangerは破壊的操作だけに使います。形状、glyph位置、target寸法はstate遷移で変えません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | `type="button"`を既定とするnative button。 |
| icon | Yes | `aria-hidden="true"`の単一glyph。 |
| accessible-label | Yes | `label`から生成する短く具体的な`aria-label`。 |
| tooltip | Yes | Hoverとfocusで表示し、`label`と同じ操作名を伝える。 |
| spinner | No | Loading中にiconと同じ寸法へ置換する装飾indicator。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `ghost` | Toolbarや行内の標準的な補助操作。 | 通常面を持たず、hover/active時だけ面を表示する。 |
| `secondary` | Ghostより常時見つけやすくする補助操作。 | Neutral control surfaceとborderを使う。 |
| `danger` | 削除など破壊的な補助操作。 | 確認DialogまたはUndoと併用する。 |

`primary`は提供しません。主要CTAをiconだけにしないためです。

## Sizes / Density

| Size | Root | Icon | Typical use |
|---|---|---|---|
| `xs` | `--ctl-xs` | `--icon-button-icon-size-xs` | 高密度なtable row。24px minimumを下限にする。 |
| `sm` | `--ctl-sm` | `--icon-button-icon-size-sm` | Compact toolbar。 |
| `md` | `--ctl-md` | `--icon-button-icon-size-md` | 標準。 |
| `lg` | `--ctl-lg` | `--icon-button-icon-size-lg` | 見つけやすさを高める操作。 |
| `xl` | `--ctl-xl` | `--icon-button-icon-size-xl` | Touch中心の44px target。 |

Compact / Default / Comfortableはviewport名ではなく作業密度と入力方式で選びます。

## Icon Rules

- 単一glyphだけを描画し、`aria-hidden="true"`にする。
- Glyph名ではなく結果をlabelにする。`trash`ではなく「プロジェクトを削除」と書く。
- 独自glyphや意味が文脈依存するglyphにはIcon Buttonを使わず、可視ラベル付きButtonへ戻す。
- Loading中はglyphだけをspinnerへ置換し、accessible nameとroot寸法を維持する。

## States

| State | Behavior |
|---|---|
| `default` | Native buttonとしてfocus可能。labelをTooltipとaria-labelへ反映する。 |
| `hover` | Variantのhover tokenを使い、Tooltipを表示する。 |
| `active` | Active tokenを使い、寸法とglyph位置を変えない。 |
| `focus` | `focus-visible` ringとTooltipを表示する。 |
| `disabled` | Native `disabled`へ写像する。 |
| `loading` | `aria-busy`、`aria-disabled`、handler guardを使い、name・focus・寸法を保持する。 |

## Behavior

- Tooltipはhoverとfocusの両方で表示する。
- EscapeはTooltipだけを閉じ、Icon Buttonのfocusを維持する。
- Loading中はclickとsubmitの再実行をcomponent handlerで防ぐ。
- Disabled理由を伝える必要がある場合は、安易にdisabledへせず周辺説明または実行後feedbackを検討する。
- Toolbar内のroving tabindexはIcon ButtonではなくToolbarが所有する。

## Layout / Placement Rules

### Recommended Pattern

- 隣接targetとの間に十分なspacingを置く。
- 主要contentより前にIcon Button群を大量配置しない。
- Danger Icon Buttonは対象と空間的に関連付け、確認またはUndoを用意する。

## Responsive / Viewport Behavior

### Desktop

- `md`を標準、table rowでは`xs`/`sm`、主要toolbarでは`md`/`lg`を使う。
- HoverとfocusのTooltipを別々に確認する。

### Mobile

- 同じpropとaction contractを維持する。
- Touch中心の主要操作は`xl`を優先し、隣接targetとのspacingを確保する。

### Touch

- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- 24pxの中心円が隣接targetと重ならないようにする。
- Hoverだけに操作名や状態を依存させない。

## Accessibility

- `label`から空でないaccessible nameと同文のTooltipを生成する。
- Tooltipを`aria-describedby`で関連付ける。
- EnterとSpaceはnative button動作でactionを実行する。
- Iconとspinnerはassistive technologyから隠す。
- `focus-visible`で`--focus-ring`を使い、sticky layerで完全に隠さない。
- Positive `tabindex`を使わない。

Keyboard:

- `Enter`: Actionを実行する。
- `Space`: Actionを実行する。
- `Tab`: 通常のdocument順序で出入りする。
- `Escape`: Tooltipを閉じ、root focusを維持する。

## Content Guidelines

- Labelは動詞から始め、結果と対象を短く書く。
- 同じ画面に複数ある操作は「削除」ではなく「プロジェクトを削除」のように区別する。
- `button`や`icon`などrole名をlabelへ含めない。
- Tooltipへshortcutを加える場合も、accessible nameの操作名は変えない。

## Tokens

- Semantic color: `--control-bg`, `--control-bg-hover`, `--control-bg-active`, `--control-border`, `--control-border-hover`, `--fg`, `--fg-disabled`, `--surface-muted`, `--danger`, `--danger-hover`, `--danger-active`, `--danger-on-solid`, `--disabled`, `--focus-ring`
- Density: `--ctl-xs`, `--ctl-sm`, `--ctl-md`, `--ctl-lg`, `--ctl-xl`
- Component geometry: `--icon-button-icon-size-*`, `--icon-button-spinner-stroke`
- Radius: `--radius-sm`
- Motion: `--dur-fast`, `--dur-loop`, `--ease-standard`

Primitive color、raw hex、任意pxをcomponent実装から選びません。

### Token Binding Decisions

- Ghost、Secondary、Dangerのdefault / hover / active / disabledを公開semantic tokenへ結線する。
- Rootのwidthとheightは同じ`--ctl-*`を使い、paddingとgapは`0`で中央揃えにする。
- Glyph sizeとspinner strokeだけをIcon Button固有のintrinsic component tokenにする。
- Focus、radius、transitionはsystem共通tokenを直接参照する。

Current coverage: `complete`。未結線のvisual slotはありません。

## React API Freeze

`0.2.0`で次の順序と意味を固定します。

```ts
type IconButtonProps = NativeButtonProps & {
  label: string
  icon: ReactElement
  variant?: 'ghost' | 'secondary' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  disabled?: boolean
  tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left'
  type?: 'button' | 'submit' | 'reset'
  ref?: ForwardedRef<HTMLButtonElement>
}
```

- `type`の既定値は`button`。
- Native form属性、`aria-*`、`data-*`をpass-throughする。
- `label`は`aria-label`とTooltipの単一source。
- `aria-pressed`は受け付けず、selection controlへ委譲する。

## Do / Don't

Do:

```tsx
<IconButton label="フィルターを開く" icon={<FilterIcon />} />
```

Don't:

```tsx
<IconButton aria-label="trash">
  <TrashIcon />
</IconButton>
```

## Prohibited Patterns

- Labelなし、または`title`属性だけで命名する。
- `primary`を追加して主要CTAをiconだけにする。
- `aria-pressed`を追加してtoggleとして使う。
- Raw color、shadow、filter、任意pxでstateを作る。
- 24px未満のtargetを作る。

## AI Selection Rules

AIが選ぶ条件:

- 単一の補助actionを認識可能なglyphで表せる。
- 可視ラベルを置くと周辺contentの走査を妨げる。

AIが避ける条件:

- 主要actionまたは説明が必要ならButtonを使う。
- NavigationならLinkを使う。
- Selection stateなら専用selection controlを使う。

## Examples

```tsx
<IconButton label="再読み込み" icon={<RefreshIcon />} loading />

<IconButton
  label="プロジェクトを削除"
  icon={<TrashIcon />}
  variant="danger"
/>
```

## Implementation Readiness

`design/implementation-readiness.json`の8 criteriaをすべて通過しています。これはReact実装前のContract確定を意味し、production stableを意味しません。

## Implementation Notes

- React packageは今後追加する。
- Tooltipは共通Tooltip primitiveを利用し、Icon Buttonが表示triggerとlabel同期を所有する。
- React実装とrequired scenariosのCI visual regression完了後に`stable`へ昇格する。

## Open Questions

Contract上の未決事項はありません。
