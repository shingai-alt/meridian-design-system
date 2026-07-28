import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  satisfiesRuntimeRange,
  validateAdapterTokenMapping,
} from '../scripts/lib/adapter-token-mapping.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (ref) => JSON.parse(readFileSync(join(root, ref), 'utf8'));
const mapping = readJson('design/generated/adapter-token-mapping.json');
const registry = readJson('design/adapter-registry.json');

test('generated Adapter Token Mapping satisfies schema and deterministic source validation', () => {
  assert.deepEqual(
    validateAgainstSchema(mapping, readJson('schemas/adapter-token-mapping.schema.json')),
    [],
  );
  assert.deepEqual(validateAdapterTokenMapping(mapping, registry, { root }), []);
});

test('mapping covers every required token output without embedding raw token values', () => {
  const adapter = mapping.adapters.find((item) => item.adapterRef === 'meridian_html_runtime');
  assert.equal(adapter.unmappedOutputRefs.length, 0);
  const required = new Set(adapter.targets.flatMap((target) => target.requiredOutputRefs));
  assert.deepEqual(
    new Set(adapter.mappings.map((item) => item.outputRef)),
    required,
  );
  assert.doesNotMatch(JSON.stringify(adapter.mappings), /"\$value"|#[a-fA-F0-9]{3,8}|rgba?\(/);
});

test('theme, contrast, and density mappings preserve modifier-aware DTCG sources', () => {
  const adapter = mapping.adapters[0];
  const primary = adapter.mappings.find((item) => item.outputRef === '--primary');
  const density = adapter.mappings.find((item) => item.outputRef === '--ctl-md');
  assert.deepEqual(primary.modifiers, ['theme', 'contrast']);
  assert.equal(primary.sources.length, 4);
  assert.deepEqual(density.modifiers, ['density']);
  assert.deepEqual(
    density.sources.map((item) => item.tokenPath),
    ['density.default.ctl-md', 'density.compact.ctl-md', 'density.comfortable.ctl-md'],
  );
});

test('runtime compatibility is evaluated against exact package and contract versions', () => {
  assert.equal(satisfiesRuntimeRange('0.1.0', '>=0.1.0 <1.0.0'), true);
  assert.equal(satisfiesRuntimeRange('1.0.0', '>=0.1.0 <1.0.0'), false);
  assert.equal(satisfiesRuntimeRange('0.1.0', '^0.1.0'), false);
  const adapter = mapping.adapters[0];
  assert.equal(adapter.runtime.version, '0.2.0');
  assert.equal(adapter.runtime.implementationRef, 'packages/html-runtime/src/index.mjs');
  assert.equal(adapter.runtime.catalogRef, 'design/harness/generated/component-registry.json');
  assert.match(adapter.runtime.implementationDigest, /^sha256-[a-f0-9]{64}$/);
  assert.match(adapter.runtime.catalogDigest, /^sha256-[a-f0-9]{64}$/);
  assert.ok(adapter.targets.filter((target) => target.runtimeImplemented).every((target) => target.runtimeCompatible));
});

test('every declared target is implemented by the HTML Runtime before mapping is complete', () => {
  const adapter = mapping.adapters[0];
  assert.equal(adapter.status, 'complete');
  const missing = adapter.targets.filter((target) => !target.runtimeImplemented).map((target) => target.targetRef).sort();
  assert.deepEqual(missing, []);
  assert.equal(adapter.incompatibilities.length, 0);
  assert.ok(['description-list', 'dialog', 'workflow-step'].every((targetRef) =>
    adapter.targets.some((target) => target.targetRef === targetRef && target.runtimeCompatible)));
});

test('mapping validation rejects source drift and hand-edited summaries', () => {
  const stale = structuredClone(mapping);
  stale.adapters[0].unmappedOutputRefs.push('--invented-token');
  assert.match(
    validateAdapterTokenMapping(stale, registry, { root }).join('\n'),
    /stale or was not deterministically generated/,
  );
});
