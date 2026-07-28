import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { RUNTIME_DEFINITIONS } from '../../packages/html-runtime/src/index.mjs';
import { collectDtcgTokens } from './dtcg.mjs';

export const TOKEN_CONTEXTS = [
  { id: 'light-standard', theme: 'light', contrast: 'standard', ref: 'tokens/build/meridian.tokens.json' },
  { id: 'dark-standard', theme: 'dark', contrast: 'standard', ref: 'tokens/build/meridian.dark.tokens.json' },
  { id: 'light-high', theme: 'light', contrast: 'high', ref: 'tokens/build/meridian.high-contrast.tokens.json' },
  { id: 'dark-high', theme: 'dark', contrast: 'high', ref: 'tokens/build/meridian.dark.high-contrast.tokens.json' },
];

function digestBuffer(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}

function safePath(root, ref) {
  if (isAbsolute(ref)) return null;
  const absolute = resolve(root, ref);
  const rel = relative(root, absolute);
  return rel.startsWith('..') || isAbsolute(rel) ? null : absolute;
}

function fileDigest(root, ref) {
  return digestBuffer(readFileSync(resolve(root, ref)));
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

function compareVersions(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function satisfiesRuntimeRange(version, range) {
  const actual = parseVersion(version);
  if (!actual) return false;
  const clauses = range.trim().split(/\s+/);
  if (clauses.length === 0) return false;
  return clauses.every((clause) => {
    const match = /^(>=|>|<=|<|=)?(\d+\.\d+\.\d+)$/.exec(clause);
    if (!match) return false;
    const comparison = compareVersions(actual, parseVersion(match[2]));
    switch (match[1] || '=') {
      case '>=': return comparison >= 0;
      case '>': return comparison > 0;
      case '<=': return comparison <= 0;
      case '<': return comparison < 0;
      default: return comparison === 0;
    }
  });
}

function tokenIndex(bundle) {
  return new Map(collectDtcgTokens(bundle).map((entry) => [entry.path, entry]));
}

function extensionOutputIndex(bundle) {
  const output = new Map();
  for (const entry of collectDtcgTokens(bundle)) {
    const cssVariable = entry.token.$extensions?.['com.meridian']?.cssVariable;
    if (cssVariable) output.set(cssVariable, entry.path);
  }
  return output;
}

function tokenPathForOutput(outputRef, bundle, extensionIndex) {
  if (extensionIndex.has(outputRef)) {
    return { paths: [extensionIndex.get(outputRef)], modifiers: ['theme', 'contrast'] };
  }
  const name = outputRef.slice(2);
  const densityModes = ['default', 'compact', 'comfortable'];
  if (densityModes.every((mode) => bundle.density?.[mode]?.[name])) {
    return { paths: densityModes.map((mode) => `density.${mode}.${name}`), modifiers: ['density'] };
  }
  const rules = [
    [/^--sp-(.+)$/, (match) => `spacing.${match[1]}`],
    [/^--radius-(.+)$/, (match) => `radius.${match[1]}`],
    [/^--dur-(.+)$/, (match) => `motion.duration.${match[1]}`],
    [/^--ease-(.+)$/, (match) => `motion.easing.${match[1]}`],
    [/^--motion-distance-(.+)$/, (match) => `motion.distance.${match[1]}`],
    [/^--shadow-(.+)$/, (match) => `shadow.level.${match[1]}`],
    [/^--type-(.+)$/, (match) => `typography.${match[1]}`],
    [/^--font-(.+)$/, (match) => `layout.font.${match[1]}`],
  ];
  for (const [pattern, build] of rules) {
    const match = pattern.exec(outputRef);
    if (match) return { paths: [build(match)], modifiers: outputRef.startsWith('--shadow-') ? ['theme', 'contrast'] : [] };
  }
  if (bundle.layout?.dimension?.[name]) return { paths: [`layout.dimension.${name}`], modifiers: [] };
  return null;
}

function mappingForOutput(outputRef, targetRefs, bundles, indexes) {
  const canonical = bundles.get('light-standard');
  const found = tokenPathForOutput(outputRef, canonical, extensionOutputIndex(canonical));
  if (!found) return null;
  const contextIds = found.modifiers.includes('theme') || found.modifiers.includes('contrast')
    ? TOKEN_CONTEXTS.map((context) => context.id)
    : ['light-standard'];
  const sources = [];
  for (const contextId of contextIds) {
    for (const path of found.paths) {
      const entry = indexes.get(contextId).get(path);
      if (!entry) return null;
      sources.push({ contextRef: contextId, tokenPath: path, tokenType: entry.type });
    }
  }
  return {
    outputRef,
    strategy: found.modifiers.length ? 'contextual' : 'direct',
    modifiers: found.modifiers,
    sources,
    usedByTargetRefs: [...targetRefs].sort(),
  };
}

export function createAdapterTokenMapping({ root, registry, generatedAt }) {
  const contexts = TOKEN_CONTEXTS.map((context) => ({
    ...context,
    digest: fileDigest(root, context.ref),
  }));
  const bundles = new Map(contexts.map((context) => [
    context.id,
    JSON.parse(readFileSync(resolve(root, context.ref), 'utf8')),
  ]));
  const indexes = new Map([...bundles].map(([id, bundle]) => [id, tokenIndex(bundle)]));
  const cssRef = 'tokens/build/tokens.css';
  const css = readFileSync(resolve(root, cssRef), 'utf8');
  const declaredCssRefs = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));

  const adapters = registry.adapters
    .filter((adapter) => adapter.kind === 'project' && adapter.availability !== 'disabled' && adapter.bindings.length > 0)
    .map((adapter) => {
      const packageRef = adapter.runtimePackageRef;
      if (!packageRef) throw new Error(`Project adapter ${adapter.id} requires runtimePackageRef`);
      const runtime = JSON.parse(readFileSync(resolve(root, packageRef), 'utf8'));
      const runtimeCatalogRef = adapter.sourceRefs.find((ref) => ref.endsWith('component-registry.json'));
      if (!runtimeCatalogRef) throw new Error(`Project adapter ${adapter.id} requires a machine-readable runtime component catalog`);
      const runtimeImplementationRef = adapter.sourceRefs.find((ref) => ref === 'packages/html-runtime/src/index.mjs');
      if (!runtimeImplementationRef) throw new Error(`Project adapter ${adapter.id} requires an exact runtime implementation source`);
      const runtimeCatalog = JSON.parse(readFileSync(resolve(root, runtimeCatalogRef), 'utf8'));
      const implementationTargets = new Set(Object.keys(RUNTIME_DEFINITIONS));
      const implementedTargets = new Set(runtimeCatalog.components
        .map((component) => component.id)
        .filter((targetRef) => implementationTargets.has(targetRef)));
      const targetRefs = [...new Set(adapter.bindings.flatMap((binding) => binding.targetRefs))].sort();
      const targets = targetRefs.map((targetRef) => {
        const contractRef = `design/contracts/components/${targetRef}.contract.json`;
        const contract = JSON.parse(readFileSync(resolve(root, contractRef), 'utf8'));
        const requiredOutputRefs = [...new Set(Object.values(contract.tokenRefs).flat())].sort();
        const runtimeRange = contract.runtime?.compatibility ?? null;
        const runtimeImplemented = implementedTargets.has(targetRef);
        return {
          targetRef,
          contractRef,
          contractDigest: fileDigest(root, contractRef),
          contractVersion: contract.contractVersion ?? null,
          contractStatus: contract.status,
          runtimeRange,
          runtimeImplemented,
          runtimeCompatible: runtimeImplemented && Boolean(runtimeRange) && satisfiesRuntimeRange(runtime.version, runtimeRange),
          requiredOutputRefs,
        };
      });
      const outputsToTargets = new Map();
      for (const target of targets) {
        for (const outputRef of target.requiredOutputRefs) {
          const owners = outputsToTargets.get(outputRef) ?? new Set();
          owners.add(target.targetRef);
          outputsToTargets.set(outputRef, owners);
        }
      }
      const mappings = [];
      const unmappedOutputRefs = [];
      for (const [outputRef, owners] of [...outputsToTargets].sort(([left], [right]) => left.localeCompare(right))) {
        const mapping = mappingForOutput(outputRef, owners, bundles, indexes);
        if (!mapping || !declaredCssRefs.has(outputRef)) unmappedOutputRefs.push(outputRef);
        else mappings.push(mapping);
      }
      const incompatibilities = targets
        .filter((target) => !target.runtimeCompatible)
        .map((target) => {
          if (!target.runtimeImplemented) return `${target.targetRef} is not implemented by ${runtime.name} ${runtime.version}.`;
          if (!target.runtimeRange) return `${target.targetRef} does not declare a runtime compatibility range.`;
          return `${target.targetRef} requires runtime ${target.runtimeRange}, but ${runtime.name} is ${runtime.version}.`;
        });
      return {
        adapterRef: adapter.id,
        tokenStrategy: adapter.tokenStrategy,
        status: incompatibilities.length ? 'incompatible' : unmappedOutputRefs.length ? 'partial' : 'complete',
        runtime: {
          packageRef,
          packageDigest: fileDigest(root, packageRef),
          packageName: runtime.name,
          version: runtime.version,
          implementationRef: runtimeImplementationRef,
          implementationDigest: fileDigest(root, runtimeImplementationRef),
          catalogRef: runtimeCatalogRef,
          catalogDigest: fileDigest(root, runtimeCatalogRef),
        },
        targets,
        mappings,
        unmappedOutputRefs,
        incompatibilities,
      };
    });

  return {
    $schema: '../../schemas/adapter-token-mapping.schema.json',
    meta: {
      schemaVersion: '0.1.0',
      kind: 'adapter-token-mapping',
      id: 'meridian_project_adapter_token_mapping_v1',
      generatedAt,
    },
    source: {
      adapterRegistry: {
        ref: 'design/adapter-registry.json',
        digest: fileDigest(root, 'design/adapter-registry.json'),
      },
      cssOutput: { ref: cssRef, digest: fileDigest(root, cssRef) },
      contexts,
    },
    adapters,
  };
}

export function validateAdapterTokenMapping(mapping, registry, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const refs = [
    mapping.source.adapterRegistry,
    mapping.source.cssOutput,
    ...mapping.source.contexts.map((context) => ({ ref: context.ref, digest: context.digest })),
  ];
  for (const item of refs) {
    const absolute = safePath(root, item.ref);
    if (!absolute || !existsSync(absolute)) errors.push(`token mapping source does not exist: ${item.ref}`);
    else if (fileDigest(root, item.ref) !== item.digest) errors.push(`token mapping source digest is stale: ${item.ref}`);
  }
  const expected = createAdapterTokenMapping({ root, registry, generatedAt: mapping.meta.generatedAt });
  if (JSON.stringify(mapping) !== JSON.stringify(expected)) errors.push('adapter token mapping is stale or was not deterministically generated');
  return errors;
}
