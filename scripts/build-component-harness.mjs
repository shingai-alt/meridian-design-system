#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from '../packages/html-runtime/src/harness-core.mjs';
import { RUNTIME_DEFINITIONS } from '../packages/html-runtime/src/index.mjs';
import { validateAgainstSchema } from './lib/schema-validator.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const checkOnly = process.argv.includes('--check');
const pilot = readJson('design/harness/pilot-components.json');
const componentSchema = readJson('schemas/component-contract.schema.json');
const patternSchema = readJson('schemas/pattern-contract.schema.json');

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function assertValid(value, schema, label) {
  const errors = validateAgainstSchema(value, schema, { label });
  if (errors.length) throw new Error(errors.join('\n'));
}

const contracts = pilot.components.map((id) => {
  const path = `design/contracts/components/${id}.contract.json`;
  const contract = readJson(path);
  assertValid(contract, componentSchema, path);
  if (!contract.contractVersion || !contract.runtime || !contract.selectionRules || !contract.negativeExamples || !contract.requiredScenarios) {
    throw new Error(`${path}: pilot Contract requires versioned runtime, selectionRules, negativeExamples, and requiredScenarios`);
  }
  const implementation = RUNTIME_DEFINITIONS[id];
  if (!implementation) throw new Error(`${path}: HTML Runtime renderer is missing`);
  if (JSON.stringify(implementation.rootElements) !== JSON.stringify(contract.runtime.rootElements)) {
    throw new Error(`${path}: Runtime rootElements do not match ${implementation.renderer} implementation`);
  }
  return { path, contract };
});

const patternFiles = readdirSync(join(root, 'design/contracts/patterns')).filter((name) => name.endsWith('.pattern.json')).sort();
const patterns = patternFiles.map((name) => {
  const path = `design/contracts/patterns/${name}`;
  const pattern = readJson(path);
  assertValid(pattern, patternSchema, path);
  return { path, pattern };
});

const sourceModel = {
  schemaVersion: pilot.schemaVersion,
  runtimeVersion: pilot.runtimeVersion,
  sourcePackageIds: pilot.sourcePackageIds,
  exceptionApprovals: pilot.exceptionApprovals,
  draftAllowlist: pilot.draftAllowlist,
  draftPatternAllowlist: pilot.draftPatternAllowlist,
  accessibility: readJson('design/accessibility.json'),
  tokenPolicy: readJson('design/token-policy.json'),
  components: contracts.map(({ path, contract }) => ({ path, contract })),
  patterns: patterns.map(({ path, pattern }) => ({ path, pattern })),
};

