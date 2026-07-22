# Text

## Summary

Native text semanticsを保ったまま、公開typography roleとneutral foreground toneを適用する非interactive primitive。

Machine-readable contract: `design/contracts/components/text.contract.json`

## Role

Textは、短いUI copy、見出し、説明、metadataへMeridianのtype scaleとforeground階層を適用します。`as`がHTML semantics、`variant`がvisual typography、`tone`がneutral emphasisを所有します。Document outline、section構造、paragraph間隔、interactive behavior、status/error semanticsはTextではなく利用文脈または専用componentが所有します。PC用とSP用に別componentを作らず、同じDOM、意味、APIをwrapとavailable widthへ適応させます。

## Principles

- 意味のあるnative elementを先に選び、visual sizeからheading levelを決めないこと。
- Typography roleとsemantic elementを独立させ、どちらも明示的に監査できること。
- Textを表示専用primitiveに限定し、focus、click、live regionを追加しないこと。
- Text enlargement、narrow reflow、利用者のtext-spacing overrideで内容を失わないこと。
- 公開typography/foreground tokenだけを使い、任意font size、line height、colorを追加しないこと。

## When To Use

- Native heading、paragraph、generic inline/block textへMeridianのtypography roleを適用するとき。
- 短いUI本文、補助説明、metadataのneutral emphasisをdefault、muted、subtleで揃えるとき。
- Semantic elementとvisual type scaleを独立して選ぶ必要があるとき。

## When Not To Use

- Link、Button、form label、status、errorなど専用componentがsemanticsとinteractionを所有する場合は、そのcomponentを使う。
- 複数paragraphのrich prose layout、list、blockquote、code blockにはnative structureまたは専用content componentを使う。
- 比較する数値にはNumeric typography、code/log/diffにはcode typographyまたはCode Blockを使う。
- Ellipsisやline clampで重要情報を省略する目的には使わない。

## Visual Model

Textはsurface、border、padding、shadowを持たないtransparentなcontent primitiveです。Native display behaviorを維持し、type scaleとforegroundだけを適用します。Headingのvisual sizeはdocument outlineを変更せず、toneは情報の重要度や状態をcolorだけで代替しません。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| root | Yes | `as`で選ぶnative `span`、`p`、`div`、`h1`〜`h6`。 |
| content | Yes | 空でないperceivable textと、必要に応じたinline semantic markup。 |

## Variants

| Variant | Token | Use |
|---|---|---|
| `display` | `--type-display` | Product/pageの強い最上位title treatment。 |
| `heading-1` | `--type-h1` | 画面の主見出しtreatment。 |
| `heading-2` | `--type-h2` | 大きなsection見出しtreatment。 |
| `heading-3` | `--type-h3` | 小section/card group見出しtreatment。 |
| `heading-4` | `--type-h4` | Compact panel見出しtreatment。 |
| `heading-5` | `--type-h5` | Labelに近い最小見出しtreatment。 |
| `reading` | `--type-reading` | 複数paragraphを読む本文。 |
| `body-lg` | `--type-body-lg` | Lead文、余裕のある設定説明。 |
| `body` | `--type-body` | 標準の短いUI本文。 |
| `body-sm` | `--type-body-sm` | 短い補助説明。 |
| `label-lg` | `--type-label-lg` | Large control相当の短いlabel treatment。 |
| `label` | `--type-label` | 標準control相当の短いlabel treatment。 |
| `label-sm` | `--type-label-sm` | Compact control相当の短いlabel treatment。 |
| `caption` | `--type-caption` | 補助的なmetadata、timestamp。 |

Variant名はvisual roleです。`heading-3`を指定してもrootを`h3`へ自動変更しません。Heading levelは周辺outlineに従い`as`で明示します。

## Sizes / Density

Dedicated size propは持ちません。Type scaleは`variant`で選びます。Display/heading/reading roleはdensityで縮小せず、body/label/captionも公開composite tokenを正本とします。Viewportだけを理由に別variantへ切り替えません。

## Icon Rules

Textはicon slotを持ちません。Iconとlabelの関係、gap、accessible nameはButton、Link、Statusなどのowner componentへ委譲します。Text内へ装飾iconを直接混在させません。

## States

| State | Behavior |
|---|---|
| `default` | 指定したnative semantics、typography variant、toneで静的contentを表示する。 |

Text固有のhover、focus、disabled、loading、selected、error stateはありません。必要なstateはowner componentが持ちます。

## Behavior

