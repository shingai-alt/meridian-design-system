# Overview Review Template

## Read

- `VISION.md`
- `README.md`
- `design/principles.json`
- `design/rules.json`
- 対象ページの`js/pages-overview.js`
- 関係する直近のreview record

## Decide

- 誰の、どのプロダクト範囲を対象にするか。
- 現在提供中のものとroadmapを分けているか。
- PrinciplesとSystem Architectureで説明できるか。
- Foundations / Tokens / Componentsが実行可能な基準か。
- AIが曖昧な解釈をしないか。

## Research Gate

- `research.scope`へOverview item IDと今回確認する判断範囲を書く。
- product scope、governance、Architectureに新しい外部判断があるか。
- 最新standard、公式design-system architecture、platform documentationを確認すべきか。
- 調査したevidenceをdecision IDへ結び、不要ならcycle scopeに基づく理由を書く。

## Rendered Review

- ページの目的が冒頭で分かるか。
- 長期ビジョン、現在状態、次の行動が混ざっていないか。
- 他ページへの導線が現在のnavigationと一致するか。
- desktop / mobileで情報階層が維持されるか。

## Propagate

- 変更が影響するFoundationを列挙する。
- token policyまたはcontract schemaへの影響を列挙する。
- HTML docsだけを更新して判断sourceを置き去りにしていないか確認する。

## Complete

- review recordへdecision、difference、impact、validationを記録する。
- Research Gateを`complete`または理由付き`not-required`で閉じる。
- `npm run check:system`を実行する。
