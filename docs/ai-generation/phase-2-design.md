# Phase 2 — Reviewable HTML Concept System

## 1. Outcome

Phase 2は、承認済みのPhase 1 Design Packageを、企業内のPdM・デザイナー・エンジニアが同じ成果物で検討できる「動くHTML Concept」へ変換する。

生成物はproduction UIではない。採用した設計判断、代替案、根拠、主要状態、アクセシビリティ、実装上の含意を、操作可能な画面と並べて検証するためのレビュー成果物である。

Phase 2完了時に、次ができる。

1. 承認済みPhase 1 PackageとConcept Manifestから単一HTMLを再生成できる。
2. Primary path、入力error、Seat超過、Owner確認、Partial successなどをscenarioとして再現できる。
3. DesktopとMobile幅を同じHTML内で切り替えられる。
4. AIが提案した理由、競合・標準のevidence、代替案、既知の制約を画面と同時に読める。
5. PdM・Design・Engineering・Accessibility・Contentのreview lensを使える。
6. Review結果を機械可読なFeedback JSONとして書き出せる。

## 2. Phase boundary

### Phase 2に含む

- Review用HTMLの生成。
- 実際の操作を模したlocal stateとscenario fixture。
- Responsive、keyboard、long-text、error stateの確認。
- 設計根拠とevidenceの表示。
- Structured Feedbackの作成とexport。
- Schema validation、deterministic generation、最低限の自動検証。

### Phase 2に含めない

- Production backend、認証、メール送信、課金処理。
- React component packageへの実装。
- 実データや機密情報の利用。
- Feedbackの自動承認やDesign Systemへの自動昇格。
- HTMLだけを根拠にしたPattern maturityの`candidate`から`supported`への変更。

## 3. Artifact model

```text
Approved Phase 1 Package (why / what)
              +
Phase 2 Concept Manifest (how to review)
              |
              v
Deterministic Generator
              |
              v
Standalone Review HTML (human-readable + interactive)
              |
              v
Phase 2 Feedback JSON (machine-readable candidate)
              |
              v
Human decision -> next revision / Phase 1 feedback candidate
```

Phase 1は設計判断のSSOT、Phase 2 Manifestはレビュー条件のSSOTとする。生成HTMLは派生成果物であり、手編集しない。

## 4. Phase 2 Concept Manifest

Schema: `schemas/phase-2-concept.schema.json`

Manifestは次を定義する。

- `source`: 承認済みPhase 1 Packageへの参照。
- `generation`: renderer、出力先、standalone要件。
- `prototype`: template、開始scenario、viewport、review lens、fixture。
- `feedback`: export時に使うcategoryとseverity。
- `acceptance`: task、automated check、manual check、known limitation。

Product固有のfixtureはManifestへ置き、Phase 1のDesignBriefやResearchPackを変更しない。
各scenarioの`covers`は検証するBusiness Ruleを宣言する。Team Invitation rendererは6 Scenario以上を要求し、Primary、Validation、Existing Pending、Seat exceeded、Owner confirmation、Partial success、Max batchの全coverageが揃わない限り生成しない。Coverageは自己申告だけでは通らず、Owner行、Pending行、Seat計算、成功・失敗行、10行境界などのfixture invariantと一致する必要がある。

## 5. Generation contract

生成コマンド:

```bash
npm run generate:phase2
```

差分検査:

```bash
npm run check:phase2
```

Generatorは以下を満たさない入力を拒否する。

- Phase 1 PackageがSchemaに適合していない。
- PackageまたはHuman Reviewが`approved`ではない。
- Manifestの`sourcePackageId`がPackageのIDと一致しない。
- 開始scenarioや出力先が不正。
- Rendererが未対応。

同じsource、Manifest、token build、rendererからは同じHTMLを生成する。時刻やrandom IDはHTMLへ埋め込まない。

## 6. Review HTML anatomy

### Review toolbar

- Scenario切替。
- Desktop / Mobile canvas切替。
- Review lens切替。
- Phase 1承認状態とConcept status。

### Interactive prototype

- 実タスクに近い操作。
- 入力、確認、送信結果をlocal stateで再現。
- Scenario切替でedge caseを即座に再現。
- 外部APIやproduction dataへ接続しない。

### Design explanation

- 問題と推奨方向。
- 採用理由。
- 比較した代替案とtrade-off。
- Evidence、limitations、unresolved items。
- Review lens別の確認観点。

### Feedback composer

- Category、severity、scenario、finding、recommendation。
- 複数entryをlocal stateへ追加。
- `phase-2-feedback.schema.json`に対応するJSONをdownloadまたはclipboardへexport。
- ExportしたFeedbackはcandidateであり、自動的にDesign Systemへ反映しない。

## 7. Accessibility baseline

- Native form controlsとbuttonを優先する。
- すべての操作をkeyboardで完了できる。
- Error summaryから該当fieldへ移動できる。
- Dynamic resultをlive regionで通知する。
- Focus indicatorをTokenで表示し、sticky UIで隠さない。
- 状態を色だけで伝えない。
- Mobile canvasでもlogical reading orderを維持する。
- `prefers-reduced-motion`を尊重する。

自動検証は構造的な欠落を検出するが、screen reader、keyboard、zoom、認知負荷のHuman Reviewを置き換えない。

## 8. Feedback lifecycle

```text
draft -> exported -> triaged -> accepted | rejected | superseded
```

Phase 2では`draft`または`exported`までを扱う。Design System全体へ適用する提案は、Phase 1の`feedbackCandidates`へ人間が昇格させる。Pattern、Component、Foundationへ影響する変更は別のHuman Reviewを必須とする。

## 9. Quality gates

1. Source gate: 承認済みPhase 1 Packageだけを入力にする。
2. Contract gate: ManifestとFeedbackがSchemaに適合する。
3. Generation gate: 派生HTMLに手編集差分がない。
4. Scenario gate: Primaryと重要なfailure stateが存在する。
5. Explanation gate: rationale、alternative、evidence、limitationを表示する。
6. Accessibility gate: semantic structure、label、focus、live resultを備える。
7. Human review gate: PdM、Design、Engineeringの観点で採否を判断する。

## 10. Phase 2 exit criteria

- Team Invitationの承認済みPackageからReview HTMLを生成できる。
- 5種類以上のscenarioを切り替えられる。
- 招待の追加、Role変更、検証、Review、送信結果を操作できる。
- 最大10人、Seat予約、Owner確認、既存Pending、Partial successが再現される。
- Design rationaleとResearch evidenceがUI内で追跡できる。
- Structured Feedbackをexportできる。
- Schema、generator、system testが通る。
- Human ReviewでPhase 3へ進めるか判断できる。

## 11. Phase 3へ持ち越す判断

- 汎用rendererを何種類まで増やすか。
- LLMがConcept Manifestを自動生成する際のprompt / Skill / MCP境界。
- Visual regression、axe、Playwrightなどbrowser automationの導入。
- FeedbackをDesign System knowledgeへ昇格するtriage UI。
- React adapterまたはproduction code generationを開始する条件。
