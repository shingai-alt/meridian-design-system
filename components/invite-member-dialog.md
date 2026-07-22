# Invite Member Dialog

## Summary

1人のmemberへ1つの通常Roleを指定し、現在のMembers文脈から素早く招待するDialog composition。

Machine-readable contract: `design/contracts/components/invite-member-dialog.contract.json`

## Role

Invite Member Dialogは招待form、role説明、client/server validation、submit結果のdomain logicを所有します。Trigger、native modal lifecycle、backdrop、title、close control、focus containment/return、responsive surfaceはDialogへ委譲します。PC用とSP用に別componentを作らず、同じ意味とAPIをviewportへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。
- 招待対象、付与Role、失敗理由を送信前後で失わないこと。

## When To Use

- Members画面から1人へ1つの通常Roleを指定して素早く招待する。
- Seatと招待権限が確認済みで追加reviewを必要としない単一招待。

## When Not To Use

- 複数宛先、宛先ごとのRole、partial successはDedicated Batch Invitation Pageを使う。
- Ownerなど高権限Role、seat調整、送信前reviewが必要な場合は専用pageを使う。
- Pendingの再送・取消、既存member管理はMembers / Pending Invitationsで行う。
- 権限がないuserにはDialog triggerを表示せず、権限説明を現在のpage文脈で示す。

## Visual Model

Dialogの標準surface内へ、可視description、Email field、Role select、role説明、error領域、Cancel / Send actionsを縦に並べます。独自surfaceや独自elevationは作らず、Dialogとform primitivesを合成します。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| trigger | Yes | Dialogへ渡し、close後にfocusを受け取るButton。 |
| dialog | Yes | Modal lifecycleを所有するDialog composition。 |
| title | Yes | 固定label「メンバーを招待」。 |
| description | Yes | 招待先workspaceと単一招待であることを示す短い説明。 |
| email-field | Yes | `type="email"`、requiredの単一Email input。 |
| role-field | Yes | Role名と説明を持つnative Select。 |
| role-description | Yes | 現在選択中Roleの権限を可視textで説明する。 |
| error-message | No | Field errorまたはserver rejectionと回復方法。 |
| footer | Yes | Cancelと「招待を送信」。 |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | 単一memberの通常招待。 | DangerやOwner variantは持たず、複雑な招待はpageへ送る。 |

## Sizes / Density

Dedicated size propは持ちません。Dialog、Text Field、Select、Buttonのdensityへ従い、target minimum、意味、APIは変えません。

## Icon Rules

独自の必須icon slotは持ちません。Dialogのclose Icon Buttonを再利用し、errorをiconだけで伝えません。

## States

| State | Behavior |
|---|---|
| `open` | Email fieldへinitial focusを置き、単一招待formを表示する。 |
| `closed` | Dialog surfaceを表示せずtriggerだけを残す。 |
| `invalid` | EmailまたはRoleのerrorをtextで示し、最初のinvalid controlへfocusする。 |
| `submitting` | 二重送信を防ぎ、入力を保持して「送信中」を伝える。 |
| `error` | Server rejectionを表示し、入力とRoleを保持して修正・再試行を可能にする。 |

`sent`は開いたvisual stateにしません。成功時はDialogを閉じ、parentがPending list更新とToastを行います。

## Behavior

- Open時はEmail inputへfocusする。
- Emailは単一addressだけを受け付け、native `type="email"`とrequiredを使う。複数addressやcommaは受け付けない。
- Roleは`roles`から選び、labelだけでなくdescriptionを常時表示する。
- `defaultRoleId`は必須で、割当可能な通常Roleをproductが明示する。
- Submit前にtrim、required、email format、enabled Roleを検証する。
- Invalid時はDialogを閉じず、`aria-invalid="true"`、field description、text errorを同期し、最初のinvalid controlへfocusする。
- Submit中はPrimary actionをbusy/disabledにして二重送信を防ぐ。Close / CancelでUIを閉じた後のlate resultを表示しない。
- `sent`でcloseし、`rejected`では開いたまま入力を保持する。
- Existing member、Pending invite、seat limit、permission denied、network failureを同じ「失敗」に潰さず、理由と回復経路を表示する。
- Existing Pendingは新規送信せず、Pending Invitationsへの導線を示す。

## React API Freeze

```tsx
type InviteRoleOption = {
  id: string;
  label: string;
  description: string;
  disabled?: boolean;
  disabledReason?: string;
};

type InviteMemberResult =
  | { status: "sent"; invitationId: string }
  | {
      status: "rejected";
      reason: "existing-member" | "pending-invite" | "seat-limit" | "permission-denied" | "network";
      message: string;
      recoveryHref?: string;
    };

type InviteMemberDialogProps = {
  trigger: ReactElement;
  workspaceName: string;
  roles: readonly InviteRoleOption[];
  defaultRoleId: string;
  onInvite: (input: { email: string; roleId: string }) => Promise<InviteMemberResult>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  ref?: ForwardedRef<HTMLDialogElement>;
};
```

- `roles`は1件以上で、`defaultRoleId`はenabled optionを参照します。
- Ownerなど追加reviewが必要なRoleを`roles`へ渡しません。
- `trigger`、open state、refはDialogへ透過します。
- Native `form` submitを使い、Enterを独自shortcutとして再実装しません。

## Layout / Placement Rules

### Recommended Pattern

- DOM順はdescription → Email → Role → role description → error → actionsとする。
- Role descriptionはSelectの直後へ置き、選択変更と同期する。
- Errorは該当fieldへ関連付け、server rejectionはform全体のstatusとしてactionsより前に置く。
- Dialogのheader、scrolling body、footerを再利用し、独自固定footerを追加しない。

