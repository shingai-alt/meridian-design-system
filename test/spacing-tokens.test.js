const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const spacing = JSON.parse(readFileSync(join(root, 'tokens/src/spacing.json'), 'utf8'));
const density = JSON.parse(readFileSync(join(root, 'tokens/src/density.json'), 'utf8'));
const layout = JSON.parse(readFileSync(join(root, 'tokens/src/layout.json'), 'utf8'));
const lightBundle = JSON.parse(readFileSync(join(root, 'tokens/build/meridian.tokens.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const generatedSource = readFileSync(join(root, 'js/generated/foundation-token-meta.js'), 'utf8');
const generatedRows = vm.runInNewContext(`${generatedSource}\nSPACING_SCALE;`);
const sourceEntries = Object.entries(spacing)
  .filter(([key]) => !key.startsWith('$'))
  .sort(([, a], [, b]) => a.$value.value - b.$value.value);

test('spacing source, generated metadata, and CSS expose the same token names', () => {
  assert.equal(generatedRows.length, sourceEntries.length);
  assert.equal(new Set(generatedRows.map((row) => row.id)).size, generatedRows.length);

  for (const [id, token] of sourceEntries) {
    const row = generatedRows.find((candidate) => candidate.id === id);
    const value = `${token.$value.value}${token.$value.unit}`;
    assert.ok(row, `missing generated spacing metadata for ${id}`);
    assert.equal(row.token, `--sp-${id}`);
    assert.equal(row.value, value);
    assert.match(css, new RegExp(`--sp-${id}:${value.replace('.', '\\.')}[;}]`));
  }
});

test('spacing scale is monotonic and density aliases resolve to existing steps', () => {
  const values = sourceEntries.map(([, token]) => token.$value.value);
  assert.deepEqual(values, [...values].sort((a, b) => a - b));

  for (const mode of Object.values(density)) {
    for (const token of Object.values(mode)) {
      const match = typeof token.$value === 'string' && /^\{spacing\.(.+)\}$/.exec(token.$value);
      if (match) assert.ok(spacing[match[1]], `unknown spacing alias ${token.$value}`);
    }
  }
});

test('layout and density aliases resolve to the bundled spacing source', () => {
  assert.deepEqual(lightBundle.spacing, spacing);
  const consumers = [layout.dimension, ...Object.values(density)];
  for (const group of consumers) {
    for (const token of Object.values(group)) {
      const match = typeof token.$value === 'string' && /^\{spacing\.(.+)\}$/.exec(token.$value);
      if (match) {
        assert.ok(spacing[match[1]], `unknown spacing alias ${token.$value}`);
        assert.equal(typeof spacing[match[1]].$value.value, 'number');
      }
    }
  }
});
