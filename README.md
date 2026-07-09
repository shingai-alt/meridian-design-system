# Meridian Design System

Seed color 駆動のカラーシステムと、Primitive → Semantic → Component の3層トークン設計に基づくデザインシステムのドキュメント/ショーケースです。ビルドステップなしでブラウザにそのまま表示できる静的サイトです。

## 構成

- Overview — 原則・アーキテクチャ・導入ガイド
- Foundations — 色・タイポグラフィ・余白・角丸・影・アクセシビリティ
- Tokens — 全トークンの一覧、CSS Variables / JSON 出力
- Components — 60+ のコンポーネント詳細と Playground
- Patterns / Templates — 画面設計の定石パターン、SaaSプロダクト相当の画面テンプレート
- Resources — 実装ガイド・チェックリスト

テーマ（Light / Dark / High contrast）、密度（Compact / Default / Comfortable）、Seed color の切り替えに対応しています。

## ディレクトリ構成

- `index.html` — アプリシェル(ページ本体は `js/` から読み込む)
- `js/` — ドキュメントサイト本体のロジック(ページ定義・コンポーネントカタログ・ルーティング)
- `src/color-engine.js` — OKLCHカラーエンジン(DOM非依存の純粋関数。単体テスト可能)
- `tokens/src/*.json` — spacing / radius / motion / layout / density トークンの定義(唯一の真実源)
- `tokens/build/tokens.css` — 上記から生成されるCSS変数(`npm run build:tokens` で再生成)
- `test/` — `node --test` によるカラーエンジンの単体テスト

## 開発

```sh
npm run build:tokens   # tokens/src/*.json から tokens/build/tokens.css を再生成
npm run check:tokens   # 生成物がソースと同期しているか検証(CIでも実行)
npm test               # カラーエンジンの単体テスト
```

## 使い方

`index.html` をブラウザで直接開く(またはローカルサーバーで配信する)だけで閲覧できます。

公開プレビュー: https://shingai-alt.github.io/meridian-design-system/
