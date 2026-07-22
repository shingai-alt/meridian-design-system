# Tag

## Summary

ユーザーが付与した属性を表示し、必要な場合だけ明示的な削除buttonを内包するラベルです。

Machine-readable contract: `design/contracts/components/tag.contract.json`

## Role

Tagは「属性の表示」を所有します。rootは非interactiveな`span`で、削除可能な場合だけ独立したnative `button`を内包します。Tag全体の選択、入力、候補popup、collection keyboard navigationは所有しません。PC用とSP用に別componentを作らず、同じ意味とAPIを親layout、density、input methodへ適応させます。

## Principles

- Native semanticsを優先し、表示と操作の境界をDOMに反映します。
- ユーザーが付与した属性と、systemが決める状態を混同しません。
- Localized accessible nameと削除後のfocusを暗黙に推測しません。
- Semantic tokenを基本とし、component固有tokenはpolicy triggerがある場合だけ追加します。

## When To Use

- ユーザーが付与したラベル、トピック、属性を読み取り可能な単位で表示する。
- 付与済みの属性を、対象名を含む明示的な削除操作で解除できるようにする。

## When Not To Use

- システム状態、件数、カテゴリの読み取り専用表示にはBadgeを使う。
- 押下で選択状態を切り替えるfilter chipやtoggleとして使わない。
- 入力、候補popup、Backspace削除、collection focusをまとめて扱う場合はComboboxまたは専用Tag Input patternを使う。

## Visual Model

Tag rootはneutralな属性面です。labelは短い補助情報として表示し、削除可能な場合だけ末尾に24px minimumのremove buttonを置きます。hover、active、focusはTag全体ではなくremove buttonだけに出します。長いlabelはellipsisで情報を失わせず、available width内で折り返します。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| `root` | Yes | 意味を追加しない非interactiveな`span`。 |
| `label` | Yes | 空でない可視属性名。 |
| `removeButton` | Conditional | `onRemove`がある場合だけ描画する`type="button"`。 |
| `removeIcon` | Conditional | `aria-hidden="true"`の装飾glyph。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `static` | 属性を読み取り専用で表示する。 | rootはtab sequenceへ入りません。 |
| `removable` | 属性を子buttonで解除する。 | `onRemove`と`removeLabel`を組で指定します。 |

Variant propは公開しません。`onRemove`の有無から構造variantが決まります。

## Sizes / Density

Dedicated size propはありません。Tag rootとremove buttonは`--ctl-xs`を使い、Compact / Default / Comfortableの全densityで24px minimum以上を保ちます。touch中心で反復的な削除が主要taskになる場合は、Tagを拡大するのではなく44px以上の行操作を持つ一覧編集UIを優先します。

## Icon Rules

- remove iconは操作名ではなく補助glyphです。常に`aria-hidden="true"`にします。
- iconだけから対象名を推測させません。`removeLabel`に可視labelと削除actionを含めます。
- leading icon、status icon、avatarをTagへ汎用slotとして追加しません。別componentとの責務境界を保ちます。

## States

| State | Behavior |
|---|---|
| `default` | rootは非interactive。removableでもremove buttonは未操作。 |
| `remove-hover` | remove buttonだけにhover feedbackを出す。 |
| `remove-active` | hoverより強いpressed feedbackを出す。 |
| `remove-focus` | remove button外周に`--focus-ring`を表示する。 |

Tagにはselected、pressed、disabled、loading stateを追加しません。削除不可にする場合は`onRemove`を渡さずstatic Tagとして表示します。

## Behavior

- `label`は空でないstringです。
- `onRemove`が未指定ならremove buttonを描画しません。
- `onRemove`を指定する場合、localized `removeLabel`も必須です。例: `design-systemを削除`。
- remove buttonは`type="button"`です。form内でもsubmitを発生させません。
- 1回のnative activationにつき`onRemove`を1回呼びます。Tag自身はDOMから消えず、親のcontrolled collection更新を待ちます。
- 削除後に次、前、入力欄、owner triggerのどこへfocusするかは親collectionが決めます。必要な完了通知も親が単一のstatus regionで管理し、Tagごとにlive regionを作りません。
- Tag単体はBackspace / Deleteを捕捉しません。空の入力から最後のtokenを扱うkeyboard behaviorはTag Input / Combobox ownerの責務です。

### React API Freeze

```ts
type TagBaseProps = {
  label: string
  ref?: React.ForwardedRef<HTMLSpanElement>
}

type TagProps = TagBaseProps & (
  | { onRemove?: never; removeLabel?: never }
  | { onRemove: () => void; removeLabel: string }
)
```

`onRemove`と`removeLabel`は型で条件付きの組にします。JavaScript利用者向けにもruntime assertionを置き、`onRemove`だけが指定された不完全な呼び出しを拒否します。rootへは安全なglobal attributesを渡せますが、`onClick`、`role`、`tabIndex`でTag全体をcontrol化しません。

## Layout / Placement Rules

### Recommended Pattern

- Tag群のwrap、gap、並び順は親layoutが管理します。
- rootは`max-inline-size:100%`、labelは`min-inline-size:0`と`overflow-wrap:anywhere`でcontent lossを防ぎます。
- remove buttonはflex itemとして縮めず、24px minimum targetを保ちます。
- 同名Tagが複数ある場合は、`removeLabel`に追加文脈を含めて対象を識別します。

