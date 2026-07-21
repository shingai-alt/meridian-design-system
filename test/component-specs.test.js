const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const contractNames = readdirSync(join(root, 'design/contracts/components'))
  .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
  .sort();
const mdNames = readdirSync(join(root, 'components'))
  .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
  .sort();
const contracts = contractNames.map((name) => JSON.parse(read(`design/contracts/components/${name}`)));
const generatedMeta = read('js/generated/component-contract-meta.js');
const registrySource = read('js/components-registry.js');
const indexSource = read('index.html');
const components = vm.runInNewContext(`${generatedMeta}\n${registrySource}\nCOMPONENTS;`);
const renderSandbox = {
  esc: (value) => String(value ?? '').replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]),
  I: new Proxy({}, { get: () => '<svg aria-hidden="true"></svg>' }),
  codeBlock: (code) => `<pre><code>${code}</code></pre>`,
};
const renderedComponents = vm.runInNewContext(`${read('js/ui-builders.js')}\n${generatedMeta}\n${registrySource}\nCOMPONENTS;`, renderSandbox);
const componentItems = JSON.parse(read('design/system-registry.json'))
  .domains.find((domain) => domain.id === 'components').items;
const plain = (value) => JSON.parse(JSON.stringify(value));

function renderProps(component, overrides = {}) {
  const props = { state: 'default', ...overrides };
  if (component.variants) props.variant = component.variants[0];
  if (component.sizes) props.size = component.sizes.includes('md') ? 'md' : component.sizes[0];
  for (const [name, , defaultValue] of component.texts ?? []) props[name] = defaultValue;
  for (const [name] of component.flags ?? []) props[name] = false;
  return props;
}

function assertBalancedHtml(html, componentId) {
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const stack = [];
  for (const match of html.matchAll(/<\/?([a-z][a-z0-9-]*)(?:\s[^<>]*?)?\s*\/?>/gi)) {
    const tag = match[1].toLowerCase();
    if (voidElements.has(tag) || match[0].endsWith('/>')) continue;
    if (match[0].startsWith('</')) {
      assert.equal(stack.pop(), tag, `${componentId} has mismatched ${match[0]}`);
    } else stack.push(tag);
  }
  assert.deepEqual(stack, [], `${componentId} has unclosed tags: ${stack.join(', ')}`);
}

const requiredHeadings = [
  'Summary', 'Role', 'Principles', 'When To Use', 'When Not To Use', 'Visual Model',
  'Anatomy', 'Variants', 'Sizes / Density', 'Icon Rules', 'States', 'Behavior',
  'Layout / Placement Rules', 'Responsive / Viewport Behavior', 'Accessibility',
  'Content Guidelines', 'Tokens', "Do / Don't", 'Prohibited Patterns',
  'AI Selection Rules', 'Examples', 'Implementation Notes', 'Open Questions',
];

test('all 74 registered components have a human spec and machine contract', () => {
  assert.equal(components.length, 74);
  assert.equal(contracts.length, 74);
  assert.equal(mdNames.length, 74);
  assert.deepEqual(contracts.map((contract) => `${contract.id}.contract.json`).sort(), contractNames);
  assert.deepEqual(contracts.map((contract) => `${contract.id}.md`).sort(), mdNames);
  assert.deepEqual(plain(components.map((component) => component.id).sort()), contracts.map((contract) => contract.id).sort());
});

test('component registry records the complete specification and rendering evidence', () => {
  const expectedSharedSources = [
    'js/components-registry.js',
    'js/generated/component-contract-meta.js',
    'js/component-pages.js',
    'js/ui-builders.js',
    'index.html',
    'test/component-specs.test.js',
  ];

  for (const item of componentItems) {
    const componentId = item.id.replace(/^components\./, '');
    assert.deepEqual(item.sources, [
      `components/${componentId}.md`,
      `design/contracts/components/${componentId}.contract.json`,
      ...expectedSharedSources,
    ]);
  }
});

