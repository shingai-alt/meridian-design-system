import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  browserQaSummary,
  deriveScenarioFindings,
  measureManifestStressCoverage,
  validateBrowserQaPolicy,
} from '../scripts/lib/browser-qa.mjs';
import {
  computeLockedStructureDigest,
  validateRepairRecord,
} from '../scripts/lib/ui-generation-repair.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (ref) => JSON.parse(readFileSync(join(root, ref), 'utf8'));
const policy = readJson('design/ui-generation-browser-qa-policy.json');
const issueManifest = readJson('test/fixtures/ui-generation/issue-triage.generation-manifest.json');

function passingChecks() {
  return {
    consoleErrors: [],
    pageErrors: [],
    horizontalOverflow: false,
    duplicateIds: [],
    danglingAriaRefs: [],
    unnamedControls: [],
    keyboard: {
      expected: 4,
      reached: 4,
      missing: [],
      missingVisibleFocus: [],
      obscured: [],
    },
    stateSignal: {
      expected: 'article[data-state="default"]',
      observed: 1,
      pass: true,
    },
    runtimeProvenance: {
      rendered: 4,
      unknown: [],
      incomplete: [],
    },
  };
}

test('M7 Browser QA policy satisfies schema and fixed semantic matrix', () => {
  assert.deepEqual(
    validateAgainstSchema(policy, readJson('schemas/browser-qa-policy.schema.json')),
    [],
  );
  assert.deepEqual(validateBrowserQaPolicy(policy), []);
  assert.deepEqual(
    policy.viewports.map(({ id, width }) => [id, width]),
    [['desktop', 1440], ['tablet', 768], ['mobile', 375]],
  );
  assert.equal(policy.repair.maximumRounds, 2);
  assert.deepEqual(policy.repair.limits, {
    deterministicValidation: 5,
    structuralRepair: 2,
    visualRepair: 2,
    patternReselection: 1,
  });
  assert.ok(policy.repair.lockedLayers.includes('selected-direction'));
});

function repairRecord(attempts, status = 'blocked') {
  const lockedStructureDigest = computeLockedStructureDigest(issueManifest);
  const counts = {
    deterministicValidation: 0,
    structuralRepair: 0,
    visualRepair: 0,
    patternReselection: 0,
  };
  const keys = {
    'deterministic-validation': 'deterministicValidation',
    'structural-repair': 'structuralRepair',
    'visual-repair': 'visualRepair',
    'pattern-reselection': 'patternReselection',
  };
  attempts.forEach((attempt) => { counts[keys[attempt.category]] += 1; });
  return {
    $schema: '../../../schemas/ui-generation-repair-record.schema.json',
    meta: {
      schemaVersion: '0.1.0',
      kind: 'ui-generation-repair-record',
      id: 'repair-fixture-issue-triage',
      pilotId: 'issue-triage',
      status,
      updatedAt: '2026-07-27T12:00:00Z',
    },
    source: {
      policy: { ref: 'design/ui-generation-browser-qa-policy.json', digest: `sha256-${'0'.repeat(64)}` },
      generationManifest: { ref: 'test/fixtures/ui-generation/issue-triage.generation-manifest.json', digest: `sha256-${'0'.repeat(64)}` },
      initialBrowserQa: { ref: 'initial.evidence.json', digest: `sha256-${'0'.repeat(64)}` },
      currentBrowserQa: { ref: 'current.evidence.json', digest: `sha256-${'0'.repeat(64)}` },
    },
    lockedStructureDigest,
    attempts,
    summary: {
      ...counts,
      resolvedFindingRefs: [],
      unresolvedFindingRefs: [],
    },
  };
}

test('repair contract enforces limits and prevents AI mutation of locked structure', () => {
  const lockedStructureDigest = computeLockedStructureDigest(issueManifest);
  const validAttempt = {
    id: 'repair-01',
    sequence: 1,
    category: 'visual-repair',
    findingRefs: ['finding-01-horizontal-overflow'],
    targetLayer: 'layout-recipe',
    actorType: 'ai',
    outcome: 'resolved',
    changedRefs: ['design/layout-recipe-registry.json'],
    lockedStructureDigestBefore: lockedStructureDigest,
    lockedStructureDigestAfter: lockedStructureDigest,
  };
  const valid = repairRecord([validAttempt], 'repaired');
  valid.summary.resolvedFindingRefs = ['finding-01-horizontal-overflow'];
  assert.deepEqual(
    validateAgainstSchema(valid, readJson('schemas/ui-generation-repair-record.schema.json')),
    [],
  );
  assert.deepEqual(validateRepairRecord(valid, issueManifest, policy, {
    initialFindingRefs: ['finding-01-horizontal-overflow'],
    validateSourceBindings: false,
  }), []);

  const forbiddenAttempt = {
    ...validAttempt,
    id: 'repair-locked',
    category: 'pattern-reselection',
    targetLayer: 'selected-patterns',
    outcome: 'resolved',
  };
  const forbidden = repairRecord([forbiddenAttempt], 'repaired');
  assert.match(
    validateRepairRecord(forbidden, issueManifest, policy, { validateSourceBindings: false }).join('\n'),
    /AI cannot repair locked layer|must be escalated/,
  );

  const tooMany = repairRecord(Array.from({ length: 3 }, (_, index) => ({
    ...validAttempt,
    id: `repair-${index + 1}`,
    sequence: index + 1,
  })), 'repaired');
  assert.match(validateRepairRecord(tooMany, issueManifest, policy, {
    validateSourceBindings: false,
  }).join('\n'), /exceeds repair limit|maximum Browser QA rounds/);
});

