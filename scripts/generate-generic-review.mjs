import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGenerationReady } from './lib/generic-generation.mjs';
import {
  compileGenericReview,
  validateCompiledReview,
} from './lib/generic-review-compiler.mjs';
import { renderGenericReviewHtml } from './lib/generic-review-renderer.mjs';
import { browserRuntimeSource } from '../packages/html-runtime/src/index.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const check = args.includes('--check');
const manifestArg = args.find((arg) => !arg.startsWith('--'));

if (!manifestArg) {
  console.error('Usage: node scripts/generate-generic-review.mjs <generation-manifest.json> [--check]');
  process.exit(2);
}

function repositoryPath(ref) {
  const absolute = resolve(root, ref);
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || rel === '') throw new Error(`Path must be a repository file: ${ref}`);
  return absolute;
}

function readJson(ref) {
  return JSON.parse(readFileSync(repositoryPath(ref), 'utf8'));
}

function expectedJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function verifyOrWrite(ref, content) {
  const absolute = repositoryPath(ref);
  if (check) {
    let current;
    try {
      current = readFileSync(absolute, 'utf8');
    } catch {
      throw new Error(`${ref} is missing`);
    }
    if (current !== content) throw new Error(`${ref} is stale`);
    return;
  }
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

try {
  const manifestRef = relative(root, repositoryPath(manifestArg));
  const manifest = readJson(manifestRef);

  // This disk-bound pass verifies every source digest before source objects are
  // handed to the compiler. Fixture mode never weakens this CLI boundary.
  assertGenerationReady(manifest, { root });

  const sources = Object.fromEntries(
    Object.entries(manifest.source).map(([name, binding]) => [name, readJson(binding.ref)]),
  );
  const compiled = compileGenericReview({ manifest, sources, root });
  const compileErrors = validateCompiledReview({
    ...compiled,
    manifest,
    registry: sources.componentRegistry,
  });
  if (compileErrors.length) throw new Error(compileErrors.join('\n'));

  const runtimeSource = browserRuntimeSource(sources.componentRegistry, compiled.composition);
  const html = renderGenericReviewHtml({
    model: compiled.model,
    usage: compiled.usage,
    runtimeSource,
    tokensCss: readFileSync(join(root, 'tokens/build/tokens.css'), 'utf8'),
    runtimeCss: readFileSync(join(root, 'packages/html-runtime/styles/components.css'), 'utf8'),
    layoutRegistry: sources.layoutRecipes,
  });

  const outputs = [
    [manifest.output.reviewModel, expectedJson(compiled.model)],
    [manifest.output.usageManifest, expectedJson(compiled.usage)],
    [manifest.output.reviewUi, html],
  ];
  for (const [ref, content] of outputs) verifyOrWrite(ref, content);
  console.log(`${check ? 'Verified' : 'Generated'} generic Review UI from ${manifestRef}.`);
} catch (error) {
  console.error(error.code ? `${error.code}: ${error.message}` : error.message);
  process.exit(1);
}
