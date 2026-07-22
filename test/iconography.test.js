const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const registry = JSON.parse(readFileSync(join(root, 'design/iconography.json'), 'utf8'));
const generatedSource = readFileSync(join(root, 'js/generated/iconography-meta.js'), 'utf8');
const utilsSource = readFileSync(join(root, 'js/utils.js'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const foundationPage = readFileSync(join(root, 'js/pages-foundations.js'), 'utf8');
const utilityBlock = /const ICON_SVG=[\s\S]+?\n\}\)\);/.exec(utilsSource)?.[0];

assert.ok(utilityBlock, 'icon utility block must be extractable');
const runtime = vm.runInNewContext(`${generatedSource}\n${utilityBlock}\n({ ICON_SVG, I, ICON_META, ICON_SIZES });`);

test('registry, generated metadata, and SVG implementation contain the same 35 IDs', () => {
  const sourceIds = registry.icons.map((icon) => icon.id).sort();
  assert.equal(sourceIds.length, 35);
  assert.deepEqual([...new Set(sourceIds)], sourceIds);
  assert.deepEqual(Array.from(runtime.ICON_META, (icon) => icon.id).sort(), sourceIds);
  assert.deepEqual(Object.keys(runtime.ICON_SVG).sort(), sourceIds);
  assert.deepEqual(Object.keys(runtime.I).sort(), sourceIds);
  assert.equal(new Set(registry.icons.map((icon) => icon.canonicalName)).size, 35);
});

test('rendered glyphs inherit color, use the registry size, and stay out of the accessibility tree', () => {
  for (const icon of registry.icons) {
    const svg = runtime.I[icon.id];
    const size = registry.sizes.find((candidate) => candidate.id === icon.defaultSize).value;
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /currentColor/);
    assert.match(svg, new RegExp(`width="${size}"`));
    assert.match(svg, new RegExp(`height="${size}"`));
    assert.match(svg, new RegExp(`data-icon="${icon.id}"`));
    assert.match(svg, new RegExp(`data-directionality="${icon.directionality}"`));
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /focusable="false"/);
  }
});

test('size and directionality references are valid and RTL mirroring is selective', () => {
  const sizes = new Set(registry.sizes.map((size) => size.id));
  for (const icon of registry.icons) assert.ok(sizes.has(icon.defaultSize));
  assert.match(indexHtml, /\[dir="rtl"\] svg\[data-directionality="mirror-in-rtl"\]/);
  assert.doesNotMatch(indexHtml, /\[dir="rtl"\] svg\[data-directionality="(?:neutral|brand-fixed)"\]/);
});

test('human docs expose the registry and accessible-name ownership rule', () => {
  assert.match(foundationPage, /ICON_META\.map/);
  assert.match(foundationPage, /Accessible nameはButtonまたはLinkが所有/);
  assert.match(foundationPage, /Tooltipは視覚的な補足/);
  assert.match(foundationPage, /Non-text Contrast/);
});