## Responsive / Viewport Behavior

### Desktop

- Dialogの`--dialog-w-md`内に単一column formを置く。
- EmailとRoleを横並びにせず、label・instruction・errorの読み順を保つ。

### Mobile

- Dialogのviewport-safe sizingを継承し、fieldとactionsを1 columnで表示する。
- Software keyboardでもfocused field、error、footerへscrollできる。
- Batch editorへ縮退させず、複数招待はpageへ移動する。

### Touch

- Dialogとchild controlsの24px minimum、主要action 44px以上推奨を継承する。
- Close、Cancel、Sendを単一pointerで操作できる。

## Accessibility

- Dialogのnamed native modal、contained Tab sequence、Escape、focus returnを継承する。
- EmailとRoleは可視`label`をnative controlへ明示的に関連付ける。
- Emailのformat instructionとRole descriptionを`aria-describedby`で各controlへ関連付ける。
- Errorはtextで特定し、該当controlの`aria-invalid`とdescriptionを同期する。
- Submit時は最初のinvalid control、server rejection時は`role="alert"`のerror summaryへfocusする。
- SubmittingはButtonのbusy stateとstatus textで伝え、色やspinnerだけに依存しない。
- Positive tabindexを使わず、DOM orderとvisual orderを一致させる。

Keyboard:

- `Tab / Shift+Tab`: Dialogがform controlsとactions内のfocusを循環する。
- `Escape`: Dialogへclose requestを発行する。
- `Enter`: Native form submit規則に従う。

## Content Guidelines

- Email labelは「メールアドレス（必須）」、instructionは「1件のメールアドレスを入力」と明示する。
- Roleは名称と1行の権限説明を表示する。
- Buttonは「招待を送信」とし、「送信」「OK」だけにしない。
- Existing memberなら参加済み、Pendingなら招待済み、seat limitなら不足数と管理先を説明する。
- Network failureでは入力が保持されていることと再試行を案内する。

## Tokens

- Dialog visual: `--surface-overlay`, `--fg`, `--fg-muted`, `--border`, `--border-muted`, `--overlay`, `--dialog-w-md`, `--radius-xl`, `--shadow-overlay`
- Form visual: `--input-bg`, `--input-border`, `--input-border-focus`, `--danger`, `--danger-subtle`, `--danger-fg`, `--focus-ring`
- Layout / type / motion: `--sp-2`, `--sp-3`, `--sp-4`, `--sp-5`, `--radius-md`, `--text-small`, `--dur-normal`, `--ease-enter`

Invite Member Dialog固有tokenは追加しません。

### Token Binding Decisions

Dialog surfaceとmodal lifecycleのvisual slotはDialog、control visual slotはText Field / Select / Button / Validation Messageへ委譲し、composition固有のrole descriptionとerror spacingだけを既存semantic tokenへ結線します。

Current coverage: `complete`。未結線の独自visual slotはありません。

## Do / Don't

Do:

```tsx
<InviteMemberDialog
  trigger={<Button>メンバーを招待</Button>}
  workspaceName="Meridian"
  roles={quickInviteRoles}
  defaultRoleId="member"
  onInvite={inviteMember}
/>
```

Don't:

```tsx
{/* 複数宛先・宛先別Role・partial successは専用page。 */}
<InviteMemberDialog roles={roles} onInvite={inviteTenMembers} />
```

## Prohibited Patterns

- Dialog surface、focus trap、backdropをこのcomponent内で再実装する。
- `type="text"`へcomma-separated email listを入れてbatch invitationを装う。
- Role名だけを示し、権限説明を隠す。
- Invalid fieldへtext errorを関連付けず、border colorだけを変える。
- Rejected後に入力を消す、またはExisting Pendingを無言で再送する。
- Disabled Sendだけでseat/permission理由を伝える。
- `NO_RAW_HEX_COLOR`、`SPACING_FROM_TOKENS_ONLY`、`RADIUS_FROM_TOKENS_ONLY`、`CONTRAST_AA_MINIMUM`に反する実装。
- `FOCUS_VISIBLE_REQUIRED`、`NO_POSITIVE_TABINDEX`、`TARGET_SIZE_MINIMUM`、`INTERACTIVE_NAME_REQUIRED`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- 1人、1つの通常Role、seat/permission確認済みのquick invite。

AIが避ける条件:

- 複数宛先、Owner付与、per-recipient Role、review、partial successはDedicated Batch Invitation Page。
- Pending managementはMembers / Pending Invitations。

AIはDialogを直接組み立てず、domain logicが必要ならInvite Member Dialogを選びます。Domain boundaryを超える場合はpage patternへ切り替えます。

## Examples

```tsx
<InviteMemberDialog
  trigger={<Button variant="secondary">招待</Button>}
  workspaceName="Meridian"
  roles={[
    { id: "member", label: "Member", description: "通常の作業と共同編集ができます。" },
    { id: "viewer", label: "Viewer", description: "閲覧のみできます。" },
  ]}
  defaultRoleId="member"
  onInvite={inviteMember}
/>
```

## Implementation Notes

- React packageは今後追加します。現在はContract 0.2.0、Dialog composition、HTML Showcase、review evidenceを実装正本とします。
- Static Showcaseは`<dialog open>`でscenarioを比較しますが、実際のmodalityを偽装する`aria-modal="true"`を付けません。
- Batch Invitationの正本は`docs/ai-generation/pilots/team-invitation.md`です。

## Open Questions

なし。React実装、Dialog integration、async result tests、visual regressionはstable昇格条件であり、実装前Contractの未決事項ではありません。
