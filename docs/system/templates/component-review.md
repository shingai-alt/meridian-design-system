# Component Review Template

コンポーネント固有の詳細手順は`docs/components/spec-workflow.md`を使用します。このテンプレートは全体loopへ接続するための追加確認です。

## Before

- `npm run refine:status`で上流Foundation / Tokenの状態を確認する。
- `components/_template.md`と`design/contracts/components/_template.contract.json`を使う。
- 類似componentとの選択境界を確認する。

## Research Gate

- `research.scope`へcomponent item IDと今回確認する仕様範囲を書く。
- WAI-ARIA APG、WCAG、native HTML、platform guidelineに既知patternがあるか。
- 類似componentのselection boundary、state、responsive behaviorを公式design systemで比較する必要があるか。
- evidenceをreview decision IDへ結び、調査不要なら具体的なcycle理由を残す。

## Token Binding

- anatomy / variant / state / sizeのvisual slotを列挙する。
- Semanticを直接使うslotとComponent tokenへ昇格するslotを分ける。
- Component tokenには`design/token-policy.json`のtriggerとreasonを付ける。
- binding coverageが`complete`でなければcontractをstableにしない。

## Sync

- `components/*.md`
- `design/contracts/components/*.contract.json`
- `js/components-registry.js`
- `index.html` / `js/ui-builders.js`
- 必要なtoken source

## Complete

- `docs/components/spec-workflow.md`のDone Criteriaを満たす。
- review recordへ上流へのfeedbackとimpacted itemを記録する。
- Research Gateを`complete`または理由付き`not-required`で閉じる。
- `npm run check:system`を実行する。
