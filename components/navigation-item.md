# Navigation Item

## Summary

永続navigationのlist内で、単一destinationと現在地を表すnative linkです。React実装前Contractは `0.2.0` です。

Machine-readable contract: `design/contracts/components/navigation-item.contract.json`

## Role

Navigation Itemはanchor 1件だけを所有します。`nav`、`ul`、`li`、group disclosure、drawer closeはSidebarなどのparentが所有します。

## Principles

- Native anchor semanticsを維持する。
- Current pageはprogrammatic stateと非色cueを同期する。
- Site navigationへmenu widget modelを持ち込まない。

## When To Use

- Sidebarやproduct navigation内で単一destinationを示す。
- 現在表示中のpageをaria-currentで示す。

## When Not To Use

- 本文中の単独遷移はLinkを使う。
- Action実行はButtonを使う。
- Submenu開閉は別のDisclosure Buttonを使う。
- 同一page内のview selectionはTabsを使う。

## Visual Model

通常はtransparent + muted foreground、hoverはmuted surface、currentは`--sidebar-item-active-bg` + `--primary` + font weightで示します。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | `href`を持つnative anchor。 |
| icon | No | Labelを補強するdecorative icon。 |
| label | Yes | Destinationを示す可視text。 |
| badge | No | 未読または件数metadata。 |
| current-indicator | No | `aria-current` と同期する非色cue。 |

## Variants

`default` のみです。Priority variantはLink/Buttonへ委譲します。

## Sizes / Density

Size propはありません。Parent densityの`--ctl-sm`へ追従し、touch中心ではparentがComfortable densityを選びます。

## Icon Rules

Iconはlabelと併用し `aria-hidden` にします。Icon-only navigationはNavigation Itemで作りません。Sidebar collapsed modeはIcon Button/Tooltipを含む別compositionとして扱います。

## States

| State | Behavior |
|---|---|
| `default` | Native linkとしてTab/Enterを保持。 |
| `hover` | Surfaceとforegroundをtokenで変更。 |
| `focus` | `--focus-ring` を表示。 |
| `current` | `aria-current="page"`、surface、weightを同期。 |

## Behavior

- `current=true` のときだけ `aria-current="page"` を設定します。
- Native anchor attributesを透過します。
- `role="menuitem"`、roving tabindex、Arrow key modelは追加しません。
- Navigation後にmobile drawerを閉じる責務はparentにあります。

## Layout / Placement Rules

- Parentの`ul > li`内へ置きます。
- Icon、label、badgeは1行。Labelは省略表示してもaccessible nameを保持します。
- Badgeは末尾へ寄せ、長いlabelと衝突させません。

## Responsive / Viewport Behavior

Desktopとmobile drawerで同じanchor APIとDOM順を使います。Touch中心の主要navigationでは44px targetを推奨し、最低24pxを保ちます。

PC用とSP用に分けません。すべての入力方式で24px minimumを満たし、touch中心の主要navigationは44px以上を推奨します。

## Accessibility

- `href`を持つnative anchor。
- 可視labelをaccessible nameにする。
- Currentは `aria-current="page"` とbackground/weightを併用。
- Decorative iconは`aria-hidden`。
- Native Tab順とfocus-visible ringを維持。

Keyboard:

- `Tab / Shift+Tab`: Native document順で移動。
- `Enter`: Destinationへ遷移。

## Content Guidelines

Destination名を簡潔に書きます。同じnavigation内で重複する曖昧labelを避け、badgeは短い件数または未読情報に限定します。

## Tokens

`--sidebar-item-active-bg`, `--fg-muted`, `--fg`, `--surface-muted`, `--primary`, `--primary-subtle`, `--focus-ring`, `--ctl-sm`, `--text-label`, `--text-micro`, `--sp-1`, `--sp-2`, `--radius-sm`, `--radius-full`, `--dur-fast`, `--ease-standard`。

全visual slotはContractで `complete` binding済みです。

## Do / Don't

Do: Parent list内でcurrent itemを1件だけ設定します。

Don't: `div role="menuitem"`、currentを色だけで示す、Navigation Itemへsubmenu buttonを内包する。

## Prohibited Patterns

- `role="menuitem"` とroving tabindex。
- `href`なしのclickable root。
- Icon-only label。
- Raw color、spacing、radius。

## AI Selection Rules

永続navigationの単一destinationだけに選択します。本文はLink、actionはButton、view selectionはTabs、disclosureはButtonを選択します。

## Examples

```tsx
<NavigationItem href="/projects" icon={<FolderIcon />} badge={12} current>
  プロジェクト
</NavigationItem>
```

## Implementation Notes

Anchor propsを透過し、`ref`は`HTMLAnchorElement`へforwardします。Parentのnavigation/list semanticsを変更しません。

### React API Freeze

```ts
type NavigationItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode
  href: string
  icon?: ReactNode
  badge?: ReactNode
  current?: boolean // false
  ref?: ForwardedRef<HTMLAnchorElement>
}
```

## Open Questions

Contract上のopen questionはありません。React実装とvisual regression完了後にstableへ昇格します。
