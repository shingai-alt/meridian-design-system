const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const source = JSON.parse(read('tokens/src/component.json'));
const policy = JSON.parse(read('design/token-policy.json'));
const buttonContract = JSON.parse(read('design/contracts/components/button.contract.json'));
const css = read('tokens/build/tokens.css');
const implementation = `${read('index.html')}\n${read('js/ui-builders.js')}`;
const catalogSource = read('js/generated/token-catalog-meta.js');
const catalog = vm.runInNewContext(`${catalogSource}\nTOKEN_CATALOG;`);

function collectTokens(node, path = [], result = []) {
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const nextPath = [...path, key];
    if (child && typeof child === 'object' && Object.hasOwn(child, '$value')) {
      result.push({ path: nextPath.join('.'), token: child });
    } else if (child && typeof child === 'object') {
      collectTokens(child, nextPath, result);
    }
  }
  return result;
}

const tokens = collectTokens(source);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('component token source satisfies the policy gate', () => {
  const allowedTriggers = new Set(policy.componentTokenDecision.requiredWhen.map((entry) => entry.id));
  const semanticNames = new Set(catalog.semanticTokens.map((entry) => entry.token));
  const componentLayer = policy.layers.find((layer) => layer.id === 'component');
  assert.ok(componentLayer.allowedReferences.includes('intrinsic-value-with-explicit-reason'));

  const cssNames = new Set();
  for (const { path, token } of tokens) {
    const extension = token.$extensions?.['com.meridian'];
    assert.ok(extension, `${path} must declare com.meridian metadata`);
    assert.match(extension.cssVariable, /^--[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!cssNames.has(extension.cssVariable), `${extension.cssVariable} must be unique`);
    cssNames.add(extension.cssVariable);
    assert.ok(allowedTriggers.has(extension.trigger), `${path} uses an unknown trigger`);
    assert.ok(extension.reason.length >= 20, `${path} needs a concrete reason`);

    const values = [token.$value, ...Object.values(extension.modes ?? {})];
    for (const value of values) {
      if (typeof value === 'string') {
        const alias = /^\{color\.semantic\.([^}]+)\}$/.exec(value);
        assert.ok(alias, `${path} must alias a Semantic color token`);
        assert.ok(semanticNames.has(alias[1]), `${path} aliases unknown Semantic token ${alias[1]}`);
      } else {
        assert.equal(extension.trigger, 'intrinsic-component-value', `${path} direct values need the intrinsic trigger`);
      }
    }
  }
});

test('all published component tokens are generated and consumed', () => {
  assert.equal(tokens.length, 12);
  assert.equal(catalog.componentTokens.length, tokens.length);
  const sourceNames = tokens.map(({ token }) => token.$extensions['com.meridian'].cssVariable).sort();
  assert.deepEqual(Array.from(catalog.componentTokens, (token) => token.cssVariable).sort(), sourceNames);

  for (const name of sourceNames) {
    assert.equal((css.match(new RegExp(`${escapeRegExp(name)}:`, 'g')) ?? []).length, 4, `${name} needs all four theme/contrast outputs`);
    assert.match(implementation, new RegExp(`var\\(${escapeRegExp(name)}(?:[,\\)])`), `${name} must have a real consumer`);
  }
});

test('Button contract uses source triggers and generated Semantic CSS aliases', () => {
  const semanticCss = new Map(catalog.semanticTokens.map((entry) => [entry.token, entry.cssVariable]));
  const bindings = new Map(buttonContract.tokenBindings.bindings
    .filter((binding) => binding.scope === 'component')
    .map((binding) => [binding.source, binding]));

  for (const { token } of tokens.filter(({ path }) => path.startsWith('button.'))) {
    const extension = token.$extensions['com.meridian'];
    const binding = bindings.get(extension.cssVariable);
    assert.ok(binding, `${extension.cssVariable} needs a Button contract binding`);
    assert.equal(binding.trigger, extension.trigger);
    const semanticName = /^\{color\.semantic\.([^}]+)\}$/.exec(token.$value)[1];
    assert.equal(binding.aliases, semanticCss.get(semanticName));
  }
});

test('AI and human docs use generated CSS names at the component boundary', () => {
  const docs = [
    read('DESIGN.md'),
    read('js/pages-foundations.js'),
    read('components/button.md'),
    read('js/components-registry.js'),
  ].join('\n');
  assert.doesNotMatch(docs, /--primary-foreground/);
  assert.match(docs, /--primary-fg/);
});
