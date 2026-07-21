const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const density = JSON.parse(read('tokens/src/density.json'));
const accessibility = JSON.parse(read('design/accessibility.json'));
const css = read('tokens/build/tokens.css');
const indexHtml = read('index.html');
const docs = read('js/pages-tokens.js');
const catalogSource = read('js/generated/token-catalog-meta.js');
const catalog = vm.runInNewContext(`${catalogSource}\nTOKEN_CATALOG;`);
const modes = ['compact', 'default', 'comfortable'];
const bundles = [
  'tokens/build/meridian.tokens.json',
  'tokens/build/meridian.dark.tokens.json',
  'tokens/build/meridian.high-contrast.tokens.json',
  'tokens/build/meridian.dark.high-contrast.tokens.json',
].map((path) => JSON.parse(read(path)));

const tokenKeys = (mode) => Object.keys(density[mode]).sort();
const cssValue = (value) => {
  if (typeof value === 'string') {
    const alias = /^\{spacing\.(.+)\}$/.exec(value);
    return alias ? `var(--sp-${alias[1]})` : value;
  }
  if (value && typeof value === 'object') return `${value.value}${value.unit}`;
  return String(value);
};

test('all density modes expose the same typed token contract', () => {
  assert.deepEqual(tokenKeys('compact'), tokenKeys('default'));
  assert.deepEqual(tokenKeys('comfortable'), tokenKeys('default'));
  assert.ok(!tokenKeys('default').some((key) => key.startsWith('type-reading')));
  for (const mode of modes) {
    for (const [key, token] of Object.entries(density[mode])) {
      assert.ok(['dimension', 'number'].includes(token.$type), `${mode}.${key} needs a supported type`);
      if (token.$type === 'dimension' && typeof token.$value !== 'string') {
        assert.equal(token.$value.unit, 'px');
        assert.equal(typeof token.$value.value, 'number');
      }
    }
  }
});

test('control tokens keep the Meridian target minimum in every mode', () => {
  const minimum = accessibility.targetSize.minimumCssPx;
  for (const mode of modes) {
    const sizes = ['ctl-xs', 'ctl-sm', 'ctl-md', 'ctl-lg', 'ctl-xl']
      .map((key) => density[mode][key].$value.value);
    assert.ok(sizes.every((size) => size >= minimum), `${mode} contains a target below ${minimum}px`);
    assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
  }
  assert.match(indexHtml, /button\{[^}]*min-inline-size:24px;min-block-size:24px/);
});

test('compact, default, and comfortable values preserve density order', () => {
  for (const key of tokenKeys('default')) {
    const values = modes.map((mode) => density[mode][key].$value);
    if (values.every((value) => typeof value === 'number')) {
      assert.ok(values[0] <= values[1] && values[1] <= values[2], key);
    } else if (values.every((value) => value && typeof value === 'object')) {
      const numbers = values.map((value) => value.value);
      assert.ok(numbers[0] <= numbers[1] && numbers[1] <= numbers[2], key);
    }
  }
  assert.deepEqual(modes.map((mode) => density[mode]['row-h'].$value.value), [32, 40, 48]);
});

test('source, catalog, CSS, and every context bundle stay synchronized', () => {
  const catalogDensities = JSON.parse(JSON.stringify(catalog.densities));
  for (const mode of modes) {
    const rule = new RegExp(`html\\[data-density="${mode}"\\]\\{([^}]*)\\}`).exec(css);
    assert.ok(rule, `missing ${mode} CSS selector`);
    for (const [key, token] of Object.entries(density[mode])) {
      assert.equal(catalogDensities[mode][key], cssValue(token.$value).replace(/^var\(--sp-(.+)\)$/, '{spacing.$1}'));
      assert.match(rule[1], new RegExp(`--${key}:${cssValue(token.$value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    }
  }
  for (const bundle of bundles) assert.deepEqual(bundle.density, density);
});

test('density selection is contextual rather than viewport-driven', () => {
  assert.doesNotMatch(indexHtml, /@media[^{}]*\{[^{}]*--(?:ctl|row-h|card-pad)-/s);
  assert.match(docs, /SPだからCompact、PCだからDefaultとは決めない/);
  assert.match(docs, /全modeでcontrol tokenは24px以上/);
});
