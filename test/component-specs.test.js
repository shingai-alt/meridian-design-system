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
  I: new Proxy({}, { get: (_target, iconId) => `<svg data-icon="${String(iconId)}" aria-hidden="true"></svg>` }),
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
    if (contract.tokenBindings.coverage === 'partial') {
      assert.ok(contract.tokenBindings.unboundSlots.length, `${contract.id} partial binding coverage needs unbound slots`);
      assert.ok(contract.openQuestions?.length, `${contract.id} partial binding coverage needs open questions`);
    }
    if (contract.status === 'stable') {
      assert.equal(contract.tokenBindings.coverage, 'complete', `${contract.id} stable contract needs complete bindings`);
      assert.deepEqual(contract.tokenBindings.unboundSlots, [], `${contract.id} stable contract cannot have unbound slots`);
      assert.deepEqual(contract.openQuestions ?? [], [], `${contract.id} stable contract cannot have open questions`);
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

test('Button is implementation-ready without claiming production stability', () => {
  const button = contracts.find((contract) => contract.id === 'button');
  assert.equal(button.status, 'draft');
  assert.equal(button.contractVersion, '0.2.0');
  assert.deepEqual(Object.keys(button.variants), ['primary', 'secondary', 'tertiary', 'ghost', 'danger']);
  assert.equal(button.tokenBindings.coverage, 'complete');
  assert.deepEqual(button.tokenBindings.unboundSlots, []);
  assert.deepEqual(button.openQuestions, []);

  const props = Object.fromEntries(button.props.map((prop) => [prop.name, prop]));
  assert.deepEqual(Object.keys(props), [
    'children', 'variant', 'size', 'leadingIcon', 'trailingIcon', 'loading', 'disabled', 'fullWidth', 'type', 'ref',
  ]);
  assert.equal(props.children.required, true);
  assert.equal(props.type.default, 'button');
  assert.match(props.ref.type, /HTMLButtonElement/);
  assert.ok(button.runtime.attributes.includes('aria-*'));
  assert.ok(button.runtime.attributes.includes('data-*'));
  assert.ok(button.runtime.attributes.includes('form'));
  for (const attribute of ['formAction', 'formEncType', 'formMethod', 'formNoValidate', 'formTarget']) {
    assert.ok(button.runtime.attributes.includes(attribute));
  }
  assert.ok(button.runtime.relations.includes('native-button-props-passthrough'));
  assert.ok(!button.runtime.attributes.includes('aria-pressed'));

  assert.equal(button.variants.primary.tokenRefs.background, '--button-primary-bg');
  assert.equal(button.variants.primary.tokenRefs.foreground, '--button-primary-fg');

  const bindingSlots = new Set(button.tokenBindings.bindings.map((binding) => binding.slot));
  for (const slot of [
    'variant.tertiary.container.background.hover-active',
    'variant.tertiary.container.background.disabled',
    'variant.ghost.container.background.active',
    'variant.danger.container.background.disabled',
  ]) assert.ok(bindingSlots.has(slot), `${slot} must be bound`);
});

test('Button showcase preserves native semantics and async state', () => {
  const button = renderedComponents.find((component) => component.id === 'button');
  const normal = button.render({ ...renderProps(button), label: '変更を保存' });
  const disabled = button.render({ ...renderProps(button), label: '変更を保存', state: 'disabled' });
  const loading = button.render({ ...renderProps(button), label: '変更を保存', state: 'loading' });
  const withIcons = button.render({ ...renderProps(button), label: 'プロジェクトを作成', leadingIcon: true, trailingIcon: true });

  assert.match(normal, /^<button type="button"/);
  assert.match(normal, />\s*<span[^>]*>変更を保存<\/span>/);
  assert.doesNotMatch(normal, /data-icononly/);
  assert.match(disabled, /\sdisabled(?:\s|>)/);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /aria-disabled="true"/);
  assert.match(loading, />\s*<span[^>]*>変更を保存<\/span>/);
  assert.equal((withIcons.match(/aria-hidden="true"/g) ?? []).length, 2);

  assert.doesNotMatch(indexSource, /\.btn\[data-variant="(?:outline|success|link)"\]/);
  assert.match(indexSource, /\.btn\[data-variant="danger"\]:hover\{background:var\(--danger-hover\)\}/);
  assert.match(indexSource, /\.btn\[data-variant="danger"\]:active\{background:var\(--danger-active\)\}/);
  assert.doesNotMatch(indexSource, /\.btn\{[^}]*filter:/);
  assert.doesNotMatch(indexSource, /\.btn\{[^}]*rgba\(/);
  const gaps = { xs: '--sp-1', sm: '--sp-15', md: '--sp-2', lg: '--sp-2', xl: '--sp-25' };
  for (const [size, token] of Object.entries(gaps)) {
    assert.match(indexSource, new RegExp(`\\.btn\\[data-size="${size}"\\]\\{[^}]*gap:var\\(${token}\\)`));
  }
  assert.match(indexSource, /\.btn\[data-loading\]\{[^}]*color:transparent!important/);
});

test('Icon Button is implementation-ready with one label source and no primary variant', () => {
  const iconButton = contracts.find((contract) => contract.id === 'icon-button');
  assert.equal(iconButton.status, 'draft');
  assert.equal(iconButton.contractVersion, '0.2.0');
  assert.equal(iconButton.implementationReadiness.status, 'ready');
  assert.deepEqual(Object.keys(iconButton.variants), ['ghost', 'secondary', 'danger']);
  assert.deepEqual(Object.keys(iconButton.sizes), ['xs', 'sm', 'md', 'lg', 'xl']);
  assert.equal(iconButton.tokenBindings.coverage, 'complete');
  assert.deepEqual(iconButton.tokenBindings.unboundSlots, []);
  assert.deepEqual(iconButton.openQuestions, []);
  assert.deepEqual(iconButton.props.map(({ name }) => name), [
    'label', 'icon', 'variant', 'size', 'loading', 'disabled', 'tooltipPlacement', 'type', 'ref',
  ]);
  assert.equal(iconButton.props.find(({ name }) => name === 'label').required, true);
  assert.equal(iconButton.props.find(({ name }) => name === 'type').default, 'button');
  assert.match(iconButton.props.find(({ name }) => name === 'ref').type, /HTMLButtonElement/);
  assert.deepEqual(iconButton.runtime.rootElements, ['button']);
  assert.ok(iconButton.runtime.relations.includes('tooltip-description'));
  assert.ok(!iconButton.runtime.attributes.includes('aria-pressed'));
});

test('Icon Button showcase preserves native semantics, target geometry, and Tooltip naming', () => {
  const component = renderedComponents.find(({ id }) => id === 'icon-button');
  const normal = component.render({ ...renderProps(component), label: 'フィルターを開く' });
  const loading = component.render({ ...renderProps(component), label: '再読み込み', state: 'loading' });
  const disabled = component.render({ ...renderProps(component), label: '削除', state: 'disabled', variant: 'danger' });

  assert.match(normal, /<button type="button"[^>]+data-component="icon-button"/);
  assert.match(normal, /aria-label="フィルターを開く"/);
  assert.match(normal, /data-icon="filter"/);
  assert.match(normal, /aria-describedby="([^"]+)"/);
  assert.match(normal, /role="tooltip"[^>]*>フィルターを開く<\/span>/);
  assert.equal((normal.match(/フィルターを開く/g) ?? []).length, 2);
  assert.match(loading, /aria-busy="true"/);
  assert.match(loading, /aria-disabled="true"/);
  assert.match(loading, /aria-label="再読み込み"/);
  assert.match(loading, /class="spinner" aria-hidden="true"/);
  assert.match(disabled, /\sdisabled(?:\s|>)/);

  for (const size of ['xs', 'sm', 'md', 'lg', 'xl']) {
    assert.match(indexSource, new RegExp(`\\.btn\\[data-component="icon-button"\\]\\[data-size="${size}"\\]\\{width:var\\(--ctl-${size}\\)\\}`));
    assert.match(indexSource, new RegExp(`--icon-button-icon-size-${size}`));
  }
  assert.match(indexSource, /\.icon-btn:focus-visible\+\.icon-button-tooltip/);
  assert.match(indexSource, /\.btn\[data-component="icon-button"\] \.spinner\{border-width:var\(--icon-button-spinner-stroke\)\}/);
});

