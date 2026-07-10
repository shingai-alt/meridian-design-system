# Meridian Design System — Claude Code へ

このリポジトリで UI(HTML/CSS/コンポーネント)を生成・編集する前に、必ず次の順で読んでください。

1. **`DESIGN.md`** — 色・タイポ・余白・角丸・モーションのトークン一覧と 7 原則。
   「絶対に守ること」5箇条がここにあります。
2. **`design/rules.json`** — 禁止パターンの詳細(`detector`/`pattern`/`alternative`)。

## 生成・編集後に必ず実行すること

```sh
node scripts/design-lint.mjs <編集/生成したファイル>
```

- **ERROR** が出た場合は、ユーザーに提示する前に必ず修正してから再実行する。
- **WARN** は可能なら直すが、ブロックはしない。
- 末尾に出る「手動レビューが必要なルール」(accent の用途・shadow の階層・
  focus-visible・コントラスト比)は自動検出できないため、`design/rules.json` を
  見ながら自分で確認する。

## 絶対に守ること(要約。詳細は DESIGN.md)

- 色は `var(--token-name)`。生の hex は書かない(実際の値は seed/theme に応じて
  `src/color-engine.js` が計算する)。
- 余白・角丸・モーションはすべてトークン(`--sp-*` / `--radius-*` / `--dur-*`)経由。
- `--accent` はロゴマーク・アバターなどブランド識別専用。ボタンやバッジには使わない。
- 影(`--shadow-*`)は Dropdown / Popover / Menu / Dialog / Drawer / Toast などの
  浮遊レイヤーにのみ使う。Card / Panel は border のみ。
- フォーカスリング・キーボード操作・コントラスト比は最初から満たす。

## トークン/憲法を変更したとき

`tokens/src/*.json` や `design/*.json` を編集した場合は、生成物を再ビルドしてから
コミットする(CI もこの同期をチェックする)。

```sh
npm run build:tokens   # tokens/src/*.json → tokens/build/tokens.css
npm run design:build   # tokens/src/*.json + design/*.json → DESIGN.md
npm test               # カラーエンジンの単体テスト(node:test)
```

## リポジトリの構成

- `index.html` + `js/*.js` — ドキュメント/ショーケースサイト本体
- `src/color-engine.js` — OKLCH カラーエンジン(DOM 非依存、単体テスト済み)
- `tokens/src/*.json` — spacing / radius / motion / layout / density の唯一の真実源
- `design/` — AI 向け憲法の元データ(principles / semantic-tokens / rules)
- `scripts/` — 上記から生成物を作る/検証するビルドスクリプト
