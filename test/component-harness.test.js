const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const readJson = (path) => JSON.parse(read(path));

const pilotIds = ['button', 'text-field', 'select', 'form-field', 'validation-message', 'checkbox', 'alert', 'status-indicator', 'table'];

test('pilot Contracts expose versioned HTML Runtime semantics', () => {
  for (const id of pilotIds) {
    const contract = readJson(`design/contracts/components/${id}.contract.json`);
    assert.match(contract.contractVersion, /^\d+\.\d+\.\d+$/);
    assert.ok(contract.runtime.rootElements.length > 0, `${id} rootElements`);
    assert.ok(contract.runtime.slots.length > 0, `${id} slots`);
    assert.ok(contract.runtime.stateModel.length > 0, `${id} state model`);
    assert.deepEqual(contract.runtime.provenance, ['component', 'instance', 'variant', 'state', 'contract-version', 'runtime-version', 'decision']);
  }
});

test('generated Registry and Translation Pack cover the pilot exactly', () => {
  const registry = readJson('design/harness/generated/component-registry.json');
  const index = readJson('design/harness/generated/ai-index.json');
  assert.deepEqual(registry.components.map((component) => component.id), pilotIds);
  assert.deepEqual(index.components.map((component) => component.id), pilotIds);
  assert.equal(registry.translationPackDigest, index.translationPackDigest);
  assert.match(registry.translationPackDigest, /^sha256-[a-f0-9]{64}$/);
  assert.deepEqual(registry.patterns.map((pattern) => pattern.id), ['interactive-row-group']);
});

test('Strict Resolver rejects unregistered APIs, stale context, and unapproved exceptions', async () => {
  const { validateComposition } = await import('../packages/html-runtime/src/harness-core.mjs');
  const registry = readJson('design/harness/generated/component-registry.json');
  const composition = readJson('examples/phase-2/team-invitation.composition.json');
  assert.equal(validateComposition({ composition, registry }), true);

  const unknownComponent = structuredClone(composition);
  unknownComponent.nodes[0].component = 'custom-button';
  assert.throws(() => validateComposition({ composition: unknownComponent, registry }), { code: 'COMPONENT_UNKNOWN' });

  const unknownProp = structuredClone(composition);
  unknownProp.nodes[0].props.style = 'color: red';
  assert.throws(() => validateComposition({ composition: unknownProp, registry }), { code: 'COMPONENT_PROP_UNKNOWN' });

  const unknownVariant = structuredClone(composition);
  unknownVariant.nodes.find((node) => node.component === 'button').props.variant = 'brand-gradient';
  assert.throws(() => validateComposition({ composition: unknownVariant, registry }), { code: 'COMPONENT_VARIANT_UNKNOWN' });

  const wrongType = structuredClone(composition);
  wrongType.nodes.find((node) => node.component === 'button').props.disabled = 'false';
  assert.throws(() => validateComposition({ composition: wrongType, registry }), { code: 'COMPONENT_PROP_TYPE' });

  const stale = structuredClone(composition);
  stale.translationPackDigest = `sha256-${'0'.repeat(64)}`;
  assert.throws(() => validateComposition({ composition: stale, registry }), { code: 'TRANSLATION_PACK_STALE' });

  const exception = structuredClone(composition);
  exception.exceptions.push({ id: 'exception.test', type: 'component-exception', reason: 'test', scope: 'pilot', humanApprovalRequired: true, status: 'proposed' });
  assert.throws(() => validateComposition({ composition: exception, registry }), { code: 'EXCEPTION_UNAPPROVED' });
});