test('every human spec follows the complete component template', () => {
  for (const contract of contracts) {
    const path = `components/${contract.id}.md`;
    const docs = read(path);
    assert.match(docs, new RegExp(`^# ${contract.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'));
    const contractRef = `Machine-readable contract: \`design/contracts/components/${contract.id}.contract.json\``;
    assert.ok(docs.includes(contractRef), `${path} must link its machine-readable contract`);
    for (const heading of requiredHeadings) assert.ok(docs.includes(`## ${heading}`), `${path} is missing ${heading}`);
    for (const statement of [...contract.intent.whenToUse, ...contract.intent.whenNotToUse]) {
      assert.ok(docs.includes(statement), `${path} must include contract intent: ${statement}`);
    }
    assert.match(docs, /PC\s*用と\s*SP\s*用に分けません|PC用とSP用に別componentを作らず/);
    assert.match(docs, /24px minimum/);
    assert.match(docs, /44px\s*以上/);
    assert.doesNotMatch(docs, /(?:ヒット領域|hit area)[^\n]*40px/);
  }
});

test('contracts contain actionable intent, behavior, accessibility, and responsive rules', () => {
  for (const contract of contracts) {
    assert.ok(contract.intent.whenToUse.length, `${contract.id} needs whenToUse`);
    assert.ok(contract.intent.whenNotToUse.length, `${contract.id} needs whenNotToUse`);
    assert.ok(contract.anatomy.length, `${contract.id} needs anatomy`);
    assert.ok(contract.states.length, `${contract.id} needs states`);
    assert.ok(contract.props.length, `${contract.id} needs props`);
    assert.ok(contract.tokenBindings.bindings.length, `${contract.id} needs token bindings`);
    assert.ok(contract.usagePatterns.length, `${contract.id} needs usage patterns`);
    for (const mode of ['desktop', 'mobile', 'touch']) {
      assert.ok(contract.responsiveBehavior[mode].rules.length, `${contract.id} needs ${mode} rules`);
      assert.ok(contract.responsiveBehavior[mode].avoid.length, `${contract.id} needs ${mode} anti-patterns`);
    }
    if (contract.status === 'draft') {
      assert.equal(contract.tokenBindings.coverage, 'partial');
      assert.ok(contract.tokenBindings.unboundSlots.length);
      assert.ok(contract.openQuestions?.length);
    }
  }
});

test('HTML component registry consumes the generated contracts without semantic drift', () => {
  const byId = new Map(contracts.map((contract) => [contract.id, contract]));
  for (const component of components) {
    const contract = byId.get(component.id);
    assert.deepEqual(plain(component.when), contract.intent.whenToUse, `${component.id} whenToUse drift`);
    assert.deepEqual(plain(component.notWhen), contract.intent.whenNotToUse, `${component.id} whenNotToUse drift`);
    assert.deepEqual(plain(component.states), contract.states.map((state) => state.id), `${component.id} state drift`);
    assert.deepEqual(plain(component.props), contract.props, `${component.id} prop drift`);
    assert.deepEqual([...component.tokens].sort(), Object.values(contract.tokenRefs).flat().sort(), `${component.id} token drift`);
    assert.deepEqual(plain(component.keys), contract.keyboardInteractions.map(({ key, action }) => [key, action]), `${component.id} keyboard drift`);
    assert.equal(component.responsiveBehavior.length, 3, `${component.id} needs all responsive modes in HTML docs`);
  }
});

test('known interaction patterns keep their defining keyboard contract', () => {
  const byId = new Map(contracts.map((contract) => [contract.id, contract]));
  const expectedKeys = {
    button: ['Enter', 'Space', 'Tab'],
    combobox: ['Arrow Up / Down', 'Enter', 'Escape'],
    tabs: ['Arrow Left / Right', 'Home / End'],
    dialog: ['Tab / Shift+Tab', 'Escape'],
    slider: ['Arrow keys', 'Home / End'],
    'data-grid': ['Arrow keys', 'Home / End', 'Enter / F2'],
    'file-tree': ['Arrow Up / Down', 'Arrow Right / Left', 'Enter'],
  };
  for (const [id, keys] of Object.entries(expectedKeys)) {
    assert.deepEqual(byId.get(id).keyboardInteractions.map((item) => item.key), keys);
  }
  for (const id of ['text', 'divider', 'avatar', 'card', 'description-list']) {
    assert.deepEqual(byId.get(id).keyboardInteractions, [], `${id} must not add a generic tab stop`);
  }
});

test('static Card follows the established radius and elevation policy', () => {
  const card = contracts.find((contract) => contract.id === 'card');
  const tokens = Object.values(card.tokenRefs).flat();
  assert.ok(tokens.includes('--radius-md'));
  assert.ok(!tokens.includes('--radius-lg'));
  assert.ok(!tokens.some((token) => token.startsWith('--shadow-')));
});

test('Secondary Button uses interactive control roles instead of the Card surface', () => {
  const button = contracts.find((contract) => contract.id === 'button');
  assert.equal(button.variants.secondary.tokenRefs.background, '--control-bg');
  assert.equal(button.variants.secondary.tokenRefs.border, '--control-border');
  assert.equal(button.variants.secondary.states.hover.background, '--control-bg-hover');
  assert.equal(button.variants.secondary.states.active.background, '--control-bg-active');
  assert.match(indexSource, /\.btn\[data-variant="secondary"\]\{[^}]*background:var\(--control-bg\)/);
  assert.doesNotMatch(indexSource, /\.btn\[data-variant="secondary"\]\{[^}]*background:var\(--surface\)/);
});

test('all component showcases render every declared state and variant as valid tokenized HTML', () => {
  for (const component of renderedComponents) {
    const cases = [renderProps(component)];
    for (const state of component.states ?? []) cases.push(renderProps(component, { state }));
    for (const variant of component.variants ?? []) cases.push(renderProps(component, { variant }));

    for (const props of cases) {
      const html = component.render(props);
      assert.ok(html.trim(), `${component.id} rendered an empty showcase`);
      assert.doesNotMatch(html, /\b(?:undefined|NaN|\[object Object\])\b/, `${component.id} rendered an invalid value`);
      assert.doesNotMatch(html, /(?:color|background(?:-color)?|border(?:-color)?|fill|stroke)\s*:\s*#[0-9a-f]{3,8}\b/i, `${component.id} rendered a raw color`);
      assertBalancedHtml(html, component.id);
      for (const match of html.matchAll(/<button\b[^>]*\bdata-icononly\b[^>]*>/gi)) {
        assert.match(match[0], /\baria-label="[^"]+"/, `${component.id} has an unnamed icon-only button`);
      }
    }
  }
});

test('every showcase token dependency is declared in its component contract', () => {
  for (const component of renderedComponents) {
    const declared = new Set(component.tokens);
    const cases = [renderProps(component)];
    for (const state of component.states ?? []) cases.push(renderProps(component, { state }));
    for (const variant of component.variants ?? []) cases.push(renderProps(component, { variant }));
    const used = new Set(cases.flatMap((props) =>
      [...component.render(props).matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]),
    ));
    const missing = [...used].filter((token) => !declared.has(token));
    assert.deepEqual(missing, [], `${component.id} has undeclared showcase tokens`);
  }
});

test('showcases demonstrate the defining semantic relationships of complex patterns', () => {
  const byId = new Map(renderedComponents.map((component) => [component.id, component]));
  const render = (id, overrides = {}) => {
    const component = byId.get(id);
    return component.render(renderProps(component, overrides));
  };

  assert.match(render('text-field', { state: 'error' }), /<label\s+for="[^"]+"/);
  assert.match(render('text-field', { state: 'error' }), /aria-invalid="true"/);
  assert.match(render('tabs'), /role="tablist"/);
  assert.match(render('tabs'), /role="tabpanel"/);
  assert.match(render('tabs'), /aria-controls="[^"]+"/);
  assert.match(render('combobox', { state: 'open' }), /role="combobox"[^>]+aria-expanded="true"/);
  assert.match(render('combobox', { state: 'open' }), /role="listbox"/);
  assert.match(render('dialog'), /role="dialog"[^>]+aria-modal="true"[^>]+aria-labelledby=/);
  assert.match(render('file-tree'), /role="tree"/);
  assert.match(render('file-tree'), /role="treeitem"[^>]+aria-expanded=/);
  assert.match(render('table'), /<caption\s+class="sr-only">/);
  assert.match(render('tooltip'), /aria-describedby="[^"]+"/);
  assert.match(render('switch'), /role="switch"/);
  assert.match(render('toast'), /role="status"[^>]+aria-live="polite"/);
  assert.match(render('prompt-input'), /<textarea\s+aria-label=/);
  assert.match(render('navigation-item', { state: 'active' }), /<a\s+href="[^"]+"[^>]+aria-current="page"/);
  assert.match(render('task-board-card'), /aria-label="MRD-98を次の列へ移動"/);
  assert.match(render('analytics-chart-container'), /<figure\b/);
  assert.match(render('analytics-chart-container'), /class="sr-only"/);
});