test('Link is implementation-ready as a native anchor without a disabled API', () => {
  const link = contracts.find((contract) => contract.id === 'link');
  assert.equal(link.status, 'draft');
  assert.equal(link.contractVersion, '0.2.0');
  assert.equal(link.implementationReadiness.status, 'ready');
  assert.deepEqual(Object.keys(link.variants), ['inline', 'standalone']);
  assert.deepEqual(link.props.map(({ name }) => name), [
    'children', 'href', 'variant', 'external', 'download', 'target', 'rel', 'leadingIcon', 'trailingIcon', 'ref',
  ]);
  assert.equal(link.props.find(({ name }) => name === 'href').required, true);
  assert.equal(link.props.some(({ name }) => name === 'disabled'), false);
  assert.match(link.props.find(({ name }) => name === 'ref').type, /HTMLAnchorElement/);
  assert.deepEqual(link.runtime.rootElements, ['a']);
  assert.ok(link.runtime.relations.includes('native-anchor-props-passthrough'));
  assert.equal(link.tokenBindings.coverage, 'complete');
  assert.deepEqual(link.tokenBindings.unboundSlots, []);
  assert.deepEqual(link.openQuestions, []);
});

test('Link showcase keeps destination semantics and communicates non-default outcomes', () => {
  const component = renderedComponents.find(({ id }) => id === 'link');
  const inline = component.render({ ...renderProps(component), variant: 'inline' });
  const external = component.render({ ...renderProps(component), variant: 'standalone', external: true });
  const newTab = component.render({ ...renderProps(component), variant: 'standalone', external: true, newTab: true });
  const download = component.render({ ...renderProps(component), download: true });

  assert.match(inline, /<a href="\/docs\/accessibility" class="linkc/);
  assert.doesNotMatch(inline, /role="link"/);
  assert.match(inline, /data-variant="inline"/);
  assert.match(external, /href="https:\/\/www\.w3\.org\/WAI\/"/);
  assert.match(external, /（外部サイト）/);
  assert.match(newTab, /target="_blank" rel="noopener"/);
  assert.match(newTab, /（新しいタブで開く）/);
  assert.match(download, /\sdownload(?:\s|>)/);
  assert.match(download, /（ダウンロード）/);
  assert.match(indexSource, /\.linkc\[data-variant="inline"\]\{text-decoration-line:underline/);
  assert.match(indexSource, /\.linkc:focus-visible,\.linkc\.sim-focus\{text-decoration-line:underline/);
});

test('Tooltip is implementation-ready as a non-interactive description popup', () => {
  const tooltip = contracts.find((contract) => contract.id === 'tooltip');
  assert.equal(tooltip.contractVersion, '0.2.0');
  assert.equal(tooltip.implementationReadiness.status, 'ready');
  assert.deepEqual(tooltip.props.map(({ name }) => name), [
    'children', 'content', 'placement', 'delayDuration', 'open', 'defaultOpen', 'onOpenChange',
  ]);
  assert.deepEqual(tooltip.states.map(({ id }) => id), ['default', 'hover', 'focus']);
  assert.ok(tooltip.runtime.relations.includes('trigger-description'));
  assert.ok(tooltip.runtime.relations.includes('non-interactive-surface'));
  assert.equal(tooltip.tokenBindings.coverage, 'complete');
  assert.deepEqual(tooltip.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'tooltip');
  const focused = component.render({ ...renderProps(component), state: 'focus', content: '変更を保存 ⌘S' });
  assert.match(focused, /data-component="tooltip"[^>]+data-meridian-state="focus"/);
  assert.match(focused, /aria-describedby="([^\"]+)"/);
  assert.match(focused, /role="tooltip" class="tooltipc-surface"/);
  assert.doesNotMatch(focused, /role="tooltip"[^>]*tabindex=/);
});

test('Navigation Item is implementation-ready as a native destination link', () => {
  const navigationItem = contracts.find((contract) => contract.id === 'navigation-item');
  assert.equal(navigationItem.contractVersion, '0.2.0');
  assert.equal(navigationItem.implementationReadiness.status, 'ready');
  assert.deepEqual(navigationItem.props.map(({ name }) => name), ['children', 'href', 'icon', 'badge', 'current', 'ref']);
  assert.deepEqual(navigationItem.states.map(({ id }) => id), ['default', 'hover', 'focus', 'current']);
  assert.deepEqual(navigationItem.runtime.rootElements, ['a']);
  assert.ok(navigationItem.runtime.relations.includes('native-anchor-props-passthrough'));
  assert.equal(navigationItem.tokenBindings.coverage, 'complete');

  const component = renderedComponents.find(({ id }) => id === 'navigation-item');
  const current = component.render({ ...renderProps(component), state: 'current', showBadge: true });
  assert.match(current, /<nav[^>]+aria-label="セクション"><ul><li><a href="#[^"]+"/);
  assert.match(current, /aria-current="page"/);
  assert.match(current, /class="navitem-badge">12/);
  assert.doesNotMatch(current, /role="menuitem"/);
});

test('Breadcrumb is implementation-ready with landmark, list, and non-link current item', () => {
  const breadcrumb = contracts.find((contract) => contract.id === 'breadcrumb');
  assert.equal(breadcrumb.contractVersion, '0.2.0');
  assert.equal(breadcrumb.implementationReadiness.status, 'ready');
  assert.deepEqual(breadcrumb.props.map(({ name }) => name), ['items', 'ariaLabel', 'ref']);
  assert.deepEqual(breadcrumb.runtime.rootElements, ['nav']);
  assert.ok(breadcrumb.runtime.relations.includes('ordered-hierarchy'));
  assert.equal(breadcrumb.tokenBindings.coverage, 'complete');

  const component = renderedComponents.find(({ id }) => id === 'breadcrumb');
  const html = component.render({ ...renderProps(component), state: 'focus' });
  assert.match(html, /<nav[^>]+aria-label="Breadcrumb"><ol>/);
  assert.equal((html.match(/<li/g) ?? []).length, 3);
  assert.equal((html.match(/<a href=/g) ?? []).length, 2);
  assert.match(html, /<li aria-current="page"><span class="cur">Meridian<\/span><\/li>/);
  assert.match(html, /class="crumb-separator" aria-hidden="true"/);
});

test('Sidebar is implementation-ready as a named native navigation landmark', () => {
  const sidebar = contracts.find((contract) => contract.id === 'sidebar');
  assert.equal(sidebar.contractVersion, '0.2.0');
  assert.equal(sidebar.implementationReadiness.status, 'ready');
  assert.deepEqual(sidebar.props.map(({ name }) => name), ['children', 'ariaLabel', 'ref']);
  assert.deepEqual(sidebar.runtime.rootElements, ['nav']);
  assert.ok(sidebar.runtime.relations.includes('named-navigation-landmark'));
  assert.ok(sidebar.runtime.relations.includes('shell-owned-placement'));
  assert.equal(sidebar.tokenBindings.coverage, 'complete');
  assert.deepEqual(sidebar.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'sidebar');
  const html = component.render(renderProps(component));
  assert.match(html, /<nav[^>]+data-component="sidebar"[^>]+aria-label="Primary"/);
  assert.equal((html.match(/<ul\b/g) ?? []).length, 2);
  assert.equal((html.match(/<li\b/g) ?? []).length, 4);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
  assert.doesNotMatch(html, /role="(?:menu|menuitem)"/);
  assert.doesNotMatch(html, /tabindex=/);
});

test('Top Bar is implementation-ready as a header with child-owned semantics', () => {
  const topBar = contracts.find((contract) => contract.id === 'top-bar');
  assert.equal(topBar.contractVersion, '0.2.0');
  assert.equal(topBar.implementationReadiness.status, 'ready');
  assert.deepEqual(topBar.props.map(({ name }) => name), ['location', 'leading', 'actions', 'sticky', 'ref']);
  assert.deepEqual(topBar.runtime.rootElements, ['header']);
  assert.ok(topBar.runtime.relations.includes('composes-breadcrumb'));
  assert.ok(topBar.runtime.relations.includes('child-owned-semantics'));
  assert.equal(topBar.tokenBindings.coverage, 'complete');
  assert.deepEqual(topBar.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'top-bar');
  const normal = component.render({ ...renderProps(component), state: 'default', sticky: false });
  const sticky = component.render({ ...renderProps(component), state: 'sticky' });
  assert.match(normal, /<header[^>]+data-component="top-bar"[^>]+data-sticky="false"/);
  assert.match(sticky, /<header[^>]+data-meridian-state="sticky"[^>]+data-sticky="true"/);
  assert.match(sticky, /<nav[^>]+data-component="breadcrumb"[^>]+aria-label="Breadcrumb"/);
  assert.match(sticky, /aria-label="通知を開く"/);
  assert.doesNotMatch(sticky, /role="(?:navigation|toolbar|banner)"/);
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
