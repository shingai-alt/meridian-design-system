# Token Review Template

## Read

- `design/token-policy.json`
- 関係するFoundation
- `tokens/src/*.json`とgenerator / resolver
- Semantic metadata、Component contractのtoken binding
- CSS / Figma / React / Nativeの出力要件

## Decide

- Reference / Semantic / Componentのどのlayerがownerか。
- token名が値ではなく役割を表しているか。
- alias参照が一方向か。
- Theme / Contrast / Densityなどmodifierの責務が重複していないか。
- Component tokenのtriggerとreasonがpolicyに適合するか。
- DTCG 2025.10の型と値形式に適合するか。

## Research Gate

- `research.scope`へToken item IDと今回確認するlayer・type・出力範囲を書く。
- DTCGのlatest published version、resolver、type moduleを確認する必要があるか。
- Figma、CSS、React、Nativeなど出力先の現行仕様が変わっていないか。
- Spectrum、Carbon、Fluentなど公式token systemとの比較がlayer判断に必要か。
- format standardと組織固有のtoken architectureを混同せず、evidenceの適用範囲を書く。

## Review Resolutions

- 全Seed preset。
- Light / Dark。
- Standard / High contrast。
- Compact / Default / Comfortable。
- 必要なPlatform / Reduced motion。

全組み合わせを保存するのではなく、modifierを直交させ、resolverで必要なresolutionを生成します。

## Propagate

- alias利用者とcomponent bindingを検索する。
- rename時はdeprecated aliasと移行先を記録する。
- generated CSS、DESIGN.md、将来のFigma / React outputを同期する。

## Complete

- token source、policy、binding、generated outputが検証済み。
- 未解決alias、循環参照、未使用Component tokenがない。
- review recordと`npm run check:system`が完了している。
- Research Gateを`complete`または理由付き`not-required`で閉じている。
