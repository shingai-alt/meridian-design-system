# Meridian Component Harness 1.0 — Phase 2.1 設計書

- Status: Implemented — Pilot ready for Human Review
- Scope: Design and Phase 2.1 pilot implementation
- Pilot: Team Invitation
- Target release: Meridian Harness 1.0 / Phase 2.1
- Last updated: 2026-07-14

## 1. 決定事項

Phase 2.1では、Team Invitationで使う9 Componentを、Component Contractと同期するFramework非依存のHTML Runtimeとして定義する。

Phase 2のReview HTMLは維持する。ただし、画面固有rendererがComponent HTMLとCSSを自由に組み立てる方式から、登録済みComponentと承認済みPatternをComposition Manifestへ宣言し、build-time auditを通過した画面固有rendererだけが正式Runtimeを呼べる方式へ移行する。Phase 2.1のManifestはComponent境界の正本であり、画面layout全体の汎用DSL化は対象外とする。

Phase 2.1の完了は、9 Componentの見た目が完成した状態ではない。次の閉路がTeam Invitationの縦切りで成立した状態とする。

```text
Component Contract + Token + Accessibility policy
                    |
                    v
       AI Translation Pack（自動生成）
                    |
Design Brief -> Component Composition Manifest
                    |
                    v
        Strict Component Resolver
                    |
                    v
       Meridian HTML Component Runtime
                    |
                    v
       Provenance付きReview HTML
                    |
                    v
     Contract / Runtime / HTML検証
```

Human Feedbackを正本へ還元する完全な循環はPhase 2.3で扱う。Phase 2.1では、後続のFeedback HarnessがComponent選択と生成根拠を追跡できるところまでを設計する。

## 2. 目的

### 2.1 Outcome

Team InvitationのReview HTMLについて、次を保証する。

1. AIまたはGeneratorが参照するComponent情報は正本から自動生成される。
2. 画面は登録済みComponentと承認済みPatternだけで構成される。
3. 使用Component、variant、state、Contract version、選択理由を機械的に追跡できる。
4. Contract、Runtime、Translation Pack、生成HTMLの不一致をCIで検出できる。
5. Component不足時は独自実装せず、承認が必要な例外候補として停止できる。

### 2.2 Meridian Harness 1.0との関係

Meridian Harness 1.0の100%は、AIが常に完璧なUIを生成することではなく、次の4層が閉じていることを意味する。

| 層 | Harness 1.0の完成条件 | Phase 2.1の責務 |
|---|---|---|
| 文脈 | AIが正本から自動生成された最新情報だけを参照する | 9 ComponentのTranslation Packを自動生成する |
| 制約 | 未登録Component、独自CSS、未承認例外を生成できない | Strict ResolverとComposition Manifestの境界を作る |
| 検証 | Contract、実装、HTML、a11yのズレをCIで検出する | 9 Componentのparityとprovenance検証を作る |
| フィードバック | 承認済み修正が正本へ戻り次回生成へ反映される | 追跡IDを残す。Importと承認処理はPhase 2.3で実装する |

## 3. 現状と解くギャップ

現在の正本とPhase 2成果物には、次の資産がある。

- 74件のmachine-readable Component Contract: `design/contracts/components/*.contract.json`
- 人間向けComponent仕様: `components/*.md`
- Component Contract Schema: `schemas/component-contract.schema.json`
- Token sourceと生成済みCSS: `tokens/src/*`、`tokens/build/tokens.css`
- Accessibility policy: `design/accessibility.json`
- Team Invitationの承認済みPhase 1 PackageとPhase 2 Concept Manifest
- DeterministicなPhase 2 generatorとReview HTML

一方、Team Invitationで使う9 Contractは現時点で`draft`、Token bindingは`partial`である。Phase 2 rendererは正式なComponent APIを介さず、画面固有のHTML、CSS class、interactionを直接出力している。このため、ContractにないvariantやDOM構造、Token bindingの逸脱を、Component単位では証明できない。

