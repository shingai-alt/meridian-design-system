# Invite Member Dialog

## Summary

メンバー招待の定型ダイアログ。メール+ロール選択。

Machine-readable contract: `design/contracts/components/invite-member-dialog.contract.json`

## Role

SaaS領域でInvite Member Dialogの責務を1か所にまとめ、類似componentとの選択境界を固定します。PC用とSP用に別componentを作らず、同じ意味とAPIをlayout、viewport、input methodへ適応させます。

## Principles

- Taskの主目的と現在状態を最短で理解できること。
- Native semanticsまたは確立したARIA patternを優先すること。
- Semantic tokenを基本とし、Component tokenはpolicy triggerがある場合だけ追加すること。

## When To Use

- emailとroleを指定してmember招待を完結するとき。

## When Not To Use

- 多数memberの一括管理には専用pageを使う。

## Visual Model

Floating or modal surface. Surface、border、type、spacingの強弱は内容の階層を支え、装飾のためだけにcard、shadow、accentを追加しません。状態は色だけでなくlabel、icon、shape、positionを組み合わせます。

## Anatomy

| Part | Required | Description |
|---|---:|---|
| surface | Yes | Floating or modal surface. |
| header | No | Title and context. |
| content | Yes | Information or controls owned by the surface. |
| actions | No | Confirmation, navigation, or dismiss controls. |
| trigger | No | Element that opens the surface and receives restored focus. |

## Variants

| Variant | Use | Notes |
|---|---|---|
| `default` | 標準文脈。 | 意味を変えずに見た目だけを増やさない。 |

## Sizes / Density

| Size | Token | Typical use |
|---|---|---|
| Dedicated size propなし | Density token | 周辺layoutのdensityに従う。 |

Compact / Default / Comfortableはviewportではなく作業密度と入力方式で選び、componentの意味やprop集合は変えません。

## Icon Rules

このcomponentは必須のicon slotを持ちません。追加する場合も情報をiconだけへ閉じ込めません。

## States

| State | Behavior |
|---|---|
| `default` | 通常状態。意味、label、valueを省略しない。 |

## Behavior

- 複数メールのカンマ区切り入力に対応する。
- ロールには権限の説明を添える。
- 送信後は Pending invites 一覧に反映し、再送・取消を可能にする。

- Controlled stateを提供する場合、visual stateとprogrammatic stateを同じeventで同期します。
- 非同期actionでは二重実行を防ぎ、完了・失敗・中断を説明します。

## Layout / Placement Rules

### Recommended Pattern

- Reading orderとfocus orderを一致させます。
- 周辺componentとのspacingはtokenを使い、固定viewport値で内部寸法を変えません。
- Viewportに収まらない固定幅を使わず、必要に応じてfull-screenまたはbottom-aligned presentationへ切り替える。

## Responsive / Viewport Behavior

### Desktop

- Invite Member Dialogは内容に応じたmax-widthを持ち、背景文脈を保つ。
- Focusをsurface内で管理し、閉じたらtriggerへ戻す。

### Mobile

- Viewportに収まらない固定幅を使わず、必要に応じてfull-screenまたはbottom-aligned presentationへ切り替える。
- Safe areaとsoftware keyboardを考慮し、primary actionを見失わせない。

### Touch

- Pointer targetは24px minimumを満たし、touch中心の主要操作は原則44px以上にする。
- Hoverだけに情報や操作を依存させず、連打とdragには同等の非gesture操作を用意する。

## Accessibility

- Keyboardとpointerで同じ機能を実行できる。
- Focus indicatorを常に視認でき、sticky layerで完全に隠さない。
- Targetは24px minimumを満たし、主要touch操作は原則44px以上にする。
- Native semanticsを優先し、ARIAは不足する関係と状態だけを補う。
- focus-visibleで--focus-ringを使う。
- Positive tabindexを使わず、DOMとvisualの順序を一致させる。

Keyboard:

- `Tab`: 順序どおりにfocusを移動する。

## Content Guidelines

- Labelは対象または結果を具体的に書き、状態だけを繰り返さない。
- Errorは原因と修正方法、Emptyは何がないかと次の一歩を示す。
- 省略するmetadataにも別経路から到達できるようにする。

## Tokens

- semanticColor: `--surface`, `--border`, `--fg`, `--surface-overlay`, `--fg-muted`, `--overlay`, `--focus-ring`
- spacing: `--sp-4`
- radius: `--radius-md`
- motion: `--dur-normal`
- shadow: `--shadow-overlay`

Primitive color、raw hex、任意pxをcomponentから直接選びません。

### Token Binding Decisions

| Slot | Source | Scope | Trigger | Reason |
|---|---|---|---|---|
| `token.surface.value` | `--surface` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.border.value` | `--border` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.fg.value` | `--fg` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.surface-overlay.value` | `--surface-overlay` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.fg-muted.value` | `--fg-muted` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.overlay.value` | `--overlay` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.shadow-overlay.value` | `--shadow-overlay` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.focus-ring.value` | `--focus-ring` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.sp-4.value` | `--sp-4` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.radius-md.value` | `--radius-md` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |
| `token.dur-normal.value` | `--dur-normal` | `semantic` | - | Invite Member Dialogの公開visual contractで用途tokenとして共有する。 |

Current coverage: `partial`。HTML showcaseを確認済みの仕様候補として記録し、React package実装時にDOM/state selectorまで結線して`complete`へ移行します。

## Do / Don't

Do:

```tsx
<InviteMemberDialog
  open={open}
  roles={roles}
  onInvite={sendInvites}
/>
```

Don't:

```tsx
{/* 多数memberの一括管理には専用pageを使う。 */}
<InviteMemberDialog />
```

## Prohibited Patterns

- `NO_RAW_HEX_COLOR`に反する実装。
- `SPACING_FROM_TOKENS_ONLY`に反する実装。
- `RADIUS_FROM_TOKENS_ONLY`に反する実装。
- `CONTRAST_AA_MINIMUM`に反する実装。
- `FOCUS_VISIBLE_REQUIRED`に反する実装。
- `NO_POSITIVE_TABINDEX`に反する実装。
- `TARGET_SIZE_MINIMUM`に反する実装。
- `INTERACTIVE_NAME_REQUIRED`に反する実装。

## AI Selection Rules

AIが選ぶ条件:

- emailとroleを指定してmember招待を完結するとき。

AIが避ける条件:

- 多数memberの一括管理には専用pageを使う。

AIはvariantを意味、sizeをtask密度、stateを実際のsystem stateから選びます。Viewport名だけでvariantやcomponentを分岐しません。

## Examples

```tsx
<InviteMemberDialog
  open={open}
  roles={roles}
  onInvite={sendInvites}
/>
```

## Implementation Notes

- React packageは今後追加します。現在はsemantic contract、HTML showcase、token binding候補を正本として扱います。
- Native element、ref forwarding、controlled state、event名はpackage実装時にこのcontractへ同期します。

## Open Questions

- React package実装時にDOM/ref/event APIと全visual slot bindingを確定し、coverage completeでstableへ移行する。
