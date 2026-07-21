import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const digestFile = (path) => `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`;

function unique(values, label) {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

export function validateReferenceRetrieval({ manifest, conceptId, sourcePackageId, root }) {
  if (manifest.conceptId !== conceptId) throw new Error(`Reference manifest belongs to ${manifest.conceptId}, expected ${conceptId}`);
  if (manifest.sourcePackageId !== sourcePackageId) throw new Error(`Reference manifest source is ${manifest.sourcePackageId}, expected ${sourcePackageId}`);
  unique(manifest.references.map((reference) => reference.id), 'Reference IDs');
  const analogyTypes = new Set(manifest.references.map((reference) => reference.analogyType));
  for (const required of ['direct', 'adjacent', 'distant']) if (!analogyTypes.has(required)) throw new Error(`Reference manifest must include ${required} analogies`);
  const captured = manifest.references.filter((reference) => reference.capture);
  if (captured.length < 3) throw new Error('Reference manifest must include at least 3 locally captured references');
  for (const reference of captured) {
    const absolute = join(root, reference.capture.path);
    const bytes = readFileSync(absolute);
    if (digestFile(absolute) !== reference.capture.digest) throw new Error(`${reference.id}: reference capture digest is stale`);
    if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error(`${reference.id}: reference capture must be a PNG`);
    if (bytes.readUInt32BE(16) !== reference.capture.width || bytes.readUInt32BE(20) !== reference.capture.height) throw new Error(`${reference.id}: reference capture dimensions are stale`);
  }
  return true;
}

export function validatePrincipleRelations({ principles, references, conceptId, referenceManifestRef = null }) {
  if (principles.conceptId !== conceptId) throw new Error(`Principles belong to ${principles.conceptId}, expected ${conceptId}`);
  if (referenceManifestRef && principles.referenceManifestRef !== referenceManifestRef) throw new Error(`Principles reference ${principles.referenceManifestRef}, expected ${referenceManifestRef}`);
  const referenceIds = new Set(references.references.map((reference) => reference.id));
  const principleIds = principles.principles.map((principle) => principle.id);
  unique(principleIds, 'Principle IDs');
  unique(principles.antiPatterns.map((pattern) => pattern.id), 'Anti-pattern IDs');
  for (const item of [...principles.principles, ...principles.antiPatterns]) {
    for (const referenceId of item.evidenceRefs) if (!referenceIds.has(referenceId)) throw new Error(`${item.id}: unknown reference ${referenceId}`);
  }
  return true;
}

export function validateStrategyRelations({ strategies, principles, conceptId, principlesRef = null }) {
  if (strategies.conceptId !== conceptId) throw new Error(`Strategies belong to ${strategies.conceptId}, expected ${conceptId}`);
  if (principlesRef && strategies.principlesRef !== principlesRef) throw new Error(`Strategies reference ${strategies.principlesRef}, expected ${principlesRef}`);
  const principleIds = new Set(principles.principles.map((principle) => principle.id));
  unique(strategies.strategies.map((strategy) => strategy.id), 'Strategy IDs');
  unique(strategies.strategies.map((strategy) => strategy.taskModel), 'Strategy task models');
  if (!strategies.strategies.some((strategy) => strategy.id === strategies.recommendation)) throw new Error('Strategy recommendation must reference a strategy');
  for (const strategy of strategies.strategies) for (const principleId of strategy.principleRefs) {
    if (!principleIds.has(principleId)) throw new Error(`${strategy.id}: unknown principle ${principleId}`);
  }
  return true;
}

export function createGroundingReport({ strategies, registry, strategiesRef }) {
  const componentIds = new Set(registry.components.map((component) => component.id));
  return {
    schemaVersion: '0.1.0',
    conceptId: strategies.conceptId,
    registryDigest: registry.translationPackDigest,
    strategiesRef,
    strategies: strategies.strategies.map((strategy) => {
      const resolvedComponents = strategy.requiredComponents.filter((component) => componentIds.has(component));
      const missingComponents = strategy.requiredComponents.filter((component) => !componentIds.has(component));
      return {
        strategyId: strategy.id,
        status: missingComponents.length ? 'proposal-required' : 'grounded',
        resolvedComponents,
        missingComponents,
      };
    }),
  };
}

export function assertGroundingReady(report) {
  const blocked = report.strategies.filter((strategy) => strategy.status === 'proposal-required');
  if (blocked.length) throw new Error(`Generation blocked by unregistered components: ${blocked.map((strategy) => `${strategy.strategyId} (${strategy.missingComponents.join(', ')})`).join('; ')}`);
  return true;
}

export function validateCandidateStrategyRelations({ candidates, strategies, principles }) {
  const strategyIds = new Set(strategies.strategies.map((strategy) => strategy.id));
  const principleIds = new Set(principles.principles.map((principle) => principle.id));
  const alternativeStrategyRefs = [];
  for (const candidate of candidates.candidates) {
    if (candidate.kind === 'baseline') continue;
    if (!strategyIds.has(candidate.strategyRef)) throw new Error(`${candidate.id}: unknown strategy ${candidate.strategyRef}`);
    alternativeStrategyRefs.push(candidate.strategyRef);
    for (const principleRef of candidate.principleRefs) if (!principleIds.has(principleRef)) throw new Error(`${candidate.id}: unknown principle ${principleRef}`);
    const strategy = strategies.strategies.find((item) => item.id === candidate.strategyRef);
    const candidatePrinciples = new Set(candidate.principleRefs);
    const missingPrinciples = strategy.principleRefs.filter((principleRef) => !candidatePrinciples.has(principleRef));
    if (missingPrinciples.length) throw new Error(`${candidate.id}: candidate is missing strategy principles ${missingPrinciples.join(', ')}`);
  }
  unique(alternativeStrategyRefs, 'Alternative candidate strategy references');
  return true;
}

export function validateVisualCritiqueRelations({ critique, captureManifest, candidates, rubric }) {
  if (critique.conceptId !== candidates.conceptId) throw new Error(`Visual critique belongs to ${critique.conceptId}, expected ${candidates.conceptId}`);
  if (critique.rubricId !== rubric.id) throw new Error(`Visual critique rubric is ${critique.rubricId}, expected ${rubric.id}`);
  const candidateIds = new Set(candidates.candidates.map((candidate) => candidate.id));
  const reviewIds = critique.candidateReviews.map((review) => review.candidateId);
  unique(reviewIds, 'Visual critique candidate IDs');
  if (reviewIds.length !== candidateIds.size || reviewIds.some((id) => !candidateIds.has(id))) throw new Error('Visual critique must review every candidate exactly once');
  const criteria = new Set(rubric.criteria.map((criterion) => criterion.id));
  const captures = new Map(captureManifest.captures.map((capture) => [`${capture.candidateId}:${capture.viewport}`, capture]));
  for (const review of critique.candidateReviews) {
    const scoreIds = review.rubricScores.map((score) => score.criterion);
    unique(scoreIds, `${review.candidateId} critique score criteria`);
    if (scoreIds.length !== criteria.size || scoreIds.some((id) => !criteria.has(id))) throw new Error(`${review.candidateId}: critique scores must cover the rubric exactly once`);
    const viewports = review.evidence.map((evidence) => evidence.viewport);
    unique(viewports, `${review.candidateId} critique evidence viewports`);
    if (!viewports.includes('desktop') || !viewports.includes('mobile')) throw new Error(`${review.candidateId}: critique requires desktop and mobile evidence`);
    for (const evidence of review.evidence) {
      const capture = captures.get(`${review.candidateId}:${evidence.viewport}`);
      if (!capture || capture.path !== evidence.path || capture.digest !== evidence.digest) throw new Error(`${review.candidateId}:${evidence.viewport} critique evidence is stale`);
    }
    for (const finding of review.findings) if (!criteria.has(finding.criterion)) throw new Error(`${review.candidateId}: unknown critique criterion ${finding.criterion}`);
  }
  return true;
}

export function critiqueScoresForCandidate(critique, candidateId) {
  return critique.candidateReviews.find((review) => review.candidateId === candidateId)?.rubricScores ?? null;
}