## Responsive / Viewport Behavior

### Desktop

- intrinsic widthを基本にし、containerを超える長いlabelだけ内部でwrapします。
- remove hover、active、focusを別々に確認します。

### Mobile

- PC用とSP用に分けません。同じcomponentを親layout内で折り返します。
- 省スペースのためにlabelを回収不能なellipsisへせず、必要なら別の属性一覧を提供します。

### Touch

- remove buttonは24px minimumを満たします。
- touch中心の主要操作は原則44px以上にし、反復削除は大きな行操作を持つ別編集UIを優先します。
- 隣接Tagのtargetが重ならないgapを親layoutで確保します。

## Accessibility

- rootは非interactiveな`span`で、roleとtabIndexを追加しません。
- remove buttonはnative `button`、`type="button"`、空でない`aria-label`を持ちます。
- remove iconは`aria-hidden="true"`です。
- Tag自身に`aria-selected`、`aria-pressed`、`aria-live`を追加しません。
- focus-visible ringを常に視認でき、sticky layerで完全に隠しません。
- remove targetは24px minimumを満たし、主要touch操作は44px以上を推奨します。

Keyboard:

- `Enter`: focus中のremove buttonをnative activationします。
- `Space`: focus中のremove buttonをnative activationします。
- `Tab`: removable Tagのremove buttonへ通常のdocument順序で出入りします。static Tagは通過します。
- `Backspace / Delete`: Tag単体では処理しません。Tag Input / Combobox ownerが文脈を持つ場合だけ定義します。

## Content Guidelines

- `label`はユーザーが識別できる属性名をそのまま表示します。
- `removeLabel`は対象とactionを含むlocalized stringにします。「削除」だけにしません。
- 同名の属性が複数存在する場合、必要なowner名や位置をremove nameへ含めます。
- labelから固定の日本語suffixを自動生成しません。

## Tokens

- semanticColor: `--surface-muted`, `--border`, `--fg-muted`, `--fg-subtle`, `--fg`, `--control-bg-hover`, `--control-bg-active`, `--focus-ring`
- typography: `--type-body-sm`, `--type-body-sm-letter-spacing`
- density: `--ctl-xs`
- spacing: `--sp-1`, `--sp-2`
- radius: `--radius-xs`, `--radius-2xs`
- layout: `--focus-w`
- motion: `--dur-fast`, `--ease-standard`

Primitive color、raw hex、任意pxをcomponentから直接選びません。全visual slotはContractの`tokenBindings`へ結線済みです。

### Token Binding Decisions

| Slot | Source | Reason |
|---|---|---|
| root surface / border | `--surface-muted` / `--border` | neutralな属性面を作る。 |
| label type / color | `--type-body-sm` / `--fg-muted` | 短い補助属性として表示する。 |
| root / remove size | `--ctl-xs` | 全densityで24px minimum以上を保つ。 |
| remove hover / active | `--control-bg-hover` / `--control-bg-active` | Button familyと同じinteraction roleを使う。 |
| remove focus | `--focus-ring` / `--focus-w` | contrast modeを含むfocus表現を共有する。 |

Current coverage: `complete`。React package実装前に必要なDOM、state、visual slot、APIの判断は確定しています。

## Do / Don't

Do:

```tsx
<Tag
  label="design-system"
  onRemove={() => removeTag("design-system")}
  removeLabel="design-systemを削除"
/>
```

Don't:

```tsx
<Tag
  label="Active"
  role="button"
  tabIndex={0}
  onClick={toggleSelected}
/>
```

system statusにはBadge、selection toggleには専用selection controlを使います。

## Prohibited Patterns

- Tag root全体への`onClick`、`role="button"`、`tabIndex`。
- `aria-selected`または`aria-pressed`を追加したfilter chip化。
- 24px未満のremove target。
- `onRemove`があるのに空または固定言語自動生成の`removeLabel`を使うこと。
- Tag単体によるBackspace / Delete捕捉。
- raw color、任意spacing、任意radius。

## AI Selection Rules

AIが選ぶ条件:

- user-assigned属性を静的に表示する。
- 同じ属性を明示的な子buttonで解除する。

AIが避ける条件:

- system statusやcountならBadgeを使う。
- selection toggleならdedicated filter chip、Checkbox、Segmented Controlなどを使う。
- tokenized input全体ならComboboxまたはTag Input ownerを使う。

Viewport名でcomponentを分岐せず、`onRemove`の有無だけでstatic / removable構造を決めます。

## Examples

```tsx
<Tag label="accessibility" />

<Tag
  label="design-system"
  onRemove={() => removeTag("design-system")}
  removeLabel="design-systemを削除"
/>
```

## Implementation Notes

- React packageは今後追加します。Contract 0.2.0、HTML Showcase、review recordを実装前の正本として扱います。
- `ref`はroot `HTMLSpanElement`へforwardします。
- remove buttonはTag固有のslotとして実装します。Icon ButtonのTooltipやsize APIを持ち込みませんが、native button、accessible name、target、focusの共通gateは再利用します。
- runtime provenanceはcomponent、instance、variant、state、contract/runtime version、decisionを保持します。

## Open Questions

なし。React実装前に必要な仕様、Contract、Showcaseの判断は確定しています。
