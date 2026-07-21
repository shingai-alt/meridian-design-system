import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function fileDigest(path) {
  return `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

export function validateVisualQualityRelations({ rubric, candidates, conceptId }) {
  if (candidates.conceptId !== conceptId) throw new Error(`Visual candidates belong to ${candidates.conceptId}, expected ${conceptId}`);
  const criteria = new Map(rubric.criteria.map((criterion) => [criterion.id, criterion]));
  if (criteria.size !== rubric.criteria.length) throw new Error('Visual rubric criterion IDs must be unique');
  const totalWeight = rubric.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
  if (totalWeight !== 100) throw new Error(`Visual rubric weights must total 100, received ${totalWeight}`);
  const ids = new Set(candidates.candidates.map((candidate) => candidate.id));
  if (ids.size !== candidates.candidates.length) throw new Error('Visual candidate IDs must be unique');
  const baseline = candidates.candidates.find((candidate) => candidate.id === candidates.baselineId);
  if (!baseline || baseline.kind !== 'baseline') throw new Error('baselineId must reference the baseline candidate');
  const alternatives = candidates.candidates.filter((candidate) => candidate.kind === 'candidate');
  if (alternatives.length !== 3) throw new Error(`P0 requires exactly 3 alternative candidates, received ${alternatives.length}`);
  const layouts = new Set(candidates.candidates.map((candidate) => candidate.layout));
  if (layouts.size !== candidates.candidates.length) throw new Error('Baseline and P0 candidates must use structurally distinct layouts');

  for (const candidate of candidates.candidates) {
    const scoreIds = new Set(candidate.provisionalScores.map((score) => score.criterion));
    if (candidate.provisionalScores.length !== criteria.size || scoreIds.size !== criteria.size || [...criteria.keys()].some((id) => !scoreIds.has(id))) {
      throw new Error(`${candidate.id}: provisionalScores must cover every rubric criterion exactly once`);
    }
    if (candidate.repairRounds.length > 2) throw new Error(`${candidate.id}: at most 2 repair rounds are allowed`);
    if (candidate.kind === 'baseline' && candidate.critiqueStatus !== 'not-required') throw new Error(`${candidate.id}: baseline critiqueStatus must be not-required`);
    if (candidate.kind === 'candidate' && candidate.repairRounds.length === 0 && candidate.critiqueStatus !== 'repair-not-required') throw new Error(`${candidate.id}: a reviewed candidate without repair rounds must use repair-not-required`);
    if (candidate.kind === 'candidate' && candidate.repairRounds.length > 0 && candidate.critiqueStatus !== 'repaired') throw new Error(`${candidate.id}: a candidate with repair rounds must use repaired`);
    let previousUnresolved = null;
    for (const [index, round] of candidate.repairRounds.entries()) {
      if (round.round !== index + 1) throw new Error(`${candidate.id}: repair rounds must be unique and contiguous from 1`);
      for (const finding of [...round.findings, ...round.unresolvedFindings]) if (!criteria.has(finding.criterion)) throw new Error(`${candidate.id}: unknown criterion ${finding.criterion}`);
      const findingIds = new Set(round.findings.map((finding) => finding.id));
      if (findingIds.size !== round.findings.length) throw new Error(`${candidate.id}: round ${round.round} finding IDs must be unique`);
      if (previousUnresolved) {
        if (findingIds.size !== previousUnresolved.size || [...previousUnresolved.keys()].some((id) => !findingIds.has(id))) throw new Error(`${candidate.id}: round ${round.round} findings must exactly continue the previous unresolved findings`);
        for (const finding of round.findings) {
          const previous = previousUnresolved.get(finding.id);
          for (const property of ['criterion', 'severity', 'region', 'finding']) if (finding[property] !== previous[property]) throw new Error(`${candidate.id}: continued finding ${finding.id} changed ${property}`);
        }
      }
      const repairedIds = new Set();
      for (const repair of round.repairs) for (const findingId of repair.findingIds) {
        if (!findingIds.has(findingId)) throw new Error(`${candidate.id}: repair references unknown finding ${findingId}`);
        repairedIds.add(findingId);
      }
      const unresolvedIds = new Set(round.unresolvedFindings.map((finding) => finding.id));
      if (unresolvedIds.size !== round.unresolvedFindings.length || [...unresolvedIds].some((id) => !findingIds.has(id))) throw new Error(`${candidate.id}: unresolved findings must reference current findings exactly once`);
      const findingsById = new Map(round.findings.map((finding) => [finding.id, finding]));
      for (const unresolved of round.unresolvedFindings) {
        const source = findingsById.get(unresolved.id);
        for (const property of ['criterion', 'severity', 'region', 'finding']) if (unresolved[property] !== source[property]) throw new Error(`${candidate.id}: unresolved finding ${unresolved.id} changed ${property}`);
      }
      for (const id of findingIds) {
        const resolved = repairedIds.has(id);
        const unresolved = unresolvedIds.has(id);
        if (resolved === unresolved) throw new Error(`${candidate.id}: finding ${id} must be either repaired or unresolved`);
      }
      previousUnresolved = new Map(round.unresolvedFindings.map((finding) => [finding.id, finding]));
    }
  }
  const comparisonPairs = new Set();
  const comparisonIds = new Set();
  for (const comparison of candidates.comparisons) {
    if (!ids.has(comparison.left) || !ids.has(comparison.right) || comparison.left === comparison.right) {
      throw new Error(`${comparison.id}: comparison must reference two different candidates`);
    }
    if (comparisonIds.has(comparison.id)) throw new Error(`Duplicate comparison ID ${comparison.id}`);
    comparisonIds.add(comparison.id);
    const pair = [comparison.left, comparison.right].sort().join(':');
    if (comparisonPairs.has(pair)) throw new Error(`${comparison.id}: duplicate candidate pair ${pair}`);
    comparisonPairs.add(pair);
  }
  const requiredPairCount = (candidates.candidates.length * (candidates.candidates.length - 1)) / 2;
  if (comparisonPairs.size !== requiredPairCount) throw new Error(`Pairwise review must cover all ${requiredPairCount} candidate pairs`);
}

export function weightedScore(rubric, candidate, scoreOverride = null) {
  const scores = new Map((scoreOverride ?? candidate.provisionalScores).map((score) => [score.criterion, score.score]));
  const weighted = rubric.criteria.reduce((sum, criterion) => sum + scores.get(criterion.id) * criterion.weight, 0);
  return Math.round(weighted / rubric.scale.maximum);
}

export function validateVisualCaptureManifest({ manifest, candidates, conceptId, expectedScenarioId, root, sourcePaths }) {
  if (manifest.conceptId !== conceptId) throw new Error(`Visual capture manifest belongs to ${manifest.conceptId}, expected ${conceptId}`);
  const expectedSources = {
    html: fileDigest(join(root, sourcePaths.html)),
    candidates: fileDigest(join(root, sourcePaths.candidates)),
    rubric: fileDigest(join(root, sourcePaths.rubric)),
  };
  for (const [key, expected] of Object.entries(expectedSources)) {
    if (manifest.sourceDigests[key] !== expected) throw new Error(`Visual capture source ${key} is stale`);
  }
  const expected = new Set(candidates.candidates.flatMap((candidate) => ['desktop', 'mobile'].map((viewport) => `${candidate.id}:${viewport}`)));
  const actual = new Set();
  for (const capture of manifest.captures) {
    const key = `${capture.candidateId}:${capture.viewport}`;
    if (!expected.has(key)) throw new Error(`Unexpected visual capture ${key}`);
    if (actual.has(key)) throw new Error(`Duplicate visual capture ${key}`);
    actual.add(key);
    const expectedPath = `examples/generated/visual-review/${capture.candidateId}.${capture.viewport}.png`;
    if (capture.path !== expectedPath) throw new Error(`${key}: capture path must be ${expectedPath}`);
    const candidate = candidates.candidates.find((item) => item.id === capture.candidateId);
    if (capture.candidateLayout !== candidate.layout) throw new Error(`${key}: captured layout does not match the candidate`);
    if (capture.scenarioId !== expectedScenarioId) throw new Error(`${key}: captured scenario must be ${expectedScenarioId}`);
    const bytes = readFileSync(join(root, capture.path));
    if (bytes.readUInt32BE(16) !== capture.width || bytes.readUInt32BE(20) !== capture.height) throw new Error(`${key}: PNG dimensions do not match the manifest`);
    if (fileDigest(join(root, capture.path)) !== capture.digest) throw new Error(`${key}: capture digest does not match the PNG`);
    if (capture.viewport === 'mobile' && capture.width > 400) throw new Error(`${key}: mobile capture must be at most 400px wide`);
    if (capture.viewport === 'desktop' && capture.width < 1000) throw new Error(`${key}: desktop capture must be at least 1000px wide`);
  }
  if (actual.size !== expected.size) throw new Error(`Visual capture set is incomplete: expected ${expected.size}, received ${actual.size}`);
  return true;
}

export function createVisualReviewReport({ rubric, candidates, visualCritique }) {
  validateVisualQualityRelations({ rubric, candidates, conceptId: candidates.conceptId });
  if (!visualCritique) throw new Error('Screenshot-grounded visual critique is required to create a review report');
  const reports = candidates.candidates.map((candidate) => {
    const critique = visualCritique?.candidateReviews.find((review) => review.candidateId === candidate.id);
    const lastRound = candidate.repairRounds.at(-1);
    const majorFindingsAfterRepair = critique
      ? critique.findings.filter((finding) => finding.severity === 'major').length
      : lastRound ? lastRound.unresolvedFindings.filter((finding) => finding.severity === 'major').length : 0;
    const score = weightedScore(rubric, candidate, critique?.rubricScores);
    const critiqueComplete = candidate.kind === 'baseline' || ['repair-not-required', 'repaired'].includes(candidate.critiqueStatus);
    return {
      id: candidate.id,
      kind: candidate.kind,
      weightedScore: score,
      majorFindingsAfterRepair,
      passesProvisionalGate: critiqueComplete && score >= rubric.decisionPolicy.minimumWeightedScore && majorFindingsAfterRepair <= rubric.decisionPolicy.maximumMajorFindings,
      screenshots: [
        `examples/generated/visual-review/${candidate.id}.desktop.png`,
        `examples/generated/visual-review/${candidate.id}.mobile.png`,
      ],
      repairRounds: candidate.repairRounds.length,
    };
  });
  const alternatives = reports.filter((candidate) => candidate.kind === 'candidate');
  const provisionalPreference = [...alternatives].sort((a, b) => b.weightedScore - a.weightedScore || a.id.localeCompare(b.id))[0].id;
  return {
    schemaVersion: '0.1.0',
    conceptId: candidates.conceptId,
    rubricId: rubric.id,
    status: 'awaiting-human-comparison',
    critic: {
      kind: 'rubric-grounded-visual-agent',
      input: ['rendered-desktop-screenshot', 'rendered-mobile-screenshot', 'design-brief', 'reference-principles', 'design-strategy', 'visual-quality-rubric', 'candidate-hypothesis'],
      maximumRepairRounds: 2,
    },
    screenshotManifest: 'examples/generated/visual-review/manifest.json',
    candidates: reports,
    comparisons: candidates.comparisons.map((comparison) => ({ ...comparison, status: 'pending-human-review' })),
    humanDecisionRequired: true,
    provisionalPreference,
  };
}
