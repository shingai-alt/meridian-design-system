# Avatar

## Summary

1つの人物、チーム、resourceを画像または明示fallbackで表す、非interactiveな視覚識別子です。

Machine-readable contract: `design/contracts/components/avatar.contract.json`

## Role

Avatarが所有するのは単一対象の画像／fallback表現だけです。名前、状態、操作、複数人の集合表現は所有しません。

## Principles

- 単一対象の識別、画像代替、静的geometryだけを所有する。
- native `img alt`を優先し、fallbackでも同じtext alternativeを維持する。
- PC用とSP用に別componentを作らず、同じ意味とAPIを保つ。

## When To Use

- 人物、チーム、resourceを一覧やsummaryで補助的に識別する。
- 画像を取得できない間も、呼び出し側が決めた短いfallbackで同じ対象を識別する。

## When Not To Use

- 対象名の唯一の可視表現にはTextを使う。
- presence、availability、system statusにはStatus IndicatorまたはBadgeを使う。
- クリック、menu opening、selectionをAvatar rootへ持たせず、Button、Icon Button、User Menuなどの親controlを使う。
- 重なり、人数省略、+N、集合全体の要約はAvatarではなく親collection/compositionが所有する。

## Contract Boundary

Avatarは常に表示専用です。親control内に配置しても、Avatar自身へ`onClick`、`role="button"`、`tabIndex`、`aria-pressed`、`aria-selected`を追加しません。

`AvatarStack`はAvatarのvariantでも子componentでもありません。複数人の順序、overlap、表示上限、`+N`、集合のaccessible summaryは、その文脈を知る親が決めます。

## Visual Model

円形rootへ画像または短いfallbackを1つだけ表示します。境界、fallback面、文字色、sizeは公開tokenへ結線し、status dot、shadow、interaction feedbackは追加しません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | 意味とfocusを追加しない`span`。 |
| image | No | `src`がloadedのときだけ表示するnative `img`。 |
| fallback | Yes | no-src、loading、errorで表示するcaller-provided文字列。 |

`image`と`fallback`は同時に表示しません。

## Variants

`default`のみ。意味を変えずにvisual variantを増やしません。

## Sizes / Density

| Size | Root | Fallback font | Typical use |
|---|---|---|---|
| `xs` | `--ctl-xs` | `--text-micro` | denseな補助識別。 |
| `sm` | `--ctl-sm` | `--text-micro` | compact list。 |
| `md` | `--ctl-md` | `--text-small` | 標準。 |
| `lg` | `--ctl-lg` | `--text-label` | profile summary。 |

size propはviewportから暗黙変更しません。各sizeの実寸はsystem densityへ追従し、周辺UIと一緒にcompact/default/comfortableへ適応します。

## Icon Rules

Avatarはicon slotを持ちません。人物画像の代わりに任意iconを入れず、AIやproduct markが必要ならその専用componentを選びます。

## States

| State | Visible slot | Semantics |
|---|---|---|
| `default` | fallback | no-src。`alt`に応じてinformativeまたはdecorative。 |
| `loading` | fallback | 画像取得中も同じgeometryとtext alternativeを維持。 |
| `loaded` | native `img` | `alt`をそのまま`img`へ渡す。 |
| `error` | fallback | image error後にfallbackへ戻す。retry/error UIは親が所有。 |

## Behavior

- `src`未指定、loading、errorではfallbackを表示する。
- loaded時だけnative `img`を表示する。
- load/errorでroot geometry、`alt`の意味、layout位置を変えない。
- retry、status、collection truncation、actionは親が所有する。

## Layout / Placement Rules

- Avatar自身はintrinsicな正方形を保ち、flex内で縮小しない。
- 隣接する可視名とのgap、複数Avatarのoverlap、`+N`は親layoutが管理する。
- sizeをviewport名から自動選択しない。

## React API Freeze

```tsx
type AvatarProps = {
  src?: string
  alt: string
  fallback: string
  size?: "xs" | "sm" | "md" | "lg"
  ref?: React.ForwardedRef<HTMLSpanElement>
}
```

- `size`の既定値は`md`。
- `alt`と`fallback`は必須。隣接する可視名や親control名と重複するときは`alt=""`を明示する。
- `fallback`は呼び出し側がlocaleと対象文脈から決める1〜2 grapheme cluster。Avatarは`name`、file name、emailから自動生成・切り詰めしない。
- `ref`はroot `span`へforwardする。
- native global propsを継承するが、interactive propsをAvatarへ付与しない。

## Runtime DOM

Loaded informative image:

```html
<span class="avatar" data-meridian-state="loaded">
  <img class="avatar-image" src="…" alt="新谷 尚史">
</span>
```

Informative fallback:

