#!/usr/bin/env node
// Assembles DESIGN.md — the AI-facing "constitution" — from:
//   tokens/src/*.json      (spacing / radius / motion / layout / density — generated, see build-tokens.mjs)
//   design/principles.json (7 design principles, human-authored)
//   design/semantic-tokens.json (semantic color token meanings, human-authored)
//   design/rules.json      (forbidden patterns AI must avoid, human-authored)
//   design/token-policy.json (token architecture and binding decisions)
//   design/research-policy.json (research gate shared by every refinement cycle)
//   design/iconography.json (icon names, meaning, size, directionality, accessibility)
//   design/accessibility.json (WCAG baseline, requirements, and quality gates)
//   design/content-guidelines.json (voice, UI writing rules, patterns, terminology)
//
// This mirrors the "Layer 1 (context) + Layer 2 (constraints)" idea from
// AI-ready design system harnesses: a single, AI-optimized entry point that
// sits alongside (not instead of) the human-facing docs in js/pages-*.js.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outFile = join(root, 'DESIGN.md');
const checkOnly = process.argv.includes('--check');
const readJson = (relPath) => JSON.parse(readFileSync(join(root, relPath), 'utf8'));

const spacing = readJson('tokens/src/spacing.json');
const radius = readJson('tokens/src/radius.json');
const motion = readJson('tokens/src/motion.json');
const layout = readJson('tokens/src/layout.json');
const typography = readJson('tokens/src/typography.json');
const shadow = readJson('tokens/src/shadow.json');
const principles = readJson('design/principles.json');
const semanticTokens = readJson('design/semantic-tokens.json');
const rules = readJson('design/rules.json');
const tokenPolicy = readJson('design/token-policy.json');
const researchPolicy = readJson('design/research-policy.json');
const iconography = readJson('design/iconography.json');
const accessibility = readJson('design/accessibility.json');
const contentGuidelines = readJson('design/content-guidelines.json');

const spacingRows = Object.entries(spacing)
  .filter(([key]) => !key.startsWith('$'))
  .sort(([, a], [, b]) => a.$value.value - b.$value.value)
  .map(([key, t]) => `| --sp-${key} | ${typeof t.$value === 'object' ? `${t.$value.value}${t.$value.unit}` : t.$value} | ${t.$extensions?.['com.meridian']?.usage || ''} |`)
  .join('\n');
const radiusRows = Object.entries(radius)
  .filter(([key]) => !key.startsWith('$'))
  .map(([key, t]) => `| --radius-${key} | ${typeof t.$value === 'object' ? `${t.$value.value}${t.$value.unit}` : t.$value} | ${t.$extensions?.['com.meridian']?.usage || ''} |`)
  .join('\n');
const durationRows = Object.entries(motion.duration)
  .filter(([key]) => !key.startsWith('$'))
  .map(([key, t]) => `| --dur-${key} | ${t.$value.value}${t.$value.unit} | ${t.$extensions?.['com.meridian']?.usage || ''} |`)
  .join('\n');
const shadowRows = Object.entries(shadow.level)
  .filter(([key]) => !key.startsWith('$'))
  .map(([key, token]) => `| --shadow-${key} | ${token.$extensions['com.meridian'].usage} | ${Array.isArray(token.$value) ? token.$value.length : 1} |`)
  .join('\n');
const layoutRows = Object.entries(layout.dimension)
  .filter(([key]) => !key.startsWith('$'))
  .map(([key, t]) => {
    const value = typeof t.$value === 'object' ? `${t.$value.value}${t.$value.unit}` : t.$value;
    return `| --${key} | ${value} | ${t.$extensions?.['com.meridian']?.usage || ''} |`;
  })
  .join('\n');
const typographyRows = Object.entries(typography)
  .filter(([key]) => !key.startsWith('$'))
  .map(([key, token]) => {
    const value = token.$value;
    const size = `${value.fontSize.value}${value.fontSize.unit}`;
    return `| --type-${key} | ${size} / ${value.lineHeight} | ${value.fontWeight} | ${token.$extensions['com.meridian'].usage} |`;
  })
  .join('\n');
const iconRows = iconography.icons
  .map((icon) => `| ${icon.id} | ${icon.canonicalName} | ${icon.meaning} | ${icon.defaultSize} | ${icon.directionality} |`)
  .join('\n');
const accessibilityRows = accessibility.requirements
  .map((requirement) => `| ${requirement.id} | ${requirement.criteria.join(', ')} | ${requirement.level} | ${requirement.requirement} |`)
  .join('\n');
