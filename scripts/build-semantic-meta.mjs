#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'design/semantic-tokens.json');
const outputPath = join(root, 'js/generated/semantic-token-meta.js');
const checkOnly = process.argv.includes('--check');
const metadata = JSON.parse(readFileSync(sourcePath, 'utf8'));

const rows = metadata.map(({ token, meaning, usage }) => [token, meaning, usage]);
const output = `"use strict";\n/* AUTO-GENERATED from design/semantic-tokens.json. */\nconst SEM_META=${JSON.stringify(rows, null, 2)};\n`;

if (checkOnly) {
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null;
  if (current !== output) {
    console.error(`${outputPath} is out of date. Run: npm run build:semantic-meta`);
    process.exitCode = 1;
  } else {
    console.log(`${outputPath} is up to date.`);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`Wrote ${outputPath}`);
}
