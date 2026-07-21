#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const registryPath = join(root, 'design/system-registry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const componentDomain = registry.domains.find((domain) => domain.id === 'components');

if (!componentDomain) throw new Error('Component domain is missing from design/system-registry.json.');

for (const item of componentDomain.items) {
  const componentId = item.id.replace(/^components\./, '');
  item.sources = [
    `components/${componentId}.md`,
    `design/contracts/components/${componentId}.contract.json`,
    'js/components-registry.js',
    'js/generated/component-contract-meta.js',
    'js/component-pages.js',
    'js/ui-builders.js',
    'index.html',
    'test/component-specs.test.js',
  ];
}

writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`Synchronized source evidence for ${componentDomain.items.length} components.`);
