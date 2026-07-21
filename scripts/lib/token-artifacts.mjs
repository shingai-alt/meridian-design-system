import { createRequire } from 'node:module';
import { join } from 'node:path';
import { collectDtcgTokens, countDtcgTokens, resolveDtcgValue, validateDtcgDocument } from './dtcg.mjs';

const require = createRequire(import.meta.url);
const DEFAULT_SEED = '#5B5BD6';
const CONTEXTS = [
  { id: 'light-standard', theme: 'light', contrast: 'standard', label: 'Light / Standard', file: 'tokens/build/meridian.tokens.json' },
  { id: 'dark-standard', theme: 'dark', contrast: 'standard', label: 'Dark / Standard', file: 'tokens/build/meridian.dark.tokens.json' },
  { id: 'light-high', theme: 'light', contrast: 'high', label: 'Light / High', file: 'tokens/build/meridian.high-contrast.tokens.json' },
  { id: 'dark-high', theme: 'dark', contrast: 'high', label: 'Dark / High', file: 'tokens/build/meridian.dark.high-contrast.tokens.json' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const tokenEntries = (group) => Object.entries(group).filter(([key]) => !key.startsWith('$'));
const cssSemanticName = (key) => `--${key.replace('foreground', 'fg').replace('background', 'bg')}`;
const round = (value) => Number(value.toFixed(6));

function hexToDtcg(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3 ? normalized.split('').map((part) => part + part).join('') : normalized;
  const color = {
    colorSpace: 'srgb',
    components: [0, 2, 4].map((offset) => round(Number.parseInt(value.slice(offset, offset + 2), 16) / 255)),
    hex: `#${value.toLowerCase()}`,
  };
  if (alpha !== undefined && alpha !== 1) color.alpha = alpha;
  return color;
}

function cssColorToDtcg(value) {
  if (value.startsWith('#')) return hexToDtcg(value);
  const match = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(value.replaceAll(' ', ''));
  if (!match) throw new Error(`Unsupported generated color: ${value}`);
  const [, red, green, blue, alpha] = match;
  const hex = `#${[red, green, blue].map((part) => Number(part).toString(16).padStart(2, '0')).join('')}`;
  return hexToDtcg(hex, Number(alpha));
}

function dtcgColorToCss(value) {
  if (!value || value.colorSpace !== 'srgb') throw new Error(`Unsupported CSS color output: ${JSON.stringify(value)}`);
  const channels = value.components.map((component) => Math.round(component * 255));
  if (value.alpha !== undefined && value.alpha !== 1) return `rgba(${channels.join(',')},${value.alpha})`;
  return value.hex ?? `rgb(${channels.join(',')})`;
}

function paletteGroup(palettes) {
  return Object.fromEntries(Object.entries(palettes).map(([family, scale]) => [
    family === 'neutralVariant' ? 'neutral-variant' : family,
    {
      '$type': 'color',
      '$description': `${family} generated reference palette`,
      ...Object.fromEntries(Object.entries(scale).map(([step, value]) => [step, { '$value': cssColorToDtcg(value) }])),
    },
  ]));
}

function semanticGroup(semantic, charts, chartForegrounds, metadata) {
  const chartValues = Object.fromEntries(charts.flatMap((value, index) => [
    [`chart-${index + 1}`, value],
    [`chart-fg-${index + 1}`, chartForegrounds[index]],
  ]));
  return {
    '$type': 'color',
    '$description': 'UIの用途と状態を表すSemantic color tokens。',
    ...Object.fromEntries(metadata.map((entry) => [entry.token, {
      '$description': `${entry.meaning}。${entry.usage}`,
      '$value': cssColorToDtcg(semantic[entry.token] ?? chartValues[entry.token]),
      '$extensions': {
        'com.meridian': {
          layer: 'semantic',
          runtimeKey: entry.token,
          cssVariable: cssSemanticName(entry.token),
          usage: entry.usage,
        },
      },
    }])),
  };
}

function contextValue(token, context) {
  let value = token.$value;
  const modes = token.$extensions?.['com.meridian']?.modes ?? {};
  if (modes[context.theme] !== undefined) value = modes[context.theme];
  if (modes[context.contrast] !== undefined) value = modes[context.contrast];
  return clone(value);
}

function componentForContext(source, context) {
  const output = clone(source);
  function visit(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return;
    if (Object.hasOwn(node, '$value')) {
      node.$value = contextValue(node, context);
      return;
    }
    for (const [key, child] of Object.entries(node)) if (!key.startsWith('$')) visit(child);
  }
  visit(output);
  return output;
}

function shadowForBundle(source) {
  const output = clone(source);
  function rewrite(value) {
    if (typeof value === 'string') return value.replace(/^\{color\./, '{shadow.color.');
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rewrite(child)]));
    }
    return value;
  }
  for (const [, token] of tokenEntries(output.level)) token.$value = rewrite(token.$value);
  return output;
}

