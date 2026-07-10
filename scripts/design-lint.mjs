#!/usr/bin/env node
// Phase 1 harness — Layer 3 (verification): scans files an AI agent just
// wrote/edited for violations of design/rules.json's automatically-detectable
// ("automationStatus": "static") rules, e.g. raw hex colors, hardcoded px
// spacing/radius, hardcoded motion durations instead of tokens.
//
// Usage:
//   node scripts/design-lint.mjs <file> [<file> ...]
//
// Exits 1 if any "error"-severity violation is found (fails CI / blocks a
// hook), exits 0 otherwise. "warning"-severity violations are reported but
// do not fail the run. Rules with "automationStatus": "manual" (e.g. accent
// misuse, shadow-on-base-surface, missing focus-visible, contrast) cannot be
// regex-checked reliably — they are listed as reminders, not enforced here.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rules = JSON.parse(readFileSync(join(root, 'design/rules.json'), 'utf8'));

// Paths where token/engine source code is expected to contain the exact
// patterns these rules forbid elsewhere (e.g. the literal hex values that
// back the seed color presets). Never lint these files against NO_RAW_HEX_COLOR.
const EXEMPT_PATH_PREFIXES = ['tokens/src/', 'src/color-engine.js'];

const staticRules = rules.filter((r) => r.automationStatus === 'static');
const manualRules = rules.filter((r) => r.automationStatus === 'manual');

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node scripts/design-lint.mjs <file> [<file> ...]');
  process.exit(2);
}

function lineNumberOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

// Blanks out /* ... */ block comments (same length, newlines preserved) so
// explanatory comments that happen to mention a hex value (e.g. "dark red on
// red, #8b000a on #b01f1f") don't trigger false positives, while keeping every
// other character's index/line number identical to the original for reporting.
// Deliberately does NOT touch `//` — CSS has no line-comment syntax, and
// blanking `//` inside JS would also blank live "https://" URLs elsewhere in
// the same file.
function stripBlockComments(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

// The Seed color is the one place a brand chooses its base color, and it has
// to be a literal value somewhere (Seed itself is the input tokens are
// derived from — see DESIGN.md). Rather than trusting a self-reported
// suppression comment (which could just as easily hide a real violation),
// the *only* structurally recognized exemption is the hex value inside a
// `data-seed="#xxxxxx"` HTML attribute.
function seedExemptRanges(content) {
  const ranges = [];
  const re = /data-seed\s*=\s*"(#[0-9a-fA-F]{3,8})"/g;
  let m;
  while ((m = re.exec(content))) {
    const start = m.index + m[0].indexOf(m[1]);
    ranges.push([start, start + m[1].length]);
  }
  return ranges;
}

let hasError = false;

for (const target of targets) {
  const relPath = relative(root, join(process.cwd(), target)).split('\\').join('/');
  const isExempt = EXEMPT_PATH_PREFIXES.some((p) => relPath.startsWith(p));
  const rawContent = readFileSync(target, 'utf8');
  const content = stripBlockComments(rawContent);
  const seedRanges = seedExemptRanges(content);
  const violations = [];

  for (const rule of staticRules) {
    if (isExempt && rule.id === 'NO_RAW_HEX_COLOR') continue;
    const re = new RegExp(rule.pattern, 'g');
    let match;
    while ((match = re.exec(content))) {
      const insideSeedAttr =
        rule.id === 'NO_RAW_HEX_COLOR' &&
        seedRanges.some(([s, e]) => match.index >= s && match.index < e);
      if (!insideSeedAttr) {
        violations.push({
          rule,
          line: lineNumberOf(content, match.index),
          snippet: match[0],
        });
      }
      if (match.index === re.lastIndex) re.lastIndex++; // guard against zero-width matches
    }
  }

  if (violations.length === 0) {
    console.log(`OK  ${target} — static rules: no violations`);
  } else {
    for (const v of violations) {
      const tag = v.rule.severity === 'error' ? 'ERROR' : 'WARN ';
      console.log(`${tag} ${target}:${v.line} [${v.rule.id}] "${v.snippet}" — ${v.rule.alternative}`);
      if (v.rule.severity === 'error') hasError = true;
    }
  }
}

if (manualRules.length) {
  console.log(`\n手動レビューが必要なルール(自動検出不可、design/rules.json 参照):`);
  for (const r of manualRules) console.log(`  - [${r.id}] ${r.alternative}`);
}

process.exit(hasError ? 1 : 0);
