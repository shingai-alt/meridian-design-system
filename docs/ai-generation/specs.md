# AI Generation Specs

Meridian の AI 画面生成は、チャット内容から直接 HTML、React、Figma を生成しない。
まず中間仕様を作り、その仕様を検証してから実装・プロトタイプへ変換する。

この層は、AI が「それっぽい画面」を出すためではなく、根拠に基づく UI/UX 設計を再現可能にするためのもの。

## Specification Layers

Meridian の生成パイプラインは、次の順で進む。

```text
User conversation
  -> DesignBrief
  -> ScreenSpec
  -> FlowSpec
  -> GenerationReport
  -> Render target: HTML / React / Figma / prototype
```

現時点でこのリポジトリに定義する正式な検証対象は `ScreenSpec` と `FlowSpec`。

- `ScreenSpec`: 単一画面の設計仕様
- `FlowSpec`: 複数画面、遷移、状態、プロトタイプの設計仕様

Phase 1では、これらの前後にあるDesignBrief、ResearchPack、DirectionSet、PatternContract、DesignProposal、Review、FeedbackCandidateを`Phase 1 Design Package`として統合し、最初のpilotでartifact間の関係を検証する。

- Schema: `schemas/phase-1-package.schema.json`
- Example: `examples/phase-1/team-invitation.phase1.json`
- Design: `docs/ai-generation/phase-1-design.md`

Phase 2では、承認済みPhase 1 Packageにreview scenarioとfixtureを追加し、操作可能な単一HTMLとStructured Feedbackへ変換する。

- Concept schema: `schemas/phase-2-concept.schema.json`
- Feedback schema: `schemas/phase-2-feedback.schema.json`
- Example manifest: `examples/phase-2/team-invitation.phase2.json`
- Generated review HTML: `examples/generated/team-invitation.phase2.html`
- Design: `docs/ai-generation/phase-2-design.md`
- Generate: `npm run generate:phase2`
- Check: `npm run check:phase2`

`DesignBrief` と `GenerationReport` は今後追加する。まずは画面とフローの中核を固める。

## Why An Intermediate Spec Exists

中間仕様を置く理由は 5 つある。

1. 画面生成の前に設計判断を検証する。
2. 複数案や推奨案の根拠を構造化する。
3. Meridian のトークン、コンポーネント、パターンから外れた生成を防ぐ。
4. React、HTML、Figma など複数の出力先に同じ設計意図を渡せるようにする。
5. 生成結果を `design-lint` や将来の eval で評価できるようにする。

## Design Rules For Schemas

Meridian の AI 生成 schema は、次のルールで設計する。

- JSON Schema 2020-12 を使う。
- `additionalProperties: false` を基本にする。
- AI が迷わないよう、キー名は短くしすぎず意味が分かる名前にする。
- 重要なフィールドには `description` を付ける。
- 未確定の値は項目を省略せず、`null` または空配列で表現する。
- 自由な CSS 値や hex 色ではなく、Meridian token / component / pattern の ID を参照する。
- `rationale` と `qualityChecks` は必須にする。

この方針は Structured Outputs で扱いやすく、機械検証もしやすい。複雑な巨大 schema を一度に出力させるより、`ScreenSpec` と `FlowSpec` に分けて段階的に生成する。

## ScreenSpec

`ScreenSpec` は単一画面の設計仕様。

画面の見た目だけではなく、ユーザー目的、情報設計、レイアウト、コンポーネント、状態、アクセシビリティ、設計根拠を含む。

Schema:

```text
schemas/screen-spec.schema.json
```

### Required Sections

- `meta`: schema version、spec id、作成元
- `context`: プロダクト種別、対象ユーザー、制約
- `ux`: 主タスク、補助タスク、成功条件、リスク、仮定
- `informationArchitecture`: 情報階層、ナビゲーション上の役割、コンテンツグループ
- `layout`: 採用テンプレート、領域、レスポンシブ方針
- `components`: Meridian component の利用計画
- `states`: default / loading / empty / error / permission denied
- `accessibility`: WCAG 目標、キーボード、フォーカス、読み上げ、色以外の状態表現
- `rationale`: 設計判断と根拠
- `qualityChecks`: 生成後に必ず検証する項目

### ScreenSpec Example Shape

