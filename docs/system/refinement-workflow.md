# System Refinement Workflow

この文書は、Meridian の Overview、Foundations、Tokens、Components を、誰が担当しても同じ順序と判断基準で継続的に改善するための共通手順です。

対象ページと依存関係の唯一の一覧は `design/system-registry.json`、各サイクルの結果は `design/reviews/*.review.json` に残します。

## Refinement Loop

```text
Overview
  Principles / Architecture / audience / readiness
      ↓
Foundations
  Color / type / spacing / layout / motion / accessibility
      ↓
Tokens
  Reference / Semantic / Component / modifiers / outputs
      ↓
Components
  md / contract / HTML docs / implementation
      ↓
Validate / visual review / review record
      └─────────────── feedback to the owning layer
```

上位から下位への矢印は「設計判断を具体化する流れ」です。下位で不足や矛盾を発見した場合は、場当たり的な例外を作らず、その判断を所有する上位 item へ戻します。

## Source Roles

| Source | Role |
|---|---|
| `design/system-registry.json` | 対象 item、順序、依存関係、source、route の機械可読カタログ。 |
| `design/reviews/*.review.json` | 1回のレビューで読んだもの、決定、差分、変更、検証、影響先を残す追記型の記録。 |
| `design/research-policy.json` | 全Domain共通のResearch Gate、調査trigger、一次資料要件、分野別source方針。 |
| `design/token-policy.json` | token layer、modifier、Component token 昇格条件、binding rule。 |
| `VISION.md` / `design/*.json` | プロダクト目標、原則、ルール、Semantic token の判断。 |
| `tokens/src/*.json` | token 値とaliasの編集元。 |
| `components/*.md` | コンポーネントの人間・AI向け設計仕様。 |
| `design/contracts/components/*.contract.json` | コンポーネントの機械可読仕様とtoken binding。 |
| `js/pages-*.js` / `index.html` | 視覚確認できるHTML docsとショーケース。 |
| `tokens/build/*` / `DESIGN.md` | sourceから生成される成果物。直接編集しない。 |

## Start A Cycle

1. `npm run refine:status` で進捗と次に着手できる item を確認する。
2. `design/system-registry.json` で対象 item の `sources`、`dependsOn`、`route` を確認する。
3. `docs/system/templates/` の該当テンプレートを使ってレビューする。
4. `npm run refine:start -- <item-id>`で新しいreview recordを作り、cycleを開始する。

完了済みitemを、利用者の新しい判断や定期監査を理由に明示的に再レビューする場合は、`npm run refine:start -- <item-id> --force`でfollow-up cycleを開始します。`--force`は依存itemがすべて完了している`complete` itemにだけ使用でき、進行中cycleの重複や未完了依存の迂回には使えません。

`refine:start`は衝突しないcycle ID、`supersedesCycleId`、現在の`acknowledgedImpacts`、registryの最新pointerを設定します。review recordは上書きしません。registryは最新recordへのpointer、過去recordは判断履歴です。

`blocked` cycleの外部条件が解消した場合も、同じ`refine:start`でfollow-upを開始します。`in-progress` itemには重複cycleを作れません。

依存 item が未完了でも調査はできますが、下流の判断を確定する前に上流の未確定点を解消します。

完了したcycleが複数itemへ影響を通知した場合は、関連testと`npm run validate:system`の成功を確認してから、`npm run refine:complete-impacts -- --validated --impact-cycle=<cycle-id>`を実行できます。このコマンドは影響itemを依存順に再確認し、影響元の調査を継承する理由、item固有の判断、確認source、検証結果をfollow-up recordへ残します。新しい外部解釈や未検証の変更が必要なitemには使わず、個別cycleとしてレビューします。

## One Cycle

### 1. Read Current Sources

- registry に列挙されたsourceをすべて読む。
- 生成物だけで判断せず、編集元を特定する。
- HTML docs、md、JSON、runtime実装のどれが現在の判断を所有しているか確認する。
- 前回review recordのopen questionとimpacted itemを確認する。

### 2. Research Gate

全cycleで`design/research-policy.json`を読み、外部調査が必要か評価します。

- 標準・アクセシビリティ・新pattern/API・cross-platform・不確実性などのtriggerがあれば`research.status: complete`まで調査する。
- normative standard、公式guideline、公式design system、platform documentationなどの一次資料を最低1件含める。
- evidenceごとにURL、source type、accessed date、要約、支持するdecision IDを記録する。
- `research.scope`へ対象item IDと、このcycleで確認する具体的な範囲を記録する。
- 複数資料の共通点と差異を`synthesis`へ、Meridianの変更点を`decisionImpact`へ書く。
- triggerがなければ`research.status: not-required`とし、このcycleで不要な具体的理由を残す。
- `secondary-analysis`だけを根拠にsystem decisionを確定しない。

`pending`のままreviewを`complete`にはできません。外部情報が取得できず判断不能な場合はreview自体を`blocked`にし、open questionへ解除条件を記録します。

### 3. Review The Decision

- 現在の文章や実装を説明するだけでなく、その判断自体が妥当かを確認する。
- Principles、System Architecture、token policy、アクセシビリティ、PC/SP/touchとの整合を見る。
- 好みではなく、再利用可能な判断基準として説明できる状態にする。