function shadowColorsForTheme(shadow, theme) {
  return Object.fromEntries(tokenEntries(shadow.color).map(([id, token]) => [
    `--shadow-color-${id}`,
    dtcgColorToCss(theme === 'light' ? token.$value : token.$extensions['com.meridian'].modes.dark),
  ]));
}

function makeBundle({ context, palettes, semantic, charts, chartForegrounds, metadata, sources }) {
  const document = {
    '$description': `Meridian Design System tokens resolved for ${context.label}.`,
    '$extensions': {
      'com.meridian': {
        specification: 'DTCG 2025.10',
        generated: true,
        defaultSeed: DEFAULT_SEED,
        modifiers: { theme: context.theme, contrast: context.contrast },
        resolutionOrder: ['theme', 'contrast'],
      },
    },
    color: {
      '$description': 'Generated reference palettes and resolved semantic colors.',
      reference: paletteGroup(palettes),
      semantic: semanticGroup(semantic, charts, chartForegrounds, metadata),
    },
    spacing: clone(sources.spacing),
    radius: clone(sources.radius),
    motion: clone(sources.motion),
    layout: clone(sources.layout),
    typography: clone(sources.typography),
    density: clone(sources.density),
    shadow: shadowForBundle(sources.shadow),
    component: componentForContext(sources.component, context),
  };
  const errors = validateDtcgDocument(document, { label: `generated:${context.id}` });
  if (errors.length) throw new Error(`Generated DTCG document is invalid:\n${errors.join('\n')}`);
  return document;
}

function declarations(values) {
  return Object.entries(values).map(([name, value]) => `  ${name}:${value};`).join('\n');
}

function semanticCssValues(semantic, charts, chartForegrounds) {
  return {
    ...Object.fromEntries(Object.entries(semantic).map(([key, value]) => [cssSemanticName(key), value])),
    ...Object.fromEntries(charts.flatMap((value, index) => [
      [`--chart-${index + 1}`, value],
      [`--chart-fg-${index + 1}`, chartForegrounds[index]],
    ])),
  };
}

function componentCssValues(bundle) {
  const values = {};
  for (const entry of collectDtcgTokens(bundle.component)) {
    const cssVariable = entry.token.$extensions?.['com.meridian']?.cssVariable;
    if (!cssVariable) continue;
    values[cssVariable] = dtcgColorToCss(resolveDtcgValue(bundle, `component.${entry.path}`));
  }
  return values;
}

function privateCssValues({ theme, palettes, engine }) {
  const codeBackground = theme === 'dark'
    ? (() => {
      const neutral = engine.hexToOklch(palettes.neutral[950]);
      return engine.oklchToHex(16, neutral.c, neutral.h);
    })()
    : palettes.neutral[25];
  const codeSteps = theme === 'dark'
    ? { '--code-k': palettes.accent[300], '--code-s': palettes.success[400], '--code-f': palettes.primary[300], '--code-n': palettes.warning[400] }
    : { '--code-k': palettes.accent[700], '--code-s': palettes.success[700], '--code-f': palettes.primary[700], '--code-n': palettes.warning[700] };
  return { '--code-bg': codeBackground, ...codeSteps };
}

function themeCss({ bundles, resolved, palettes, sources, engine }) {
  const primitiveValues = Object.fromEntries(Object.entries(palettes).flatMap(([family, scale]) =>
    Object.entries(scale).map(([step, value]) => [`--${family === 'neutralVariant' ? 'neutral-variant' : family}-${step}`, value])));
  const blocks = CONTEXTS.map((context) => {
    const { id, theme, contrast } = context;
    const baseSelector = `html[data-theme="${theme}"][data-contrast="${contrast}"]`;
    const selector = contrast === 'standard'
      ? `${id === 'light-standard' ? ':root,' : ''}${baseSelector},html[data-theme="${theme}"]:not([data-contrast])`
      : baseSelector;
    const values = {
      ...semanticCssValues(resolved[id].semantic, resolved[id].charts, resolved[id].chartForegrounds),
      ...componentCssValues(bundles[id]),
      ...shadowColorsForTheme(sources.shadow, theme),
      '--focus-w': contrast === 'high' ? '3px' : '2px',
      ...privateCssValues({ theme, palettes, engine }),
    };
    return `${selector}{\n${declarations(values)}\n}`;
  });
  return `\n/* Generated reference colors for the default seed (${DEFAULT_SEED}). */\n:root{\n${declarations(primitiveValues)}\n}\n/* Theme and contrast mappings. Runtime seed selection may override these declarations inline. */\n${blocks.join('\n')}\n@media (prefers-reduced-motion: reduce){\n  :root{--dur-instant:0ms;--dur-fast:0ms;--dur-normal:0ms;--dur-slow:0ms;--dur-slower:0ms;--motion-distance-sm:0px;--motion-distance-md:0px}\n}\n`;
}

