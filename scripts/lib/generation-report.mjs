import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { validateBrowserQaEvidence } from './browser-qa.mjs';
import { validateRepairRecord } from './ui-generation-repair.mjs';

function digest(value) {
  return `sha256-${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function unique(values) {
  return [...new Set(values)];
}

function projectScreens(manifest, sources) {
  const responsibilities = new Map(
    sources.screenResponsibilities.responsibilities.map((item) => [item.id, item]),
  );
  return manifest.screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    responsibilityRef: screen.responsibilityRef,
    responsibility: responsibilities.get(screen.responsibilityRef)?.responsibility ?? 'Unknown responsibility',
    patternRef: screen.patternRef,
  }));
}

function projectComponentAllocation(resolution) {
  const allocationByAdapter = new Map();
  for (const result of resolution.results) {
    const current = allocationByAdapter.get(result.adapterRef) ?? {
      adapterRef: result.adapterRef,
      status: 'selected',
      capabilityRefs: [],
      targetRefs: [],
    };
    current.capabilityRefs.push(result.capabilityRef);
    current.targetRefs.push(...result.targetRefs);
    if (result.status === 'unresolved') current.status = 'unresolved';
    else if (result.status === 'partial' && current.status !== 'unresolved') current.status = 'partial';
    allocationByAdapter.set(result.adapterRef, current);
  }
  return [...allocationByAdapter.values()].map((item) => ({
    ...item,
    capabilityRefs: unique(item.capabilityRefs),
    targetRefs: unique(item.targetRefs),
  }));
}

function projectDirections(directionSet) {
  return directionSet.directions.map((direction) => ({
    id: direction.id,
    title: direction.title,
    benefits: direction.benefits ?? ['Synthetic fixture direction used to verify report portability.'],
    risks: direction.risks ?? ['Synthetic fixture does not represent a production direction comparison.'],
  }));
}

function validateBinding(binding, root, label, errors) {
  if (!binding) return;
  if (isAbsolute(binding.ref)) {
    errors.push(`${label} must be repository-relative`);
    return;
  }
  const absolute = resolve(root, binding.ref);
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    errors.push(`${label} escapes the repository`);
  } else if (!existsSync(absolute)) {
    errors.push(`${label} does not exist`);
  } else if (`sha256-${createHash('sha256').update(readFileSync(absolute)).digest('hex')}` !== binding.digest) {
    errors.push(`${label} digest is stale`);
  }
}

export function computeGenerationReportReviewDigest(report) {
  const copy = structuredClone(report);
  copy.humanReview.approval = null;
  copy.humanReview.status = 'pending';
  copy.meta.status = copy.validation.status === 'pass' && copy.unresolved.length === 0
    ? 'ready-for-human-review'
    : copy.meta.status;
  return digest(copy);
}

export function createGenerationReport({
  manifest,
  manifestBinding,
  sources,
  browserEvidence = null,
  browserEvidenceBinding = null,
  repairRecord = null,
  repairRecordBinding = null,
  policy,
  generatedAt = '2026-07-27T12:00:00Z',
}) {
  const screens = projectScreens(manifest, sources);
  const componentAllocation = projectComponentAllocation(sources.adapterResolution);
  const validationStatus = browserEvidence
    ? (browserEvidence.meta.status === 'pass' ? 'pass' : 'blocked')
    : 'not-run';
  const unresolved = repairRecord
    ? [...repairRecord.summary.unresolvedFindingRefs]
    : unique(browserEvidence?.scenarios.flatMap((scenario) =>
      scenario.findings.map((finding) => finding.id)) ?? []);
  const reportStatus = validationStatus === 'not-run'
    ? 'evidence-missing'
    : (validationStatus === 'blocked' || unresolved.length ? 'qa-blocked' : 'ready-for-human-review');
  return {
    $schema: '../../../schemas/generation-report.schema.json',
    meta: {
      schemaVersion: '0.1.0',
      kind: 'generation-report',
      id: `generation-report-${manifest.meta.id}`,
      pilotId: manifest.meta.id.replace(/^fixture_generation_/, '').replace(/^generation_/, '').replaceAll('_', '-'),
      status: reportStatus,
      generatedAt,
    },
    source: {
      generationManifest: manifestBinding,
      browserQa: browserEvidenceBinding,
      repairRecord: repairRecordBinding,
    },
    screens,
    design: {
      directionRef: manifest.directionRef,
      visualProfileRef: manifest.visualProfileRef,
      adapterRefs: unique(sources.adapterResolution.results.map((result) => result.adapterRef)),
    },
    componentAllocation,
    excluded: unique(sources.screenResponsibilities.responsibilities.flatMap((item) => item.notResponsibleFor ?? [])),
    directions: projectDirections(sources.directionSet),
    recommendation: {
      directionRef: sources.directionSet.recommendation.directionRef,
      selectedDirectionRef: manifest.directionRef,
      rationale: sources.directionSet.recommendation.rationale,
    },
    validation: {
      status: validationStatus,
      scenarioSummary: browserEvidence?.summary ?? null,
      limitations: policy.limitations,
    },
    fixes: repairRecord?.attempts.map((attempt) => ({
      attemptRef: attempt.id,
      category: attempt.category,
      findingRefs: attempt.findingRefs,
      outcome: attempt.outcome,
      changedRefs: attempt.changedRefs,
    })) ?? [],
    unresolved,
    humanReview: {
      status: 'pending',
      requiredRole: 'design-owner',
      approval: null,
    },
  };
}

export function validateGenerationReport(report, manifest, sources, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  if (options.validateSourceBindings !== false) {
    for (const [name, binding] of Object.entries(report.source)) {
      validateBinding(binding, root, `Generation Report source ${name}`, errors);
    }
  }
  const expectedScreens = projectScreens(manifest, sources);
  if (JSON.stringify(report.screens) !== JSON.stringify(expectedScreens)) {
    errors.push('Generation Report screens or responsibilities are stale');
  }
  if (report.design.directionRef !== manifest.directionRef) errors.push('Generation Report direction is stale');
  if (report.design.visualProfileRef !== manifest.visualProfileRef) errors.push('Generation Report visual profile is stale');
  const expectedAdapters = unique(sources.adapterResolution.results.map((result) => result.adapterRef));
  if (JSON.stringify(report.design.adapterRefs) !== JSON.stringify(expectedAdapters)) {
    errors.push('Generation Report adapter allocation is stale');
  }
  if (JSON.stringify(report.componentAllocation) !== JSON.stringify(projectComponentAllocation(sources.adapterResolution))) {
    errors.push('Generation Report component allocation is stale');
  }
  const expectedExcluded = unique(
    sources.screenResponsibilities.responsibilities.flatMap((item) => item.notResponsibleFor ?? []),
  );
  if (JSON.stringify(report.excluded) !== JSON.stringify(expectedExcluded)) {
    errors.push('Generation Report excluded scope is stale');
  }
  if (JSON.stringify(report.directions) !== JSON.stringify(projectDirections(sources.directionSet))) {
    errors.push('Generation Report direction comparison is stale');
  }
  if (report.recommendation.selectedDirectionRef !== manifest.directionRef) {
    errors.push('Generation Report selected direction is stale');
  }
  if (
    report.recommendation.directionRef !== sources.directionSet.recommendation.directionRef
    || JSON.stringify(report.recommendation.rationale) !== JSON.stringify(sources.directionSet.recommendation.rationale)
  ) {
    errors.push('Generation Report recommendation is stale');
  }
  if (report.validation.status !== 'not-run' && !options.browserEvidence) {
    errors.push('Generation Report cannot claim Browser QA without bound evidence');
  }
  const syntheticEvidenceAllowed = options.allowSyntheticEvidence === true && manifest.meta.mode === 'fixture';
  if (options.browserEvidence) {
    if (!options.policy) {
      errors.push('Generation Report Browser QA validation requires the QA policy');
    } else if (!syntheticEvidenceAllowed) {
      for (const error of validateBrowserQaEvidence(options.browserEvidence, manifest, options.policy, {
        root,
        manifestRef: report.source.generationManifest.ref,
        policyRef: options.policyRef,
      })) {
        errors.push(`Browser QA evidence: ${error}`);
      }
    }
    const expectedValidation = options.browserEvidence.meta?.status === 'pass' ? 'pass' : 'blocked';
    if (report.validation.status !== expectedValidation) {
      errors.push('Generation Report validation status differs from Browser QA evidence');
    }
  }
  if (options.repairRecord && !syntheticEvidenceAllowed) {
    const initialFindingRefs = options.initialBrowserEvidence?.scenarios?.flatMap((scenario) =>
      scenario.findings.map((finding) => finding.id)) ?? [];
    for (const error of validateRepairRecord(options.repairRecord, manifest, options.policy, {
      root,
      initialFindingRefs,
    })) {
      errors.push(`Repair record: ${error}`);
    }
    if (
      report.source.browserQa
      && options.repairRecord.source.currentBrowserQa.digest !== report.source.browserQa.digest
    ) {
      errors.push('Repair record current Browser QA differs from Generation Report evidence');
    }
  }
  if (report.validation.status === 'not-run' && report.meta.status !== 'evidence-missing') {
    errors.push('Missing Browser QA evidence must keep Generation Report evidence-missing');
  }
  if (report.validation.status === 'blocked' && report.meta.status !== 'qa-blocked') {
    errors.push('Blocked Browser QA must block Generation Report');
  }
  if (
    report.validation.status === 'pass'
    && report.unresolved.length === 0
    && !['ready-for-human-review', 'approved', 'revision-requested'].includes(report.meta.status)
  ) {
    errors.push('Passing Browser QA report status is stale');
  }
  if (report.unresolved.length && ['ready-for-human-review', 'approved'].includes(report.meta.status)) {
    errors.push('Unresolved findings must block Generation Report');
  }
  const approval = report.humanReview.approval;
  if (report.humanReview.status === 'approved') {
    if (
      report.meta.status !== 'approved'
      || report.validation.status !== 'pass'
      || report.unresolved.length
      || approval?.actorType !== 'human'
      || approval?.role !== report.humanReview.requiredRole
      || approval?.decision !== 'approved'
    ) {
      errors.push('Generation Report approval requires passing QA, no unresolved findings, and Human design-owner approval');
    } else if (approval.reportDigest !== computeGenerationReportReviewDigest(report)) {
      errors.push('Generation Report Human approval digest is stale');
    }
  } else if (report.meta.status === 'approved') {
    errors.push('Approved Generation Report requires approved Human review');
  }
  if (options.browserEvidence && report.validation.scenarioSummary !== options.browserEvidence.summary) {
    if (JSON.stringify(report.validation.scenarioSummary) !== JSON.stringify(options.browserEvidence.summary)) {
      errors.push('Generation Report Browser QA summary is stale');
    }
  }
  const expectedFixes = options.repairRecord?.attempts.map((attempt) => ({
    attemptRef: attempt.id,
    category: attempt.category,
    findingRefs: attempt.findingRefs,
    outcome: attempt.outcome,
    changedRefs: attempt.changedRefs,
  })) ?? [];
  if (JSON.stringify(report.fixes) !== JSON.stringify(expectedFixes)) {
    errors.push('Generation Report fixes are stale');
  }
  const expectedUnresolved = options.repairRecord
    ? [...options.repairRecord.summary.unresolvedFindingRefs]
    : unique(options.browserEvidence?.scenarios.flatMap((scenario) =>
      scenario.findings.map((finding) => finding.id)) ?? []);
  if (JSON.stringify(report.unresolved) !== JSON.stringify(expectedUnresolved)) {
    errors.push('Generation Report unresolved findings are stale');
  }
  return errors;
}