Phase 2.1は既存Phase 2を作り直すものではない。Phase 2のBrief、Scenario、Review、Feedback exportを維持し、そのprototype生成部分にComponent Harnessを挿入する。

## 4. Scope

### 4.1 対象

- 9 ComponentのHTML Runtime contractと正式実装。
- 9 ComponentのContractをRuntime実装に必要な粒度へ補強。
- Component Registry view。
- Contractから生成するAI Translation Pack。
- Component Composition Manifest。
- Strict Component Resolver。
- Component usage manifestと選択理由。
- 生成HTMLのComponent provenance。
- Contract / Runtime / Translation Pack parity check。
- Team Invitation rendererのComponent Harnessへの移行設計。
- Phase 2.2で追加するlint、browser、visual検証の接続点。

### 4.2 対象外

- 残り65 ComponentのRuntime化。
- React、Vue、Web Componentsなど特定Framework向けadapter。
- Production backend、認証、メール送信、課金処理。
- AIによるContract、Rule、Tokenの自動変更。
- Feedback Import、scope分類、承認、正本更新。
- Visual regression基盤とbrowser automation本体。
- すべての情報設計、視覚品質、screen reader体験の自動判定。
- Contractの`stable`昇格。Phase 2.1の実装とHuman Reviewを終えるまで`draft`を維持する。

## 5. Pilot Component set

| ID | Runtime責務 | Team Invitationでの用途 | 必須状態・variant |
|---|---|---|---|
| `button` | native button、action hierarchy、loading/disabled | 行追加、削除、Review、送信、再試行 | `primary`、`secondary`、`ghost`、`disabled`、`loading` |
| `text-field` | native inputとvalue state | Email入力 | `default`、`focus`、`error`、`disabled` |
| `select` | native selectとoption selection | 宛先ごとのRole選択 | `default`、`focus`、`error`、`disabled` |
| `form-field` | label、description、control、messageの関連付け | EmailとRoleのfield構造 | `default`、`error` |
| `validation-message` | field単位の検証結果 | Invalid、duplicate、既存Member | `error`、`warning`、`success` |
| `checkbox` | native checkboxとlabel | Owner権限の明示確認 | `default`、`checked`、`disabled` |
| `alert` | page/section levelの状態と回復導線 | Error summary、Seat超過、送信結果 | `info`、`success`、`warning`、`danger` |
| `status-indicator` | 短い行状態をtextと非色依存cueで表示 | Pending、Expired、送信済み、失敗 | `success`、`running`、`warning`、`error`、`idle` |
| `table` | 比較可能なnative table semantics | Desktopの招待行、結果一覧 | `default`、`loading`、`empty` |

### 5.1 Table / Interactive Row Groupの境界

`table`は比較可能なデータ構造を所有する。行追加、行削除、行ごとの入力state、Mobileでのcard reflow、Partial successの業務ロジックはTable Componentへ入れない。

これらはTeam Invitationの承認済みPattern `interactive-row-group`として定義し、内部で`table`、`form-field`、`text-field`、`select`、`status-indicator`、`button`を構成する。Desktopではnative table相当の比較関係を保ち、Mobileでは同じデータとfield relationを1宛先1groupへreflowする。

PatternはComponentの抜け道ではない。Patternの全leaf nodeはRegistryにあるComponentへ解決され、Pattern固有CSSもTokenと承認済みlayout recipeだけを使う。

## 6. 正本と派生成果物

正本の優先順位を次のように固定する。

