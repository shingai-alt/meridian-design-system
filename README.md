# Meridian Design System

Seed color 駆動のカラーシステムと、Reference(Primitive) → Semantic → Component の3層トークン設計に基づくデザインシステムのドキュメント/ショーケースです。ビルドステップなしでブラウザにそのまま表示できる静的サイトです。

プロジェクトの長期的な北極星は [`VISION.md`](./VISION.md) に、AI 画面生成の中間仕様は [`docs/ai-generation/specs.md`](./docs/ai-generation/specs.md) に、AI-assisted Agile の Sprint 0 計画は [`docs/agile/sprint-0.md`](./docs/agile/sprint-0.md) にまとめています。

Overview → Foundations → Tokens → Components を継続的にブラッシュアップする共通手順は [`docs/system/refinement-workflow.md`](./docs/system/refinement-workflow.md) にあります。対象、依存関係、進捗の機械可読な台帳は [`design/system-registry.json`](./design/system-registry.json)、各レビューの判断記録は `design/reviews/*.review.json` です。

102項目を最初に一周した時点の変更内容、検証結果、現在残っている作業は [`docs/system/refinement-report-2026-07-14.md`](./docs/system/refinement-report-2026-07-14.md) にまとめています。

コンポーネント固有の作成・レビュー・HTML docs 反映・contract JSON 同期は [`docs/components/spec-workflow.md`](./docs/components/spec-workflow.md) にまとめています。新しいコンポーネント仕様は [`components/_template.md`](./components/_template.md) と [`design/contracts/components/_template.contract.json`](./design/contracts/components/_template.contract.json) から始めます。

## 構成

- Overview — 原則・アーキテクチャ・導入ガイド
- Foundations — 色・タイポグラフィ・余白・角丸・影・アクセシビリティ
- Tokens — 全トークンの一覧、CSS Variables / JSON 出力
- Components — 74 のコンポーネント詳細と Playground
- Patterns / Templates — 画面設計の定石パターン、実プロダクト相当の画面テンプレート
- Resources — 実装ガイド・チェックリスト

テーマ（Light / Dark）、コントラスト（Standard / High）、密度（Compact / Default / Comfortable）、Seed color の切り替えに対応しています。

## ディレクトリ構成

- `index.html` — アプリシェル(ページ本体は `js/` から読み込む)
- `js/` — ドキュメントサイト本体のロジック(ページ定義・コンポーネントカタログ・ルーティング)
- `src/color-engine.js` — OKLCHカラーエンジン(DOM非依存の純粋関数。単体テスト可能)
- `tokens/src/*.json` — spacing / radius / motion / layout / density トークンの定義(唯一の真実源)
- `tokens/build/tokens.css` — 上記から生成されるCSS変数(`npm run build:tokens` で再生成)
- `design/token-policy.json` — token layer、modifier、Component token昇格条件、binding rule
- `design/research-policy.json` — 全Domain共通のResearch Gate、調査trigger、一次資料とevidenceの要件
- `design/system-registry.json` — 全レビュー対象、順序、依存関係、source、route
- `design/reviews/*.review.json` — サイクルごとの決定、差分、変更、検証、影響先
- `components/*.md` — 人間とAIが読むコンポーネント設計仕様
- `design/contracts/components/*.contract.json` — AI/ツール向けの機械可読コンポーネント契約
- `schemas/*.schema.json` — policy、registry、review、component contract、AI生成仕様のschema
- `docs/system/templates/*.md` — Overview / Foundation / Token / Componentレビューのチェックリスト
- `test/` — token、contract、review workflow、HTML showcase、カラーエンジンの自動テスト

## 開発

```sh
npm run refine:status  # 完了状況、依存関係、次に着手できるitemを表示
npm run refine:start -- overview.for-designers  # 新しいreview cycleを開始
npm run refine:start -- foundations.color --force  # 完了済みitemを明示的に再レビュー
npm run refine:complete-impacts -- --validated --impact-cycle=<cycle-id>  # 検証済みの影響itemを依存順に閉じる
npm run check:system   # schema、registry、binding、AI spec、生成物、JS構文、全テストを一括検証
npm run build:tokens   # tokens/src/*.json から tokens/build/tokens.css を再生成
npm run design:build   # design sourceからAI向けDESIGN.mdを再生成
npm test               # カラーエンジンと検証基盤の単体テスト
```

通常は `npm run refine:status` から対象を選び、レビュー完了前に `npm run check:system` を実行します。CIも同じ一括コマンドを使用します。

すべてのreview cycleはResearch Gateを通ります。対象itemと確認範囲を`research.scope`へ固定し、外部調査が必要なcycleは一次資料とdecisionへの影響を構造化して残します。不要なcycleもscopeに即した理由なしでは完了できません。

## 使い方

`index.html` をブラウザで直接開く(またはローカルサーバーで配信する)だけで閲覧できます。

公開プレビュー: https://shingai-alt.github.io/meridian-design-system/
