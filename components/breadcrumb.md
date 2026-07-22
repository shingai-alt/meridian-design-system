# Breadcrumb

## Summary

階層化されたinformation architecture内の現在地と親pageへのnative navigation trailです。React実装前Contractは `0.2.0` です。

Machine-readable contract: `design/contracts/components/breadcrumb.contract.json`

## Role

Breadcrumbはpage hierarchyをgeneralからspecificへ示します。Browser history、process progress、Tabs、page titleの代替ではありません。

## Principles

- `nav > ol > li`でlandmarkとhierarchyを伝える。
- Ancestorはnative link、currentは非link textにする。
- Viewportが狭くてもDOMと意味を削らない。

## When To Use

- 3階層以上のpage hierarchyで現在地を示す。
- 親または祖先pageへ直接戻る経路を提供する。

## When Not To Use

- Flatなinformation architecture。
- 訪問履歴を戻る操作。
- Process stepやprogress表示。
- 同一page内のsection切替。

## Visual Model

Ancestorはsubtle foreground、currentはstrong foreground + weightで示します。Separatorはvisual-onlyで、navigation itemのaccessible nameへ含めません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Accessible nameを持つ`nav` landmark。 |
| list | Yes | General→specificの`ol`。 |
| ancestor-link | Yes | 最後より前の`a[href]`。 |
| current-item | Yes | 最後の非link text。`li[aria-current=page]`。 |
| separator | Yes | `aria-hidden` のvisual separator。 |

## Variants

`default` のみです。

## Sizes / Density

Size propはありません。`--text-label`を使い、ancestor linkは`--ctl-xs`で24px minimum heightを保ちます。

## Icon Rules

Item iconは持ちません。SeparatorはCSSまたは`aria-hidden` SVGで描画します。

## States

| State | Behavior |
|---|---|
| `default` | Ancestorのnative link。 |
| `hover` | Foregroundとunderlineでfeedback。 |
| `focus` | Focus-visible ringを表示。 |
| `current` | 最後の非link text。`aria-current="page"`。 |

## Behavior

- `items`はgeneralからspecific順です。
- 最後は`href`なし、それ以前は`href`必須です。
- Current itemはlinkにしません。
- 自動ellipsis menuはv0.2.0で所有せず、narrow viewportではhorizontal scrollで全hierarchyを保持します。

## Layout / Placement Rules

- Page titleの前に配置します。
- 1行・no-wrapを保ち、component内だけhorizontal overflowを許可します。
- Current itemを末尾に保持します。

## Responsive / Viewport Behavior

Desktopでは全hierarchyを1行表示します。Mobileでは同じDOMをhorizontal scrollし、CSSだけで中間itemをaccessibility treeから除外しません。Focused linkはscroll into viewします。

PC用とSP用に分けません。Ancestor linkは24px minimumを満たし、touch中心の主要navigationでは44px以上の配置余地をparent layoutで確保します。

## Accessibility

- Rootは`nav` + `aria-label`または`aria-labelledby`。
- Hierarchyは`ol > li`。
- Current `li`は`aria-current="page"`、中身は非link text。
- Separatorは`aria-hidden`。
- Ancestor linkだけがTab stop。

Keyboard:

- `Tab / Shift+Tab`: Ancestor linkをnative順で移動。
- `Enter`: Focused ancestorへ遷移。

## Content Guidelines

Page titleと一致する短いlabelを使います。組織名など冗長なprefixを各itemで繰り返しません。

## Tokens

`--fg-subtle`, `--fg`, `--focus-ring`, `--text-label`, `--ctl-xs`, `--sp-1`, `--sp-15`, `--radius-xs`, `--dur-fast`, `--ease-standard`。

全visual slotはContractで `complete` binding済みです。

## Do / Don't

Do: Generalからspecificへ並べ、最後を非link current itemにします。

Don't: `div` click handler、separatorの読み上げ、currentのself-link、viewportだけを理由にitemを削除。

## Prohibited Patterns

- Landmarkまたはlist semanticsの欠落。
- Current itemのself-link。
- CSSだけで中間itemをaccessibility treeから隠す。
- Raw color、spacing、focus style。

## AI Selection Rules

3階層以上のpage hierarchyだけに選択します。Flat pageはtitle、履歴移動はBack Link、processはWorkflow Step、view切替はTabsを選択します。

## Examples

```tsx
<Breadcrumb
  items={[
    { label: 'Workspace', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Meridian' },
  ]}
/>
```

## Implementation Notes

Runtimeでitems invariantをdevelopment warningとして検証します。`ref`はnative `nav`へforwardします。

### React API Freeze

```ts
type BreadcrumbItem = { label: string; href?: string }
type BreadcrumbProps = {
  items: readonly BreadcrumbItem[]
  ariaLabel?: string // 'Breadcrumb'
  ref?: ForwardedRef<HTMLElement>
}
```

## Open Questions

Contract上のopen questionはありません。React実装とvisual regression完了後にstableへ昇格します。