```json
{
  "meta": {
    "schemaVersion": "0.1.0",
    "kind": "screen",
    "id": "screen_project_dashboard",
    "title": "Project Dashboard",
    "source": "conversation",
    "status": "draft"
  },
  "context": {
    "productType": "saas-dashboard",
    "targetUsers": ["project-manager", "designer"],
    "primaryUseCase": "プロジェクトの進捗とリスクを確認する",
    "userIntent": "毎朝、対応が必要なタスクを判断したい",
    "constraints": ["desktop-first", "supports-dark-mode"],
    "locale": "ja-JP"
  }
}
```

実際の spec では、上記以外の必須セクションもすべて埋める。

## FlowSpec

`FlowSpec` は複数画面を横断する体験の設計仕様。

画面の集合ではなく、ユーザーの目的、権限、開始条件、終了条件、状態遷移、失敗経路、検証タスクを扱う。

Schema:

```text
schemas/flow-spec.schema.json
```

### Required Sections

- `meta`: schema version、spec id、作成元
- `goal`: ユーザーゴール、ビジネスゴール、完了条件
- `actors`: 利用者ロール、権限、ニーズ
- `screens`: Flow 内で使う ScreenSpec 参照
- `transitions`: 画面間の遷移、ユーザー操作、システム応答
- `prototype`: 開始画面、happy path、代替経路、edge case
- `stateModel`: flow 全体で扱う主要状態
- `rationale`: フロー設計上の判断と根拠
- `validation`: usability / accessibility / design-system の検証観点

## Examples

代表的な ScreenSpec / FlowSpec の見本は `examples/specs/` に置く。

- `examples/specs/saas-dashboard.screen.json`
- `examples/specs/settings.screen.json`
- `examples/specs/ai-workspace.screen.json`
- `examples/specs/team-invite.flow.json`

これらは、AI に期待する出力粒度、設計根拠の書き方、状態設計、アクセシビリティ要件、Meridian component / token 参照の見本として使う。

## Rationale Model

Meridian では `rationale` を必須にする。

AI が画面を生成するときは、少なくとも次のどれかに根拠を接続する。

- `user-goal`: ユーザーの目的や主要タスク
- `design-principle`: `DESIGN.md` の原則
- `accessibility`: WCAG / a11y 要件
- `pattern`: Meridian の pattern / template
- `constraint`: 制約、権限、データ量、デバイス要件
- `tradeoff`: 他案を退けた理由

これにより、ユーザーは「なぜこの UI なのか」を追える。

## Component References

`components[].componentId` は Meridian の component id を参照する。

例:

- `button`
- `text-field`
- `sidebar`
- `top-bar`
- `table`
- `dialog`
- `tabs`
- `empty-state`

コンポーネントが未定義の場合は、勝手に新しい UI を作らず、`qualityChecks.unresolvedItems` に追加して設計システム拡張の候補として扱う。

## State Requirements

ScreenSpec は成功状態だけを扱ってはいけない。

すべての画面は、次の状態を持つ。

- `default`: 通常状態
- `loading`: 初期読み込みまたは更新中
- `empty`: データが無い状態
- `error`: 取得失敗や保存失敗
- `permissionDenied`: 権限不足

該当しない場合も項目は残し、`applicable: false` と理由を記録する。

## Quality Gates

生成後は、少なくとも次を検証する。

- Meridian token に準拠しているか。
- Meridian component id を参照しているか。
- WCAG 2.2 AA を目標にしているか。
- キーボード操作と focus-visible があるか。
- 色だけに依存した状態表現になっていないか。
- responsive behavior が定義されているか。
- loading / empty / error / permission denied が考慮されているか。
- rationale が主要な設計判断に付いているか。

## Implementation Plan

1. `schemas/screen-spec.schema.json` と `schemas/flow-spec.schema.json` を SSOT にする。
2. `examples/specs/` に代表的な ScreenSpec / FlowSpec を追加する。
3. `scripts/validate-spec.mjs` で schema 検証をできるようにする。
4. Patterns / Templates を AI が参照できる知識ベースへ構造化する。
5. ScreenSpec から HTML / React / Figma へ変換する renderer を作る。

## References

- OpenAI Structured Outputs: JSON Schema による厳格な構造化出力。
- JSON Schema 2020-12: Meridian spec の検証基盤。
- WCAG 2.2: 生成 UI のアクセシビリティ基準。
- Design Tokens Community Group Format: design token をツール間で交換する考え方。