function cssValue(value) {
  if (value && typeof value === 'object' && Object.hasOwn(value, 'value')) return `${value.value}${value.unit}`;
  return String(value);
}

function catalog({ bundles, resolved, palettes, metadata, sources }) {
  const componentRows = collectDtcgTokens(sources.component).map((entry) => {
    const extension = entry.token.$extensions['com.meridian'];
    return {
      path: `component.${entry.path}`,
      cssVariable: extension.cssVariable,
      trigger: extension.trigger,
      reason: extension.reason,
      aliases: Object.fromEntries(CONTEXTS.map((context) => [context.id, contextValue(entry.token, context)])),
      values: Object.fromEntries(CONTEXTS.map(({ id }) => [id, dtcgColorToCss(resolveDtcgValue(bundles[id], `component.${entry.path}`))])),
    };
  });
  const densityRows = Object.fromEntries(Object.entries(sources.density).map(([mode, group]) => [
    mode,
    Object.fromEntries(tokenEntries(group).map(([id, token]) => [id, cssValue(token.$value)])),
  ]));
  const referenceColorCount = Object.values(palettes).reduce((total, scale) => total + Object.keys(scale).length, 0);
  const families = [
    { id: 'reference-color', label: 'Reference color', layer: 'reference', count: referenceColorCount, source: 'src/color-engine.js', css: '--{family}-{step}' },
    { id: 'semantic-color', label: 'Semantic color', layer: 'semantic', count: metadata.length, source: 'design/semantic-tokens.json', css: '用途別の短縮互換名' },
    { id: 'typography', label: 'Typography', layer: 'reference', count: countDtcgTokens(sources.typography), source: 'tokens/src/typography.json', css: '--type-*' },
    { id: 'spacing', label: 'Spacing', layer: 'reference', count: countDtcgTokens(sources.spacing), source: 'tokens/src/spacing.json', css: '--sp-*' },
    { id: 'radius', label: 'Radius', layer: 'reference', count: countDtcgTokens(sources.radius), source: 'tokens/src/radius.json', css: '--radius-*' },
    { id: 'shadow', label: 'Shadow', layer: 'reference', count: countDtcgTokens(sources.shadow), source: 'tokens/src/shadow.json', css: '--shadow-*' },
    { id: 'motion', label: 'Motion', layer: 'reference', count: countDtcgTokens(sources.motion), source: 'tokens/src/motion.json', css: '--dur-* / --ease-* / --motion-distance-*' },
    { id: 'layout', label: 'Layout', layer: 'semantic', count: countDtcgTokens(sources.layout), source: 'tokens/src/layout.json', css: '用途別のlayout名' },
    { id: 'density', label: 'Density', layer: 'modifier', count: countDtcgTokens(sources.density), source: 'tokens/src/density.json', css: 'data-densityで解決' },
    { id: 'component', label: 'Component', layer: 'component', count: componentRows.length, source: 'tokens/src/component.json', css: '--{component}-*' },
  ];
  const selectedThemeTokens = ['background', 'surface', 'foreground', 'border', 'primary', 'focus-ring'];
  return {
    specification: {
      name: 'Design Tokens Format Module',
      version: '2025.10',
      status: 'Stable Community Group Final Report',
      formatUrl: 'https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/',
      colorUrl: 'https://www.w3.org/community/reports/design-tokens/CG-FINAL-color-20251028/',
      resolverUrl: 'https://www.w3.org/community/reports/design-tokens/CG-FINAL-resolver-20251028/',
    },
    defaultSeed: DEFAULT_SEED,
    liveSeedBehavior: 'ドキュメントサイトでは選択したSeedがinline styleとして生成済みCSSを上書きする。配布JSONとCSSの再現可能な既定値はdefaultSeedで固定する。',
    layers: [
      { id: 'input', label: 'Generator input', description: 'Seedとbrand config。token layerには数えない。' },
      { id: 'reference', label: 'Reference', description: '実値・scale・生成palette。UIから直接参照しない。' },
      { id: 'semantic', label: 'Semantic', description: '用途と状態を表す共通語彙。通常のUI実装が参照する。' },
      { id: 'component', label: 'Component', description: 'policy triggerを満たす公開bindingだけを置く。' },
      { id: 'output', label: 'Platform output', description: 'CSSとmodifier context解決済みDTCG JSON。正本ではなく再生成物。' },
    ],
    families,
    sourceFiles: [
      'src/color-engine.js', 'design/semantic-tokens.json', 'tokens/src/typography.json',
      'tokens/src/spacing.json', 'tokens/src/radius.json', 'tokens/src/shadow.json',
      'tokens/src/motion.json', 'tokens/src/layout.json', 'tokens/src/density.json', 'tokens/src/component.json',
    ],
    outputs: [
      { path: 'tokens/build/tokens.css', format: 'CSS Custom Properties', context: '2 themes × 2 contrast modes / 3 densities / reduced motion', tokenCount: null },
      ...CONTEXTS.map((context) => ({ path: context.file, format: 'DTCG .tokens.json', context: context.label, tokenCount: countDtcgTokens(bundles[context.id]) })),
    ],
    contexts: CONTEXTS.map(({ id, theme, contrast, label, file }) => ({
      id, theme, contrast, label, file,
      values: Object.fromEntries(selectedThemeTokens.map((token) => [token, resolved[id].semantic[token]])),
    })),
    densities: densityRows,
    componentTokens: componentRows,
    semanticTokens: metadata.map((entry) => ({
      ...entry,
      cssVariable: cssSemanticName(entry.token),
      values: Object.fromEntries(CONTEXTS.map(({ id }) => {
        const chartIndex = /^chart-(?:fg-)?(\d+)$/.exec(entry.token);
        let value = resolved[id].semantic[entry.token];
        if (chartIndex) {
          const index = Number(chartIndex[1]) - 1;
          value = entry.token.startsWith('chart-fg-') ? resolved[id].chartForegrounds[index] : resolved[id].charts[index];
        }
        return [id, value];
      })),
    })),
    jsonPreview: {
      '$description': bundles['light-standard'].$description,
      '$extensions': bundles['light-standard'].$extensions,
      color: {
        semantic: {
          '$type': 'color',
          primary: bundles['light-standard'].color.semantic.primary,
        },
      },
    },
    limitations: [
      'npm packageとReact packageはまだ未公開。現在の配布境界はrepository内の生成ファイル。',
      'Figma Variablesへの直接importは保証しない。利用するtoolのDTCG対応範囲と変換結果を検証する。',
      'Resolver documentはまだ出力せず、themeとcontrastのmodifier contextを解決したbundleとして配布する。bundle内aliasは関係性を保つため保持する。',
    ],
  };
}