const runtimeCss = readFileSync(join(root, 'packages/html-runtime/styles/components.css'), 'utf8');
const declaredTokens = new Set(contracts.flatMap(({ contract }) => Object.values(contract.tokenRefs).flat()));
const usedRuntimeTokens = [...runtimeCss.matchAll(/var\((--[a-z0-9-]+)/g)].map((match) => match[1]);
for (const token of usedRuntimeTokens) {
  if (!declaredTokens.has(token)) throw new Error(`packages/html-runtime/styles/components.css: ${token} is not declared by a Pilot Contract`);
}
if (/#[0-9a-f]{3,8}\b/i.test(runtimeCss)) throw new Error('packages/html-runtime/styles/components.css: raw color is prohibited');
const translationPackDigest = digest(sourceModel);

const registry = {
  schemaVersion: '0.1.0',
  runtimeVersion: pilot.runtimeVersion,
  sourcePackageIds: pilot.sourcePackageIds,
  exceptionApprovals: pilot.exceptionApprovals,
  translationPackDigest,
  draftAllowlist: pilot.draftAllowlist,
  draftPatternAllowlist: pilot.draftPatternAllowlist,
  components: contracts.map(({ path, contract }) => ({
    id: contract.id,
    name: contract.name,
    status: contract.status,
    contractVersion: contract.contractVersion,
    source: path,
    sourceDigest: digest(contract),
    pilotScope: ['team-invitation'],
    variants: Object.keys(contract.variants),
    states: contract.states.map((state) => state.id),
    sizes: Object.keys(contract.sizes),
    props: contract.props,
    runtime: contract.runtime,
    tokenRefs: contract.tokenRefs,
  })),
  patterns: patterns.map(({ path, pattern }) => ({
    id: pattern.id,
    name: pattern.name,
    status: pattern.status,
    contractVersion: pattern.contractVersion,
    source: path,
    sourceDigest: digest(pattern),
    components: pattern.components,
    layoutRecipes: pattern.layoutRecipes,
  })),
};

const aiIndex = {
  schemaVersion: '0.1.0',
  translationPackDigest,
  runtimeVersion: pilot.runtimeVersion,
  components: contracts.map(({ path, contract }) => ({
    id: contract.id,
    name: contract.name,
    status: contract.status,
    contractVersion: contract.contractVersion,
    source: path,
    sourceDigest: digest(contract),
    pilotScope: ['team-invitation'],
    description: contract.description,
    whenToUse: contract.intent.whenToUse,
    whenNotToUse: contract.intent.whenNotToUse,
    alternatives: contract.intent.whenNotToUse,
    anatomy: contract.anatomy,
    variants: Object.keys(contract.variants),
    states: contract.states,
    sizes: Object.keys(contract.sizes),
    props: contract.props,
    accessibility: contract.accessibility,
    keyboardInteractions: contract.keyboardInteractions,
    prohibitedRules: contract.rules,
    allowedTokenCategories: Object.keys(contract.tokenRefs),
    selectionRules: contract.selectionRules,
    negativeExamples: contract.negativeExamples,
    requiredScenarios: contract.requiredScenarios,
    examples: contract.examples,
    runtime: contract.runtime,
  })),
  patterns: patterns.map(({ path, pattern }) => ({ ...pattern, source: path, sourceDigest: digest(pattern) })),
};

function renderMarkdown(index) {
  const sections = index.components.map((component) => `## ${component.name} \`${component.id}\`

- Status: ${component.status}
- Contract: ${component.contractVersion}
- Source: \`${component.source}\`
- Source digest: \`${component.sourceDigest}\`
- Variants: ${component.variants.join(', ') || 'none'}
- States: ${component.states.map((state) => state.id).join(', ') || 'none'}
- Sizes: ${component.sizes.join(', ') || 'none'}
- Runtime compatibility: ${component.runtime.compatibility}
- Pilot scope: ${component.pilotScope.join(', ')}
- Required scenarios: ${component.requiredScenarios.join(', ')}

Use when:
${component.whenToUse.map((item) => `- ${item}`).join('\n')}

Avoid when:
${component.whenNotToUse.map((item) => `- ${item}`).join('\n')}

Negative examples:
${component.negativeExamples.map((item) => `- ${item.pattern} — ${item.reason} (${item.ruleIds.join(', ')})`).join('\n')}

Accessibility:
${component.accessibility.requirements.map((item) => `- ${item}`).join('\n')}
`).join('\n');
  return `# Meridian AI Component Index

- Translation Pack: \`${index.translationPackDigest}\`
- Runtime: \`${index.runtimeVersion}\`
- Generated from Contract, Token policy, and Accessibility policy. Do not edit.

${sections}`;
}

const outputs = new Map([
  ['design/harness/generated/component-registry.json', `${JSON.stringify(registry, null, 2)}\n`],
  ['design/harness/generated/ai-index.json', `${JSON.stringify(aiIndex, null, 2)}\n`],
  ['design/harness/generated/ai-index.md', renderMarkdown(aiIndex)],
]);

let changed = 0;
for (const [path, content] of outputs) {
  const absolute = join(root, path);
  const current = existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
  if (current === content) continue;
  changed += 1;
  if (checkOnly) {
    console.error(`${path}: generated output is stale`);
  } else {
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, content);
    console.log(`Generated ${relative(root, absolute)}`);
  }
}

if (checkOnly && changed) process.exitCode = 1;
if (checkOnly && !changed) console.log(`Component Harness generation check passed: ${contracts.length} components, ${patterns.length} pattern(s), ${translationPackDigest}.`);
