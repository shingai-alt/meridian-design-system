const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const root = join(__dirname, '..');
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));

test('Team Invitation Phase 2 manifest validates against its contract', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = readJson('schemas/phase-2-concept.schema.json');
  const value = readJson('examples/phase-2/team-invitation.phase2.json');
  assert.deepEqual(validateAgainstSchema(value, schema), []);
});

test('Phase 2 concept is gated by an approved Phase 1 package', () => {
  const concept = readJson('examples/phase-2/team-invitation.phase2.json');
  const source = readJson(concept.source.phaseOnePackage);
  assert.equal(source.meta.id, concept.source.sourcePackageId);
  assert.equal(source.meta.status, 'approved');
  assert.equal(source.review.status, 'approved');
  assert.equal(concept.source.requiredStatus, 'approved');
});

test('Phase 2 scenarios cover core business and review states', () => {
  const concept = readJson('examples/phase-2/team-invitation.phase2.json');
  const ids = concept.prototype.scenarios.map((scenario) => scenario.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes(concept.prototype.startScenario));
  assert.deepEqual(ids, ['primary_path', 'validation_errors', 'seat_exceeded', 'owner_confirmation', 'partial_success', 'maximum_batch']);
  assert.ok(concept.prototype.scenarios.every((scenario) => scenario.rows.length <= 10));
  assert.equal(concept.prototype.scenarios.find((scenario) => scenario.id === 'maximum_batch').rows.length, 10);
  const coverage = new Set(concept.prototype.scenarios.flatMap((scenario) => scenario.covers));
  assert.deepEqual([...coverage].sort(), ['existing-pending', 'max-batch', 'owner-confirmation', 'partial-success', 'primary', 'seat-exceeded', 'validation']);
  assert.deepEqual(concept.prototype.viewportModes, ['desktop', 'mobile']);
  assert.ok(concept.prototype.reviewLenses.includes('accessibility'));
});

test('Phase 2 coverage claims must match scenario fixture behavior', async () => {
  const { validatePhaseTwoCoverage } = await import('../scripts/lib/phase-2-validation.mjs');
  const concept = readJson('examples/phase-2/team-invitation.phase2.json');
  assert.deepEqual(validatePhaseTwoCoverage(concept), []);

  const invalid = structuredClone(concept);
  invalid.prototype.scenarios.find((scenario) => scenario.id === 'owner_confirmation').rows[0].role = 'Member';
  invalid.prototype.scenarios.find((scenario) => scenario.id === 'partial_success').sendFailureEmails = [];
  invalid.prototype.scenarios.find((scenario) => scenario.id === 'maximum_batch').rows.pop();
  const errors = validatePhaseTwoCoverage(invalid);
  assert.ok(errors.some((error) => error.includes('owner-confirmation')));
  assert.ok(errors.some((error) => error.includes('partial-success')));
  assert.ok(errors.some((error) => error.includes('max-batch')));
});

test('Phase 2 feedback example shape validates when exported', async () => {
  const { validateAgainstSchema } = await import('../scripts/lib/schema-validator.mjs');
  const schema = readJson('schemas/phase-2-feedback.schema.json');
  const feedback = {
    meta: { schemaVersion: '0.1.0', kind: 'phase-2-feedback', id: 'feedback_phase2_team_invitation_2026_07_14', conceptId: 'phase2_team_invitation', sourcePackageId: 'phase1_team_invitation', createdAt: '2026-07-14T00:00:00.000Z', reviewer: 'pilot-reviewer' },
    summary: { outcome: 'revision-requested', note: 'Seat不足時の回復導線を確認する' },
    entries: [{ id: 'feedback_01', category: 'product', severity: 'major', scenarioId: 'seat_exceeded', finding: '必要Seat数は分かるが回復先が曖昧', recommendation: 'Pending管理への導線を追加する', status: 'candidate' }]
  };
  assert.deepEqual(validateAgainstSchema(feedback, schema), []);
});

test('generated Phase 2 HTML contains interactive review capabilities', () => {
  const html = readFileSync(join(root, 'examples/generated/team-invitation.phase2.html'), 'utf8');
  assert.match(html, /Meridian Phase 2 Concept Generator/);
  assert.match(html, /id="scenario-select"/);
  assert.match(html, /data-viewport="mobile"/);
  assert.match(html, /id="feedback-finding"/);
  assert.match(html, /phase-2-feedback/);
  assert.match(html, /付与される権限と影響を理解しました/);
  assert.match(html, /querySelectorAll\('\.segmented \[data-viewport\]'\)/);
  assert.match(html, /setTimeout\(rerenderPreservingFocus,0\)/);
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  assert.equal(scripts.length, 3);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, { filename: `phase-2-inline-${index}.js` })));
});

test('renderer does not create links for unsafe evidence URL schemes', async () => {
  const { renderPhase2Html } = await import('../scripts/lib/phase-2-renderer.mjs');
  const manifest = readJson('examples/phase-2/team-invitation.phase2.json');
  const source = readJson(manifest.source.phaseOnePackage);
  source.researchPack.evidence[0].url = 'javascript:alert(1)';
  const html = renderPhase2Html({ manifest, phaseOne: source, tokensCss: '' });
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, />WCAG 2\.2<\/h4>/);
});
