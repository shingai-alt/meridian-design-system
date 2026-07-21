#!/usr/bin/env node
// Zero-dependency token builder: tokens/src/*.json (W3C Design Tokens format)
// -> tokens/build/tokens.css and generated documentation metadata.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTokenArtifacts } from './lib/token-artifacts.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(root, 'tokens/src');
const outDir = join(root, 'tokens/build');
const outFile = join(outDir, 'tokens.css');
const typographyMetaFile = join(root, 'js/generated/typography-token-meta.js');
const foundationMetaFile = join(root, 'js/generated/foundation-token-meta.js');
const checkOnly = process.argv.includes('--check');

const readJson = (name) => JSON.parse(readFileSync(join(srcDir, name), 'utf8'));

const spacing = readJson('spacing.json');
const radius = readJson('radius.json');
const motion = readJson('motion.json');
const layout = readJson('layout.json');
const density = readJson('density.json');
const typography = readJson('typography.json');
const shadow = readJson('shadow.json');
const component = readJson('component.json');
const semanticMetadata = JSON.parse(readFileSync(join(root, 'design/semantic-tokens.json'), 'utf8'));

const dimensionToCss = ({ value, unit }) => `${value}${unit}`;
const toCssValue = (value) => value && typeof value === 'object' && 'value' in value
  ? dimensionToCss(value)
  : String(value);
const fontFamilyToCss = (families) => (Array.isArray(families) ? families : [families])
  .map((family) => ['system-ui', 'sans-serif', 'serif', 'monospace', 'ui-monospace'].includes(family)
    ? family
    : `'${family}'`)
  .join(',');
const colorToCss = (color) => {
  if (color.colorSpace !== 'srgb' || !Array.isArray(color.components)) {
    throw new Error(`Unsupported shadow color: ${JSON.stringify(color)}`);
  }
  const channels = color.components.map((component) => Math.round(component * 255));
  return `rgba(${channels.join(',')},${color.alpha ?? 1})`;
};
const shadowLayerToCss = (layer) => {
  const alias = /^\{color\.(.+)\}$/.exec(layer.color);
  if (!alias || !shadow.color[alias[1]]) throw new Error(`Unknown shadow color alias: ${layer.color}`);
  return [
    toCssValue(layer.offsetX),
    toCssValue(layer.offsetY),
    toCssValue(layer.blur),
    toCssValue(layer.spread),
    `var(--shadow-color-${alias[1]})`,
  ].join(' ');
};
const shadowToCss = (value) => (Array.isArray(value) ? value : [value]).map(shadowLayerToCss).join(',');

// Resolves DTCG alias refs like "{spacing.4}" against the spacing token group,
// producing a CSS var() reference so density values stay in sync with spacing.
function resolveValue(raw) {
  if (raw && typeof raw === 'object') return toCssValue(raw);
  const m = /^\{spacing\.(.+)\}$/.exec(raw);
  if (!m) return raw;
  if (!(m[1] in spacing)) throw new Error(`Unknown spacing alias: ${raw}`);
  return `var(--sp-${m[1]})`;
}

const tokenEntries = (group) => Object.entries(group).filter(([key]) => !key.startsWith('$'));
const spacingEntries = tokenEntries(spacing).sort(([, a], [, b]) => {
  const av = typeof a.$value === 'object' ? a.$value.value : Number.parseFloat(a.$value);
  const bv = typeof b.$value === 'object' ? b.$value.value : Number.parseFloat(b.$value);
  return av - bv;
});
const rootDecls = [];
rootDecls.push(`--font-sans:${fontFamilyToCss(layout.font.sans.$value)}`);
rootDecls.push(`--font-mono:${fontFamilyToCss(layout.font.mono.$value)}`);
for (const [key, token] of spacingEntries) rootDecls.push(`--sp-${key}:${toCssValue(token.$value)}`);
for (const [key, token] of tokenEntries(radius)) rootDecls.push(`--radius-${key}:${toCssValue(token.$value)}`);
for (const [key, token] of tokenEntries(motion.duration)) rootDecls.push(`--dur-${key}:${toCssValue(token.$value)}`);
for (const [key, token] of tokenEntries(motion.easing)) rootDecls.push(`--ease-${key}:cubic-bezier(${token.$value.join(',')})`);
for (const [key, token] of tokenEntries(motion.distance)) rootDecls.push(`--motion-distance-${key}:${toCssValue(token.$value)}`);
for (const [key, token] of tokenEntries(layout.dimension)) rootDecls.push(`--${key}:${resolveValue(token.$value)}`);
for (const [key, token] of tokenEntries(shadow.color)) rootDecls.push(`--shadow-color-${key}:${colorToCss(token.$value)}`);
for (const [key, token] of tokenEntries(shadow.level)) rootDecls.push(`--shadow-${key}:${shadowToCss(token.$value)}`);
for (const [key, token] of Object.entries(typography)) {
  if (key.startsWith('$')) continue;
  const value = token.$value;
  rootDecls.push(`--type-${key}-font-family:${fontFamilyToCss(value.fontFamily)}`);
  rootDecls.push(`--type-${key}-font-size:${dimensionToCss(value.fontSize)}`);
  rootDecls.push(`--type-${key}-font-weight:${value.fontWeight}`);
  rootDecls.push(`--type-${key}-letter-spacing:${dimensionToCss(value.letterSpacing)}`);
  rootDecls.push(`--type-${key}-line-height:${value.lineHeight}`);
  rootDecls.push(`--type-${key}:var(--type-${key}-font-weight) var(--type-${key}-font-size)/var(--type-${key}-line-height) var(--type-${key}-font-family)`);
}

