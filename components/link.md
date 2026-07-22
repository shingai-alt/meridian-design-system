# Link

## Summary

現在の文脈から別のURLまたは同一document内の位置へ移動するnative hyperlinkです。

Machine-readable contract: `design/contracts/components/link.contract.json`

Contract version: `0.2.0`

## Role

Linkはnavigationだけを所有します。現在の文脈でcommandを実行する場合はButton、現在位置を含むnavigation構造はBreadcrumbやNavigation Itemが所有します。PC用とSP用に別componentを作らず、同じhrefとAPIをlayout、typography、input methodへ適応させます。

## Principles

- `href`を持つnative `<a>`を使い、browser標準のnavigation、context menu、copy linkを保持する。
- 見た目ではなく結果がnavigationかactionかでLinkとButtonを選ぶ。
- Link目的と通常と異なる結果を、visible textとprogrammatic contextで予測可能にする。
- Disabled Linkを作らない。

## When To Use

- 別ページ、別resource、同一document内の位置へ移動する。
- 本文中で関連情報や出典を参照する。
- 外部サイトまたはdownload先への遷移を明示する。

## When Not To Use

- データの作成、更新、削除、送信、Dialog表示など現在の文脈でactionを実行する場合はButtonを使う。
- 遷移先が存在しない状態をdisabled Linkで表さず、textへ戻すかLink自体を表示しない。
- カード全体をLinkにして内部のButtonやLinkを入れ子にしない。

## Visual Model

Inline Linkは通常時からunderlineを表示し、周辺本文と色だけで区別しません。Standalone Linkはnavigation群やCTA補助など明確な配置文脈とdirection indicatorを持ち、hover・focusではunderlineも表示します。Buttonのsurfaceや固定control heightは持ちません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | `href`を必須とするnative `<a>`。 |
| label | Yes | 遷移先または目的を説明する可視text。 |
| leading-icon | No | Resource種別を補足する装飾icon。 |
| trailing-indicator | No | External、download、new-tab結果を視覚・音声で補足する。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `inline` | 本文中の参照。 | Underlineを常時表示する。既定値。 |
| `standalone` | Navigation群、footer、CTA補助。 | 明確な配置文脈またはdirection indicatorが必要。 |

Button風のvariantやdisabled variantは提供しません。

## Sizes / Density

Link固有のsize propはありません。Inline flowでは周辺typographyとline-heightを継承し、Standaloneでも任意のcontrol heightを作りません。Density変更時もhref、label、variant、native semanticsを維持します。

## Icon Rules

- Leading/trailing iconは`aria-hidden="true"`にし、labelの意味を置き換えない。
- `external`、`download`、`target="_blank"`は専用indicatorと補足accessible textを同期する。
- 外部URLだからという理由だけで自動的に新しいtabを開かない。
- Icon-only navigationはLinkの対象外。可視labelを付ける。

## States

| State | Behavior |
|---|---|
| `default` | `href`を持つnative anchorとしてfocus可能。 |
| `hover` | `--primary-hover`とunderlineで示す。 |
| `active` | `--primary-active`で短いfeedbackを示す。 |
| `focus` | `focus-visible` outlineとunderlineを同時に表示する。 |

Disabled stateはありません。遷移先がなければtextへ戻すかLinkを表示しません。

## Behavior

- `external`はindicatorを追加するだけで、`target`を自動変更しない。
- `target="_blank"`では`rel`へ`noopener`をmergeし、新しいtabで開くことをvisible/accessibilityの両方で伝える。
- `download`はnative download属性を使い、download結果をindicatorで伝える。
- `onClick`はanalyticsなどの補助目的に限定し、navigationをButton actionへ変えない。
- Focus取得だけでnavigationや新しいtabを開始しない。

## Layout / Placement Rules

### Recommended Pattern

- Inline Linkは文章と自然にwrapさせる。
- Standalone Linkはnavigation群またはdirection indicatorで役割を明確にする。
- Linkを含むCard内へ別のinteractive contentを入れ子にしない。

## Responsive / Viewport Behavior

### Desktop

- Inline flowと周辺typographyを維持する。
- Hover、focus、context menuなどbrowser標準動作を確認する。

### Mobile

- 同じhrefとAPIを維持し、長いlabelは省略せず自然にwrapさせる。
- Navigation群では親layoutが十分なblock spacingまたはpaddingを確保する。

### Touch