| Artifact | Role | Edit policy |
|---|---|---|
| Component Contract JSON | Componentの意味、API、状態、a11y、Token bindingの正本 | Human Reviewを経て編集 |
| Token source / policy | 値、alias、利用制約の正本 | 既存Token workflowで編集 |
| Accessibility policy | 横断要件の正本 | Human Reviewを経て編集 |
| Pattern Contract | 複数Componentの構成と業務上の責務の正本 | Phase 2.1で新設、Human Reviewを経て編集 |
| Phase 1 Package | Product要件と採用方向の正本 | 既存Phase 1 workflowで編集 |
| Phase 2 Concept Manifest | Scenarioとreview条件の正本 | 既存Phase 2 workflowで編集 |
| Runtime implementation | Contractを実行可能HTMLへ写像する正式実装 | Contractと同一change setで更新 |
| AI Translation Pack | AI向けに圧縮した派生成果物 | 手編集禁止 |
| Component Registry view | Resolver向け索引の派生成果物 | 手編集禁止 |
| Generated Review HTML | Review用派生成果物 | 手編集禁止 |
| Component usage manifest | 生成結果の追跡用派生成果物 | 手編集禁止 |

Human向け`components/*.md`は説明と判断根拠を提供するが、Runtime APIの機械判定にはContract JSONを使う。両者の不一致は既存のComponent同期検査で検出する。

## 7. Target architecture

```text
design/contracts/components/*.contract.json ----+
tokens/src/* + design/token-policy.json --------+--> Component Registry Builder
design/accessibility.json ----------------------+              |
                                                               +--> registry.json
                                                               +--> ai-index.json
                                                               +--> ai-index.md
                                                               +--> runtime typings

Phase 1 Package + Phase 2 Concept Manifest
                     |
                     v
        Component Composition Manifest
                     |
                     v
            Strict Resolver <------ registry.json
                     |
          +----------+----------+
          |                     |
          v                     v
    HTML Runtime          Usage Manifest
          |
          v
 Provenance付きReview HTML
          |
          v
 Schema / parity / component / token / a11y checks
```

### 7.1 Runtime layer

Runtimeは次の3層で構成する。

1. Semantic HTML renderer: native element、ARIA relation、required anatomyを出力する。
2. Component CSS: 公開slotとstateへContract記載Tokenをbindingする。
3. Behavior controller: loading、focus移動、live announcementなど、native HTMLだけで不足する最小interactionを提供する。

RuntimeはglobalなDOM探索や画面固有selectorへ依存しない。各instanceは一意なinstance IDと明示的なrelation IDを受け取り、Behavior controllerは当該rootの内側だけを所有する。

### 7.2 Runtime packaging

Phase 2.1ではES moduleとCSSを正式配布単位とする。

```text
packages/html-runtime/
  src/
    components/
    patterns/
    resolver/
    provenance/
  styles/
    components.css
    patterns.css
  index.js
  index.d.ts
```

上記は実装時の予定構造であり、本設計書の作成時点では追加しない。Standalone Review HTMLでは、build時に必要なmoduleとCSSをinline化できる。inline化後もsource versionとintegrity情報をprovenanceへ残す。

### 7.3 Public rendering interface

GeneratorはComponent HTML文字列を直接連結せず、Resolverで検証されたusage IDを使ってRuntimeを呼ぶ。画面固有section、heading、layout containerはdeterministic rendererが担当し、Component呼出しはbuild-timeにCompositionと双方向照合する。

```js
resolver.render({
  component: 'button',
  instanceId: 'invite-submit',
  props: {
    variant: 'primary',
    size: 'md',
    type: 'submit',
    disabled: false
  },
  content: '3人に招待を送信',
  rationaleRef: 'decision.invite-submit.primary'
})
```

Resolverは次の順で拒否または解決する。

1. Component IDがRegistryにあるか。
2. statusが利用可能か。`deprecated`は拒否し、`draft`はPilot allowlist内だけ許可する。
3. prop、variant、state、sizeがContractにあるか。
4. required propとrequired anatomyが満たされるか。
5. 値型と列挙値がRuntime API Schemaに適合するか。
6. a11y relationとaccessible nameを構築できるか。
7. rationaleRefがUsage Manifest内のdecisionへ解決できるか。
8. Runtime renderer versionがContract versionをsupportするか。

失敗時にfallback HTMLを生成しない。構造化errorを返し、`ready-for-review`への遷移を止める。

