# Drawer

## Summary

現在の画面文脈を視覚的に残しながら、画面端へ一時的な補助taskをmodal表示するside-aligned dialogです。React実装前Contractは `0.2.0` です。

Machine-readable contract: `design/contracts/components/drawer.contract.json`

## Role

Drawerはtrigger、modal lifecycle、side placement、backdrop、focus containment、dismiss、focus returnを所有します。内部へ置くSidebar、form、detail contentはそれぞれの意味を維持します。

## Principles

- Native `<dialog>`を`showModal()`で開き、宣言だけでなく背景を実際にinertにする。
- Side placementとdialog semanticsを分離し、見た目を理由にmodal責務を弱めない。
- PC用とSP用に分けません。同じ意味とReact APIをlogical sideとviewportへ適応します。

## When To Use

- 一覧から詳細を確認・軽く編集するquick view。
- 現在の画面へ戻る前提のfilter、settings、補助form。
- Narrow viewportでSidebar navigationを一時的に提示するmodal container。

## When Not To Use

- 短い確認や不可逆actionの判断はDialogを使う。
- 常設navigationはSidebar、常設inspectorはlayout panelを使う。
- 長いmulti-step workflowや固有URLが必要なtaskは専用pageを使う。

## Visual Model

`--surface-overlay`のfull-height surfaceをlogical inline edgeへ接続し、borderと`--shadow-overlay`で背景から分離します。`::backdrop`は`--overlay`を使います。Viewport edgeと連続するためcard radiusは付けません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| trigger | Yes | Openし、close後にfocusを受け取るcontrol。 |
| backdrop | Yes | 背景が操作不能であることを示すscrim。 |
| surface | Yes | Native `dialog` modal surface。 |
| title | Yes | `aria-labelledby`でsurfaceを命名する可視heading。 |
| close-control | Yes | Accessible nameを持つ常時visibleなIcon Button。 |
| body | Yes | 独立してscrollする補助content。 |
| footer | No | Body scrollから独立したaction領域。 |

## Variants

`default` のみです。`side`は意味variantではなくlogical placement propです。

## Sizes / Density

Size propはありません。Inline sizeは`--drawer-w`、上限は`100vi`、block sizeは`100dvb`です。Internal controlsは周辺densityへ従います。24px minimumを必須とし、主要touch controlは44px以上を推奨します。

## Icon Rules

Close controlはIcon Buttonを使い、`closeLabel`からprogrammatic accessible nameを持ちます。その他のiconはchildren側のContractに従い、iconだけへ意味を閉じ込めません。

## States

| State | Behavior |
|---|---|
| `open` | `showModal()`でtop layerへ表示し、背景をinert化してfocusを内部へ移す。 |
| `closed` | Surfaceは非表示。Triggerは`aria-expanded="false"`で通常のdocument順に残る。 |

Reactの`open` propとnative `open` attributeは同一物ではありません。Componentはprop変更を`showModal()` / `close()`へ同期し、attributeだけを直接追加・削除しません。

## Behavior

- Triggerへ`aria-haspopup="dialog"`、`aria-controls`、`aria-expanded`を合成します。
- Open時はnative `showModal()`を使い、`cancel`、close control、backdrop pointerを同じclose requestへ統合します。
- Escapeはcancel可能なclose requestを発行します。
- Close後は原則triggerへfocusを戻します。Triggerが消えた場合だけworkflow上の論理的な次の要素へ移します。
- Backdropが見えていても背景contentは操作できません。背景との並行操作が必要ならDrawerを使いません。

## Layout / Placement Rules

- Surfaceは`side="inline-end"`を既定とし、RTLのdirectionへ追従します。
- Header、body、footerをDOM順に配置し、bodyだけをscrollさせます。
- Titleとvisible close controlをscroll領域の外へ保ちます。
- Footerがある場合、body内のfocused elementを完全に隠さないscroll paddingを確保します。
- Full-height edge surfaceへcard radiusや重複したinner shadowを追加しません。

## Responsive / Viewport Behavior

Desktopでは`--drawer-w`を使い、背景の位置関係を視覚的に残します。ただしmodal中の背景操作は許可しません。

