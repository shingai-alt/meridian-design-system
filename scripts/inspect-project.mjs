#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectProject, validateProjectContext } from './lib/project-inspector.mjs';
import { validateAgainstSchema } from './lib/schema-validator.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputRef = 'examples/ui-generation/meridian.project-context.json';
const checkOnly = process.argv.includes('--check');
const context = inspectProject({ root });
const schema = JSON.parse(readFileSync(join(root, 'schemas/project-context.schema.json'), 'utf8'));
const errors = [
  ...validateAgainstSchema(context, schema, { label: outputRef }),
  ...validateProjectContext(context, { root }).map((error) => `${outputRef}: ${error}`),
];
if (errors.length > 0) throw new Error(errors.join('\n'));

const output = `${JSON.stringify(context, null, 2)}\n`;
const outputPath = join(root, outputRef);
if (checkOnly) {
  if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) {
    throw new Error(`${outputRef} is stale; run npm run inspect:project`);
  }
  console.log(`Project inspection check passed: ${context.findings.length} findings, ${context.unresolved.length} unresolved, adapter ${context.adapterSelection.selectedAdapterId}.`);
} else {
  writeFileSync(outputPath, output);
  console.log(`Wrote ${outputRef}: ${context.findings.length} findings, ${context.unresolved.length} unresolved, adapter ${context.adapterSelection.selectedAdapterId}.`);
}
