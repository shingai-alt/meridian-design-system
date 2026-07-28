import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  summarizeBrowserCandidate,
  validateAdapterDependencyAudit,
  validateAdapterBrowserEvaluationPlan,
  validateAdapterBrowserEvidence,
  validateShadcnRegistrySnapshot,
} from '../scripts/lib/adapter-browser-evidence.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const benchmark = readJson('design/adapter-benchmark.json');
const plan = readJson('design/adapter-browser-evaluation-plan.json');
const evidence = readJson('design/evidence/adapter-browser/manifest.json');
const dependencyAudit = readJson('design/evidence/adapter-browser/dependency-audit.json');
const shadcnSnapshot = readJson('design/evidence/adapter-browser/shadcn-registry-snapshot.json');

test('Adapter Browser Evaluation Plan covers the exact benchmark matrix', () => {
  assert.deepEqual(
    validateAgainstSchema(plan, readJson('schemas/adapter-browser-evaluation-plan.schema.json')),
    [],
  );
  assert.deepEqual(validateAdapterBrowserEvaluationPlan(plan, benchmark), []);
  assert.equal(plan.completionRule.requiredScenarioCount, 30);
});

test('Automated Adapter Browser Evidence is schema-valid and digest-bound', () => {
  assert.deepEqual(
    validateAgainstSchema(evidence, readJson('schemas/adapter-browser-evidence.schema.json')),
    [],
  );
  assert.deepEqual(validateAdapterBrowserEvidence(evidence, plan, benchmark, { root }), []);
  assert.equal(evidence.status, 'automated-complete');
  assert.equal(evidence.decisionEligible, false);
});

test('Adapter dependency audit is explicit, reconciled, and lockfile-bound', () => {
  assert.deepEqual(
    validateAgainstSchema(
      dependencyAudit,
      readJson('schemas/adapter-dependency-audit.schema.json'),
    ),
    [],
  );
  assert.deepEqual(validateAdapterDependencyAudit(dependencyAudit, plan, { root }), []);
  assert.equal(dependencyAudit.summary.high, 0);
  assert.equal(dependencyAudit.summary.critical, 0);
  assert.equal(dependencyAudit.summary.moderate, 3);
  assert.equal(dependencyAudit.status, 'open-findings');
});

test('shadcn adapter compiles the content-digested captured registry source', () => {
  assert.deepEqual(
    validateAgainstSchema(
      shadcnSnapshot,
      readJson('schemas/shadcn-registry-snapshot.schema.json'),
    ),
    [],
  );
  assert.deepEqual(validateShadcnRegistrySnapshot(shadcnSnapshot, { root }), []);
  assert.equal(shadcnSnapshot.cli.version, '4.8.3');
  assert.equal(shadcnSnapshot.items.length, 9);
  assert.equal(
    evidence.manualChecks.find((check) => check.id === 'shadcn-registry-parity')?.status,
    'complete',
  );
  assert.ok(
    evidence.source.implementationFiles.some(
      (file) => file.ref === 'spikes/external-adapters/src/adapters/shadcn-registry.tsx',
    ),
  );
  for (const item of shadcnSnapshot.items) {
    for (const source of item.files) {
      assert.ok(
        evidence.source.implementationFiles.some(
          (file) =>
            file.ref.endsWith(`/registry-parity/generated/${source.path}`) &&
            file.sha256 === source.contentSha256,
        ),
        source.path,
      );
    }
  }
});

test('Every candidate has both Pilots and all required viewports', () => {
  for (const candidateRef of plan.candidateRefs) {
    const scenarios = evidence.scenarios.filter((scenario) => scenario.candidateRef === candidateRef);
    assert.equal(scenarios.length, 6);
    assert.deepEqual(
      [...new Set(scenarios.map((scenario) => scenario.pilotRef))].sort(),
      [...plan.pilotRefs].sort(),
    );
    assert.deepEqual(
      [...new Set(scenarios.map((scenario) => scenario.viewport.id))].sort(),
      ['desktop', 'mobile', 'tablet'],
    );
    assert.deepEqual(
      evidence.candidateSummaries.find((summary) => summary.candidateRef === candidateRef),
      summarizeBrowserCandidate(candidateRef, evidence.scenarios),
    );
  }
});

test('Automated browser evidence cannot silently become selection-eligible', () => {
  const promoted = clone(evidence);
  promoted.decisionEligible = true;
  assert.match(
    validateAdapterBrowserEvidence(promoted, plan, benchmark, { root }).join('\n'),
    /decisionEligible flag is stale/,
  );

  const fakeComplete = clone(evidence);
  fakeComplete.status = 'complete';
  assert.match(
    validateAdapterBrowserEvidence(fakeComplete, plan, benchmark, { root }).join('\n'),
    /requires every selection-blocking manual check/,
  );
});

test('Evidence validator rejects partial matrices, stale summaries, and screenshot drift', () => {
  const partial = clone(evidence);
  partial.scenarios.pop();
  assert.match(
    validateAdapterBrowserEvidence(partial, plan, benchmark, { root }).join('\n'),
    /exact planned candidate × Pilot × viewport matrix/,
  );

  const stale = clone(evidence);
  stale.candidateSummaries[0].passedScenarioCount -= 1;
  assert.match(
    validateAdapterBrowserEvidence(stale, plan, benchmark, { root }).join('\n'),
    /candidate summaries are stale/,
  );

  const drift = clone(evidence);
  drift.scenarios[0].screenshot.sha256 = '0'.repeat(64);
  assert.match(
    validateAdapterBrowserEvidence(drift, plan, benchmark, { root }).join('\n'),
    /screenshot digest is stale/,
  );

  const staleSource = clone(evidence);
  staleSource.source.implementationFiles[0].sha256 = '0'.repeat(64);
  assert.match(
    validateAdapterBrowserEvidence(staleSource, plan, benchmark, { root }).join('\n'),
    /implementation source/,
  );
});

test('Evidence validator rejects omitted findings derived from layout and interaction checks', () => {
  const omittedOverflow = clone(evidence);
  omittedOverflow.scenarios[0].checks.layout.horizontalOverflow = true;
  assert.match(
    validateAdapterBrowserEvidence(omittedOverflow, plan, benchmark, { root }).join('\n'),
    /omits derived finding document-overflow/,
  );

  const omittedAccessibilityTree = clone(evidence);
  omittedAccessibilityTree.scenarios[0].checks.accessibility.absentFromTree.push(
    omittedAccessibilityTree.scenarios[0].checks.accessibility.controls[0],
  );
  assert.match(
    validateAdapterBrowserEvidence(omittedAccessibilityTree, plan, benchmark, { root }).join('\n'),
    /omits derived finding accessibility-tree/,
  );

  const omittedTouchTarget = clone(evidence);
  omittedTouchTarget.scenarios[0].checks.touchTargets.failures.push({
    index: 999,
    tag: 'button',
    testId: null,
    width: 20,
    height: 20,
  });
  assert.match(
    validateAdapterBrowserEvidence(omittedTouchTarget, plan, benchmark, { root }).join('\n'),
    /omits derived finding touch-target/,
  );
});