## 8. ContractのPhase 2.1拡張

現行Contractには、用途、variant、state、props、Token、a11y、例がある。HTML Runtimeとの厳密なparityには次の情報を追加する必要がある。

| Field | Purpose |
|---|---|
| `contractVersion` | Component単位のsemver。schemaVersionとは分離する |
| `runtime.element` | rootのnative elementまたは許可されたelement集合 |
| `runtime.slots` | label、control、messageなど公開slotとrequired条件 |
| `runtime.attributes` | propからHTML attribute / ARIAへの写像 |
| `runtime.stateModel` | stateのdata attribute、native attribute、ARIA表現 |
| `runtime.events` | click、changeなど公開eventとpayload |
| `runtime.relations` | label、description、error、summary、live regionのID関係 |
| `runtime.provenance` | 必須provenance field |
| `selectionRules` | AI向けの選択条件、禁止条件、代替候補 |
| `negativeExamples` | 機械利用できるNG例と違反rule ID |
| `requiredScenarios` | Runtimeで必ず実証する状態fixture |

Schema拡張は後方互換にせず、Phase 2.1用schema versionを上げ、74 Contractを一括で必須変更しない。Pilot allowlistの9 Componentから段階移行し、旧ContractはTranslation Packのlegacy entryとして生成対象外にできるようにする。

Contract versioning rule:

- Patch: 文言、例、実装を変えない明確化。
- Minor: optional prop、variant、stateの追加。
- Major: DOM semantics、required anatomy、prop削除・変更、keyboard modelの破壊的変更。
- Runtimeは対応するContract version rangeを宣言する。
- HTMLには解決時に使用した正確なContract versionを残す。

## 9. AI Translation Pack

Translation PackはLLM向けにContractを要約した手書きpromptではなく、正本からdeterministicに生成する。

### 9.1 Contents

Componentごとに次を含む。

- ID、name、category、status、contractVersion。
- 使う条件、使わない条件、代替Component。
- variants、states、sizes、propsとdefault。
- required anatomyとHTML semantics。
- Accessibility requirementsとkeyboard interaction。
- 許可Token categoryと禁止rule ID。
- 正しい例、NG例。
- Team Invitationでの許可scope。
- Runtime compatibility range。
- source pathとcontent digest。

### 9.2 Formats

- `ai-index.json`: Generatorと自動検証向け。
- `ai-index.md`: Codex / Claudeのcontext向け。
- Component別fragment: context budgetに応じた選択読み込み向け。

すべて同じnormalized modelから生成し、format間の独自情報を禁止する。Pack headerには生成元digest、生成tool version、生成日時ではなく再現可能なsource revision IDを含める。

### 9.3 Staleness rule

Contract、Token binding、Accessibility policy、Pattern Contractのいずれかが変わり、Translation Packのdigestが一致しない場合はCIを失敗させる。GeneratorはstaleなPackを警告付きで使わず、生成自体を拒否する。

## 10. Component Composition Manifest

Composition Manifestは、AIまたはdeterministic generatorが出力する「どのComponentを、どの判断根拠・variant・state範囲で使えるか」の中間表現である。HTMLやCSSを値として持たない。Phase 2.1では画面全体の親子DOMやcontent layoutを生成するtemplate ASTではなく、Component leafとPatternの許可境界を表す。

```json
{
  "schemaVersion": "0.1.0",
  "id": "team-invitation.primary-path",
  "translationPackDigest": "sha256-...",
  "nodes": [
    {
      "component": "button",
      "instanceId": "invite-submit",
      "props": {
        "variant": "primary",
        "size": "md",
        "type": "submit"
      },
      "contentRef": "content.invite.send-count",
      "decisionRef": "decision.invite-submit.primary"
    }
  ],
  "decisions": [
    {
      "id": "decision.invite-submit.primary",
      "component": "button",
      "reason": "この画面の最終確定actionであり、同じ意思決定文脈のprimaryは1件だけ",
      "sourceRefs": ["component.button.selection.primary", "phase1_team_invitation"]
    }
  ],
  "exceptions": []
}
```

