const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const radius = JSON.parse(readFileSync(join(root, 'tokens/src/radius.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const lightBundle = JSON.parse(readFileSync(join(root, 'tokens/build/meridian.tokens.json'), 'utf8'));
const generatedSource = readFileSync(join(root, 'js/generated/foundation-token-meta.js'), 'utf8');
const generatedRows = vm.runInNewContext(`${generatedSource}\nRADIUS_SCALE;`);
const sourceEntries = Object.entries(radius).filter(([key]) => !key.startsWith('$'));

test('radius source, generated metadata, and CSS stay synchronized', () => {
  assert.equal(generatedRows.length, sourceEntries.length);
  for (const [id, token] of sourceEntries) {
    const row = generatedRows.find((candidate) => candidate.id === id);
    const value = `${token.$value.value}${token.$value.unit}`;
    assert.ok(row, `missing generated radius metadata for ${id}`);
    assert.equal(row.token, `--radius-${id}`);
    assert.equal(row.value, value);
    assert.match(css, new RegExp(`--radius-${id}:${value}[;}]`));
  }
});

test('static card-like surfaces use the 8px maximum radius', () => {
  for (const selector of ['.panel', '.cardc', '.comp-tile', '.tpl-frame']) {
    const escaped = selector.replace('.', '\\.');
    assert.match(indexHtml, new RegExp(`${escaped}\\{[^}]*border-radius:var\\(--radius-md\\)`));
  }
});

test('DTCG bundle and usage metadata preserve the shape policy', () => {
  assert.deepEqual(lightBundle.radius, radius);
  const values = sourceEntries.map(([, token]) => token.$value.value);
  assert.deepEqual(values, [...values].sort((a, b) => a - b));
  assert.equal(radius.md.$value.value, 8);
  assert.match(radius.md.$extensions['com.meridian'].usage, /card|panel|tile/);
  assert.match(radius.lg.$extensions['com.meridian'].usage, /menu|popover|tooltip/);
  assert.match(radius.full.$extensions['com.meridian'].usage, /avatar|status|badge/i);
});