Mobileでは同じdialogとAPIのまま`max-inline-size: 100vi`へ収め、`100dvb`、safe area、software keyboardを考慮します。Sidebar compositionでもDrawerがclose/focus lifecycle、Sidebarがnavigation semanticsを所有します。

Touchではbackdrop tapをclose requestとして扱えますが、visible close controlを必ず残します。Swipe gestureを追加しても唯一のdismiss経路にしません。

## Accessibility

- Native `<dialog>`を`showModal()`で開き、modal外を実際にinertにします。
- Dialogは可視titleを参照する`aria-labelledby`で命名します。
- Structured contentを一続きに読ませる`aria-describedby`は既定で付けません。
- Open時は`initialFocusRef`、先頭の意味あるcontrol、または`tabindex="-1"`のstatic title/contentへfocusを移します。
- Tab sequenceをsurface内へ保持し、positive tabindexを使いません。
- Visible close controlは24px minimum、touch中心では44px以上を推奨します。

Keyboard:

- `Tab / Shift+Tab`: Open中はDrawer内のtabbable element間を循環。
- `Escape`: Cancel可能なclose requestを発行し、close後にtriggerへfocus return。

## Content Guidelines

Titleは対象とtaskが分かる名詞句または短い動詞句にします。Close controlはlocaleに合う具体的なlabelを持ちます。長いworkflow、重要な判断、page固有navigationをDrawerへ詰め込みません。

## Tokens

`--surface-overlay`, `--border`, `--fg`, `--fg-muted`, `--overlay`, `--sp-3`, `--sp-4`, `--text-label`, `--dur-normal`, `--ease-enter`, `--drawer-w`, `--shadow-overlay`。

全visual slotはContractで`complete` binding済みです。Child controlsのvisual tokenはButton / Icon Button側が所有します。

## Do / Don't

Do: Quick detail、補助form、mobile Sidebarをmodal lifecycle付きの一時surfaceとして構成します。

Don't: `aria-modal="true"`だけを付けて背景を操作可能にする、native `open` attributeをrenderで直接toggleする、close controlを省略する。

## Prohibited Patterns

- `div role="dialog"`へARIAだけを付け、背景をinertにしない。
- Native dialogの`open` attributeを直接追加・削除する。
- Close後のfocusを`body`へ落とす。
- Backdrop tapまたはswipeだけにdismissを依存する。
- Fixed 420pxでmobile横overflowを起こす。
- Raw color、spacing、shadow、width。

## AI Selection Rules

現在の画面へ戻る前提の補助taskをmodalなside surfaceで完了する場合だけDrawerを選びます。短い判断はDialog、常設領域はSidebar/layout panel、長いworkflowは専用page、trigger近傍の小さな補助UIはPopoverを選びます。

## Examples

```tsx
<Drawer
  trigger={<Button variant="secondary">詳細を表示</Button>}
  title="MRD-142 の詳細"
  open={open}
  onOpenChange={setOpen}
  footer={<Button fullWidth>Issueを開く</Button>}
>
  <IssueSummary issue={issue} />
</Drawer>
```

```tsx
<Drawer
  trigger={<IconButton label="ナビゲーションを開く" icon={<MenuIcon />} />}
  title="ナビゲーション"
>
  <Sidebar ariaLabel="Primary">…</Sidebar>
</Drawer>
```

## Implementation Notes

Native dialogはportal先でrenderし、controlled/uncontrolled stateを`showModal()`、`requestClose()`、`close()`、`cancel`、`close` eventへ同期します。Backdrop pointerは`event.target === dialog`の場合だけclose requestとして扱います。Reduced motionではside transformを除去します。

### React API Freeze

```ts
type DrawerProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, 'open' | 'onClose'> & {
  trigger: ReactElement
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
  open?: boolean
  defaultOpen?: boolean // false
  onOpenChange?: (open: boolean) => void
  side?: 'inline-start' | 'inline-end' // inline-end
  initialFocusRef?: RefObject<HTMLElement | null>
  closeLabel?: string // "閉じる"
  ref?: ForwardedRef<HTMLDialogElement>
}
```

## Open Questions

Contract上のopen questionはありません。React実装、native dialog lifecycle integration、visual regression完了後にstableへ昇格します。
