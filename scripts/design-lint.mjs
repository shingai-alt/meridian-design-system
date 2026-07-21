#!/usr/bin/env node
// Phase 1 harness — Layer 3 (verification): scans files an AI agent just
// wrote/edited for violations of design/rules.json's automatically-detectable
// ("automationStatus": "static") rules: raw hex colors, hardcoded
// spacing/radius/motion, shadow-sm+ on non-floating layout blocks, accent
// used outside brand marks, outline:none without a :focus-visible fallback,
// and background/color token pairs that fail WCAG contrast.
//
// Usage:
//   node scripts/design-lint.mjs <file> [<file> ...]
//
// Exits 1 if any "error"-severity violation is found (fails CI / blocks a
// hook), exits 0 otherwise. "warning"-severity violations are reported but
// do not fail the run. Rules with "automationStatus": "manual" cannot be
// checked reliably at all — they are listed as reminders, not enforced here.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { createRequire } from 'node:module';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rules = JSON.parse(readFileSync(join(root, 'design/rules.json'), 'utf8'));

// color-engine.js is a classic-script/CJS hybrid (see its own header comment)
// so it's `require()`-ed via createRequire rather than `import`-ed, even
// though this file is ESM.
const require = createRequire(import.meta.url);
const { buildPalettes, buildSemantics, contrast, SEED_PRESETS } = require(
  join(root, 'src/color-engine.js')
);

// Paths where token/engine source code is expected to contain the exact
// patterns these rules forbid elsewhere (e.g. the literal hex values that
// back the seed color presets). Never lint these files against NO_RAW_HEX_COLOR.
const EXEMPT_PATH_PREFIXES = ['tokens/src/', 'src/color-engine.js'];

// Rules with a bespoke detector (below), not a single regex, are excluded
// from the generic regex loop.
const regexStaticRules = rules.filter((r) => r.automationStatus === 'static' && r.detector === 'regex');
const shadowLayerRule = rules.find((r) => r.id === 'SHADOW_ONLY_ON_FLOATING_LAYER');
const accentRule = rules.find((r) => r.id === 'ACCENT_BRAND_MARK_ONLY');
const focusVisibleRule = rules.find((r) => r.id === 'FOCUS_VISIBLE_REQUIRED');
const contrastRule = rules.find((r) => r.id === 'CONTRAST_AA_MINIMUM');
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

// Iterates every flat (non-nested) `selector{ declarations }` CSS rule block
// in the file. Shared by the shadow/accent/contrast detectors below.
function forEachCssRule(content, fn) {
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = ruleRe.exec(content))) {
    fn(m[1], m[2], m.index, m[0]);
  }
}

// shadow-xs is treated as a small-control tactile affordance (Button, Input,
// Slider thumb, Avatar ring) and is exempt regardless of whether the element
// floats — only shadow-sm/md/lg/overlay are true "layer elevation" and are
// checked here. A rule block is exempt if its selector names a known
// floating-UI pattern, or if its own declaration block sets position:fixed /
// position:absolute (the actual structural signal for "floats above other
// content" — see Atlassian's elevation guidance: floating buttons get
// elevation because they float, not because they're buttons).
const FLOATING_KEYWORDS = /dropdown|popover|menu|dialog|drawer|toast|tooltip|overlay|modal|sheet|fab|cmdk/i;

function findShadowLayerViolations(content) {
  const violations = [];
  forEachCssRule(content, (selector, body, index, whole) => {
    const shadowMatch = /box-shadow\s*:[^;]*var\(--shadow-(sm|md|lg|overlay)\)/.exec(body);
    if (!shadowMatch) return;
    const isFloating =
      FLOATING_KEYWORDS.test(selector) || /position\s*:\s*(fixed|absolute)/.test(body);
    if (isFloating) return;
    const shadowIndex = index + whole.indexOf(shadowMatch[0]);
    violations.push({
      line: lineNumberOf(content, shadowIndex),
      snippet: `${selector.trim()} { ${shadowMatch[0]} }`,
    });
  });
  return violations;
}

// accent (and accent-hover/-active/-on-solid) is reserved for brand-identity
// marks: logo marks and avatar gradients/fallbacks. Recognized by selector
// keyword, not by full DOM/semantic analysis — inline `style="..."`
// attributes are not scanned (only <style> block rules), same limitation as
// the shadow detector.
const BRAND_MARK_KEYWORDS = /mark|avatar|logo|brand/i;

