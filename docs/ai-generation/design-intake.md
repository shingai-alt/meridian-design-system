# Meridian UI Generation — Design Intake and Clarification

- Status: Implementation spike complete; Human Brief Approval pending
- Milestone: M2
- Canonical policy: `design/ui-generation-clarification-policy.json`
- Schemas: `schemas/design-brief.schema.json`, `schemas/clarification-round.schema.json`

## 1. Purpose

Design Intakeは、自由記述のUser RequestとProject Contextを、後続のDirection生成が参照できる独立したDesign Briefへ変換する境界である。ここでは見た目や特定UI LibraryのComponentを決めず、利用者の行動、業務上の対象、制約、Risk、未確定事項を構造化する。

Design BriefはRequestの要約ではない。各判断をEvidenceへ接続し、どの入力Revisionから生成されたかをdigestで固定し、Human Reviewの対象にする。

## 2. Canonical artifacts

| Artifact | Ownership | Responsibility |
|---|---|---|
| User Request | canonical | 利用者が要求した目的と明示要件 |
| Project Context | evidence | Framework、Design System、Token、Component、品質条件の観測結果 |
| Design Brief | canonical | Actor、Goal、Task、Entity、Action、Constraint、Risk、Assumption、Unknown、Scope、Acceptance |
| Clarification Round | canonical | 1回に提示する質問、回答、merge結果 |

現行Design Briefの`source`は、同じSessionにある現行User RequestとProject Contextのpathおよびdigestへ一致しなければならない。Session validatorはこの連鎖を検証し、古い入力や別Request由来のBriefを拒否する。

## 3. Unknown classification

Unknownは、回答によって変化する可能性がある構造層で分類する。

- `task-model`
- `information-architecture`
- `navigation`
- `screen-boundary`
- `disclosure`
- `permission`
- `primary-action`
- `none`

Policyは構造影響ごとの重みを定義する。Unknownのpriorityは該当する影響の最大重みと一致しなければならない。`none`だけのUnknownはnon-blockingであり、質問Roundを止めない。

## 4. Clarification behavior

質問対象は、状態が`open`かつimpactが`blocking`のUnknownだけである。

1. priority降順、同順位はUnknown ID順に並べる。
2. 1 Roundあたり最大3件に制限する。
3. Component名、Framework名、実装方式ではなく、利用者の行動と業務結果を尋ねる。
4. 回答は許可されたBrief fieldだけへmergeする。
5. 回答がなくても構造を変えないUnknownは、根拠を残してAssumptionへ変換できる。

Blocking unknownが残る間、BriefはDirection planningへ進めない。Non-blocking unknownは明示されたまま残せる。

## 5. Human gate

Brief approvalは`product-owner` roleのHumanだけが実行できる。Approvalは承認時点のcanonical Brief digestへ結び付く。承認後にBrief内容が変わった場合、digestが変わるため以前のApprovalは無効である。

AIは次を実行できない。

- 自分自身をHuman actorとして記録する
- Blocking unknownを黙って解決済みにする
- Brief変更後も以前のApprovalを再利用する
- 未承認BriefからDirectionを正式生成する

## 6. Team Invitation pilot

Reference pilotは次の成果物で構成する。

- `examples/ui-generation/team-invitation.request.json`
- `examples/ui-generation/meridian.project-context.json`
- `examples/ui-generation/team-invitation.design-brief.json`
- `examples/ui-generation/team-invitation.clarification.json`
- `examples/ui-generation/team-invitation.session.json`

現在のBriefにはblocking unknownがないため、Clarification Roundの質問数は0である。競合製品のKeyboard観察は構造を変えないnon-blocking unknownとして保持している。Briefは`ready-for-review`だがHuman Approvalは未記録である。

M1のProject Configuration Research Decisionも未承認のため、Sessionは`created`に留まり、`inspect_project` transitionはopen blockerによって禁止されている。成果物を先に作成できても、正式なstate advancementは承認Gateを迂回しない。

## 7. Verification

```sh
node --test test/design-intake.test.js test/ui-generation-session.test.js
node scripts/validate-system.mjs
npm run check:system
```

検証対象はSchema適合だけでなく、Unknownのpriority、質問件数と順序、禁止語、merge allowlist、Assumption conversion、Human-only approval、canonical digest、Session内のsource bindingを含む。
