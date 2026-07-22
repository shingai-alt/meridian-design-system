#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateImplementationReadiness } from './lib/implementation-readiness.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const policy = readJson('design/implementation-readiness.json');
const names = readdirSync(join(root, 'design/contracts/components'))
  .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'));
const contracts = names.map((name) => readJson(`design/contracts/components/${name}`));
const errors = contracts.flatMap((contract) => validateImplementationReadiness(contract, policy));

if (errors.length) {
  console.error(`Implementation readiness failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  const ready = contracts.filter((contract) => contract.implementationReadiness?.status === 'ready');
  console.log(`Implementation readiness passed: ${ready.length}/${contracts.length} contracts ready (${ready.map(({ id }) => id).join(', ')}).`);
}
