const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const typography = JSON.parse(readFileSync(join(root, 'tokens/src/typography.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const generatedSource = readFileSync(join(root, 'js/generated/typography-token-meta.js'), 'utf8');
const generatedRows = vm.runInNewContext(`${generatedSource}\nTYPE_SCALE;`);
const sourceEntries = Object.entries(typography).filter(([key]) => !key.startsWith('$'));
const lightBundle = JSON.parse(readFileSync(join(root, 'tokens/build/meridian.tokens.json'), 'utf8'));

test('typography source defines a unique generated role for every token', () => {
  assert.equal(generatedRows.length, sourceEntries.length);
  assert.equal(new Set(generatedRows.map((row) => row.id)).size, generatedRows.length);

  for (const [id, token] of sourceEntries) {
    const row = generatedRows.find((candidate) => candidate.id === id);
    assert.ok(row, `missing generated metadata for ${id}`);
    assert.equal(row.token, `--type-${id}`);
    assert.equal(row.letterSpacing, '0rem', `${id} must keep letter spacing at zero`);
    assert.match(css, new RegExp(`--type-${id}-font-size:`));
    assert.match(css, new RegExp(`--type-${id}:var\\(--type-${id}-font-weight\\)`));
    assert.equal(token.$value.letterSpacing.value, 0);
  }
});

test('reading role stays at a readable 1rem and is not density-dependent', () => {
  assert.equal(typography.reading.$value.fontSize.value, 1);
  assert.equal(typography.reading.$value.fontSize.unit, 'rem');
  assert.ok(typography.reading.$value.lineHeight >= 1.5);
  assert.doesNotMatch(css, /data-density[^}]*--type-reading-font-size/);
});

test('DTCG bundle preserves every typography composite without mode-specific drift', () => {
  assert.deepEqual(lightBundle.typography, typography);
  assert.equal(lightBundle.typography.$type, 'typography');
  for (const [, token] of sourceEntries) {
    assert.deepEqual(Object.keys(token.$value).sort(), ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'].sort());
  }
});
