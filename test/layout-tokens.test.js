const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const layout = JSON.parse(readFileSync(join(root, 'tokens/src/layout.json'), 'utf8'));
const spacing = JSON.parse(readFileSync(join(root, 'tokens/src/spacing.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const foundationPage = readFileSync(join(root, 'js/pages-foundations.js'), 'utf8');
const generatedSource = readFileSync(join(root, 'js/generated/foundation-token-meta.js'), 'utf8');
const generated = vm.runInNewContext(`${generatedSource}\n({ LAYOUT_TOKENS, LAYOUT_BREAKPOINTS });`);
const dimensions = Object.entries(layout.dimension).filter(([key]) => !key.startsWith('$'));
const breakpoints = Object.entries(layout.breakpoint).filter(([key]) => !key.startsWith('$'));

test('layout source, generated metadata, and CSS expose the same dimensions', () => {
  assert.equal(generated.LAYOUT_TOKENS.length, dimensions.length);
  for (const [id, token] of dimensions) {
    const row = generated.LAYOUT_TOKENS.find((candidate) => candidate.id === id);
    assert.ok(row, `missing generated layout metadata for ${id}`);
    assert.equal(row.token, `--${id}`);
    assert.match(css, new RegExp(`--${id}:`));

    const alias = typeof token.$value === 'string' && /^\{spacing\.(.+)\}$/.exec(token.$value);
    if (alias) {
      assert.ok(spacing[alias[1]], `unknown layout alias ${token.$value}`);
      assert.equal(row.value, `var(--sp-${alias[1]})`);
    }
  }
});

test('content-driven breakpoints stay synchronized with shell media queries', () => {
  assert.equal(generated.LAYOUT_BREAKPOINTS.length, breakpoints.length);
  for (const [id, token] of breakpoints) {
    const value = `${token.$value.value}${token.$value.unit}`;
    const row = generated.LAYOUT_BREAKPOINTS.find((candidate) => candidate.id === id);
    assert.ok(row, `missing breakpoint metadata for ${id}`);
    assert.equal(row.value, value);
    assert.match(indexHtml, new RegExp(`@media\\(max-width:${value.replace('.', '\\.')}\\)`));
  }
});

test('layout docs no longer advertise legacy variable names', () => {
  for (const legacy of ['--sidebar-width', '--content-max-width', '--page-padding', '--modal-width-md']) {
    assert.doesNotMatch(foundationPage, new RegExp(legacy));
  }
});
