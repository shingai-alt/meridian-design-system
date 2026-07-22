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

test('Dialog is implementation-ready as a native modal with safe confirmation focus policy', () => {
  const dialog = contracts.find((contract) => contract.id === 'dialog');
  assert.equal(dialog.status, 'draft');
  assert.equal(dialog.contractVersion, '0.2.0');
  assert.equal(dialog.implementationReadiness.status, 'ready');
  assert.deepEqual(Object.keys(dialog.variants), ['default', 'danger']);
  assert.deepEqual(dialog.states.map(({ id }) => id), ['open', 'closed', 'submitting', 'error']);
  assert.deepEqual(dialog.props.map(({ name }) => name), [
    'trigger', 'title', 'description', 'children', 'footer', 'variant', 'role', 'open',
    'defaultOpen', 'onOpenChange', 'initialFocusRef', 'closeLabel', 'ref',
  ]);
  assert.deepEqual(dialog.runtime.rootElements, ['dialog']);
  assert.ok(dialog.runtime.relations.includes('modal-inert-background'));
  assert.ok(dialog.runtime.relations.includes('safe-initial-focus'));
  assert.ok(dialog.runtime.relations.includes('contained-tab-sequence'));
  assert.ok(dialog.runtime.relations.includes('focus-return'));
  assert.equal(dialog.tokenBindings.coverage, 'complete');
  assert.deepEqual(dialog.tokenBindings.unboundSlots, []);
  assert.deepEqual(dialog.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'dialog');
  const opened = component.render({ ...renderProps(component), state: 'open', variant: 'default' });
  const closed = component.render({ ...renderProps(component), state: 'closed', variant: 'default' });
  const danger = component.render({ ...renderProps(component), state: 'open', variant: 'danger', scenario: 'danger-confirmation' });
  const submitting = component.render({ ...renderProps(component), state: 'submitting', variant: 'default' });
  const error = component.render({ ...renderProps(component), state: 'error', variant: 'default' });
  const simple = component.render({ ...renderProps(component), state: 'open', scenario: 'simple-message' });
  assert.match(opened, /<button[^>]+aria-haspopup="dialog"[^>]+aria-controls="dialog-\d+"[^>]+aria-expanded="true"/);
  assert.match(opened, /<dialog[^>]+data-component="dialog"[^>]+aria-labelledby="dialog-\d+-title"[^>]+aria-describedby="dialog-\d+-description"[^>]+open/);
  assert.match(opened, /<h3[^>]+id="dialog-\d+-title"[^>]+tabindex="-1"/);
  assert.match(opened, /<button[^>]+data-icononly[^>]+aria-label="閉じる"/);
  assert.doesNotMatch(opened, /aria-modal=/);
  assert.doesNotMatch(opened, /\srole="dialog"/);
  assert.doesNotMatch(opened, /tabindex="[1-9]/);
  assert.match(closed, /aria-expanded="false"/);
  assert.doesNotMatch(closed, /<dialog[^>]+\sopen(?:\s|>)/);
  assert.match(danger, /data-runtime-role="alertdialog"/);
  assert.match(danger, /data-variant="danger"/);
  assert.match(danger, />キャンセル<\/span>/);
  assert.match(danger, />完全に削除<\/span>/);
  assert.match(danger, /class="dft"[^]*>キャンセル<\/span>[^]*>完全に削除<\/span>/);
  assert.match(submitting, /data-state="submitting"/);
  assert.match(submitting, /aria-busy="true" aria-disabled="true"/);
  assert.match(error, /data-state="error"/);
  assert.match(error, /aria-invalid="true"/);
  assert.match(error, /プロジェクト名を入力してください。/);
  assert.match(simple, /data-dialog-scenario="simple-message"/);
  assert.match(indexSource, /\.dialogc::backdrop\{background:var\(--overlay\)\}/);
  assert.match(indexSource, /\.dialogc\{[^}]*inline-size:min\(var\(--dialog-w-md\),calc\(100vi - var\(--sp-8\)\)\)/);
  assert.doesNotMatch(indexSource, /\.dialogc\{[^}]*display:none/);
});

test('Invite Member Dialog is implementation-ready as a single-invite Dialog composition', () => {
  const contract = contracts.find(({ id }) => id === 'invite-member-dialog');
  assert.equal(contract.contractVersion, '0.2.0');
  assert.equal(contract.implementationReadiness.status, 'ready');
  assert.deepEqual(contract.variants && Object.keys(contract.variants), ['default']);
  assert.deepEqual(contract.states.map(({ id }) => id), ['open', 'closed', 'invalid', 'submitting', 'error']);
  assert.deepEqual(contract.props.map(({ name }) => name), [
    'trigger', 'workspaceName', 'roles', 'defaultRoleId', 'onInvite', 'open', 'defaultOpen', 'onOpenChange', 'ref',
  ]);
  assert.deepEqual(contract.runtime.rootElements, ['dialog']);
  assert.ok(contract.runtime.relations.includes('composes-dialog'));
  assert.ok(contract.runtime.relations.includes('label-email'));
  assert.ok(contract.runtime.relations.includes('first-invalid-focus'));
  assert.equal(contract.tokenBindings.coverage, 'complete');
  assert.deepEqual(contract.tokenBindings.unboundSlots, []);
  assert.deepEqual(contract.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'invite-member-dialog');
  const opened = component.render({ ...renderProps(component), state: 'open', scenario: 'single-invite' });
  const closed = component.render({ ...renderProps(component), state: 'closed' });
  const invalid = component.render({ ...renderProps(component), state: 'invalid', scenario: 'invalid-email' });
  const submitting = component.render({ ...renderProps(component), state: 'submitting' });
  const pending = component.render({ ...renderProps(component), state: 'error', scenario: 'existing-pending' });
  const seat = component.render({ ...renderProps(component), state: 'error', scenario: 'seat-limit' });
  const network = component.render({ ...renderProps(component), state: 'error', scenario: 'network-error' });
  assert.match(opened, /<button[^>]+aria-haspopup="dialog"[^>]+aria-controls="invite-dialog-\d+"[^>]+aria-expanded="true"/);
  assert.match(opened, /<dialog[^>]+data-component="invite-member-dialog"[^>]+aria-labelledby="invite-dialog-\d+-title"[^>]+aria-describedby="invite-dialog-\d+-description"[^>]+open/);
  assert.match(opened, /<button[^>]+data-icononly[^>]+aria-label="閉じる"/);
  assert.match(opened, /<input[^>]+type="email"[^>]+name="email"[^>]+required/);
  assert.doesNotMatch(opened, /\bmultiple\b|カンマ区切り/);
  assert.match(opened, /<label for="invite-dialog-\d+-email">メールアドレス（必須）/);
  assert.match(opened, /<label for="invite-dialog-\d+-role">ロール（必須）/);
  assert.match(opened, /Member — 通常の作業と共同編集ができます。/);
  assert.doesNotMatch(opened, /aria-modal=|\srole="dialog"/);
  assert.match(closed, /aria-expanded="false"/);
  assert.doesNotMatch(closed, /<dialog[^>]+\sopen(?:\s|>)/);
  assert.match(invalid, /data-state="invalid"/);
  assert.match(invalid, /aria-invalid="true"/);
  assert.match(invalid, /name@company\.com の形式で1件入力してください。/);
  assert.match(submitting, /data-state="submitting"/);
  assert.match(submitting, /aria-busy="true" aria-disabled="true"/);
  assert.match(submitting, /送信中/);
  assert.match(pending, /role="alert" tabindex="-1"/);
  assert.match(pending, /招待を送信済みです。/);
  assert.match(pending, /Pending Invitationsを確認/);
  assert.match(seat, /利用可能なシートがありません。/);
  assert.match(network, /入力は保持されています。/);
  assert.match(indexSource, /\.invitec-fields\{display:grid;gap:var\(--sp-4\)\}/);
  assert.match(indexSource, /\.invitec-demo \.dialogc-stage\{block-size:520px\}/);
  assert.match(indexSource, /\.invitec-error\{[^}]*background:var\(--danger-subtle\)/);
});

test('Project Card is implementation-ready with a native heading link and independent actions', () => {
  const contract = contracts.find(({ id }) => id === 'project-card');
  assert.equal(contract.contractVersion, '0.2.0');
  assert.equal(contract.implementationReadiness.status, 'ready');
  assert.deepEqual(Object.keys(contract.variants), ['default']);
  assert.deepEqual(contract.states.map(({ id }) => id), ['default', 'hover', 'focus-visible']);
  assert.deepEqual(contract.props.map(({ name }) => name), ['project', 'href', 'actions', 'ref']);
  assert.deepEqual(contract.runtime.rootElements, ['article']);
  assert.ok(contract.runtime.relations.includes('article-heading'));
  assert.ok(contract.runtime.relations.includes('independent-sibling-actions'));
  assert.ok(contract.runtime.relations.includes('named-progress-value'));
  assert.ok(contract.runtime.relations.includes('machine-readable-time'));
  assert.equal(contract.tokenBindings.coverage, 'complete');
  assert.deepEqual(contract.tokenBindings.unboundSlots, []);
  assert.deepEqual(contract.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'project-card');
  const standard = component.render({ ...renderProps(component), state: 'default', scenario: 'with-actions' });
  const hovered = component.render({ ...renderProps(component), state: 'hover' });
  const focused = component.render({ ...renderProps(component), state: 'focus-visible' });
  const noActions = component.render({ ...renderProps(component), scenario: 'no-actions' });
  const zero = component.render({ ...renderProps(component), scenario: 'zero-progress' });
  const complete = component.render({ ...renderProps(component), scenario: 'complete' });
  const manyMembers = component.render({ ...renderProps(component), scenario: 'many-members' });
  const longContent = component.render({ ...renderProps(component), scenario: 'long-content' });
  assert.match(standard, /<article[^>]+data-component="project-card"[^>]+aria-labelledby="project-card-\d+-title"/);
  assert.match(standard, /<h3[^>]+id="project-card-\d+-title"[^>]*><a class="projectc-link" href="#\/projects\/meridian-docs">Meridian Docs<\/a><\/h3>/);
  assert.match(standard, /<button[^>]+data-icononly[^>]+aria-label="Meridian Docsのアクションを開く"[^>]+aria-haspopup="menu"[^>]+aria-expanded="false"/);
  assert.doesNotMatch(standard, /<a\b[^>]*>(?:(?!<\/a>).)*<button/s);
  assert.doesNotMatch(standard, /<article[^>]+(?:onclick|role="link"|tabindex)/i);
  assert.match(standard, /role="progressbar"[^>]+aria-labelledby="project-card-\d+-progress-label"[^>]+aria-valuemin="0"[^>]+aria-valuemax="100"[^>]+aria-valuenow="72"/);
  assert.match(standard, />完了率<\/span><b>72%<\/b>/);
  assert.match(standard, /role="group" aria-label="メンバー: 新谷 尚史、加藤 由紀、ほか3人"/);
  assert.match(standard, /<time datetime="2026-07-22T09:00:00\+09:00">更新 2時間前<\/time>/);
  assert.match(hovered, /data-state="hover"/);
  assert.match(focused, /data-state="focus-visible"/);
  assert.doesNotMatch(noActions, /aria-haspopup="menu"/);
  assert.match(zero, /aria-valuenow="0"/);
  assert.match(zero, />未着手<\/span>/);
  assert.match(complete, /aria-valuenow="100"/);
  assert.match(complete, />完了<\/span>/);
  assert.match(manyMembers, /ほか6人/);
  assert.match(longContent, /Meridian Enterprise Design System Documentation/);
  assert.match(indexSource, /\.projectc-link::after\{content:"";position:absolute;inset:0;border-radius:var\(--radius-md\)\}/);
  assert.match(indexSource, /\.projectc-actions\{position:relative;z-index:1\}/);
  assert.doesNotMatch(indexSource, /\.projectc-members\{[^}]*z-index/);
  assert.match(indexSource, /\.projectc:has\(\.projectc-link:focus-visible\)[^}]*var\(--focus-ring\)/);
});

