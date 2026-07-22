# Sidebar

## Summary

恒常的なapp destinationをgroup化して提示する、名前付きnavigation landmarkです。React実装前Contractは `0.2.0` です。

Machine-readable contract: `design/contracts/components/sidebar.contract.json`

## Role

Sidebarはnavigationの意味とgroup/list構造だけを所有します。Desktopのcolumn配置、mobileのDrawer、開閉trigger、overlay、focus trap、Escape、focus returnはApp ShellまたはDrawerが所有します。

## Principles

- Native `nav` と `ul > li` hierarchyを使う。
- Navigation Item、Workspace Switcher、User Menuの既存Contractを合成する。
- Viewportごとに意味やReact APIを複製しない。

## When To Use

- 5件以上の恒常的destinationを持つapp。
- Workspace switcher、group、footer actionをprimary navigationと同じ領域で構成する。

## When Not To Use

- 3〜4件のpeer viewはTabsまたはTop Barを使う。
- Page内section navigationはTable of Contentsを使う。
- Mobile overlay containerはDrawerを使う。
- Commandや一時actionはMenuを使う。

## Visual Model

`--sidebar-bg` の常設surfaceをborderでmain contentから分離します。Group labelはdestinationより弱く、current/hover/focusの表現はNavigation Itemが所有します。Sidebar自身にcard、shadow、priority variantを追加しません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Accessible nameを持つnative `nav`。 |
| header | No | Workspace switcherなどnavigation context。 |
| group | Yes | Optional labelと`ul`を持つdestination group。 |
| navigation-item | Yes | `li`内のNavigation Item。 |
| footer | No | User Menuやsettingsなど恒常的な補助control。 |

## Variants

`default` のみです。同じSidebarをDesktop App Shellまたはmobile Drawerへ配置します。

## Sizes / Density

Size propはありません。Inline幅は `--sidebar-w`、child targetは周辺densityへ従います。Viewportだけでdensityやcomponent APIを切り替えません。

## Icon Rules

Destination iconはNavigation Itemの可視labelと併用します。Sidebarが自動でicon-onlyへcollapseすることはありません。Icon-only navigationが必要な製品要件は別compositionとして設計し、Tooltipだけをaccessible nameにしません。

## States

| State | Behavior |
|---|---|
| `default` | Named landmark、list hierarchy、全可視labelを維持。 |

Visibility、mobile open、collapsedはSidebar stateではなくApp Shell／Drawer placement stateです。

## Behavior

- Rootは `nav`。Page内の他navと区別できるaccessible nameを持ちます。
- Groupは`ul > li`でdestination hierarchyを表します。
- Current pageはSidebar全体で1件だけです。
- `role="menu"`、`role="menuitem"`、roving tabindexを追加しません。
- Sidebar独自のArrow keyやglobal shortcutを追加しません。

## Layout / Placement Rules

- Header、groups、footerをDOM/reading orderどおりに並べます。
- Root内部だけを縦scroll可能にし、focused itemを完全に隠しません。
- Footerはborderでprimary destinationから分離します。
- App ShellがSidebarのsticky/column placementを所有します。

## Responsive / Viewport Behavior

DesktopではApp Shellのinline columnへ置き、main contentを覆いません。Mobileでは同じ`nav`とlist DOMをDrawerへ配置し、Drawer triggerが`aria-controls`と`aria-expanded`、DrawerがEscapeとfocus managementを所有します。

PC用とSP用に分けません。Touch targetは24px minimumを満たし、primary navigationでは44px以上を推奨します。

## Accessibility

- Native `nav`へ重複する`role="navigation"`を付けません。
- 複数navがあるpageでは一意なlabelを付けます。
- Destinationは`ul > li > a[href]`構造を持ちます。
- Native Tab順を維持し、通常navigationへmenu keyboard modelを持ち込みません。
- Drawer配置時のinitial focus、trap、Escape、focus returnはparent責務です。

Keyboard:

- `Tab / Shift+Tab`: Native document順でlinksとcontrolsを移動。
- `Enter / Space`: Focused native link/button固有のactivation。

## Content Guidelines

Group labelは3件以上の意味あるまとまりにだけ使い、短い名詞にします。Destination labelは重複や曖昧語を避け、footer controlも結果が分かるaccessible nameを持ちます。

## Tokens

`--sidebar-bg`, `--bg-subtle`, `--border`, `--border-muted`, `--fg-subtle`, `--sidebar-w`, `--sp-1`, `--sp-2`, `--sp-3`, `--text-micro`。

全visual slotはContractで `complete` binding済みです。

## Do / Don't

Do: Named `nav`、list hierarchy、1件のcurrent Navigation Itemを使い、responsive placementをparentへ委譲します。

Don't: Sidebarへdialog/menu semantics、focus trap、viewport別API、icon-only自動collapseを追加しません。

## Prohibited Patterns

- `role="menu"` / `role="menuitem"` とroving tabindex。
- List semanticsのない平坦なanchor列。
- Sidebar自身によるDrawer focus management。
- Current pageが複数。
- Raw color、spacing、width。

## AI Selection Rules

5件以上の恒常的destinationをgroup化する場合だけSidebarを選びます。少数peer viewはTabs、page内navigationはTable of Contents、overlayはDrawer、commandはMenuを選びます。

## Examples

```tsx
<Sidebar ariaLabel="Primary">
  <Sidebar.Header><WorkspaceSwitcher /></Sidebar.Header>
  <Sidebar.Group label="Workspace">
    <NavigationItem href="/dashboard" current>ダッシュボード</NavigationItem>
    <NavigationItem href="/projects">プロジェクト</NavigationItem>
  </Sidebar.Group>
  <Sidebar.Footer><UserMenu /></Sidebar.Footer>
</Sidebar>
```

## Implementation Notes

`Sidebar.Group`はlabelとchildren、`Sidebar.Footer`はchildrenを受け取ります。Rootはnative `nav`属性を透過し、`ref`を`HTMLElement`へforwardします。Parentが同じSidebar nodeをApp ShellまたはDrawerへ配置します。

### React API Freeze

```ts
type SidebarProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  ariaLabel?: string // "Primary"
  ref?: ForwardedRef<HTMLElement>
}

type SidebarGroupProps = {
  label?: string
  children: ReactNode // NavigationItem instances
}

type SidebarFooterProps = { children: ReactNode }
```

## Open Questions

Contract上のopen questionはありません。React実装、App Shell／Drawer integration、visual regression完了後にstableへ昇格します。