const densityBlocks = Object.entries(density).map(([mode, tokens]) => {
  const decls = Object.entries(tokens).map(([key, token]) => `--${key}:${resolveValue(token.$value)}`);
  return `html[data-density="${mode}"]{${decls.join(';')}}`;
});

const baseCss = `/* AUTO-GENERATED by scripts/build-tokens.mjs — do not edit by hand.
   Edit tokens/src/*.json instead, then run: node scripts/build-tokens.mjs */
:root{
  ${rootDecls.join(';\n  ')};
}
${densityBlocks.join('\n')}
`;

const typographyRows = Object.entries(typography)
  .filter(([key]) => !key.startsWith('$'))
  .map(([id, token]) => ({
    id,
    label: token.$extensions['com.meridian'].label,
    usage: token.$extensions['com.meridian'].usage,
    description: token.$description,
    fontFamily: token.$value.fontFamily,
    fontSize: dimensionToCss(token.$value.fontSize),
    fontWeight: token.$value.fontWeight,
    letterSpacing: dimensionToCss(token.$value.letterSpacing),
    lineHeight: token.$value.lineHeight,
    token: `--type-${id}`,
  }));
const typographyMeta = `"use strict";\n/* AUTO-GENERATED from tokens/src/typography.json. */\nconst TYPE_SCALE=${JSON.stringify(typographyRows, null, 2)};\n`;
const spacingRows = spacingEntries.map(([id, token]) => ({
  id,
  token: `--sp-${id}`,
  value: toCssValue(token.$value),
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const layoutRows = tokenEntries(layout.dimension).map(([id, token]) => ({
  id,
  token: `--${id}`,
  value: resolveValue(token.$value),
  source: typeof token.$value === 'string' ? token.$value : toCssValue(token.$value),
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const breakpointRows = tokenEntries(layout.breakpoint).map(([id, token]) => ({
  id,
  value: toCssValue(token.$value),
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const radiusRows = tokenEntries(radius).map(([id, token]) => ({
  id,
  token: `--radius-${id}`,
  value: toCssValue(token.$value),
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const shadowRows = tokenEntries(shadow.level).map(([id, token]) => ({
  id,
  token: `--shadow-${id}`,
  value: shadowToCss(token.$value),
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const shadowThemeColors = Object.fromEntries(['light', 'dark'].map((mode) => [
  mode,
  Object.fromEntries(tokenEntries(shadow.color).map(([id, token]) => [
    id, colorToCss(mode === 'light' ? token.$value : token.$extensions['com.meridian'].modes.dark),
  ])),
]));
const motionDurations = tokenEntries(motion.duration).map(([id, token]) => ({
  id,
  token: `--dur-${id}`,
  value: toCssValue(token.$value),
  milliseconds: token.$value.unit === 'ms' ? token.$value.value : token.$value.value * 1000,
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const motionEasings = tokenEntries(motion.easing).map(([id, token]) => ({
  id,
  token: `--ease-${id}`,
  value: `cubic-bezier(${token.$value.join(',')})`,
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const motionDistances = tokenEntries(motion.distance).map(([id, token]) => ({
  id,
  token: `--motion-distance-${id}`,
  value: toCssValue(token.$value),
  description: token.$description || '',
  usage: token.$extensions?.['com.meridian']?.usage || '',
}));
const foundationMeta = `"use strict";\n/* AUTO-GENERATED from tokens/src foundation files. */\nconst SPACING_SCALE=${JSON.stringify(spacingRows, null, 2)};\nconst LAYOUT_TOKENS=${JSON.stringify(layoutRows, null, 2)};\nconst LAYOUT_BREAKPOINTS=${JSON.stringify(breakpointRows, null, 2)};\nconst RADIUS_SCALE=${JSON.stringify(radiusRows, null, 2)};\nconst SHADOW_LEVELS=${JSON.stringify(shadowRows, null, 2)};\nconst SHADOW_THEME_COLORS=${JSON.stringify(shadowThemeColors, null, 2)};\nconst MOTION_DURATIONS=${JSON.stringify(motionDurations, null, 2)};\nconst MOTION_EASINGS=${JSON.stringify(motionEasings, null, 2)};\nconst MOTION_DISTANCES=${JSON.stringify(motionDistances, null, 2)};\n`;

const { artifacts } = buildTokenArtifacts({
  root,
  baseCss,
  sources: { spacing, radius, motion, layout, density, typography, shadow, component },
  semanticMetadata,
});
artifacts.set('js/generated/typography-token-meta.js', typographyMeta);
artifacts.set('js/generated/foundation-token-meta.js', foundationMeta);

for (const [relativePath, expected] of artifacts) {
  const absolutePath = join(root, relativePath);
  if (checkOnly) {
    const current = existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : null;
    if (current !== expected) {
      console.error(`${absolutePath} is out of date. Run: npm run build:tokens`);
      process.exitCode = 1;
    } else {
      console.log(`${absolutePath} is up to date.`);
    }
  } else {
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, expected);
    console.log(`Wrote ${absolutePath}`);
  }
}
