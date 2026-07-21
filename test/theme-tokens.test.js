const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const policy = JSON.parse(read('design/token-policy.json'));
const component = JSON.parse(read('tokens/src/component.json'));
const shadow = JSON.parse(read('tokens/src/shadow.json'));
const css = read('tokens/build/tokens.css');
const runtime = read('js/utils.js');
const shell = read('js/app-shell.js');
const indexHtml = read('index.html');
const docs = read('js/pages-tokens.js');
const catalogSource = read('js/generated/token-catalog-meta.js');
const catalog = vm.runInNewContext(`${catalogSource}\nTOKEN_CATALOG;`);
const contexts = [
  ['light-standard', 'light', 'standard', 'tokens/build/meridian.tokens.json'],
  ['dark-standard', 'dark', 'standard', 'tokens/build/meridian.dark.tokens.json'],
  ['light-high', 'light', 'high', 'tokens/build/meridian.high-contrast.tokens.json'],
  ['dark-high', 'dark', 'high', 'tokens/build/meridian.dark.high-contrast.tokens.json'],
];

function findModeKeys(node, result = []) {
  if (!node || typeof node !== 'object') return result;
  const modes = node.$extensions?.['com.meridian']?.modes;
  if (modes) result.push(Object.keys(modes));
  for (const [key, child] of Object.entries(node)) if (!key.startsWith('$')) findModeKeys(child, result);
  return result;
}

test('theme and contrast are separate policy modifiers', () => {
  const theme = policy.modifiers.find((modifier) => modifier.id === 'theme');
  const contrastMode = policy.modifiers.find((modifier) => modifier.id === 'contrast');
  assert.deepEqual(theme.contexts, ['light', 'dark']);
  assert.deepEqual(contrastMode.contexts, ['standard', 'high']);
  assert.ok(theme.mustNotOwn.includes('density'));
  assert.ok(contrastMode.mustNotOwn.includes('light versus dark selection'));
});

test('four resolved bundles declare modifier inputs and resolution order', () => {
  assert.deepEqual(Array.from(catalog.contexts, (context) => context.id), contexts.map(([id]) => id));
  for (const [id, theme, contrastMode, path] of contexts) {
    const bundle = JSON.parse(read(path));
    const metadata = bundle.$extensions['com.meridian'];
    assert.deepEqual(metadata.modifiers, { theme, contrast: contrastMode }, id);
    assert.deepEqual(metadata.resolutionOrder, ['theme', 'contrast'], id);
  }
});

test('CSS publishes every theme and contrast permutation without hc as a theme', () => {
  for (const [, theme, contrastMode] of contexts) {
    assert.match(css, new RegExp(`html\\[data-theme="${theme}"\\]\\[data-contrast="${contrastMode}"\\]`));
  }
  assert.doesNotMatch(css, /data-theme="hc"/);
  assert.match(css, /data-theme="light"\]\[data-contrast="high"\][^{]*\{[^}]*--focus-w:3px/s);
  assert.match(css, /data-theme="dark"\]\[data-contrast="high"\][^{]*\{[^}]*--focus-w:3px/s);
});

test('component and shadow overrides keep modifier ownership explicit', () => {
  for (const keys of findModeKeys(component)) {
    assert.ok(keys.every((key) => ['dark', 'high'].includes(key)));
    assert.ok(keys.length <= 1, `component token mixes modifiers: ${keys.join(', ')}`);
  }
  for (const keys of findModeKeys(shadow)) assert.deepEqual(keys, ['dark']);
});

test('runtime state, settings, and previews use separate axes', () => {
  assert.match(runtime, /theme:\['light','dark'\]\.includes/);
  assert.match(runtime, /contrast:LEGACY_HC\?'high'/);
  assert.match(runtime, /buildSemantics\(P,STATE\.theme,STATE\.contrast\)/);
  assert.match(runtime, /r\.dataset\.contrast=STATE\.contrast/);
  assert.match(runtime, /mrd\.contrast/);
  assert.match(runtime, /prefers-contrast: more/);
  assert.match(shell, /data-setcontrast/);
  assert.match(shell, /function cycleContrast/);
  assert.match(indexHtml, /data-theme="light" data-contrast="standard"/);
  assert.match(indexHtml, /html\[data-theme="dark"\]\{color-scheme:dark\}/);
});

test('author High mode stays distinct from forced colors mode', () => {
  assert.doesNotMatch(`${indexHtml}\n${runtime}\n${shell}`, /forced-color-adjust\s*:\s*none/);
  assert.match(docs, /forced-colors: active/);
  assert.match(docs, /CSS Color Adjustment Level 1/);
  assert.match(docs, /DTCG Resolver Module 2025\.10/);
});
