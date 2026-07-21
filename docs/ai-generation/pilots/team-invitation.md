# Phase 1 Manual Pilot — Team Invitation

- Status: Approved reference
- Selected direction: Dedicated Batch Invitation Page
- Human decision: Approved as a Phase 1 reference example
- Date: 2026-07-14

## Approval record

- Approved by: Project owner
- Approved on: 2026-07-14
- Review result: Approved
- Revision requests: None
- Reference role: Phase 1におけるAI提案、Human Review Gate、構造化packageの基準例。

## Confirmed brief

- 招待できるのはOwnerのみ。
- RoleはOwner / Admin / Member / Viewer。
- OwnerはすべてのRoleを付与可能。
- Adminはメンバー一覧を閲覧できるが、招待・Role変更・無効化・削除はできない。
- 複数宛先へ、宛先ごとにRoleを設定できる。
- 1回の操作で招待できるのは最大10人。
- 契約Seatを超える招待は送信できない。
- Pendingは課金上の使用Seatではないが、送信可能数では予約Seatとして扱う。
- 一部エラー時は正常な宛先だけ送信する。
- 既存Pendingは新規送信から除外し、既存招待の再送を案内する。
- Ownerを含む場合は権限説明と明示的な確認checkboxを必須にする。
- 招待は7日間有効。再送で新しい7日間を開始する。

## Seat model

```text
activeSeats = acceptedMembers
reservedSeats = validPendingInvitations
availableForNewInvites = contractedSeats - activeSeats - reservedSeats
```

正常な新規招待数が`availableForNewInvites`を超える場合、送信不可にする。Invalid、既存Member、既存Pendingは新規招待数へ含めない。

## Selected information architecture

```text
Members
  -> Invite members page
      -> Header / seat summary
      -> Batch editor
      -> Global validation summary
      -> Owner permission confirmation (conditional)
      -> Review
      -> Send
      -> Full success / Partial success / Failure
  -> Members / Pending invitations
```

## Batch editor row

各行は次を持つ。

- Email address。
- Role selector。
- Validation / invitation status。
- Remove action。
- Existing Pendingの場合の`招待を再送`導線。

補助操作として、全未確定行へ同じRoleを一括適用できる。ただし各行の個別Roleを維持できること。

## State model

### Default

- 空の1行から開始する。
- Seat summaryに契約、参加済み、予約中、今回送信可能数を表示する。

### Validation error

- Invalid email、同一batch内重複、既存Member、既存Pendingを行単位で表示する。
- Page上部にerror summaryを置き、対象行へ移動できるようにする。

### Seat exceeded

- 必要な追加Seat数を表示する。
- 送信actionを無効にするだけでなく、Pending管理またはplan管理への導線を示す。

### Owner confirmation required

- Owner行が1件以上ある場合のみ表示する。
- Ownerが請求、権限、Workspace削除を含む全操作を行えることを説明する。
- `付与される権限と影響を理解しました` checkboxを必須にする。

### Submitting

- 二重送信を防止する。
- 行とpageの両方で処理中を伝える。

### Full success

- 送信件数と7日間の有効期限を表示する。
- Members / Pendingへ戻るactionをPrimaryにする。

### Partial success

- 成功行を確定して編集対象から外す。
- 失敗行は入力とRoleを保持する。
- 成功、失敗、対象外を別groupで要約する。
- `失敗した招待を再試行`を提供し、成功行を再送しない。

### Existing Pending

- 新規招待から除外する。
- 既存送信日時、有効期限、Roleを示す。
- `招待を再送`と`招待を取消`をPending管理文脈で提供する。
- 入力Roleと既存Roleが異なる場合は無言で上書きしない。

### Expired

- Expiredをtextとstatusで示す。
- 再送すると新しい7日間で再発行する。

### Permission denied

- Owner以外に招待actionを表示しない。
- 招待ページURLへ直接到達した場合は、Owner権限が必要であることを説明してMembersへ戻す。

## Responsive behavior

- Desktopでは比較しやすいtable形式。
- Mobileでは1宛先1cardへreflowし、Email、Role、Status、Removeの読み順を維持する。
- Seat summaryとglobal errorをbatch editorより前に置く。
- Bottom actionを固定する場合もfocusを隠さない。

## Accessibility specification

- Native input、select、checkbox、buttonを優先する。
- Error summaryから該当Email fieldへfocus移動できる。
- 行追加・削除、検証完了、送信結果を必要な粒度でstatus announceする。
- Tableを使う場合も各controlに行の宛先を含むaccessible nameを付ける。
- Owner確認は色やiconだけに依存しない。
- Disabled送信だけで理由を伝えず、Seat不足の説明を常時表示する。
- Partial success後のfocusは結果summaryへ移し、成功・失敗件数を読み上げる。
- 24px minimum targetを満たし、主要touch actionは44pxを目標にする。

## Content decisions

- Role名だけでなく1行の権限説明を表示する。
- Button labelは結果を表す。例: `3人に招待を送信`。
- Pending、Expired、Failedを色だけで伝えない。
- Seat不足は`送信できません`だけでなく、必要数と回復方法を示す。
- Owner確認では恐怖を煽らず、実行可能な権限を具体的に説明する。

## Quality review tasks

1. Ownerが3人へ異なるRoleを設定して送信できる。
2. Invalid 1件を含むbatchで正常行だけ送信できる。
3. 既存Pendingが新規送信から除外され、再送へ進める。
4. 残りSeatを超えたとき、必要Seat数を理解できる。
5. Ownerを含むときだけ確認checkboxが必要になる。
6. Keyboardだけで行追加、Role変更、error修正、送信まで完了できる。
7. Partial success後に成功行を再送せず失敗行だけ修正できる。

## Evidence status

- GitHub、Slack、Notionの公開公式ドキュメント画像はprovenance付きで取得済み。Business rule、用語、task条件の根拠として使用する。
- これらは認証後の実画面ではないため、各Productの詳細なvisual hierarchyとkeyboard behaviorを証明するものとしては扱わない。
- 取得した根拠は画面固有原則へ変換し、3つのtask modelとMeridian Component Registryへgrounding済み。
- Business Ruleに未解決事項はない。