- 独立したLinkは24px minimumのtargetまたは十分なspacingを確保する。
- 文中Linkのtarget size例外を、密集したnavigationへ流用しない。
- 主要touch操作はButtonなどを含め原則44px以上にするが、Inline Linkを不自然な44px line boxへ変えない。

## Accessibility

- Link目的をvisible label単独、またはprogrammatically determined contextと合わせて判別可能にする。
- Inline Linkは通常時からunderlineを表示し、色だけに依存しない。
- External、download、new-tabの結果をvisible indicatorと補足accessible textで伝える。
- `aria-current`をnative属性としてpass-throughする。
- Visible labelと異なる`aria-label`で目的を上書きしない。
- `focus-visible`で`--focus-ring`とunderlineを表示する。

Keyboard:

- `Enter`: Browser標準動作でhrefへ移動する。
- `Tab`: 通常のdocument順序で出入りする。
- `Shift+F10`: 対応platformではbrowser標準のlink context menuを開く。

## Content Guidelines

- 「こちら」「詳しく」ではなく、遷移先の内容を書く。
- 同じ遷移先には一貫したlabel、異なる遷移先には区別可能なlabelを使う。
- File linkではformatや結果を必要に応じて示す。例:「Q2レポート（PDF）」。
- 新しいtabで開く場合は「新しいタブ」相当の補足を提供する。

## Tokens

- Semantic color: `--primary`, `--primary-hover`, `--primary-active`, `--focus-ring`
- Spacing: `--sp-1`
- Typography: Showcaseでは`--text-body`。実装は周辺typographyをinherit可能。
- Motion: `--dur-fast`, `--ease-standard`
- Literal: `transparent`, `currentColor`, `none`

Primitive color、raw hex、任意pxをcomponent実装から選びません。

### Token Binding Decisions

- Default / hover / active / focus foregroundをprimary interaction tokensへ結線する。
- Inlineのdecorationは全stateで`currentColor`、Standaloneはhover / active / focusで`currentColor`にする。
- Backgroundは常にtransparent。Button surfaceへ変えない。
- Indicator gapは`--sp-1`、focusは`--focus-ring`を使う。

Current coverage: `complete`。未結線のvisual slotはありません。

## React API Freeze

`0.2.0`で次の順序と意味を固定します。

```ts
type LinkProps = NativeAnchorProps & {
  children: ReactNode
  href: string
  variant?: 'inline' | 'standalone'
  external?: boolean
  download?: boolean | string
  target?: HTMLAttributeAnchorTarget
  rel?: string
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  ref?: ForwardedRef<HTMLAnchorElement>
}
```

- Rootは常に`<a href>`で、polymorphic rootを持たない。
- `href`、`target`、`rel`、`download`、`hreflang`、`type`、`referrerPolicy`、`aria-*`、`data-*`をpass-throughする。
- `external`はtargetを変更しない。
- `target="_blank"`では`noopener`をmergeする。
- `disabled` propは持たない。

## Do / Don't

Do:

```tsx
<Link href="/docs/accessibility">アクセシビリティ指針</Link>
```

Don't:

```tsx
<Link disabled onClick={saveChanges}>保存</Link>
```

## Prohibited Patterns

- `href`なしの`a`、`role="link"`の`span`、`javascript:` URL。
- Disabled Link、`pointer-events:none`による無効化。
- Linkの見た目でaction、Buttonの見た目でnavigationを実装する。
- Interactive contentをLink内へ入れ子にする。
- Inline Linkを色だけで周辺textから区別する。

## AI Selection Rules

AIが選ぶ条件:

- 主な結果がURLまたはdocument位置へのnavigationである。
- Browser標準のopen-in-new-tab、copy-link、download機能を保持する。

AIが避ける条件:

- 現在の文脈でactionを実行するならButtonを使う。
- 遷移先がない場合はdisabled Linkを作らない。
- Iconだけのnavigationには可視labelを追加する。

## Examples

```tsx
<Link href="https://www.w3.org/WAI/" external variant="standalone">
  WAIガイドライン
</Link>

<Link href="/reports/q2.pdf" download>
  Q2レポート（PDF）
</Link>
```

## Implementation Readiness

`design/implementation-readiness.json`の8 criteriaをすべて通過しています。これはReact実装前のContract確定を意味し、production stableを意味しません。

## Implementation Notes

- React packageは今後追加する。
- Router adapterはLinkのnative anchor contractを保持する別integration layerとし、core Linkをpolymorphicにしない。
- React実装とrequired scenariosのCI visual regression完了後に`stable`へ昇格する。

## Open Questions

Contract上の未決事項はありません。