Manifest schemaは次を禁止する。

- raw HTML、`style`、`className`、CSS selector。
- raw color、px、rem、shadow、radius、motion value。
- RegistryにないComponent、Pattern、slot。
- Contract外のvariant、state、prop。
- inline event handlerと任意script。
- sourceのないdecision。
- approval recordのないexception。

Layoutは任意CSSではなく、Registryに登録したlayout recipeを参照する。初期recipeは`stack`、`cluster`、`grid`、`section`、`responsive-switch`に限定し、gap、column、breakpointは許可Tokenまたは名前付きpresetで指定する。

## 11. ProvenanceとUsage Manifest

### 11.1 HTML provenance

各Component rootへ、少なくとも次を出力する。

```html
<button
  data-meridian-component="button"
  data-meridian-instance="invite-submit"
  data-meridian-variant="primary"
  data-meridian-state="default"
  data-meridian-contract-version="0.1.0"
  data-meridian-runtime-version="0.1.0"
  data-meridian-decision="decision.invite-submit.primary"
>
  3人に招待を送信
</button>
```

Native/ARIA attributeをprovenanceで置き換えない。provenanceは検査・追跡用であり、user agentや支援技術に対する意味はnative semanticsとARIAが所有する。

Child slotには必要な場合だけ`data-meridian-slot`を付ける。全DOM nodeへmetadataを複製しない。

### 11.2 Usage Manifest

生成HTMLと同時に、次を機械可読JSONとして出力する。

- concept / scenario / source package ID。
- Translation Pack digest。
- Runtime version。
- Component instance一覧。
- instanceごとのComponent、variant、state、props、Contract version。
- decision ID、選択理由、sourceRefs。
- Patternとlayout recipe。
- exceptionとapproval record。
- validation result digest。

画面renderer内のRuntime call siteとUsage Manifestをbuild-timeに双方向照合し、未宣言usage IDまたは未使用nodeをbuild failureにする。生成HTMLの静的root provenanceと、browserで展開される動的instanceのscenario別完全照合はPhase 2.2のbrowser validationで追加する。

## 12. Exception protocol

ComponentまたはPatternで要件を表現できない場合、Resolverは独自実装を生成せず、次の候補を返す。

```json
{
  "type": "component-exception",
  "id": "exception.team-invitation.row-reflow",
  "reason": "既存ComponentとPatternではMobileの編集行を表現できない",
  "scope": "team-invitation",
  "requestedCapability": "interactive row group with mobile reflow",
  "alternativesConsidered": ["table", "data-grid", "list"],
  "humanApprovalRequired": true,
  "status": "proposed"
}
```

Phase 2.1では、`proposed` exceptionが1件でもあれば`ready-for-review`へ進めない。人間が承認した場合も、期限、owner、scope、代替手段を持つapproval recordが必要である。例外を永続化するか、Pattern / Componentへ昇格するかはPhase 2.3の変更提案として扱う。

## 13. Team Invitation composition

### 13.1 Page structure

```text
Page heading
Seat summary
Alert: global validation / seat exceeded / result
Interactive Row Group
  Table (desktop comparison semantics)
    Form Field
      Text Field
      Validation Message
    Form Field
      Select
    Status Indicator
    Button (row action)
Owner confirmation
  Alert
  Checkbox
Page actions
  Button (review / send / retry)
```

Seat summary、Page heading、Breadcrumb、Review shellは今回の9 Component外である。Phase 2.1では次のいずれかへ分類し、暗黙の独自Componentにしない。

- semantic HTML + 登録済みlayout recipeで表現できるcontent structure。
- Review Harness自体のinfrastructure UI。
- Pilotに必要な追加Component候補。

Prototype本体に新規の操作componentが必要になった場合は例外protocolへ進む。Review toolbarとFeedback composerは生成対象UIではなくHarness infrastructureとして別namespace `meridian-harness-*`を使い、Product UIの準拠scoreへ混ぜない。

