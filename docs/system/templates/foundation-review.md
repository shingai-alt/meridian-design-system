# Foundation Review Template

## Read

- `overview/introduction`、`overview/principles`、`overview/architecture`
- 対象FoundationのHTML docs
- 関係する`tokens/src/*.json`、`design/*.json`、runtime generator
- 利用しているcomponent contract

## Decide

- Foundationの責務を1文で説明できるか。
- 使用条件と禁止条件があるか。
- 固定値、Semantic decision、Component decisionを分けているか。
- Theme、Contrast、Density、Platform、Motionのどのmodifierに関係するか。
- PC / SP / touchの差をtokenで扱うか、responsiveBehaviorで扱うか。
- accessibilityとcontent requirementを初期条件にしているか。

## Research Gate

- `research.scope`へFoundation item IDと今回確認する値・behaviorの範囲を書く。
- W3C/WAI、native platform guideline、HCI研究に判断基準があるか。
- 他design systemのFoundationを比較すると選択基準が明確になるか。
- standard、公式guideline、公式design systemを一次資料として記録する。
- 調査不要なら、値やbehaviorを変更しない内部同期だけであることを具体的に説明する。

## Rendered Review

- 基礎値だけでなく、役割と実例を確認できるか。
- theme / density / seedを切り替えても説明と表示が一致するか。
- Do / Don't、失敗例、関連tokenへの導線があるか。

## Propagate

- 追加・変更するReference / Semantic tokenを列挙する。
- 影響するtoken outputとcomponent bindingを列挙する。
- Foundation固有でない判断を上位Overviewへ戻す。

## Complete

- source、HTML docs、tokenへの影響が同期している。
- review recordと`npm run check:system`が完了している。
- Research Gateを`complete`または理由付き`not-required`で閉じている。