function findAccentMisuseViolations(content) {
  const violations = [];
  forEachCssRule(content, (selector, body, index, whole) => {
    const accentMatch = /var\(--accent\b[^)]*\)/.exec(body);
    if (!accentMatch) return;
    if (BRAND_MARK_KEYWORDS.test(selector)) return;
    const accentIndex = index + whole.indexOf(accentMatch[0]);
    violations.push({
      line: lineNumberOf(content, accentIndex),
      snippet: `${selector.trim()} { ${accentMatch[0]} }`,
    });
  });
  return violations;
}

// File-level check: if anything resets outline:none, at least one
// :focus-visible rule must restore a real (non-none) outline. This is the
// pattern used throughout the codebase (a single global `:focus{outline:none}`
// + `:focus-visible{outline:var(--focus-w)...}` pair covers every element),
// so a whole-file check — not a per-selector pairing — matches how it's
// actually used. It cannot catch a one-off `.foo:focus{outline:none}` with
// no matching `:focus-visible` anywhere while a *different* element's pair
// exists; that residual gap stays a manual-review concern.
function findFocusVisibleViolations(content) {
  if (!/outline\s*:\s*none/.test(content)) return [];
  const hasRealFocusVisible = /:focus-visible[^{]*\{[^}]*outline\s*:\s*(?!none\b)[^;}]+/.test(content);
  if (hasRealFocusVisible) return [];
  return [{ line: 1, snippet: 'outline:none はあるが、outline を実際に描く :focus-visible ルールが見つからない' }];
}

// Only catches the case where a single CSS rule declares BOTH a semantic
// background and a semantic foreground color directly (the common pattern in
// this codebase — see e.g. `.badge.primary{background:...;color:...}`).
// Cannot resolve cascaded/inherited backgrounds from a separate rule or
// element. Aliases --fg/--bg to the buildSemantics() key names since
// applyTheme() sets both the full name and that short alias.
const TOKEN_ALIASES = { fg: 'foreground', bg: 'background' };

function findContrastViolations(content) {
  const violations = [];
  const contexts = [
    ['light', 'standard'], ['dark', 'standard'],
    ['light', 'high'], ['dark', 'high'],
  ];
  forEachCssRule(content, (selector, body, index, whole) => {
    const bgMatch = /(?:^|[;{])\s*background(?:-color)?\s*:\s*var\(--([a-zA-Z0-9-]+)\)/.exec(body);
    const fgMatch = /(?:^|[;{])\s*color\s*:\s*var\(--([a-zA-Z0-9-]+)\)/.exec(body);
    if (!bgMatch || !fgMatch) return;
    const bgToken = TOKEN_ALIASES[bgMatch[1]] || bgMatch[1];
    const fgToken = TOKEN_ALIASES[fgMatch[1]] || fgMatch[1];

    for (const seedPreset of SEED_PRESETS) {
      for (const [theme, contrastMode] of contexts) {
        const T = buildSemantics(buildPalettes(seedPreset.hex), theme, contrastMode);
        const bgHex = T[bgToken];
        const fgHex = T[fgToken];
        if (!bgHex || !fgHex) return; // one/both tokens aren't semantic color roles — not checkable here
        const target = contrastMode === 'high' ? 7 : 4.5;
        const ratio = contrast(fgHex, bgHex);
        if (ratio < target) {
          violations.push({
            line: lineNumberOf(content, index),
            snippet: `${selector.trim()} { color:var(--${fgMatch[1]}) on background:var(--${bgMatch[1]}) } — ${seedPreset.name} seed / ${theme}-${contrastMode}: ${ratio.toFixed(2)}:1 < ${target}`,
          });
          return; // one report per rule is enough
        }
      }
    }
  });
  return violations;
}

let hasError = false;

for (const target of targets) {
  const relPath = relative(root, join(process.cwd(), target)).split('\\').join('/');
  const isExempt = EXEMPT_PATH_PREFIXES.some((p) => relPath.startsWith(p));
  const rawContent = readFileSync(target, 'utf8');
  const content = stripBlockComments(rawContent);
  const seedRanges = seedExemptRanges(content);
  const violations = [];

  for (const rule of regexStaticRules) {
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

  if (shadowLayerRule) {
    for (const v of findShadowLayerViolations(content)) violations.push({ rule: shadowLayerRule, ...v });
  }
  if (accentRule) {
    for (const v of findAccentMisuseViolations(content)) violations.push({ rule: accentRule, ...v });
  }
  if (focusVisibleRule) {
    for (const v of findFocusVisibleViolations(content)) violations.push({ rule: focusVisibleRule, ...v });
  }
  if (contrastRule) {
    for (const v of findContrastViolations(content)) violations.push({ rule: contrastRule, ...v });
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
} else {
  console.log('\n手動レビューのみのルールはもう残っていません(8/8が自動検出対応)。');
}

process.exit(hasError ? 1 : 0);