- `as`の既定値は`span`、`variant`は`body`、`tone`は`default`とする。
- `as`は`span | p | div | h1 | h2 | h3 | h4 | h5 | h6`に限定する。
- `variant`は公開typography composite tokenへ1対1で対応させる。
- `tone=default`は`--fg`、`muted`は`--fg-muted`、`subtle`は`--fg-subtle`へ対応させる。
- Rootのbrowser既定marginを0へresetし、block間隔は親layoutがspacing tokenで所有する。
- Contentは自然にwrapし、長い単語/URLもcontainerからoverflowさせない。
- `lang`と`dir`を含む安全なglobal attributesをnative rootへforwardする。
- `variant`から`as`を推論または変更しない。
- `tone`でsuccess、warning、danger、disabled、interactive stateを表現しない。
- Rootへ`role`、`tabIndex`、`onClick`、`aria-live`をcomponent責務として追加しない。

## React API Freeze

```tsx
type TextElement = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

type TextVariant =
  | "display"
  | "heading-1"
  | "heading-2"
  | "heading-3"
  | "heading-4"
  | "heading-5"
  | "reading"
  | "body-lg"
  | "body"
  | "body-sm"
  | "label-lg"
  | "label"
  | "label-sm"
  | "caption";

type TextTone = "default" | "muted" | "subtle";

type TextProps<T extends TextElement = "span"> = {
  as?: T;
  variant?: TextVariant;
  tone?: TextTone;
  children: ReactNode;
  ref?: PolymorphicRef<T>;
} & SafeTextAttributes<T>;
```

- `children`は空でないperceivable textを必須とし、inline semanticsを表す`em`、`strong`、`abbr`、`time`などを含められます。
- `SafeTextAttributes<T>`は`id`、`className`、`style`、`title`、`lang`、`dir`、`aria-*`、`data-*`などrootで有効な非interactive属性をforwardします。
- `SafeTextAttributes<T>`はText単体をcontrol化する`onClick`、keyboard handler、positive `tabIndex`を公開推奨APIにしません。
- `ref`は実際に選択されたnative elementへforwardします。

## Layout / Placement Rules

### Recommended Pattern

- Heading levelはpage/section outlineから選び、visual variantは情報hierarchyから選ぶ。
- Paragraph、heading、metadata間のgapはStackなど親layoutがspacing tokenで所有する。
- Long-form reading textは親containerが`--reading-max`などのreading measureを所有する。
- Text自身にwidth、fixed height、line clamp、absolute positioningを持たせない。

## Responsive / Viewport Behavior

### Desktop

- Native inline/block flowと親containerのavailable widthに従う。
- Reading contentのline lengthは親layoutで管理し、Textに固定widthを持たせない。
- Headingとbodyのsemantic orderをvisual placementと一致させる。

### Mobile

- 320 CSS px相当で同じelement、content、variant、toneを維持してwrapする。
- Long word、URL、和欧混植をcontainerからoverflowさせない。
- Viewportに応じてheadingをparagraphへ変えたり、captionへ縮小したりしない。
- 200% text enlargementでもclip、overlap、二方向scrollを発生させない。

### Touch

- 表示専用rootをTab順やpointer targetへ追加しない。
- Textを操作のvisible labelとしてcompositionする場合、Button/Linkなどowner componentが24px minimumと主要touch操作44px以上を保証する。
- Textのglyph領域だけをhidden click targetにしない。

## Accessibility

- Headingは周辺content hierarchyに合う`h1`〜`h6`を`as`で選び、topicまたはpurposeを説明するcontentにする。
- Paragraphは`p`、inline textは`span`を使い、`div`を見出しやparagraphの代替にしない。
- Heading variantだけでprogrammatic headingを作らず、不要な`role=heading`/`aria-level`を追加しない。
- Textはaccessible name、keyboard interaction、focus targetを独自に持たない。
- Toneは重要度や状態の唯一の手段にせず、meaningful textまたはowner semanticsを併用する。
- Normal textは背景との4.5:1 minimumを満たす公開foreground tokenを使う。
- 200% text enlargement、320 CSS px相当のreflow、WCAG text-spacing overrideでcontentをclip、overlap、非表示にしない。
- Content内で言語が切り替わる場合は適切な`lang`をnative elementまたはinline childへ付ける。

Keyboard:

- Text固有のkeyboard interactionはありません。
- Text rootはfocusableにせず、nested interactive contentをTextへ持ち込まないでください。

## Content Guidelines

