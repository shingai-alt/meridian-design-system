# Integration Card

## Summary

Integration catalogで接続状態、説明、次のactionを比較する非focusable list item。

Machine-readable contract: `design/contracts/components/integration-card.contract.json`

## Role

Integration Cardは、1つの外部serviceのlogo、visible name、接続状態、説明、statusと整合するprimary action、任意secondary actionsの配置を所有します。Catalog ownerはnamed list、filter/sort、status更新後のannouncementを所有します。OAuth consent、認証error recovery、disconnect confirmation、詳細設定formは専用flow/page/dialogへ委譲します。PC用とSP用に別componentを作らず、同じDOM、意味、APIをreflowします。

## Principles

- Service名、接続状態、連携結果、次actionを短く走査できること。
- Root全体をcustom controlにせず、提供されたnative Button/LinkだけをTab順へ入れること。
- Connected、setup-required、not-connected、errorをtextで明示し、Badge不在やcolorだけで伝えないこと。
- Status data、Card placement、action behavior、flow result announcementのownershipを分離すること。
- Semantic tokenと既存child componentを優先し、Integration Card固有tokenを増やさないこと。

## When To Use

- Named integration catalogで複数serviceの接続状態、説明、次actionを比較するとき。
- 各serviceへ1つのprimary actionと任意のsecondary actionsを提示するとき。

## When Not To Use

- 接続後の詳細設定formにはSettings Panelまたは専用設定画面を使う。
- OAuth consent、認証error recovery、disconnect confirmationのflow全体には専用flow/page/dialogを使う。
- 1つのserviceだけをpageの主要CTAとして紹介する場合はFeature sectionまたはCalloutを使う。
- ProjectやtaskのsummaryにはProject CardまたはTask Board Cardを使う。

## Visual Model

1つのstatic Card内へlogo/status/secondary actions、service heading/description/error、primary actionをreading order順に配置します。Catalog gridではCardを同高にし、primary actionをfooterへ揃えます。Rootにhover affordanceやshadowを追加せず、interactive stateはchild Button/Linkだけが示します。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| collection | Yes | Integration Cardを直接の子に持つnamed `ul`。Catalog ownerが所有する。 |
| root | Yes | `ul`の直接の子になる非focusable `li`。 |
| logo | Yes | Visible service nameと重複するためaccessibility treeから隠すbrand mark。 |
| heading | Yes | Integration名を示す`h3`。 |
| status | Yes | 接続状態をtextで示すBadge。 |
| description | Yes | 連携結果または用途を説明するsummary。 |
| error-message | No | Error variantだけに表示する原因と次の一歩。 |
| primary-action | Yes | Statusと整合する1つのnative ButtonまたはLink composition。 |
| actions | No | Menu triggerなど1つのsecondary composition。 |

## Variants

| Variant | Use | Primary action example |
|---|---|---|
| `connected` | Serviceが接続済みで設定へ進める。 | 「Slackを設定」 |
| `setup-required` | 認証後に追加設定が必要。 | 「Slackの設定を完了」 |
| `not-connected` | Serviceが未接続。 | 「Slackを接続」 |
| `error` | 接続に失敗し原因と回復方法を提示する。 | 「Slackの接続を再試行」 |

`none`やBadge不在で未接続を表しません。Connection statusは意味のあるvariantであり、visual preferenceではありません。

## Sizes / Density

Dedicated size propは持ちません。`--card-pad`とlogoの`--ctl-md`を現在のdensity contextから受け取ります。Viewportだけでdensityを変更しません。

## Icon Rules

- Logoはvisible headingとservice identityが重複するため`aria-hidden="true"`にする。
- Logoが読み込めなくてもservice名をheadingから理解できるようにする。
- Statusはicon/dotだけで表さずtext Badgeを必須にする。
- Error iconには隣接するvisible error textを必ず伴わせる。
- Secondary actionsのIcon Buttonはservice名と目的をaccessible nameへ含める。

## States

| State | Behavior |
|---|---|
| `default` | Controlled connection statusと提供されたactionsを表示し、root自体はinteractiveにしない。 |

Connection statusはvariant、Buttonのhover/focus/loading/disabledはchild stateです。Cardへ`hover`、`focus-visible`、`loading`を重複追加しません。

## Behavior