### 13.2 Scenario coverage

| Scenario | 実証するComponent contract |
|---|---|
| Primary path | Text Field、Select、Button、Tableのdefaultと送信action |
| Validation errors | Form Field relation、Validation Message、Alert error summary、focus移動 |
| Existing Pending | Status Indicator、Buttonによる再送導線、入力対象外の説明 |
| Seat exceeded | Alert warning/danger、送信Buttonのdisabled理由 |
| Owner confirmation | Alert、Checkbox、条件付きrequired、送信guard |
| Partial success | Alert success/error、Status Indicator、retry Button、成功行の再送防止 |
| Maximum batch | Table density、10行境界、Mobile reflow |

各required stateは少なくとも1つのdeterministic fixtureに紐づける。Contractにrequired stateがあるがPilot scenarioで到達不能な場合は、Component単体fixtureで補う。

## 14. Validation design

### 14.1 Build-time gates

| Gate | Check | Failure example |
|---|---|---|
| Schema | Contract、Pattern、Composition、UsageのSchema適合 | unknown prop |
| Registry | 参照ID、version、status、digestの整合 | unregistered component |
| Parity | Contract APIとRuntime exportの一致 | Contractにあるstateをrendererが未実装 |
| Translation | Packが正本と同期 | stale digest |
| Composition | leaf nodeが許可Componentへ解決 | raw HTML node |
| Token | Runtime CSSがContract binding内のTokenだけを使う | raw color / arbitrary spacing |
| Provenance | HTMLとUsage Manifestが一致 | missing decision ID |
| Accessibility | required semantics、relation、name、stateを静的検査 | error messageがinputと未関連 |
| Determinism | 同じ入力からbyte-identical output | random instance ID |

### 14.2 Runtime and browser gates

Phase 2.1ではtest fixtureとinterfaceを用意し、browser自動化の本体はPhase 2.2で接続する。

- Keyboardだけで行追加、Role変更、error修正、送信まで完了できる。
- Error summaryから該当fieldへfocusできる。
- Owner確認が条件付きrequiredとして働く。
- Loading中の二重送信を防ぐ。
- Partial success後に成功行を再送しない。
- Dynamic resultを適切なlive regionで通知する。
- Mobile reflow後もreading orderとfocus orderが一致する。
- 200% zoomと320 CSS px幅で二方向scrollをpage全体へ発生させない。
- Reduced motionを尊重する。

### 14.3 Human gates

自動検証を通過しても、次はHuman Reviewに残す。

- Component選択理由がtaskと情報設計に合うか。
- Primary actionの強さと視覚階層が適切か。
- Error、Seat不足、Owner権限の説明が理解できるか。
- Mobile reflowが比較と編集の両方を保てるか。
- Screen readerで冗長または不足したannouncementがないか。
- Team Invitation固有Patternをsystem-wideへ昇格すべきか。

## 15. CI state model

Concept statusは次のgateをすべて通るまで`ready-for-review`へ遷移できない。

```text
Schema        PASS
Registry      PASS
Component     PASS
Token         PASS
Accessibility PASS
Interaction   PASS
Provenance    PASS
Determinism   PASS
Translation   PASS
Exception     PASS
```

`Feedback PASS`はPhase 2.3で追加する。Phase 2.1ではFeedback export機能を維持するが、正本へ還元されたことを完了条件にはしない。

CI reportはpass/failだけでなく、Component ID、instance ID、Contract field、source path、rule ID、修正候補を返す。AIが修正を試みる場合も、ContractやRuleを変更せずComposition ManifestまたはProduct固有contentだけを修正する。

## 16. Security and integrity

