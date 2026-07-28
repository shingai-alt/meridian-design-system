import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdapterTokenMapping } from './lib/adapter-token-mapping.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const outputRef = 'design/generated/adapter-token-mapping.json';
const outputPath = join(root, outputRef);
const registry = JSON.parse(readFileSync(join(root, 'design/adapter-registry.json'), 'utf8'));
const existing = existsSync(outputPath) ? JSON.parse(readFileSync(outputPath, 'utf8')) : null;
const mapping = createAdapterTokenMapping({
  root,
  registry,
  generatedAt: existing?.meta.generatedAt ?? '2026-07-27T08:30:00Z',
});
const output = `${JSON.stringify(mapping, null, 2)}\n`;
if (check) {
  if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== output) {
    console.error(`${outputRef} is stale; run npm run generate:adapter-token-mapping`);
    process.exit(1);
  }
  console.log('Adapter token mapping is current.');
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`Generated ${outputRef}`);
}
