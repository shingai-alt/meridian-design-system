import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  summarizeAdapterCandidate,
  validateAdapterBenchmark,
} from '../scripts/lib/adapter-benchmark.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const benchmark = readJson('design/adapter-benchmark.json');
const research = readJson('design/research-decisions/ui-generation-reference-adapter.research.json');

test('External Adapter Benchmark satisfies its schema and semantic comparison rules', () => {
  assert.deepEqual(validateAgainstSchema(benchmark, readJson('schemas/adapter-benchmark.schema.json')), []);
  assert.deepEqual(validateAdapterBenchmark(benchmark), []);
});

test('Every candidate is compared against the exact same two Pilot capability sets', () => {
  const expectedPilots = benchmark.pilots.map((pilot) => pilot.id).sort();
  for (const candidate of benchmark.candidates) {
    assert.deepEqual(candidate.pilotCoverage.map((coverage) => coverage.pilotRef).sort(), expectedPilots);
    for (const pilot of benchmark.pilots) {
      const expected = pilot.capabilities.map((capability) => capability.id).sort();
      const actual = candidate.pilotCoverage
        .find((coverage) => coverage.pilotRef === pilot.id)
        .capabilities.map((capability) => capability.capabilityRef)
        .sort();
      assert.deepEqual(actual, expected);
    }
  }
});

test('Summary is derived from coverage rather than hand-scored candidate preference', () => {
  assert.deepEqual(
    benchmark.summary,
    benchmark.candidates.map((candidate) => summarizeAdapterCandidate(candidate, benchmark)),
  );
  assert.equal(benchmark.summary.find((item) => item.candidateRef === 'material-ui').commercial, 1);
  assert.equal(benchmark.summary.find((item) => item.candidateRef === 'radix-primitives').unresolved, 4);
  assert.equal(benchmark.summary.find((item) => item.candidateRef === 'carbon').unresolved, 3);
});

test('Commercial and unresolved capabilities remain explicit instead of silently falling back', () => {
  for (const candidate of benchmark.candidates) {
    for (const pilot of candidate.pilotCoverage) {
      for (const capability of pilot.capabilities) {
        if (capability.status === 'unresolved') assert.equal(capability.resolution, null);
        if (capability.status === 'commercial') {
          assert.match(`${capability.notes} ${candidate.licenseBoundary}`, /commercial|paid|license|Pro|Premium/i);
        }
      }
    }
  }
});

test('Benchmark evidence references resolve to the Reference Adapter Research Decision', () => {
  const evidenceIds = new Set(research.evidence.map((evidence) => evidence.id));
  for (const candidate of benchmark.candidates) {
    for (const evidenceRef of candidate.evidenceRefs) assert.ok(evidenceIds.has(evidenceRef), `${candidate.id}: ${evidenceRef}`);
    for (const pilot of candidate.pilotCoverage) {
      for (const capability of pilot.capabilities) {
        for (const evidenceRef of capability.evidenceRefs) assert.ok(evidenceIds.has(evidenceRef), `${candidate.id}.${capability.capabilityRef}: ${evidenceRef}`);
      }
    }
  }
});

test('Research remains non-recommending while browser evidence still requires manual checks', () => {
  assert.equal(research.status, 'researching');
  assert.equal(research.decision.status, 'pending');
  assert.equal(research.decision.recommendedCandidateId, null);
  assert.equal(research.decision.approval, null);
  assert.equal(benchmark.browserEvaluation.status, 'in-progress');
  assert.ok(benchmark.browserEvaluation.artifactRefs.includes('design/evidence/adapter-browser/manifest.json'));
  assert.ok(benchmark.browserEvaluation.blockers.length > 0);
});

test('Validator rejects a partial comparison, stale summary, and premature decision-ready claim', () => {
  const partial = clone(benchmark);
  partial.candidates[0].pilotCoverage[0].capabilities.pop();
  assert.match(validateAdapterBenchmark(partial).join('\n'), /does not assess the exact shared capability set/);

  const stale = clone(benchmark);
  stale.summary[0].native += 1;
  assert.match(validateAdapterBenchmark(stale).join('\n'), /summary is stale/);

  const premature = clone(benchmark);
  premature.status = 'decision-ready';
  assert.match(validateAdapterBenchmark(premature).join('\n'), /requires completed browser evaluation/);
});
