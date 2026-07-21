const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const source = JSON.parse(readFileSync(join(root, 'design/content-guidelines.json'), 'utf8'));
const generatedSource = readFileSync(join(root, 'js/generated/content-guidelines-meta.js'), 'utf8');
const generated = vm.runInNewContext(`${generatedSource}\n({ CONTENT_META, CONTENT_RULES, CONTENT_PATTERNS, CONTENT_TERMS, CONTENT_QUALITY_GATES });`);
const docs = readFileSync(join(root, 'js/pages-foundations.js'), 'utf8');
const designMd = readFileSync(join(root, 'DESIGN.md'), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));

test('content source and generated metadata stay synchronized', () => {
  assert.equal(source.voice.length, 4);
  assert.equal(source.rules.length, 23);
  assert.equal(source.messagePatterns.length, 7);
  assert.equal(source.terms.length, 12);
  assert.equal(source.qualityGates.length, 5);
  assert.deepEqual(plain(generated.CONTENT_META), { locale: source.locale, voice: source.voice });
  assert.deepEqual(plain(generated.CONTENT_RULES), source.rules);
  assert.deepEqual(plain(generated.CONTENT_PATTERNS), source.messagePatterns);
  assert.deepEqual(plain(generated.CONTENT_TERMS), source.terms);
  assert.deepEqual(plain(generated.CONTENT_QUALITY_GATES), source.qualityGates);
});

test('rules cover every content decision category and have executable examples', () => {
  const categories = new Set(source.rules.map((rule) => rule.category));
  assert.deepEqual([...categories].sort(), ['accessibility', 'actions', 'ai', 'format', 'forms', 'localization', 'states', 'voice']);
  assert.equal(new Set(source.rules.map((rule) => rule.id)).size, source.rules.length);
  for (const rule of source.rules) {
    assert.ok(rule.do.length > 0, `${rule.id} must define do examples`);
    assert.ok(rule.dont.length > 0, `${rule.id} must define dont examples`);
  }
});

test('state and AI message patterns are complete', () => {
  const patterns = new Map(source.messagePatterns.map((pattern) => [pattern.id, pattern]));
  for (const id of ['error', 'success', 'empty', 'confirmation', 'loading', 'permission', 'ai-output']) {
    assert.ok(patterns.has(id), `missing ${id} message pattern`);
    assert.ok(patterns.get(id).requiredParts.length >= 2);
  }
  const aiRuleIds = source.rules.filter((rule) => rule.category === 'ai').map((rule) => rule.id);
  assert.deepEqual(aiRuleIds, ['ai-disclosure-and-scope', 'ai-uncertainty-and-recovery', 'ai-data-transparency']);
});

test('terminology and localization policy are machine-readable', () => {
  assert.equal(source.locale.default, 'ja-JP');
  assert.equal(source.locale.fallback, 'en');
  assert.equal(new Set(source.terms.map((term) => term.concept)).size, source.terms.length);
  assert.ok(source.rules.some((rule) => rule.id === 'no-string-concatenation'));
  assert.ok(source.rules.some((rule) => rule.id === 'flexible-content-length'));
  assert.ok(source.rules.some((rule) => rule.id === 'localized-number-date-time'));
});

test('human and AI docs render from the same content source', () => {
  assert.match(docs, /CONTENT_RULES\.map/);
  assert.match(docs, /CONTENT_PATTERNS\.map/);
  assert.match(docs, /CONTENT_TERMS\.map/);
  assert.match(docs, /AI-generated content/);
  assert.match(designMd, /## Content Guidelines/);
  assert.match(designMd, /ai-disclosure-and-scope/);
  assert.match(designMd, /Canonical terms/);
});