- Collectionはnamed `ul`、rootは直接の`li`とする。
- Rootは`onClick`、`role="button"`、`role="link"`、`tabIndex`を持たない。
- Logo、heading、status、description、primary actionをすべてのvariantで常時表示する。
- `status`はcontrolled discriminated unionとし、visual Badgeとdata-statusを同じ値から生成する。
- Connectedは「接続済み」、setup-requiredは「設定が必要」、not-connectedは「未接続」、errorは「接続エラー」とtextで示す。
- Error variantは空でない`message`を必須にし、原因または次の一歩をvisible textで示す。
- `primaryAction`はstatusと整合する1つのButtonまたはLink compositionとする。
- Visible action labelへservice名と結果を含める。「設定」「接続する」「再試行」だけにしない。
- Buttonを使うのは現在pageでcommandを実行するとき、Linkを使うのはdestination navigationが結果のときとする。
- `actions`はMenu triggerなど1つのsecondary compositionとし、primary actionと独立させる。
- Async pending/disabled/focus semanticsはprimary action childのButton/Link Contractへ委譲する。
- Statusが動的に変化した結果はCatalog/flow ownerの単一`role="status"`でservice名と結果を通知する。
- 各Cardや初期status Badgeへ`role="status"`、`aria-live`、`aria-atomic`を付けない。
- Status更新後はtriggerへfocusを維持し、Card rootやBadgeへ移動しない。

## React API Freeze

```tsx
type IntegrationCardIntegration = {
  id: string;
  name: string;
  description: string;
  logo: ReactElement;
};

type IntegrationCardStatus =
  | { kind: "connected" }
  | { kind: "setup-required" }
  | { kind: "not-connected" }
  | { kind: "error"; message: string };

type IntegrationCardProps = {
  integration: IntegrationCardIntegration;
  status: IntegrationCardStatus;
  primaryAction: ReactElement;
  actions?: ReactElement;
  ref?: ForwardedRef<HTMLLIElement>;
};
```

- `integration.id`、`integration.name`、`integration.description`は空文字を許可しません。
- `integration.logo`は1つのvisual ReactElementとし、implementationがdecorative slotとして隠します。
- `status.kind = "error"`の`message`は空文字を許可しません。
- `primaryAction`は1つのfocusable ButtonまたはLinkとし、visible labelへintegration nameと結果を含めます。
- `actions`は1つのfocusable actionまたはMenu compositionとします。
- `ref`はroot `li`へforwardします。
- `variant`、`onConfigure`、`onConnect`、`onRetry`、`loading`をCard APIへ追加しません。意味は`status`、behavior/stateはcomposed actionへ帰属させます。

## Layout / Placement Rules

### Recommended Pattern

- Catalog sectionへheadingを付け、その直下のnamed `ul`をgridにする。
- Integration Cardを`ul`の直接`li` childにする。
- DOM順はlogo → status → secondary actions → heading → description/error → primary actionとする。
- Grid ownerのstretchへ追従してCardを同高にし、footerを下端へ揃える。
- Logo/status/actionsはtitle幅を不必要に圧迫しない。
- Filter、sort、result count、empty state、status live regionはCatalog ownerが管理する。

## Responsive / Viewport Behavior

### Desktop

- Catalog grid内でCardを同高にしprimary actionをfooterへ揃える。
- Long nameとdescriptionをwrapし、固定heightでclipしない。
- Static Cardにhover border、click cursor、elevationを追加しない。

### Mobile

- 同じ`li`、heading、status、actions semanticsで1列へreflowする。
- Cardをavailable inline sizeまで縮める。
- Narrow containerではprimary actionをfull widthにする。
- Status、description、error、primary actionを削除しない。

### Touch

- Primary actionとsecondary actionsを独立targetとして操作する。
- 全targetは24px minimum、主要touch actionは44px以上を推奨する。
- Card surfaceをhidden action targetにせず、child targetとhit areaを重ねない。
- Hoverやgestureだけでactionを出現させない。

## Accessibility

- Named `ul` / `li`でcatalog collectionとitemの関係を伝える。
- Service nameはvisible `h3`、connection statusはtext Badgeとして常時表示する。
- Logoはheadingと重複するため`aria-hidden="true"`にする。
- Root、logo、status Badge、descriptionはTab順へ追加しない。
- Tab順はheaderの任意secondary actions、footerのprimary actionというvisual/DOM順とする。
- Primary actionのvisible labelへservice名と結果を含め、visible labelとaccessible nameを一致させる。
- Error retry actionはvisible error messageを`aria-describedby`で参照できる。
- 初期状態を並べるcatalogへCardごとのlive regionを作らない。
- Action結果がfocus移動なしで表示される場合は、ownerの`role="status"`で通知する。
- 全pointer targetは24px minimum、主要touch targetは44px以上推奨とする。
- 200% zoom、High contrast、Reduced motion、320 CSS px相当でもstatus、description、action、focus順を保持する。

Keyboard:

