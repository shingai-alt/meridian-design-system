# Top Bar

## Summary

App shell上端で現在地とpage横断actionを構成するheaderです。React実装前Contractは `0.2.0` です。

Machine-readable contract: `design/contracts/components/top-bar.contract.json`

## Role

Top Barは`leading`、`location`、`actions`のlayoutを所有します。Breadcrumbは自身のnavigation landmarkを、Icon ButtonやSearch Fieldは自身のname/keyboard semanticsを所有します。Top Bar自身はnavigationでもtoolbarでもありません。

## Principles

- Native `header`でshell contextをまとめる。
- Child componentのlandmark、focus、accessible nameを上書きしない。
- Narrow viewportでも現在地とglobal functionへの到達経路を残す。

## When To Use

- Breadcrumbまたは現在地とglobal search、notifications、account controlsを一貫して配置する。
- Responsive navigation triggerをshell上端へ置く。

## When Not To Use

- Page固有titleとactionはPage Headerを使う。
- Destination listはSidebarを使う。
- 編集command群はToolbarを使う。
- 現在地だけならBreadcrumbまたはpage titleを単独で使う。
- Top Bar自身をnavigation landmarkにしない。

## Visual Model

`--surface`とbottom borderでmain contentから分離する単一行のshell headerです。Elevationや半透明blurを必須にせず、sticky時もcontent contrastを一定に保ちます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | Native `header`。 |
| leading | No | Sidebar triggerまたはproduct context。 |
| location | Yes | Breadcrumbまたは現在地label。 |
| actions | No | Search、notification、accountなどglobal controls。 |

## Variants

`default` のみです。`sticky`はvariantではなくplacement stateです。

## Sizes / Density

Size propはありません。Block sizeは `--topbar-h`、child controlは周辺densityへ従います。Viewportだけでdensityを変えません。

## Icon Rules

Icon-only global actionはIcon Buttonを使い、programmatic labelと可視Tooltipを持ちます。Top Barはchild iconのaccessible nameを生成しません。

## States

| State | Behavior |
|---|---|
| `default` | Document flow内でlocationとactionsを表示。 |
| `sticky` | `data-sticky=true`で上端固定し、後続focus targetを隠さない。 |

## Behavior

- Rootは`header`。`role="navigation"`や`role="toolbar"`を付けません。
- `location`はrequiredで、現在地を常に識別可能にします。
- DOM/focus orderはleading → location内links → actionsです。
- Page固有primary actionはPage Headerへ置きます。
- Sticky高さとdocumentのscroll offsetを`--topbar-h`で同期します。

## Layout / Placement Rules

- Locationがavailable inline spaceを受け取り、actionsを押し出しません。
- Actionsは末尾にgroup化しますがtoolbar roleは使いません。
- Sticky Top Barはmain contentのfocused targetを完全に覆いません。
- Horizontal document overflowを発生させません。

## Responsive / Viewport Behavior

Desktopではleading、full location、global actionsを1行に配置します。MobileではSidebar triggerとlocationを優先し、secondary global actionsはprogrammatic labelとTooltipを持つIcon Button、またはMenu/Popoverへ再構成します。CSSで唯一のsearch/account経路を隠しません。

PC用とSP用に分けません。同じ`location`、`leading`、`actions` APIを維持します。Touch targetは24px minimumを満たし、主要controlは44px以上を推奨します。

## Accessibility

- Native `header`へ明示的な`role="banner"`を追加せず、document contextのlandmark mappingに従います。
- Top Barへ`role="navigation"`を付けず、Breadcrumbがnamed navを所有します。
- Actionsへ`role="toolbar"`を付けず、native Tab順を維持します。
- Sticky時は`scroll-padding`または`scroll-margin`を`--topbar-h`へ同期します。
- Labelを省略するactionはprogrammatic labelとTooltipを維持し、hidden actionには同じ機能へ到達できるMenu等の経路を残します。

Keyboard:

- `Tab / Shift+Tab`: Leading、location内links、actionsをnative順で移動。
- `Enter / Space`: Child component固有のnative activation。

## Content Guidelines

Locationはpage hierarchyまたは現在地を明確に書きます。Actionsはpage横断機能に限定し、同じ機能をviewportごとに異なる名前へ変えません。

## Tokens

`--surface`, `--border`, `--fg`, `--topbar-h`, `--sp-2`, `--sp-4`。

全visual slotはContractで `complete` binding済みです。

## Do / Don't

Do: `header`内にBreadcrumbとglobal actionsを合成し、sticky offsetをlayout tokenへ同期します。

Don't: Top Bar rootをnav/toolbarにする、page固有actionを混ぜる、narrow viewportで唯一のglobal actionを消す。

## Prohibited Patterns

- Rootの`role="navigation"`または`role="toolbar"`。
- Locationなしのaction bar。
- Sticky headerによるfocused targetの完全な遮蔽。
- 代替経路のない`display:none` action。
- Raw height、color、spacing。

## AI Selection Rules

App全体の現在地とglobal actionsをshell上端へ置く場合だけTop Barを選びます。Page固有contentはPage Header、destination listはSidebar、command groupはToolbarを選びます。

## Examples

```tsx
<TopBar
  leading={<SidebarTrigger />}
  location={<Breadcrumb items={crumbs} />}
  actions={<><SearchField /><NotificationButton /><UserMenu /></>}
/>
```

## Implementation Notes

`location`、`leading`、`actions`を固定DOM順のwrapperへ配置します。`ref`はnative `header`へforwardし、child propsやlandmarkを変更しません。

### React API Freeze

```ts
type TopBarProps = HTMLAttributes<HTMLElement> & {
  location: ReactNode
  leading?: ReactNode
  actions?: ReactNode
  sticky?: boolean // false
  ref?: ForwardedRef<HTMLElement>
}
```

## Open Questions

Contract上のopen questionはありません。React実装、sticky/focus integration、visual regression完了後にstableへ昇格します。