### 4. Review The Rendered Result

- HTML docsの情報構造、例、状態、レスポンシブ表示を確認する。
- FoundationsとTokensでは値だけでなく、使い方・禁止事項・theme/density差を確認する。
- ComponentsではPlayground、Variants、States、Usage patterns、Responsive behaviorを確認する。

### 5. Classify Differences

| Classification | Action |
|---|---|
| `source-wrong` | 判断を所有するmd / JSON / policyを直す。 |
| `docs-stale` | HTML docsの説明や例をsourceへ同期する。 |
| `implementation-stale` | CSS / JS / component implementationを更新する。 |
| `missing-token` | token ownerへ戻し、Reference / Semantic / Componentのどこで持つか判断する。 |
| `missing-contract` | schemaまたはcontractへ機械可読な項目を追加する。 |
| `cross-layer-conflict` | 上位itemをimpacted itemとして記録し、下流だけで解決しない。 |
| `open-question` | 決定に必要な情報とownerを記録し、stable扱いにしない。 |
| `no-change` | 読んだsourceと確認内容をrecordへ残す。 |

### 6. Update In Ownership Order

```text
Decision source
  → machine-readable policy / contract
  → implementation
  → HTML docs
  → generated outputs
```

同じ変更で複数層に触れる場合も、この順序を守ります。生成物からsourceへ内容を逆輸入しません。

### 7. Propagate Impact

- Overview変更: 関係するFoundations、Tokens、Componentsを`impactedItems`へ追加する。
- Foundation変更: 対応token domainと利用componentを追加する。
- Token変更: alias参照先、component binding、CSS/Figma/React outputを追加する。
- Component変更: md、contract、HTML、実装を同一cycleで同期する。

影響先を同じcycleで直さない場合は、次のreview対象としてrecordに残します。

### 8. Validate

```sh
npm run check:system
```

対象HTMLを変更した場合は、desktop / mobile、Light / Dark × Standard / High、必要なDensityで視覚確認します。自動確認できない場合は、review recordへ手動確認内容を記録します。

### 9. Close The Cycle

review recordを更新します。

- review recordの`complete`は「今回のcycleを閉じた」という意味で、component contractの`stable`とは別です。
- 2周目以降は`supersedesCycleId`で同じitemの前回cycleへつなぐ。
- `status`を`complete`または`blocked`にする。
- reviewを`complete`にする場合は、`research.status`を`complete`または理由付き`not-required`にする。
- 外部情報を取得できずreviewを`blocked`にする場合だけ、scopeとopen questionを記録した上で`research.status: pending`を維持できる。
- decisions、differences、changes、validationsを空のままにしない。
- open questionにはownerとstable化に必要な条件を書く。
- impacted itemと次の推奨itemを記録する。
- 今回取り込んだ上流cycleの`cycleId`を`acknowledgedImpacts`へ記録する。
- `npm run refine:status`でqueueが進んだことを確認する。

完了済みitemが新しいreview recordの`impactedItems`に入り、そのcycleをまだ`acknowledgedImpacts`へ記録していない場合、`refine:status`はそのitemを`needs review`として再度queueへ戻します。これが2周目以降の入口です。

## Domain Done Criteria

全Domain共通で、Research Gateの判定、根拠、判断への反映がreview recordに記録されていることを必須とします。

### Overview

- VISION、Principles、Architecture、現在の提供状況と矛盾しない。
- 下位層が実装可能な判断基準になっている。
- 将来像と現在実装を混同していない。

### Foundations

- 目的、選択基準、禁止事項、theme/density/responsive/accessibilityがある。
- tokenへ落とす判断と、layout/component contractで扱う判断を分けている。
- 値の一覧だけで終わっていない。

### Tokens

- Reference / Semantic / Componentとmodifierのownerが明確。
- alias方向、命名、型、DTCG形式、出力先が検証できる。
- Component tokenにはtoken policyで許可されたtriggerとreasonがある。

### Components

- `docs/components/spec-workflow.md`のDone Criteriaを満たす。
- visual slotのtoken binding coverageが記録されている。
- md、contract、HTML docs、実装の主要判断が同期している。

## Change Safety

次は同じcycleで扱います。

- 名称変更とalias移行
- token削除と参照先更新
- schema変更とtemplate / pilot contract更新
- modifier追加と全resolutionの検証

破壊的変更は、移行先、deprecated期間、影響itemをreview recordへ記録するまで完了にしません。

## Commands

```sh
npm run refine:status   # 進捗、blocked item、次に着手できるitem
npm run refine:start -- <item-id> # review cycleを追記型recordとして開始
npm run refine:start -- <item-id> --force # 完了済みitemを明示的な理由で再レビュー
npm run refine:complete-impacts -- --validated --impact-cycle=<cycle-id> # 検証済みの影響itemを依存順に完了
npm run check:system    # schema、registry、contract、binding、AI spec、生成物、JS構文、tests
npm run build:tokens    # token CSSを再生成
npm run design:build    # DESIGN.mdを再生成
```