```html
<span class="avatar" data-meridian-state="error">
  <span class="avatar-fallback" role="img" aria-label="新谷 尚史">SN</span>
</span>
```

Decorative fallback next to a visible name:

```html
<span class="avatar" data-meridian-state="default">
  <span class="avatar-fallback" aria-hidden="true">SN</span>
</span>
<span>新谷 尚史</span>
```

Loaded時はnative `img alt`、fallback時は空でない`alt`だけを`role="img" aria-label`へ写します。`alt=""`のfallbackは`aria-hidden="true"`です。`title`は使いません。

## Accessibility

- 単独で対象を伝えるAvatarは空でないlocalized `alt`を持つ。
- 隣接する可視名または親controlのaccessible nameと重複するAvatarは`alt=""`にする。
- 画像、fallback、loading、errorで対象のtext alternativeを変えない。
- fallback文字列そのものをaccessible nameとして推測しない。
- rootはtab sequenceへ入らず、keyboard interactionを持たない。
- interaction文脈では親native controlだけがfocusとtarget sizeを所有する。

## Collection Composition

```tsx
<span role="img" aria-label="メンバー: 新谷、Yuki、ほか3名">
  <span aria-hidden="true">
    <Avatar alt="" fallback="SN" size="xs" />
    <Avatar alt="" fallback="YK" size="xs" />
    <span>+3</span>
  </span>
</span>
```

この例の`role="img"`、summary、`+3`は親compositionのcontractです。Avatar APIへ`users`、`max`、overlapを追加しません。

## Responsive / Viewport Behavior

### Desktop

- 文脈に合うsizeを明示指定し、画像とfallbackで同じgeometryを保つ。
- 集合のspacingとoverlapは親layoutが管理する。

### Mobile

- 同じ意味、`alt`、`fallback`、size APIを維持する。
- viewportだけを理由にalternative textを省略しない。

### Touch

- Avatarはtargetではない。
- 操作可能に見せる場合はButtonやUser Menu trigger内へ配置する。親controlは24px minimumを満たし、主要操作の親targetを原則44px以上にする。

## Tokens

- Color: `--primary-muted`, `--primary`, `--border`
- Radius: `--radius-full`
- Geometry: `--ctl-xs`, `--ctl-sm`, `--ctl-md`, `--ctl-lg`
- Fallback typography: `--text-micro`, `--text-small`, `--text-label`

Avatarは既存density scaleと同じ4段階を使えるため、固有Component tokenを追加しません。全visual slotのbinding coverageは`complete`です。

## Content Guidelines

- `alt`は対象を文脈内で識別できる簡潔なlocalized textにする。
- 隣接Textが同じ対象名を伝えるときは`alt=""`にする。
- fallbackは1〜2 grapheme clusterへ事前に決定し、Avatar内で自動生成しない。
- `+N`やstatus labelをfallbackへ入れない。

## Do / Don't

Do:

```tsx
<Avatar src={user.photoUrl} alt="" fallback="SN" size="sm" />
<span>新谷 尚史</span>

<Avatar src={user.photoUrl} alt="新谷 尚史" fallback="SN" size="md" />
```

Don't:

```tsx
<Avatar name="新谷 尚史" onClick={openUserMenu} />
<Avatar alt="ほか3名" fallback="+3" />
```

## Prohibited Patterns

- `name.slice(0, 2)`などのfallback自動生成。
- rootへの`onClick`、interactive role、`tabIndex`。
- 隣接可視名と同じ`alt`による二重読み上げ。
- `+N`、presence dot、status、arbitrary iconのAvatar内包。
- raw hex、任意radius、非公開size値の直接指定。

## AI Selection Rules

AIは単一対象の補助的な視覚識別にだけAvatarを選びます。名前はText、状態はStatus IndicatorまたはBadge、操作はButton系、集合の要約は親compositionを選びます。`alt`のinformative/decorative判定とfallback文字列を呼び出し文脈から明示し、推測APIを生成しません。

## Examples

```tsx
// Adjacent visible name: decorative
<Avatar src={user.photoUrl} alt="" fallback="SN" size="sm" />

// Standalone identity: informative
<Avatar src={user.photoUrl} alt="新谷 尚史" fallback="SN" size="md" />
```

## Required Showcase Scenarios

`default`, `loading`, `loaded`, `error`, `informative-image`, `decorative-image`, `explicit-fallback`, `adjacent-name`, `interactive-parent`, `xs`, `sm`, `md`, `lg`, `mobile`。

## Implementation Notes

- React package実装前のContractは`0.2.0`で確定。
- 現在のstatusは`draft`。React実装、load/error unit test、theme/density/responsive visual regressionがCIで通った時点で`stable`へ昇格する。
- Contract上のopen questionはありません。

## Open Questions

なし。React実装とCI visual regressionはstable昇格条件であり、Contract未確定事項ではありません。