- `Enter / Space`: FocusされたButton primary actionをButton Contractどおりに実行する。
- `Enter`: FocusされたLink primary actionのdestinationへ移動する。
- `Tab / Shift+Tab`: 任意secondary actionsとprimary actionをvisual/DOM順に移動する。
- MenuやDialogを開くsecondary actionは各child Contractのkeyboard/focus lifecycleに従う。

## Content Guidelines

- Nameはproviderが公開する正式なservice名を使う。
- Descriptionは「何と何が連携し、何が起きるか」を1〜2文で示す。
- Status labelは「接続済み」「設定が必要」「未接続」「接続エラー」に統一する。
- Primary actionは「Slackを接続」のようにservice名と結果を含める。
- Error messageは「権限を確認して再試行してください」のように原因候補と次の一歩を示す。
- Disconnectや権限変更などprimary path外の操作はsecondary actionsへまとめる。

## Tokens

- Surface / content: `--surface`, `--surface-muted`, `--border`, `--fg`, `--fg-muted`, `--danger-fg`
- Density / spacing: `--card-pad`, `--ctl-md`, `--sp-1`, `--sp-2`, `--sp-3`
- Shape / type: `--radius-md`, `--text-body`, `--text-small`

Integration Card固有tokenは追加しません。Badge、Button、Link、Icon Button内部のvisual tokenは各child Contractへ委譲します。

### Token Binding Decisions

| Slot | Source | Scope | Reason |
|---|---|---|---|
| Card surface / border / padding / radius | `--surface`, `--border`, `--card-pad`, `--radius-md` | semantic | Static catalog item。 |
| Section gaps | `--sp-1`, `--sp-2`, `--sp-3` | semantic | Header、content、error、footer hierarchy。 |
| Logo holder | `--surface-muted`, `--border`, `--fg`, `--ctl-md`, `--radius-md`, `--text-body` | semantic | Density-aware decorative mark holder。 |
| Heading | `--fg`, `--text-body` | semantic | Visible service name。 |
| Description | `--fg-muted`, `--text-small` | semantic | Supporting summary。 |
| Error | `--danger-fg`, `--text-small` | semantic | Visible failure/recovery text。 |

Current coverage: `complete`。未結線のIntegration Card固有visual slotはありません。

## Do / Don't

Do:

```tsx
<IntegrationCard
  integration={slack}
  status={{ kind: "connected" }}
  primaryAction={
    <Button onClick={openConfig}>Slackを設定</Button>
  }
  actions={<IntegrationActions integration={slack} />}
/>
```

Don't:

```tsx
{/* Generic CTAとBadge不在で状態を推測させない。 */}
<IntegrationCard variant="none" onConfigure={openConfig} />
```

## Prohibited Patterns

- Root `div`/`li`へ`onClick`、`role="button"`、`role="link"`、`tabIndex=0`を追加する。
- ConnectedだけBadgeを表示しnot-connectedをBadge不在で表す。
- Statusをcolor、dot、logo treatmentだけで表す。
- 反復Cardのactionを「設定」「接続する」「再試行」だけで命名する。
- Statusと矛盾するprimary actionを提供する。
- Primary Button内へsecondary Menu triggerを入れる。
- 各Cardまたは初期Badgeへ`role="status"` / `aria-live`を付ける。
- Errorの原因または次の一歩を省略する。
- Mobileでstatus、error、primary actionを削除する。
- Static Cardへhover affordance、click cursor、shadowを追加する。
- Raw hex、任意spacing/radius、固定pixel heightを追加する。

## AI Selection Rules

AIが選ぶ条件:

- Named catalogで複数integrationの接続状態と次actionを同じ構造で比較する。
- Statusと整合する1つのprimary actionをserviceごとに提示する。

AIが避ける条件:

- 詳細設定、OAuth/error flow、単独marketing CTA、project/task summaryが主目的である。
- Clickable Card root、Badge不在の未接続、generic action label、Cardごとのlive regionを生成する。

AIはstatus variantをsystem dataから選び、viewport名だけでvariantやAPIを分岐しません。

## Examples

```tsx
<IntegrationCard
  integration={slack}
  status={{ kind: "not-connected" }}
  primaryAction={
    <Button onClick={startOAuth}>Slackを接続</Button>
  }
/>
```

## Implementation Notes

- Contract `0.2.0`はReact実装前の公開API、DOM、status/action ownership、token bindingを確定しています。
- `implementationReadiness.status = ready`はproduction stableを意味しません。
- React package、OAuth/router/action integration tests、CI visual regression baselineはstable移行時に追加します。

## Open Questions

なし。React実装前の判断は確定しています。