- Headingは短く具体的にし、後続contentのtopicまたはpurposeを説明する。
- Bodyはtaskに必要な情報を先に書き、曖昧な代名詞や状態語だけにしない。
- Muted/subtle toneへ重要なinstruction、error、status、必須条件を落とさない。
- Captionは補助metadataに限定し、primary contentや操作labelに使わない。
- Content languageがpageの既定言語と異なる場合は`lang`を付ける。

## Tokens

- Foreground: `--fg`, `--fg-muted`, `--fg-subtle`
- Display/heading: `--type-display`, `--type-h1`, `--type-h2`, `--type-h3`, `--type-h4`, `--type-h5`
- Body: `--type-reading`, `--type-body-lg`, `--type-body`, `--type-body-sm`
- Label/metadata: `--type-label-lg`, `--type-label`, `--type-label-sm`, `--type-caption`

Primitive color、raw font size、raw line height、negative tracking、arbitrary font weightをTextから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Reason |
|---|---|---|---|
| `tone.default.foreground` | `--fg` | semantic | Primary neutral text。 |
| `tone.muted.foreground` | `--fg-muted` | semantic | Secondary explanation。 |
| `tone.subtle.foreground` | `--fg-subtle` | semantic | Tertiary metadata。 |
| `variant.*.typography` | 対応する`--type-*` | reference | Source typography roleへ1対1で結線する。 |
| `root.margin` | `0` | literal | Browser既定marginをresetし親layoutへspacing ownershipを戻す。 |

`overflow-wrap:anywhere`はthemeable visual valueではなく、long contentを失わないruntime behaviorとして固定します。

Current coverage: `complete`。Textが所有するforeground、typography、margin resetの全visual slotを結線済みです。

## Do / Don't

Do:

```tsx
<Text as="h2" variant="heading-2">アクセシビリティ</Text>
<Text as="p" variant="body" tone="muted">変更は自動的に保存されます。</Text>
<Text as="span" variant="caption" lang="en">Updated 2 min ago</Text>
```

Don't:

```tsx
{/* Visual variantはheading semanticsを自動生成しない。 */}
<Text variant="heading-2">アクセシビリティ</Text>

{/* Textをcontrolやstatus ownerにしない。 */}
<Text onClick={save} tone="subtle">保存</Text>
```

## Prohibited Patterns

- `variant="heading-*"`だけでheading semanticsがあると扱う。
- Visual sizeに合わせてdocument outlineと無関係なheading levelを選ぶ。
- Headingに`span role="heading" aria-level`を使える状況でnative headingを避ける。
- Text rootへ`onClick`、keyboard handler、positive `tabIndex`、button/link roleを追加する。
- Text rootへ`role=status`、`role=alert`、`aria-live`を追加する。
- `tone`だけでsuccess、warning、danger、disabled、selectedを伝える。
- Fixed height、nowrap、line clamp、ellipsisで必須contentを隠す。
- Mobileだけvariant、content、semantic elementを変える。
- Raw font size、line height、color、font family、font weightを指定する。

## AI Selection Rules

AIが選ぶ条件:

- Native text elementへMeridian typographyとneutral foregroundを適用する。
- Semantic elementとvisual roleを別々に決定できる。

AIが避ける条件:

- Action/navigationはButton/Link、form labelはForm Field、status/errorはBadge/Alert/Validation Messageを使う。
- Rich prose構造、list、blockquote、code、numeric dataをText 1つへ平坦化しない。
- Visual variantからheading levelを推測しない。

Selection order:

1. Contentのnative semanticsから`as`を選ぶ。
2. Visual hierarchyから`variant`を選ぶ。
3. Neutral emphasisから`tone`を選ぶ。
4. State、interaction、layoutが必要ならowner componentへ移す。

## Examples

```tsx
<section aria-labelledby="billing-heading">
  <Text id="billing-heading" as="h2" variant="heading-2">
    請求設定
  </Text>
  <Text as="p" variant="body" tone="muted">
    請求先と支払い方法を管理します。
  </Text>
</section>
```

## Implementation Notes

- React packageは今後追加します。現在はContract 0.2.0、human spec、HTML Showcase、token binding、browser evidenceを実装時の正本とします。
- Implementationは`as`をwhitelistし、選択されたelementへrefと安全なglobal attributesをforwardします。
- Classは`textc`、`data-variant`、`data-tone`を使用し、semantic elementをselectorへ埋め込みません。
- React実装とrequired scenariosのCI visual regression完了までは`draft`を維持します。

## Open Questions

Contract上の未解決事項はありません。React実装、type-level polymorphic ref test、visual regressionはstable移行条件として管理します。
