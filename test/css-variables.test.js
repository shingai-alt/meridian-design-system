const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const css = read('tokens/build/tokens.css');
const catalogSource = read('js/generated/token-catalog-meta.js');
const catalog = vm.runInNewContext(`${catalogSource}\nTOKEN_CATALOG;`);

const cssNames = (content) => new Set(content.match(/--[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? []);
const declarations = (content) => new Set(
  Array.from(content.matchAll(/(--[a-z0-9]+(?:-[a-z0-9]+)*)\s*:/g), (match) => match[1]),
);
function usages(content) {
  const result = new Set();
  for (const match of content.matchAll(/var\(\s*(--[a-z0-9]+(?:-[a-z0-9]+)*)/g)) {
    const nextCharacter = content[match.index + match[0].length];
    if (nextCharacter !== '-' && nextCharacter !== '$') result.add(match[1]);
  }
  return result;
}
const declared = declarations(css);
const countDeclaration = (name) => (css.match(new RegExp(`${name.replaceAll('-', '\\-')}\\s*:`, 'g')) ?? []).length;

function assertNamesArePublished(names, source) {
  for (const name of names) {
    assert.ok(declared.has(name), `${source} references unpublished CSS variable ${name}`);
  }
}

test('generated CSS resolves every custom-property dependency', () => {
  assertNamesArePublished(usages(css), 'tokens/build/tokens.css');
});

test('theme, contrast, component, and density outputs are complete', () => {
  for (const token of catalog.semanticTokens) {
    assert.equal(countDeclaration(token.cssVariable), 4, `${token.cssVariable} needs all four theme/contrast contexts`);
  }
  for (const token of catalog.componentTokens) {
    assert.equal(countDeclaration(token.cssVariable), 4, `${token.cssVariable} needs all four theme/contrast contexts`);
  }

  const density = JSON.parse(read('tokens/src/density.json'));
  const modes = ['compact', 'default', 'comfortable'];
  const modeNames = modes.map((mode) => new Set(Object.keys(density[mode]).map((name) => `--${name}`)));
  assert.deepEqual([...modeNames[0]].sort(), [...modeNames[1]].sort());
  assert.deepEqual([...modeNames[1]].sort(), [...modeNames[2]].sort());
  for (const name of modeNames[0]) {
    assert.equal(countDeclaration(name), 3, `${name} needs all three density modes`);
  }
});

test('documentation app and standalone examples only consume available variables', () => {
  const appFiles = [
    'index.html',
    ...readdirSync(join(root, 'js'))
      .filter((name) => name.endsWith('.js'))
      .map((name) => `js/${name}`),
  ];
  const app = appFiles.map(read).join('\n');
  const appAvailable = new Set([...declared, ...declarations(app)]);
  for (const name of usages(app)) {
    assert.ok(appAvailable.has(name), `documentation app references undefined CSS variable ${name}`);
  }
  for (let index = 1; index <= 6; index += 1) {
    assert.ok(declared.has(`--chart-fg-${index}`), `dynamic chart label token --chart-fg-${index} must be published`);
  }

  const examples = readdirSync(join(root, 'examples')).filter((name) => name.endsWith('.html'));
  assert.equal(examples.length, 5);
  for (const name of examples) {
    const path = `examples/${name}`;
    const source = read(path);
    assert.match(source, /href="\.\.\/tokens\/build\/tokens\.css"/, `${path} must load the generated token CSS`);
    const available = new Set([...declared, ...declarations(source)]);
    for (const token of usages(source)) {
      assert.ok(available.has(token), `${path} references undefined CSS variable ${token}`);
    }
  }
});

test('machine-readable specs and component documentation use published names', () => {
  for (const name of readdirSync(join(root, 'examples/specs')).filter((entry) => entry.endsWith('.screen.json'))) {
    const path = `examples/specs/${name}`;
    const screen = JSON.parse(read(path));
    const names = new Set((screen.regions ?? []).flatMap((region) => region.meridianTokens ?? []));
    assertNamesArePublished(names, path);
  }

  for (const name of readdirSync(join(root, 'design/contracts/components')).filter((entry) => entry.endsWith('.contract.json'))) {
    const path = `design/contracts/components/${name}`;
    const contractNames = cssNames(read(path));
    assertNamesArePublished(contractNames, path);
  }

  for (const name of readdirSync(join(root, 'components')).filter((entry) => entry.endsWith('.md'))) {
    const path = `components/${name}`;
    const exactBacktickNames = new Set(
      Array.from(read(path).matchAll(/`(--[a-z0-9]+(?:-[a-z0-9]+)*)`/g), (match) => match[1]),
    );
    assertNamesArePublished(exactBacktickNames, path);
  }

  assertNamesArePublished(cssNames(read('js/components-registry.js')), 'js/components-registry.js');
});

test('resource guidance points at real distribution artifacts', () => {
  const resources = read('js/pages-resources.js');
  assert.doesNotMatch(resources, /@meridian\/tokens\/css/);
  assert.match(resources, /\.\.\/tokens\/build\/tokens\.css/);
  assert.match(resources, /npm package は未公開/);
  assert.match(resources, /4 context × Compact \/ Default \/ Comfortable の12通り/);
});
