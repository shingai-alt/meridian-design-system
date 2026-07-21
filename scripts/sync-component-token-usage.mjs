#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (path) => readFileSync(join(root, path), 'utf8');
const generatedMeta = read('js/generated/component-contract-meta.js');
const registrySource = read('js/components-registry.js');
const sandbox = {
  esc: (value) => String(value ?? ''),
  I: new Proxy({}, { get: () => '<svg aria-hidden="true"></svg>' }),
  codeBlock: (code) => `<pre><code>${code}</code></pre>`,
};
const components = vm.runInNewContext(`${read('js/ui-builders.js')}\n${generatedMeta}\n${registrySource}\nCOMPONENTS;`, sandbox);

function tokenGroup(token) {
  if (/^--(?:font|text|lh)-/.test(token)) return 'typography';
  if (/^--sp-/.test(token)) return 'spacing';
  if (/^--radius-/.test(token)) return 'radius';
  if (/^--shadow-/.test(token)) return 'shadow';
  if (/^--(?:dur|ease|motion-distance)-/.test(token)) return 'motion';
  if (/^--(?:sidebar-w|topbar-h|content-|reading-|toc-w|page-pad|section-gap|dialog-w|drawer-w|command-w)/.test(token)) return 'layout';
  if (/^--(?:ctl|row-h|cell-y|card-pad|gap-form|input-x)/.test(token)) return 'density';
  return 'semanticColor';
}

function renderCases(component) {
  const base = { state: 'default' };
  if (component.variants) base.variant = component.variants[0];
  if (component.sizes) base.size = component.sizes.includes('md') ? 'md' : component.sizes[0];
  for (const [name, , defaultValue] of component.texts ?? []) base[name] = defaultValue;
  for (const [name] of component.flags ?? []) base[name] = false;
  return [
    base,
    ...(component.states ?? []).map((state) => ({ ...base, state })),
    ...(component.variants ?? []).map((variant) => ({ ...base, variant })),
  ];
}

function renderTokenSection(contract) {
  return Object.entries(contract.tokenRefs)
    .filter(([, tokens]) => tokens.length > 0)
    .map(([group, tokens]) => `- ${group}: ${tokens.map((token) => `\`${token}\``).join(', ')}`)
    .join('\n');
}

function renderBindingRows(contract) {
  return contract.tokenBindings.bindings.map((binding) =>
    `| \`${binding.slot}\` | \`${binding.source}\` | \`${binding.scope}\` | ${binding.trigger ? `\`${binding.trigger}\`` : '-'} | ${binding.reason} |`,
  ).join('\n');
}

let updatedContracts = 0;
let addedBindings = 0;

for (const component of components) {
  const contractPath = `design/contracts/components/${component.id}.contract.json`;
  const docPath = `components/${component.id}.md`;
  const contract = JSON.parse(read(contractPath));
  const usedTokens = new Set(renderCases(component).flatMap((props) =>
    [...component.render(props).matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]),
  ));
  const declaredTokens = new Set(Object.values(contract.tokenRefs).flat());
  const boundTokens = new Set(contract.tokenBindings.bindings.map((binding) => binding.source));
  const missing = [...usedTokens].filter((token) => !declaredTokens.has(token)).sort();

  for (const token of missing) {
    const group = tokenGroup(token);
    contract.tokenRefs[group] ??= [];
    contract.tokenRefs[group].push(token);
    if (!boundTokens.has(token)) {
      contract.tokenBindings.bindings.push({
        slot: `token.${token.slice(2)}.value`,
        source: token,
        scope: 'semantic',
        componentToken: null,
        aliases: null,
        trigger: null,
        reason: `${component.name}のHTML showcaseで実際に参照する公開token。`,
      });
      boundTokens.add(token);
      addedBindings += 1;
    }
  }

  if (missing.length === 0) continue;
  for (const tokens of Object.values(contract.tokenRefs)) tokens.sort();
  writeFileSync(join(root, contractPath), `${JSON.stringify(contract, null, 2)}\n`);

  const docs = read(docPath)
    .replace(/(## Tokens\n\n)[\s\S]*?(\n\nPrimitive color)/, `$1${renderTokenSection(contract)}$2`)
    .replace(/(\| Slot \| Source \| Scope \| Trigger \| Reason \|\n\|---\|---\|---\|---\|---\|\n)[\s\S]*?(\n\nCurrent coverage:)/, `$1${renderBindingRows(contract)}$2`);
  writeFileSync(join(root, docPath), docs);
  updatedContracts += 1;
}

console.log(`Synchronized implementation token usage: ${updatedContracts} contracts updated, ${addedBindings} bindings added.`);