const accessibilityGates = accessibility.qualityGates
  .map((gate) => `- **${gate.id}** (${gate.stage}, ${gate.owner}) — ${gate.checks.join('; ')}`)
  .join('\n');
const contentRuleRows = contentGuidelines.rules
  .map((rule) => `| ${rule.id} | ${rule.category} | ${rule.rule} |`)
  .join('\n');
const contentPatternRows = contentGuidelines.messagePatterns
  .map((pattern) => `| ${pattern.id} | ${pattern.requiredParts.join(' + ')} | ${pattern.example} |`)
  .join('\n');
const contentTermRows = contentGuidelines.terms
  .map((term) => `| ${term.concept} | ${term.ja} | ${term.en} |`)
  .join('\n');

const principlesSection = principles
  .map((p) => `### ${p.id}. ${p.title}\n\n${p.body}`)
  .join('\n\n');

const cssSemanticName = (token) => `--${token.replace('foreground', 'fg').replace('background', 'bg')}`;
const semanticRows = semanticTokens
  .map((t) => `| ${cssSemanticName(t.token)} | ${t.meaning} | ${t.usage} |`)
  .join('\n');

const rulesSection = rules
  .map((r) => `- **${r.id}** (${r.severity}) — ${r.alternative}`)
  .join('\n');

const layerRows = tokenPolicy.layers
  .map((layer) => `| ${layer.order} | ${layer.id} | ${layer.description} | ${layer.allowedReferences.join(', ') || 'none'} |`)
  .join('\n');

const modifierRows = tokenPolicy.modifiers
  .map((modifier) => `| ${modifier.id} | ${modifier.contexts.join(' / ')} | ${modifier.default} | ${modifier.owns.join(', ')} |`)
  .join('\n');

const componentTokenTriggers = tokenPolicy.componentTokenDecision.requiredWhen
  .map((trigger) => `- **${trigger.id}** — ${trigger.description}`)
  .join('\n');

const researchTriggers = researchPolicy.gate.researchRequiredWhen
  .map((trigger) => `- **${trigger.id}** — ${trigger.description}`)
  .join('\n');