- ContentはdefaultでHTML escapeし、明示的なtrusted HTML propを提供しない。
- URL propは許可protocolと用途をContractで制限する。
- inline event handler、`eval`、任意script injectionを禁止する。
- instance IDはManifestからdeterministicに生成し、DOM IDとして安全な形式へ正規化する。
- Runtime dataを`script`へ埋め込む場合は`<`、`>`、`&`をescapeする。
- Provenanceは個人情報、入力値、reviewer情報を含めない。
- Translation PackとRuntime artifactにsource digestを持たせ、取り違えを検出する。

## 17. 実装計画

本設計が承認された後、Phase 2.1を次の順で実装する。

### Step 1 — Contract readiness

- 9 ContractへRuntime fieldsを追加する。
- Pattern Contract schemaと`interactive-row-group`を追加する。
- required scenario fixtureを固定する。
- Contract versionとPilot allowlistを定義する。

Exit: 9 ContractとPatternがSchemaに適合し、open questionがowner付きで記録される。

### Step 2 — Generated context

- Component Registry Builderを追加する。
- AI Translation Packを生成する。
- digestとstaleness checkを追加する。

Exit: 正本の変更でPackが必ずstaleになり、再生成後は同じ入力から同じ出力になる。

### Step 3 — HTML Runtime

- 9 Component renderer、CSS、behavior controllerを実装する。
- 単体fixtureとprovenanceを追加する。
- Contract / Runtime parity testを追加する。

Exit: 全required variant/stateがfixtureでrenderされ、Tokenとa11yの静的検査を通る。

### Step 4 — Resolver and composition

- Composition Manifest schemaを追加する。
- Strict Resolver、layout recipe、exception errorを実装する。
- Usage Manifestを生成する。

Exit: unknown Component、prop、variant、raw style、未承認例外を拒否できる。

### Step 5 — Team Invitation migration

- 現行Phase 2 rendererのprototype部分をComposition Manifest経由へ移す。
- 既存6 Scenario（7種のcoverage）、Review shell、Feedback exportを維持する。
- 生成HTMLへprovenanceを追加する。

Exit: Team Invitationの既存acceptanceを維持し、HTMLとUsage Manifestが一致する。

### Step 6 — Gate integration and Human Review

- CIへPhase 2.1 gateを追加する。
- Keyboard、screen reader、zoom、Mobile、long textをHuman Reviewする。
- Contractを`stable`へ昇格するか、修正を継続するか判断する。

Exit: blockerなし、未承認exceptionなし、Human Reviewの判断記録がある。

## 18. Phase 2.1 acceptance criteria

### Context

- 9 Componentと1 PatternのAI Translation Packが正本から生成される。
- Packにsource digestとRuntime compatibilityがある。
- staleなPackでは生成できない。

### Constraint

- Team InvitationのComponent利用境界がComposition Manifestから解決され、rendererのRuntime call siteと双方向一致する。
- Generatorがraw HTML、raw CSS、unknown Component、unknown variant/state/propを受け付けない。
- 独自実装が必要な場合は未承認exceptionとして停止する。

### Runtime

- 9 ComponentがFramework非依存のsemantic HTMLとしてrenderされる。
- 公開DOM、state、event、relation、Token bindingがContractと一致する。
- DesktopとMobileで同じComponent identityとdata modelを保つ。

### Validation

- Contract / Runtime / Translation Pack parityがCIで検査される。
- 生成HTMLの全Component instanceにprovenanceがある。
- Usage ManifestとrendererのRuntime call siteが双方向一致し、静的HTML rootにprovenanceがある。
- 既存Phase 2のdeterministic generationとScenario coverageが維持される。
- Accessibilityの静的gateと必須Human checksが完了する。

### Governance

- ContractやRuleをAIが自動変更しない。
- 例外はreason、scope、owner、期限、approvalを持つ。
- Review結果がComponent instanceとdecision IDへ紐づけ可能である。

## 19. Definition of done

Phase 2.1は、次の文がTeam Invitationについて真になった時点で完了する。

> Team InvitationのすべてのComponent UIは、正本から生成された最新情報を参照し、登録済みComponentと承認済みPatternだけで構成され、使用理由とversionを追跡でき、Contract・Runtime・renderer call siteの逸脱を生成前に検出できる。