test('structural and pattern repair are routed to Human review', () => {
  const lockedStructureDigest = computeLockedStructureDigest(issueManifest);
  const record = repairRecord([{
    id: 'repair-escalation-01',
    sequence: 1,
    category: 'structural-repair',
    findingRefs: ['finding-structure-01'],
    targetLayer: 'selected-direction',
    actorType: 'ai',
    outcome: 'escalated',
    changedRefs: [],
    lockedStructureDigestBefore: lockedStructureDigest,
    lockedStructureDigestAfter: lockedStructureDigest,
  }], 'human-review-required');
  record.summary.unresolvedFindingRefs = ['finding-structure-01'];
  assert.match(
    validateRepairRecord(record, issueManifest, policy, {
      initialFindingRefs: ['finding-structure-01'],
      validateSourceBindings: false,
    }).join('\n'),
    /AI cannot repair locked layer/,
  );
  record.attempts[0].actorType = 'human';
  assert.deepEqual(validateRepairRecord(record, issueManifest, policy, {
    initialFindingRefs: ['finding-structure-01'],
    validateSourceBindings: false,
  }), []);
});

test('finding classification is derived from checks and cannot hide blocking failures', () => {
  const checks = passingChecks();
  checks.horizontalOverflow = true;
  checks.danglingAriaRefs = ['aria-describedby:missing'];
  checks.keyboard.missingVisibleFocus = ['primary-action'];
  checks.runtimeProvenance.unknown = ['invented-usage'];
  const findings = deriveScenarioFindings(checks);
  assert.deepEqual(
    findings.map(({ severity, layer, code }) => [severity, layer, code]),
    [
      ['major', 'layout-recipe', 'horizontal-overflow'],
      ['major', 'component-runtime', 'dangling-aria-ref'],
      ['major', 'component-runtime', 'focus-not-visible'],
      ['critical', 'component-runtime', 'unknown-usage'],
    ],
  );
  assert.ok(findings.every((item) => item.lockedStructureImpact === false));
  assert.match(
    deriveScenarioFindings(checks, 'scenario-issue-default-mobile')[0].id,
    /^finding-scenario-issue-default-mobile-/,
  );
});

test('contradictory Browser QA self-reporting produces blocking findings', () => {
  const checks = passingChecks();
  checks.keyboard = {
    expected: 4,
    reached: 0,
    missing: [],
    missingVisibleFocus: [],
    obscured: [],
  };
  checks.stateSignal = {
    expected: 'article[data-state="default"]',
    observed: 0,
    pass: true,
  };
  checks.runtimeProvenance.rendered = 0;
  assert.deepEqual(
    deriveScenarioFindings(checks).map((item) => [item.severity, item.code]),
    [
      ['critical', 'keyboard-accounting-invalid'],
      ['major', 'state-signal-missing'],
      ['critical', 'runtime-not-rendered'],
    ],
  );
});

test('Issue Triage fixture supplies long Japanese and high-density stress evidence', () => {
  const coverage = measureManifestStressCoverage(issueManifest, policy);
  assert.equal(coverage.longJapanese.status, 'pass');
  assert.equal(coverage.highDensity.status, 'pass');
  assert.ok(coverage.longJapanese.observed >= 80);
  assert.ok(coverage.highDensity.observed >= 10);
});

test('Browser QA summary is derived from scenario findings', () => {
  const pass = { status: 'pass', findings: [] };
  const blocked = {
    status: 'blocked',
    findings: [
      { severity: 'critical' },
      { severity: 'major' },
      { severity: 'minor' },
    ],
  };
  assert.deepEqual(browserQaSummary([pass, blocked]), {
    expected: 2,
    completed: 2,
    passed: 1,
    blocked: 1,
    criticalFindings: 1,
    majorFindings: 1,
    minorFindings: 1,
  });
});
