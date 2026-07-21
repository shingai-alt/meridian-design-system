#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, 'design/iconography.json');
const outputPath = join(root, 'js/generated/iconography-meta.js');
const checkOnly = process.argv.includes('--check');
const source = JSON.parse(readFileSync(sourcePath, 'utf8'));
const sizes = Object.fromEntries(source.sizes.map((size) => [size.id, size]));

for (const icon of source.icons) {
  if (!sizes[icon.defaultSize]) throw new Error(`${icon.id}: unknown defaultSize ${icon.defaultSize}`);
}

const output = `"use strict";\n/* AUTO-GENERATED from design/iconography.json. */\nconst ICONOGRAPHY_META=${JSON.stringify({
  coordinateSystem: source.coordinateSystem,
  accessibility: source.accessibility,
}, null, 2)};\nconst ICON_SIZES=${JSON.stringify(sizes, null, 2)};\nconst ICON_META=${JSON.stringify(source.icons, null, 2)};\n`;

if (checkOnly) {
  const current = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : null;
  if (current !== output) {
    console.error(`${outputPath} is out of date. Run: npm run build:icon-meta`);
    process.exitCode = 1;
  } else {
    console.log(`${outputPath} is up to date.`);
  }
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, output);
  console.log(`Wrote ${outputPath}`);
}
