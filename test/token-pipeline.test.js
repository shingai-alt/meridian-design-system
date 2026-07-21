const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');

const root = join(__dirname, '..');
const sourceNames = ['spacing', 'radius', 'motion', 'layout', 'density', 'typography', 'shadow', 'component'];
const sources = Object.fromEntries(sourceNames.map((name) => [
  name,
  JSON.parse(readFileSync(join(root, `tokens/src/${name}.json`), 'utf8')),
]));
const bundlePaths = [
  'tokens/build/meridian.tokens.json',
  'tokens/build/meridian.dark.tokens.json',
  'tokens/build/meridian.high-contrast.tokens.json',
  'tokens/build/meridian.dark.high-contrast.tokens.json',
];
const bundles = bundlePaths.map((path) => JSON.parse(readFileSync(join(root, path), 'utf8')));
const semanticMetadata = JSON.parse(readFileSync(join(root, 'design/semantic-tokens.json'), 'utf8'));
const css = readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8');
const docs = readFileSync(join(root, 'js/pages-tokens.js'), 'utf8');
const runtime = readFileSync(join(root, 'js/utils.js'), 'utf8');
const catalogSource = readFileSync(join(root, 'js/generated/token-catalog-meta.js'), 'utf8');
const catalog = vm.runInNewContext(`${catalogSource}\nTOKEN_CATALOG;`);

function findProperty(value, property, found = []) {
  if (!value || typeof value !== 'object') return found;
  if (Object.hasOwn(value, property)) found.push(value[property]);
  for (const child of Object.values(value)) findProperty(child, property, found);
  return found;
}

test('token sources avoid non-standard schema claims and use typed DTCG values', () => {
  for (const [name, source] of Object.entries(sources)) {
    assert.deepEqual(findProperty(source, '$schema'), [], `${name} must not publish an unsupported $schema`);
  }
  for (const mode of Object.values(sources.density)) {
    for (const token of Object.values(mode)) {
      if (token.$type === 'dimension' && typeof token.$value !== 'string') {
        assert.equal(typeof token.$value.value, 'number');
        assert.ok(['px', 'rem'].includes(token.$value.unit));
      }
      if (token.$type === 'number') assert.equal(typeof token.$value, 'number');
    }
  }
});

test('generated theme bundles conform to the local DTCG 2025.10 validator', async () => {
  const { countDtcgTokens, validateDtcgDocument } = await import(pathToFileURL(join(root, 'scripts/lib/dtcg.mjs')));
  const expectedTokenCount = 103 + semanticMetadata.length
    + Object.values(sources).reduce((total, source) => total + countDtcgTokens(source), 0);
  for (const [index, bundle] of bundles.entries()) {
    assert.deepEqual(validateDtcgDocument(bundle, { label: bundlePaths[index] }), []);
    assert.equal(countDtcgTokens(bundle), expectedTokenCount);
    assert.equal(bundle.$extensions['com.meridian'].specification, 'DTCG 2025.10');
  }
});

test('four context bundles expose the same paths, types, and resolvable aliases', async () => {
  const { collectDtcgTokens, resolveDtcgValue } = await import(pathToFileURL(join(root, 'scripts/lib/dtcg.mjs')));
  const expectedContexts = [
    { theme: 'light', contrast: 'standard' },
    { theme: 'dark', contrast: 'standard' },
    { theme: 'light', contrast: 'high' },
    { theme: 'dark', contrast: 'high' },
  ];
  const signatures = [];

  for (const [index, bundle] of bundles.entries()) {
    const metadata = bundle.$extensions['com.meridian'];
    assert.deepEqual(metadata.modifiers, expectedContexts[index]);
    assert.deepEqual(metadata.resolutionOrder, ['theme', 'contrast']);
    const entries = collectDtcgTokens(bundle);
    signatures.push(entries.map(({ path, type }) => `${path}:${type}`).sort());
    for (const { path, type } of entries) {
      assert.ok(type, `${bundlePaths[index]}:${path} must expose an effective type`);
      assert.doesNotThrow(() => resolveDtcgValue(bundle, path), `${bundlePaths[index]}:${path} must resolve`);
    }
  }

  for (const signature of signatures.slice(1)) assert.deepEqual(signature, signatures[0]);
});

test('DTCG validator derives alias types and rejects incompatible explicit types', async () => {
  const { validateDtcgDocument } = await import(pathToFileURL(join(root, 'scripts/lib/dtcg.mjs')));
  const color = {
    '$type': 'color',
    '$value': { colorSpace: 'srgb', components: [1, 1, 1] },
  };
  assert.deepEqual(validateDtcgDocument({ color, alias: { '$value': '{color}' } }), []);
  assert.match(
    validateDtcgDocument({ color, alias: { '$type': 'dimension', '$value': '{color}' } }).join('\n'),
    /dimension alias must not reference color token/,
  );
});

test('color bundles keep reference and semantic coverage stable across contexts', () => {
  const expectedSemantic = semanticMetadata.map((entry) => entry.token).sort();
  for (const bundle of bundles) {
    const referenceCount = Object.values(bundle.color.reference)
      .reduce((total, family) => total + Object.keys(family).filter((key) => !key.startsWith('$')).length, 0);
    const semanticNames = Object.keys(bundle.color.semantic).filter((key) => !key.startsWith('$')).sort();
    assert.equal(referenceCount, 103);
    assert.deepEqual(semanticNames, expectedSemantic);
  }
  assert.equal(catalog.defaultSeed, '#5B5BD6');
  assert.equal(catalog.families.find((family) => family.id === 'semantic-color').count, semanticMetadata.length);
});

test('CSS output contains every published context and component binding', () => {
  for (const [theme, contrastMode] of [['light', 'standard'], ['dark', 'standard'], ['light', 'high'], ['dark', 'high']]) {
    const selector = `html[data-theme="${theme}"][data-contrast="${contrastMode}"]`;
    assert.match(css, new RegExp(selector.replace(/[\[\]]/g, '\\$&')));
  }
  for (const mode of ['compact', 'default', 'comfortable']) assert.match(css, new RegExp(`data-density="${mode}"`));
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.equal(catalog.componentTokens.length, 12);
  for (const token of catalog.componentTokens) {
    assert.match(css, new RegExp(`${token.cssVariable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:`));
    assert.ok(token.trigger);
    assert.ok(token.reason);
  }
});

test('runtime and docs consume generated component and token metadata', () => {
  assert.match(runtime, /TOKEN_CATALOG\.componentTokens/);
  assert.match(docs, /TOKEN_CATALOG\.families/);
  assert.match(docs, /TOKEN_CATALOG\.componentTokens/);
  assert.match(docs, /現在npm packageは未公開/);
  assert.doesNotMatch(docs, /@import ["']@meridian\/tokens\/css/);
  assert.doesNotMatch(docs, /Figma Variables へそのままインポート/);
  assert.doesNotMatch(docs, /https:\/\/design-tokens\.org"/);
  assert.match(docs, /modifier context解決済み/);
  assert.match(docs, /bundle内aliasは保持/);
  assert.equal(catalog.jsonPreview.$extensions['com.meridian'].modifiers.theme, 'light');
  assert.equal(catalog.jsonPreview.$extensions['com.meridian'].modifiers.contrast, 'standard');
});
