#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'design/accessibility.json');
const outputPath = join(root, 'js/generated/accessibility-meta.js');
const checkOnly = process.argv.includes('--check');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));

const output = `"use strict";\n/* AUTO-GENERATED from design/accessibility.json. */\nconst A11Y_META=${JSON.stringify({
  standard: source.standard,
  policy: source.policy,
  targetSize: source.targetSize,
  liveRegions: source.liveRegions,
  disabledState: source.disabledState,
}, null, 2)};\nconst A11Y_REQUIREMENTS=${JSON.stringify(source.requirements, null, 2)};\nconst A11Y_QUALITY_GATES=${JSON.stringify(source.qualityGates, null, 2)};\n`;

if (checkOnly) {
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null;
  if (current !== output) {
    console.error(`${outputPath} is out of date. Run: npm run build:a11y-meta`);
    process.exitCode = 1;
  } else {
    console.log(`${outputPath} is up to date.`);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`Wrote ${outputPath}`);
}