const md = `<!--
  AUTO-GENERATED by scripts/build-design-md.mjs — do not edit by hand.
  Source of truth: tokens/src/*.json + design/*.json
  Regenerate with: node scripts/build-design-md.mjs
-->

# Meridian — Design Constitution (for AI coding agents)

Meridian はプロダクトインターフェースのための、トークン駆動のデザインシステムです。
このファイルは **AI が UI コードを生成する前に最初に読む1枚**です。人間向けの詳細な
ドキュメントは \`index.html\`(Foundations / Components / Patterns 以下)にあります。

## 絶対に守ること

1. **色は必ず \`var(--token-name)\` を使う。生の hex を書かない。** 実際の値は Seed
   color、Theme(light/dark)、Contrast(standard/high)に応じて \`src/color-engine.js\` が実行時に計算する
   ため、コード側で特定の hex を決め打ちできません。
2. **余白・角丸・モーションは必ずトークンを使う。** 任意の px 値や ms 値を直接書かない。
3. **\`--accent\` は一般 UI に使わない。** ロゴマーク・アバターなどブランド識別専用です。
4. **影(shadow token)は浮遊レイヤーにのみ使う。** Card / Panel のような静的なベース
   面は border のみで階層を表現します。
5. **アクセシビリティは後付けしない。** フォーカスリング・キーボード操作・コントラスト
   比(AA 4.5:1 / High contrast 7:1)は最初から満たす。
6. **UIからReference tokenを直接参照しない。** 通常はSemantic tokenを使い、component固有の
   安定した変更境界が必要な場合だけComponent tokenを作る。
7. **全refinement cycleでResearch Gateを評価する。** 調査が必要なら一次資料と判断への影響を
   記録し、不要なら対象scopeに即した理由を残す。
8. **Icon SVGを直接accessibility treeへ露出しない。** Icon-only controlのaccessible nameは
   Button/Link側が所有し、同じ機能には同じcanonical iconを使う。

詳細な禁止パターンは下記「Rules」と \`design/rules.json\` を参照してください。

## 7 Principles

${principlesSection}

## Research Gate

Overview、Foundations、Tokens、Componentsのすべてのrefinement cycleで、実装や文書更新の前に
Research Gateを評価します。次のいずれかに該当する場合は外部調査が必要です。

${researchTriggers}

調査を行う場合は、少なくとも${researchPolicy.sourcePolicy.minimumEvidence.total}件のevidenceと
${researchPolicy.sourcePolicy.minimumEvidence.primary}件の一次資料を記録し、各evidenceを
Meridianのdecisionへ紐づけます。すべての判定で\`research.scope\`へitem IDと確認範囲を記録し、
調査不要の場合も、そのscopeに即した具体的な理由が必要です。
完全なpolicyは\`design/research-policy.json\`、実際の記録は\`design/reviews/*.review.json\`を参照してください。

## Token Architecture

Seed colorとbrand configはgenerator inputであり、token layerではありません。token dependencyは次の3層です。

| Order | Layer | Responsibility | Allowed references |
|---:|---|---|---|
${layerRows}

Themeなどのcontextはlayerを増やさず、直交するmodifierとして扱います。

| Modifier | Contexts | Default | Owns |
|---|---|---|---|
${modifierRows}

### Component tokenを作る条件

次のtriggerのいずれかと具体的なreasonをcomponent contractの\`tokenBindings\`へ記録できる場合だけ作ります。

${componentTokenTriggers}

Semantic tokenの単純な別名、CSS実装上の都合、一度限りの見た目調整を理由に作ってはいけません。
完全なpolicyは\`design/token-policy.json\`、各componentのbindingは\`design/contracts/components/*.contract.json\`を参照してください。

## Tokens — Spacing

| Token | Value | Usage |
|---|---|---|
${spacingRows}

## Tokens — Typography

PCとSPで同じsemantic roleを使います。headingのHTML levelは文書構造で決め、見た目のroleとは分離します。
複数段落の本文はReading、短いUI本文はBody、操作名はLabelを選びます。

| Token | Size / Line height | Weight | Usage |
|---|---|---:|---|
${typographyRows}

## Tokens — Radius

| Token | Value | Usage |
|---|---|---|
${radiusRows}

## Tokens — Motion (duration)

| Token | Value | Usage |
|---|---|---|
${durationRows}

## Tokens — Shadow

Shadow geometryは全themeで不変です。Light、Dark、High Contrastはcolor/alpha modeだけを変更します。
\`shadow-sm\`以上は他contentに重なる一時surfaceに限定し、静的なCard/Panelには使いません。

| Token | Usage | Layers |
|---|---|---:|
${shadowRows}

## Tokens — Layout

| Token | Value / Alias | Usage |
|---|---|---|
${layoutRows}

## Iconography

正本は \`design/iconography.json\` です。Reusable SVG glyphは \`aria-hidden="true"\`、
\`focusable="false"\` とし、accessible nameは所有するButton/Linkへ付与します。Tooltipは補足であり、
accessible nameの代替ではありません。\`mirror-in-rtl\` だけRTLで反転します。

| ID | Canonical name | Meaning | Default size | Directionality |
|---|---|---|---|---|
${iconRows}

## Accessibility

Baselineは **${accessibility.standard.name} ${accessibility.standard.version} ${accessibility.standard.conformanceLevel}**。
適用されるLevel A / AAをすべて満たし、個別項目だけで適合を表明しません。
Pointer targetは全densityで${accessibility.targetSize.minimumCssPx}px以上を基本とし、touch中心・主要actionは
${accessibility.targetSize.preferredCssPx}px程度を優先します。完全なpolicyは
\`design/accessibility.json\`、component固有の挙動は各contractを参照してください。

| Requirement | WCAG | Level | Rule |
|---|---|---|---|
${accessibilityRows}

### Accessibility quality gates

${accessibilityGates}

## Content Guidelines

Default localeは **${contentGuidelines.locale.default}**、fallbackは **${contentGuidelines.locale.fallback}**。
UI textはtask、state、risk、次のactionを伝える設計要素です。Voiceは明快・落ち着き・尊重・正確を保ち、
errorやsuccessでも温度を過度に変えません。完全な正本は \`design/content-guidelines.json\` です。

| Rule | Category | Decision |
|---|---|---|
${contentRuleRows}

### Message patterns

| State | Required parts | Example |
|---|---|---|
${contentPatternRows}

### Canonical terms

| Concept | ja-JP | en |
|---|---|---|
${contentTermRows}

## Semantic Color Tokens

色の実際の値(hex)は Seed color と Theme によって変わるため、ここには載せません。
必ずトークン名で参照してください。

| Token | Meaning | Usage |
|---|---|---|
${semanticRows}

## Rules (summary)

全 ${rules.length} 件。詳細(detector・pattern・適用範囲)は \`design/rules.json\` を参照。

${rulesSection}
`;

if (checkOnly) {
  const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : null;
  if (current !== md) {
    console.error(`${outFile} is out of date. Run: npm run design:build`);
    process.exitCode = 1;
  } else {
    console.log(`${outFile} is up to date.`);
  }
} else {
  writeFileSync(outFile, md);
  console.log(`Wrote ${outFile}`);
}