test('Usage Manifest matches composition decisions and generated HTML provenance', () => {
  const composition = readJson('examples/phase-2/team-invitation.composition.json');
  const usage = readJson('examples/generated/team-invitation.phase2.usage.json');
  const html = read('examples/generated/team-invitation.phase2.html');
  assert.equal(usage.instances.length, composition.nodes.length);
  assert.equal(usage.decisions.length, composition.decisions.length);
  assert.equal(usage.exceptions.length, 0);
  assert.equal(usage.renderSites.length, composition.nodes.length);
  assert.match(usage.validationDigest, /^sha256-[a-f0-9]{64}$/);
  for (const id of pilotIds) assert.match(html, new RegExp(`meta\\('${id}'`));
  assert.match(html, /data-meridian-contract-version/);
  assert.match(html, /data-meridian-runtime-version/);
  assert.match(html, /data-meridian-decision/);
  assert.match(html, /data-meridian-usage/);
  const declaredUsageIds = new Set(usage.instances.map((instance) => instance.instanceId));
  const renderedUsageIds = new Set([...html.matchAll(/usageId:'([^']+)'|data-meridian-usage="([^"]+)"/g)].map((match) => match[1] || match[2]));
  assert.deepEqual([...renderedUsageIds].sort(), [...declaredUsageIds].sort());
  assert.match(html, /<table class=\\?"mrd-table invite-table/);
  assert.match(html, /<caption class=\\?"sr-only/);
});

test('build-time renderer audit blocks undeclared and unused Composition nodes', async () => {
  const { auditRendererUsage } = await import('../packages/html-runtime/src/harness-core.mjs');
  const composition = readJson('examples/phase-2/team-invitation.composition.json');
  const source = read('scripts/lib/phase-2-renderer.mjs');
  const sites = auditRendererUsage({ source, composition });
  assert.deepEqual(sites.map((site) => site.usageId), composition.nodes.map((node) => node.instanceId).sort());

  const missing = structuredClone(composition);
  missing.nodes = missing.nodes.filter((node) => node.instanceId !== 'invite-action');
  assert.throws(() => auditRendererUsage({ source, composition: missing }), { code: 'RENDER_USAGE_UNKNOWN' });

  const unused = structuredClone(composition);
  unused.nodes.push({ ...structuredClone(unused.nodes[0]), instanceId: 'unused-table' });
  assert.throws(() => auditRendererUsage({ source, composition: unused }), { code: 'COMPOSITION_NODE_UNRENDERED' });
});

test('browser Runtime is syntactically valid and uses native controls', async () => {
  const { browserRuntimeSource } = await import('../packages/html-runtime/src/index.mjs');
  const registry = readJson('design/harness/generated/component-registry.json');
  const composition = readJson('examples/phase-2/team-invitation.composition.json');
  const source = browserRuntimeSource(registry, composition);
  assert.doesNotThrow(() => new vm.Script(source));
  assert.match(source, /<button type=/);
  assert.match(source, /<input class=/);
  assert.match(source, /<select class=/);
  assert.match(source, /<table class=/);
  assert.doesNotMatch(source, /eval\(|new Function/);

  const sandbox = {
    window: {},
    document: {
      createElement() {
        return {
          value: '',
          set textContent(value) { this.value = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;'); },
          get innerHTML() { return this.value; },
        };
      },
    },
  };
  vm.runInNewContext(source, sandbox);
  const runtime = sandbox.window.MeridianHTMLRuntime;
  assert.throws(() => runtime.button({ instanceId: 'rogue', usageId: 'missing-template', variant: 'primary', decisionRef: 'decision.invite-action' }, '送信'));
  assert.throws(() => runtime.button({ instanceId: 'rogue', usageId: 'invite-action', variant: 'danger', decisionRef: 'decision.invite-action' }, '削除'));
  const escapedAlert = String(runtime.alert({ instanceId: 'safe-alert', usageId: 'invite-page-alert', variant: 'warning', decisionRef: 'decision.page-alert' }, '通知', '<img src=x onerror=alert(1)>'));
  assert.doesNotMatch(escapedAlert, /<img/);
  assert.match(escapedAlert, /&lt;img/);
  const injectedValue = String(runtime.textField({ instanceId: 'email-0', usageId: 'invite-email-input', value: 'x\" autofocus onfocus=\"alert(1)', decisionRef: 'decision.email-field' }));
  assert.doesNotMatch(injectedValue, /value="x" autofocus/);
  assert.match(injectedValue, /value="x&amp;quot;|value="x&quot;/);
});
