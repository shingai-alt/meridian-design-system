#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'design/content-guidelines.json');
const outputPath = join(root, 'js/generated/content-guidelines-meta.js');
const checkOnly = process.argv.includes('--check');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const output = `"use strict";\n/* AUTO-GENERATED from design/content-guidelines.json. */\nconst CONTENT_META=${JSON.stringify({ locale: source.locale, voice: source.voice }, null, 2)};\nconst CONTENT_RULES=${JSON.stringify(source.rules, null, 2)};\nconst CONTENT_PATTERNS=${JSON.stringify(source.messagePatterns, null, 2)};\nconst CONTENT_TERMS=${JSON.stringify(source.terms, null, 2)};\nconst CONTENT_QUALITY_GATES=${JSON.stringify(source.qualityGates, null, 2)};\n`;

if (checkOnly) {
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null;
  if (current !== output) {
    console.error(`${outputPath} is out of date. Run: npm run build:content-meta`);
    process.exitCode = 1;
  } else {
    console.log(`${outputPath} is up to date.`);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`Wrote ${outputPath}`);
}