export function buildTokenArtifacts({ root, baseCss, sources, semanticMetadata }) {
  const engine = require(join(root, 'src/color-engine.js'));
  const palettes = engine.buildPalettes(DEFAULT_SEED);
  const resolved = {};
  const bundles = {};
  for (const context of CONTEXTS) {
    const { id, theme, contrast } = context;
    const semantic = engine.buildSemantics(palettes, theme, contrast);
    const charts = engine.buildCharts(DEFAULT_SEED, theme);
    const chartForegrounds = engine.chartForegrounds(charts);
    resolved[id] = { semantic, charts, chartForegrounds };
    bundles[id] = makeBundle({ context, palettes, semantic, charts, chartForegrounds, metadata: semanticMetadata, sources });
  }

  for (const [name, source] of Object.entries(sources)) {
    const errors = validateDtcgDocument(source, { label: `tokens/src/${name}.json`, allowUnresolvedAliases: true });
    if (errors.length) throw new Error(`Invalid DTCG source:\n${errors.join('\n')}`);
  }

  const css = `${baseCss.trimEnd()}\n${themeCss({ bundles, resolved, palettes, sources, engine })}`;
  const metadata = catalog({ bundles, resolved, palettes, metadata: semanticMetadata, sources });
  const artifacts = new Map([
    ['tokens/build/tokens.css', css],
    ...CONTEXTS.map(({ id, file }) => [file, `${JSON.stringify(bundles[id], null, 2)}\n`]),
    ['js/generated/token-catalog-meta.js', `"use strict";\n/* AUTO-GENERATED by scripts/build-tokens.mjs. */\nconst TOKEN_CATALOG=${JSON.stringify(metadata, null, 2)};\n`],
  ]);
  return { artifacts, metadata };
}
