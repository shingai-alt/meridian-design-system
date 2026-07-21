const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const policy = JSON.parse(readFileSync(join(root, 'design/accessibility.json'), 'utf8'));
const generatedSource = readFileSync(join(root, 'js/generated/accessibility-meta.js'), 'utf8');
const generated = vm.runInNewContext(`${generatedSource}\n({ A11Y_META, A11Y_REQUIREMENTS, A11Y_QUALITY_GATES });`);
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
const appShell = readFileSync(join(root, 'js/app-shell.js'), 'utf8');
const utils = readFileSync(join(root, 'js/utils.js'), 'utf8');
const docs = readFileSync(join(root, 'js/pages-foundations.js'), 'utf8');
const rules = JSON.parse(readFileSync(join(root, 'design/rules.json'), 'utf8'));
const plain = (value) => JSON.parse(JSON.stringify(value));

test('WCAG baseline, requirements, and quality gates stay synchronized', () => {
  assert.equal(policy.standard.version, '2.2');
  assert.equal(policy.standard.conformanceLevel, 'AA');
  assert.equal(policy.requirements.length, 26);
  assert.equal(new Set(policy.requirements.map((requirement) => requirement.id)).size, 26);
  assert.deepEqual(plain(generated.A11Y_REQUIREMENTS), policy.requirements);
  assert.deepEqual(plain(generated.A11Y_QUALITY_GATES), policy.qualityGates);
  assert.deepEqual(plain(generated.A11Y_META.policy), policy.policy);
});

test('WCAG 2.2 additions and Meridian target policy are explicit', () => {
  const criteria = new Set(policy.requirements.flatMap((requirement) => requirement.criteria));
  for (const criterion of ['2.4.11', '2.5.7', '2.5.8', '3.3.7', '3.3.8']) {
    assert.ok(criteria.has(criterion), `missing WCAG 2.2 criterion ${criterion}`);
  }
  assert.equal(policy.targetSize.minimumCssPx, 24);
  assert.equal(policy.targetSize.preferredCssPx, 44);
  assert.match(policy.policy.registryScope, /完全な代替一覧ではない/);
});

test('documentation shell provides bypass, focus, target, and status foundations', () => {
  assert.match(indexHtml, /<html lang="ja"/);
  assert.match(indexHtml, /class="skip-link"[^>]+data-skip-content/);
  assert.match(indexHtml, /button\{[^}]*min-inline-size:24px;min-block-size:24px/);
  assert.match(indexHtml, /:focus:not\(:focus-visible\)\{outline:none\}/);
  assert.doesNotMatch(indexHtml, /(^|\n):focus\{outline:none\}/);
  assert.match(appShell, /<main class="content" id="content" tabindex="-1">/);
  assert.match(appShell, /heading\.focus\(\{preventScroll:true\}\)/);
  assert.match(utils, /setAttribute\('role',tone==='danger'\?'alert':'status'\)/);
});

test('command menu exposes modal combobox semantics and restores focus', () => {
  assert.match(appShell, /role="dialog" aria-modal="true"/);
  assert.match(appShell, /role="combobox"[^>]+aria-controls="cmd-list"/);
  assert.match(appShell, /id="cmd-list" role="listbox"/);
  assert.match(appShell, /role="option" aria-selected=/);
  assert.match(appShell, /returnFocus\?\.isConnected/);
  assert.match(appShell, /e\.key==='Tab'\)\{e\.preventDefault\(\);\$\('#cmd-input'\)\.focus\(\)/);
});

test('docs and rules use the current baseline without stale thresholds', () => {
  assert.match(docs, /A11Y_REQUIREMENTS\.map/);
  assert.match(docs, /Loading indicatorを出す遅延時間はWCAG要件ではありません/);
  assert.doesNotMatch(docs, /40×40px 以上/);
  assert.doesNotMatch(docs, /1 秒未満はインジケータを出さない/);
  assert.doesNotMatch(docs, /0\.01ms に短縮/);
  const ids = new Set(rules.map((rule) => rule.id));
  for (const id of ['NO_POSITIVE_TABINDEX', 'INTERACTIVE_NAME_REQUIRED', 'TARGET_SIZE_MINIMUM', 'STATE_NOT_COLOR_ONLY', 'DRAG_ALTERNATIVE_REQUIRED']) {
    assert.ok(ids.has(id), `missing design rule ${id}`);
  }
});
