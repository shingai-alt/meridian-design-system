const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const shadow = JSON.parse(readFileSync(join(root, 'tokens/src/shadow.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const utils = readFileSync(join(root, 'js/utils.js'), 'utf8');
const builders = readFileSync(join(root, 'js/ui-builders.js'), 'utf8');
const lightBundle = JSON.parse(readFileSync(join(root, 'tokens/build/meridian.tokens.json'), 'utf8'));
const darkBundle = JSON.parse(readFileSync(join(root, 'tokens/build/meridian.dark.tokens.json'), 'utf8'));
const generatedSource = readFileSync(join(root, 'js/generated/foundation-token-meta.js'), 'utf8');
const generated = vm.runInNewContext(`${generatedSource}\n({ SHADOW_LEVELS, SHADOW_THEME_COLORS });`);
const colors = Object.entries(shadow.color).filter(([key]) => !key.startsWith('$'));
const levels = Object.entries(shadow.level).filter(([key]) => !key.startsWith('$'));

test('shadow source, generated levels, and CSS geometry stay synchronized', () => {
  assert.equal(generated.SHADOW_LEVELS.length, levels.length);
  for (const [id, token] of levels) {
    const row = generated.SHADOW_LEVELS.find((candidate) => candidate.id === id);
    assert.ok(row, `missing generated shadow metadata for ${id}`);
    assert.equal(row.token, `--shadow-${id}`);
    assert.match(css, new RegExp(`--shadow-${id}:`));

    const layers = Array.isArray(token.$value) ? token.$value : [token.$value];
    for (const layer of layers) {
      const match = /^\{color\.(.+)\}$/.exec(layer.color);
      assert.ok(match && shadow.color[match[1]], `unknown shadow color alias ${layer.color}`);
      assert.match(row.value, new RegExp(`var\\(--shadow-color-${match[1]}\\)`));
    }
  }
});

test('shadow color is theme-owned and does not vary with contrast', () => {
  for (const mode of ['light', 'dark']) {
    assert.equal(Object.keys(generated.SHADOW_THEME_COLORS[mode]).length, colors.length);
    for (const [id] of colors) assert.match(generated.SHADOW_THEME_COLORS[mode][id], /^rgba\(/);
  }
  for (const [, token] of colors) assert.deepEqual(Object.keys(token.$extensions['com.meridian'].modes), ['dark']);
  assert.match(utils, /SHADOW_THEME_COLORS\[STATE\.theme\]/);
  assert.doesNotMatch(utils, /setProperty\('--shadow-(?:xs|sm|md|lg|overlay)'/);
});

test('static card surfaces do not declare elevated shadows', () => {
  for (const selector of ['.panel', '.cardc', '.comp-tile']) {
    const escaped = selector.replace('.', '\\.');
    const rule = new RegExp(`${escaped}\\{([^}]*)\\}`).exec(indexHtml);
    assert.ok(rule, `missing ${selector} rule`);
    assert.doesNotMatch(rule[1], /box-shadow\s*:/);
  }
  const emptyIcon = /\.emptyc \.ic\{([^}]*)\}/.exec(indexHtml);
  assert.ok(emptyIcon);
  assert.doesNotMatch(emptyIcon[1], /box-shadow/);
});

test('transient surfaces use the level assigned by source usage', () => {
  assert.match(indexHtml, /\.tb-menu\{[^}]*box-shadow:var\(--shadow-sm\)/);
  assert.match(builders, /function popoverEl\(\).*?box-shadow:var\(--shadow-md\)/);
  assert.match(builders, /function comboboxEl\(.*?box-shadow:var\(--shadow-md\)/s);
  assert.match(indexHtml, /\.toastc\{[^}]*box-shadow:var\(--shadow-lg\)/);
  assert.match(indexHtml, /\.dialogc\{[^}]*box-shadow:var\(--shadow-overlay\)/);
});

test('DTCG theme bundles keep identical geometry and qualified color aliases', () => {
  assert.deepEqual(lightBundle.shadow, darkBundle.shadow);
  for (const token of Object.values(lightBundle.shadow.level).filter((value) => value && typeof value === 'object' && '$value' in value)) {
    const layers = Array.isArray(token.$value) ? token.$value : [token.$value];
    for (const layer of layers) assert.match(layer.color, /^\{shadow\.color\.[^}]+\}$/);
  }
});