test('Issue Row is implementation-ready as a native list item with independent link, selection, and actions', () => {
  const contract = contracts.find(({ id }) => id === 'issue-row');
  assert.equal(contract.contractVersion, '0.2.0');
  assert.equal(contract.implementationReadiness.status, 'ready');
  assert.deepEqual(Object.keys(contract.variants), ['default']);
  assert.deepEqual(contract.states.map(({ id }) => id), ['default', 'hover', 'focus-visible', 'selected']);
  assert.deepEqual(contract.props.map(({ name }) => name), ['issue', 'href', 'selection', 'actions', 'ref']);
  assert.deepEqual(contract.runtime.rootElements, ['li']);
  assert.ok(contract.runtime.relations.includes('ul-direct-li'));
  assert.ok(contract.runtime.relations.includes('issue-key-title-link-name'));
  assert.ok(contract.runtime.relations.includes('controlled-checkbox-selection'));
  assert.ok(contract.runtime.relations.includes('independent-sibling-actions'));
  assert.equal(contract.tokenBindings.coverage, 'complete');
  assert.deepEqual(contract.tokenBindings.unboundSlots, []);
  assert.deepEqual(contract.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'issue-row');
  const standard = component.render({ ...renderProps(component), state: 'default', scenario: 'with-selection' });
  const hovered = component.render({ ...renderProps(component), state: 'hover' });
  const focused = component.render({ ...renderProps(component), state: 'focus-visible' });
  const selected = component.render({ ...renderProps(component), state: 'selected' });
  const withoutSelection = component.render({ ...renderProps(component), scenario: 'without-selection' });
  const disabledSelection = component.render({ ...renderProps(component), scenario: 'disabled-selection' });
  const withoutActions = component.render({ ...renderProps(component), scenario: 'without-actions' });
  const noAssignee = component.render({ ...renderProps(component), scenario: 'no-assignee' });
  const noLabels = component.render({ ...renderProps(component), scenario: 'no-labels' });
  const manyLabels = component.render({ ...renderProps(component), scenario: 'many-labels' });
  const longTitle = component.render({ ...renderProps(component), scenario: 'long-title' });
  assert.match(standard, /^<div class="issuerow-demo"><ul class="issuerow-list" aria-label="Issues"><li class="panel issuerow"[^>]+data-component="issue-row"/);
  assert.match(standard, /<label class="checkbox issuerow-select"><input type="checkbox" aria-label="MRD-142を選択"><\/label>/);
  assert.match(standard, /<span id="issue-row-\d+-key" class="issuerow-key">MRD-142<\/span><a id="issue-row-\d+-title" class="issuerow-link" href="#\/issues\/mrd-142" aria-labelledby="issue-row-\d+-key issue-row-\d+-title">/);
  assert.match(standard, /aria-label="ラベル: bug、table"/);
  assert.match(standard, /aria-label="担当: 新谷 尚史"/);
  assert.match(standard, /aria-label="MRD-142のアクションを開く"[^>]+aria-haspopup="menu"[^>]+aria-expanded="false"/);
  assert.doesNotMatch(standard, /<a\b[^>]*>(?:(?!<\/a>).)*(?:<input|<button)/s);
  assert.doesNotMatch(standard, /<li[^>]+(?:onclick|role="(?:link|row)"|tabindex)/i);
  assert.match(hovered, /data-state="hover"/);
  assert.match(focused, /data-state="focus-visible"/);
  assert.match(selected, /data-state="selected"[^>]+data-selected="true"/);
  assert.match(selected, /<input type="checkbox" aria-label="MRD-142を選択" checked>/);
  assert.doesNotMatch(withoutSelection, /issuerow-select/);
  assert.match(disabledSelection, /aria-label="MRD-142を選択" disabled/);
  assert.doesNotMatch(withoutActions, /aria-haspopup="menu"/);
  assert.doesNotMatch(noAssignee, /issuerow-assignee/);
  assert.doesNotMatch(noLabels, /issuerow-labels/);
  assert.match(manyLabels, /aria-label="ラベル: bug、table、routing、accessibility、regression"/);
  assert.match(manyLabels, /<span class="tagc">\+3<\/span>/);
  assert.match(longTitle, /server-side sortingとURL state synchronization/);
  assert.match(indexSource, /\.issuerow-link::after\{content:"";position:absolute;inset:0;border-radius:var\(--radius-md\)\}/);
  assert.match(indexSource, /\.issuerow-select,\.issuerow-actions\{position:relative;z-index:1;min-inline-size:var\(--ctl-sm\)/);
  assert.match(indexSource, /\.issuerow:has\(\.issuerow-link:focus-visible\)[^}]*var\(--focus-ring\)/);
  assert.match(indexSource, /\.issuerow-list\{[^}]*container-type:inline-size/);
  assert.match(indexSource, /@container\(max-width:520px\)\{\.issuerow\{grid-template-columns:auto minmax\(0,1fr\) auto/);
});

test('Task Board Card is implementation-ready with a native task link and paired reordering alternatives', () => {
  const contract = contracts.find(({ id }) => id === 'task-board-card');
  assert.equal(contract.contractVersion, '0.2.0');
  assert.equal(contract.implementationReadiness.status, 'ready');
  assert.deepEqual(Object.keys(contract.variants), ['default']);
  assert.deepEqual(contract.states.map(({ id }) => id), ['default', 'hover', 'focus-visible', 'dragging']);
  assert.deepEqual(contract.props.map(({ name }) => name), ['task', 'href', 'reordering', 'actions', 'ref']);
  assert.deepEqual(contract.runtime.rootElements, ['li']);
  assert.ok(contract.runtime.relations.includes('ul-direct-li'));
  assert.ok(contract.runtime.relations.includes('task-title-link-name'));
  assert.ok(contract.runtime.relations.includes('paired-drag-and-single-pointer-controls'));
  assert.ok(contract.runtime.relations.includes('board-owned-status-and-drop-indicator'));
  assert.equal(contract.tokenBindings.coverage, 'complete');
  assert.deepEqual(contract.tokenBindings.unboundSlots, []);
  assert.deepEqual(contract.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'task-board-card');
  const standard = component.render({ ...renderProps(component), state: 'default', scenario: 'with-reordering' });
  const hovered = component.render({ ...renderProps(component), state: 'hover' });
  const focused = component.render({ ...renderProps(component), state: 'focus-visible' });
  const dragging = component.render({ ...renderProps(component), state: 'dragging' });
  const noReordering = component.render({ ...renderProps(component), scenario: 'without-reordering' });
  const withActions = component.render({ ...renderProps(component), scenario: 'with-actions' });
  const noAssignee = component.render({ ...renderProps(component), scenario: 'no-assignee' });
  const noLabels = component.render({ ...renderProps(component), scenario: 'no-labels' });
  const manyLabels = component.render({ ...renderProps(component), scenario: 'many-labels' });
  const longTitle = component.render({ ...renderProps(component), scenario: 'long-title' });
  assert.match(standard, /^<div class="taskboardc-demo"><ul class="taskboardc-list" aria-label="進行中のタスク"><li class="cardc taskboardc"[^>]+data-component="task-board-card"/);
  assert.match(standard, /<a id="task-board-card-\d+-title" class="taskboardc-link" href="#\/tasks\/mrd-98" aria-label="MRD-98 Dark themeでfocus ringのコントラストが不足">/);
  assert.match(standard, /aria-label="MRD-98をドラッグして移動"[^>]+aria-describedby="task-board-card-\d+-instructions"/);
  assert.match(standard, /aria-label="MRD-98を前の列へ移動"/);
  assert.match(standard, /aria-label="MRD-98を次の列へ移動"/);
  assert.doesNotMatch(standard, /<a\b[^>]*>(?:(?!<\/a>).)*(?:<button|<input)/s);
  assert.doesNotMatch(standard, /<li[^>]+(?:onclick|role="(?:link|option)"|tabindex|draggable)/i);
  assert.match(hovered, /data-state="hover"/);
  assert.match(focused, /data-state="focus-visible"/);
  assert.match(dragging, /data-state="dragging"/);
  assert.doesNotMatch(noReordering, /taskboardc-drag-handle|を前の列へ移動|を次の列へ移動/);
  assert.match(withActions, /aria-label="MRD-98のアクションを開く"[^>]+aria-haspopup="menu"/);
  assert.doesNotMatch(noAssignee, /taskboardc-assignee/);
  assert.match(noLabels, /aria-label="ラベル: なし"/);
  assert.match(manyLabels, /aria-label="ラベル: bug、accessibility、theme、regression"/);
  assert.match(manyLabels, /<span class="tagc">\+2<\/span>/);
  assert.match(longTitle, /keyboard focus indicatorが複数のsticky layerに隠れる/);
  assert.match(indexSource, /\.taskboardc-link::after\{content:"";position:absolute;inset:0;border-radius:var\(--radius-md\)\}/);
  assert.match(indexSource, /\.taskboardc-assignee,\.taskboardc-reordering,\.taskboardc-actions\{position:relative;z-index:1/);
  assert.match(indexSource, /\.taskboardc:has\(\.taskboardc-link:focus-visible\)[^}]*var\(--focus-ring\)/);
  assert.match(indexSource, /\.taskboardc\[data-state="dragging"\][^}]*var\(--shadow-md\)/);
  assert.match(indexSource, /\.taskboardc-list\{[^}]*container-type:inline-size/);
});

test('Drawer is implementation-ready as a native modal dialog with trigger and focus lifecycle', () => {
  const drawer = contracts.find((contract) => contract.id === 'drawer');
  assert.equal(drawer.contractVersion, '0.2.0');
  assert.equal(drawer.implementationReadiness.status, 'ready');
  assert.deepEqual(drawer.states.map(({ id }) => id), ['open', 'closed']);
  assert.deepEqual(drawer.props.map(({ name }) => name), [
    'trigger', 'title', 'children', 'footer', 'open', 'defaultOpen', 'onOpenChange',
    'side', 'initialFocusRef', 'closeLabel', 'ref',
  ]);
  assert.deepEqual(drawer.runtime.rootElements, ['dialog']);
  assert.ok(drawer.runtime.relations.includes('modal-inert-background'));
  assert.ok(drawer.runtime.relations.includes('contained-tab-sequence'));
  assert.ok(drawer.runtime.relations.includes('focus-return'));
  assert.equal(drawer.tokenBindings.coverage, 'complete');
  assert.deepEqual(drawer.openQuestions, []);

  const component = renderedComponents.find(({ id }) => id === 'drawer');
  const opened = component.render({ ...renderProps(component), state: 'open' });
  const closed = component.render({ ...renderProps(component), state: 'closed' });
  const longContent = component.render({ ...renderProps(component), state: 'open', scenario: 'long-content' });
  const mobileNavigation = component.render({ ...renderProps(component), state: 'open', scenario: 'mobile-navigation' });
  assert.match(opened, /<button[^>]+aria-haspopup="dialog"[^>]+aria-controls="drawer-\d+"[^>]+aria-expanded="true"/);
  assert.match(opened, /<dialog[^>]+data-component="drawer"[^>]+aria-labelledby="drawer-\d+-title"[^>]+open/);
  assert.match(opened, /<h3[^>]+id="drawer-\d+-title"[^>]+tabindex="-1"/);
  assert.match(opened, /<button[^>]+data-icononly[^>]+aria-label="閉じる"/);
  assert.doesNotMatch(opened, /role="dialog"/);
  assert.doesNotMatch(opened, /aria-modal=/);
  assert.doesNotMatch(opened, /tabindex="[1-9]/);
  assert.match(closed, /aria-expanded="false"/);
  assert.doesNotMatch(closed, /<dialog[^>]+\sopen(?:\s|>)/);
  assert.equal((longContent.match(/<section>/g) ?? []).length, 8);
  assert.match(longContent, /data-drawer-scenario="long-content"/);
  assert.match(mobileNavigation, /<nav[^>]+data-component="sidebar"[^>]+aria-label="Primary"/);
  assert.match(mobileNavigation, /<h3[^>]+>ナビゲーション<\/h3>/);
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
  const dialog = render('dialog');
  assert.match(dialog, /<button[^>]+aria-haspopup="dialog"[^>]+aria-controls="dialog-\d+"[^>]+aria-expanded="true"/);
  assert.match(dialog, /<dialog[^>]+data-component="dialog"[^>]+aria-labelledby="dialog-\d+-title"[^>]+open/);
  assert.doesNotMatch(dialog, /aria-modal=/);
  assert.match(render('file-tree'), /role="tree"/);
  assert.match(render('file-tree'), /role="treeitem"[^>]+aria-expanded=/);
  assert.match(render('table'), /<caption\s+class="sr-only">/);
  assert.match(render('tooltip'), /aria-describedby="[^"]+"/);
  assert.match(render('switch'), /role="switch"/);
  assert.match(render('toast'), /role="status"[^>]+aria-live="polite"/);
  assert.match(render('prompt-input'), /<textarea\s+aria-label=/);
  assert.match(render('navigation-item', { state: 'active' }), /<a\s+href="[^"]+"[^>]+aria-current="page"/);
  assert.match(render('task-board-card'), /<ul class="taskboardc-list" aria-label="進行中のタスク"><li class="cardc taskboardc"/);
  assert.match(render('task-board-card'), /aria-label="MRD-98を次の列へ移動"/);
  assert.match(render('analytics-chart-container'), /<figure\b/);
  assert.match(render('analytics-chart-container'), /class="sr-only"/);
});