これはMeridian Harness 1.0全体の完成ではない。Phase 2.2で制約・検証をsystem levelへ広げ、Phase 2.3でHuman Feedbackの承認循環を閉じ、Phase 2.4で残り65 Componentへ展開した時点で4層がsystem-wideに閉じる。

## 20. 実装前に承認する判断

1. Runtime形式をES module + CSSとし、Custom Elementを必須にしないこと。
2. Generator入力をHTMLではなくComponent Composition Manifestにすること。
3. `interactive-row-group`をComponentではなくPatternとして扱うこと。
4. Review Harness infrastructureをProduct UIのComponent準拠scopeから分離すること。
5. 9 Contractだけを新schemaへ先行移行し、残り65件をPhase 2.4へ送ること。
6. `draft` ComponentはPilot allowlist内のみ利用可能とし、Phase 2.1完了時にHuman Reviewで`stable`昇格を判断すること。
7. 未承認exceptionがあるConceptは`ready-for-review`へ進めないこと。

この7点をPhase 2.1 Pilotの実装判断として採用した。Contractの`stable`昇格とsystem-wide rolloutはHuman Review後に判断する。

## 21. 実装記録

2026-07-14にTeam InvitationのPilot実装を完了した。

### Source artifacts

- Pilot allowlist: `design/harness/pilot-components.json`
- Pattern Contract: `design/contracts/patterns/interactive-row-group.pattern.json`
- Composition Manifest: `examples/phase-2/team-invitation.composition.json`
- HTML Runtime: `packages/html-runtime/`
- Registry / Translation Pack builder: `scripts/build-component-harness.mjs`
- Strict Resolver / Usage Manifest: `packages/html-runtime/src/harness-core.mjs`
- Harness tests: `test/component-harness.test.js`

### Generated artifacts

- Component Registry: `design/harness/generated/component-registry.json`
- AI Translation Pack: `design/harness/generated/ai-index.json`、`design/harness/generated/ai-index.md`
- Review HTML: `examples/generated/team-invitation.phase2.html`
- Component Usage Manifest: `examples/generated/team-invitation.phase2.usage.json`

### Verification

- 9 Pilot Contractにversioned Runtime semanticsとprovenance contractがある。
- Strict Resolverが未登録Component、Contract外prop / variant、stale Translation Pack、未承認exceptionを拒否する。
- build-time renderer auditが未宣言Runtime call、component不一致、未使用Composition nodeを拒否する。
- decision sourceは既知のContract fieldまたは承認済みPhase 1 packageへ解決し、未使用decisionを拒否する。
- exception approvalはRegistry内のapproval record、scope、owner、期限と一致しなければ拒否する。
- Review HTMLは正式Runtimeを使い、native input、select、checkbox、button、tableを出力する。
- Desktopはcaptionとcolumn headerを持つnative table、Mobileは同じDOM順序の編集groupへreflowする。
- Validation errorは`aria-invalid="true"`と`aria-describedby`でcontrolへ関連付ける。
- Owner確認前は送信不可、確認後は送信可能になり、結果summaryへfocusする。
- Partial success後は成功行を再送対象から外し、失敗行だけを再試行できる。
- Component Harness、System validation、Phase 2 deterministic generation、全自動testが通過する。

### Remaining Human Review

- Screen readerによるannouncementの冗長性と順序。
- 200% zoom、320 CSS px相当、Japanese long-textの視覚品質。
- 9 Contractを`draft`から`stable`へ昇格する判断。
- `interactive-row-group`をsystem-wide Patternとして承認する判断。

### Phase 2.2へ残す検証拡張

- browserで展開された全scenarioの実instance、variant、state、version、decisionをUsage Manifestと照合する。
- Contractのslot、attribute、event、relation、state modelとRuntime実装のfield単位parityを自動検査する。
- 画面固有layout/CSSをPattern layout recipeへ拘束するlintを追加する。
