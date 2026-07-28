import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, normalize } from 'node:path';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const duplicates = (values) => values.filter((value, index) => values.indexOf(value) !== index);
const sorted = (values) => [...values].sort();
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function safeRepositoryPath(root, ref) {
  if (typeof ref !== 'string' || isAbsolute(ref)) return null;
  const normalized = normalize(ref);
  if (normalized === '..' || normalized.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) return null;
  return join(root, normalized);
}

function verifyDigest(errors, root, ref, expected, label) {
  const path = safeRepositoryPath(root, ref);
  if (!path) {
    errors.push(`${label} must be a repository-relative path`);
    return;
  }
  if (!existsSync(path)) {
    errors.push(`${label} does not exist: ${ref}`);
    return;
  }
  const actual = sha256(readFileSync(path));
  if (actual !== expected) errors.push(`${label} digest is stale for ${ref}`);
}

export function summarizeBrowserCandidate(candidateRef, scenarios) {
  const candidateScenarios = scenarios.filter((scenario) => scenario.candidateRef === candidateRef);
  const findings = candidateScenarios.flatMap((scenario) => scenario.findings);
  return {
    candidateRef,
    scenarioCount: candidateScenarios.length,
    passedScenarioCount: candidateScenarios.filter((scenario) => !scenario.blocking).length,
    critical: findings.filter((finding) => finding.severity === 'critical').length,
    major: findings.filter((finding) => finding.severity === 'major').length,
    minor: findings.filter((finding) => finding.severity === 'minor').length,
    blocking: findings.some((finding) => ['critical', 'major'].includes(finding.severity)),
  };
}

export function validateAdapterBrowserEvaluationPlan(plan, benchmark) {
  const errors = [];
  const candidateIds = benchmark.candidates.map((candidate) => candidate.id);
  const pilotIds = benchmark.pilots.map((pilot) => pilot.id);
  if (!same(sorted(plan.candidateRefs), sorted(candidateIds))) {
    errors.push('browser plan must use the exact benchmark candidate set');
  }
  if (!same(sorted(plan.pilotRefs), sorted(pilotIds))) {
    errors.push('browser plan must use the exact benchmark Pilot set');
  }
  const viewportIds = plan.viewports.map((viewport) => viewport.id);
  if (!same(sorted(viewportIds), ['desktop', 'mobile', 'tablet'])) {
    errors.push('browser plan must define exactly Desktop, Tablet, and Mobile');
  }
  if (duplicates(viewportIds).length > 0) errors.push('browser plan has duplicate viewport IDs');
  if (duplicates(plan.checks.map((check) => check.id)).length > 0) errors.push('browser plan has duplicate check IDs');
  const requiredCheckIds = [
    'business-journey',
    'keyboard-focus',
    'accessible-names',
    'responsive-overflow',
    'forced-colors',
    'touch-targets',
    'runtime-stability',
    'assistive-technology',
  ];
  const checkIds = plan.checks.map((check) => check.id);
  if (!requiredCheckIds.every((id) => checkIds.includes(id))) {
    errors.push('browser plan is missing one or more required evaluation checks');
  }
  const expectedScenarioCount = plan.candidateRefs.length * plan.pilotRefs.length * plan.viewports.length;
  if (plan.completionRule.requiredScenarioCount !== expectedScenarioCount) {
    errors.push(`browser plan requiredScenarioCount must equal its ${expectedScenarioCount}-scenario Cartesian product`);
  }
  const assistiveCheck = plan.checks.find((check) => check.id === 'assistive-technology');
  if (!assistiveCheck || assistiveCheck.automated) {
    errors.push('assistive-technology must be an explicit manual check');
  }
  if (!plan.completionRule.manualAssistiveTechnologyRequiredForSelection) {
    errors.push('manual assistive technology must remain required for selection');
  }
  if (plan.completionRule.allowAutomatedEvidenceToClaimConformance) {
    errors.push('automated browser evidence cannot claim accessibility conformance');
  }
  return errors;
}

export function validateAdapterBrowserEvidence(evidence, plan, benchmark, { root }) {
  const errors = [];
  verifyDigest(errors, root, evidence.source.planRef, evidence.source.planSha256, 'browser evidence plan');
  verifyDigest(errors, root, evidence.source.benchmarkRef, evidence.source.benchmarkSha256, 'browser evidence benchmark');
  verifyDigest(errors, root, evidence.source.packageLockRef, evidence.source.packageLockSha256, 'browser evidence package lock');
  verifyDigest(errors, root, evidence.build.manifestRef, evidence.build.manifestSha256, 'browser evidence build manifest');
  const implementationRefs = evidence.source.implementationFiles.map((file) => file.ref);
  if (duplicates(implementationRefs).length > 0) {
    errors.push('browser evidence has duplicate implementation source refs');
  }
  for (const file of evidence.source.implementationFiles) {
    verifyDigest(errors, root, file.ref, file.sha256, `browser evidence implementation source ${file.ref}`);
  }
  const implementationSha256 = sha256(
    evidence.source.implementationFiles
      .map((file) => `${file.ref}:${file.sha256}`)
      .join('\n'),
  );
  if (evidence.source.implementationSha256 !== implementationSha256) {
    errors.push('browser evidence implementation source digest is stale');
  }
  const shadcnParity = evidence.manualChecks.find(
    (check) => check.id === 'shadcn-registry-parity',
  );
  if (shadcnParity?.status === 'complete') {
    const snapshotRef = 'design/evidence/adapter-browser/shadcn-registry-snapshot.json';
    if (!shadcnParity.evidenceRefs.includes(snapshotRef)) {
      errors.push('complete shadcn registry parity must reference the captured snapshot');
    } else {
      const snapshotPath = safeRepositoryPath(root, snapshotRef);
      if (snapshotPath && existsSync(snapshotPath)) {
        const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
        const implementationByRef = new Map(
          evidence.source.implementationFiles.map((file) => [file.ref, file.sha256]),
        );
        for (const item of snapshot.items) {
          for (const file of item.files) {
            const generatedRef =
              `spikes/external-adapters/registry-parity/generated/${file.path}`;
            if (implementationByRef.get(generatedRef) !== file.contentSha256) {
              errors.push(
                `complete shadcn registry parity is not bound to captured source ${file.path}`,
              );
            }
          }
        }
        if (
          !implementationByRef.has(
            'spikes/external-adapters/src/adapters/shadcn-registry.tsx',
          )
        ) {
          errors.push('complete shadcn registry parity requires the registry-source adapter');
        }
      }
    }
  }

  const expectedScenarioKeys = [];
  for (const candidateRef of plan.candidateRefs) {
    for (const pilotRef of plan.pilotRefs) {
      for (const viewport of plan.viewports) {
        expectedScenarioKeys.push(`${candidateRef}.${pilotRef}.${viewport.id}`);
      }
    }
  }
  const scenarioKeys = evidence.scenarios.map(
    (scenario) => `${scenario.candidateRef}.${scenario.pilotRef}.${scenario.viewport.id}`,
  );
  if (duplicates(scenarioKeys).length > 0) errors.push('browser evidence has duplicate scenarios');
  if (!same(sorted(scenarioKeys), sorted(expectedScenarioKeys))) {
    errors.push('browser evidence must contain the exact planned candidate × Pilot × viewport matrix');
  }

  for (const scenario of evidence.scenarios) {
    const expectedViewport = plan.viewports.find((viewport) => viewport.id === scenario.viewport.id);
    if (!expectedViewport || !same(scenario.viewport, expectedViewport)) {
      errors.push(`scenario ${scenario.id} does not use the planned viewport fixture`);
    }
    const expectedId = `${scenario.candidateRef}.${scenario.pilotRef}.${scenario.viewport.id}`;
    if (scenario.id !== expectedId) errors.push(`scenario ${scenario.id} must use ID ${expectedId}`);
    if (!scenario.screenshot || !scenario.checks) {
      errors.push(`scenario ${scenario.id} is missing executable evidence`);
      continue;
    }
    verifyDigest(
      errors,
      root,
      scenario.screenshot.ref,
      scenario.screenshot.sha256,
      `scenario ${scenario.id} screenshot`,
    );
    if (scenario.viewport.fixture === 'rtl' && scenario.checks.layout.direction !== 'rtl') {
      errors.push(`scenario ${scenario.id} did not activate RTL`);
    }
    if (
      scenario.viewport.fixture === 'forced-colors' &&
      !scenario.checks.layout.forcedColorsActive
    ) {
      errors.push(`scenario ${scenario.id} did not activate forced colors`);
    }
    if (scenario.viewport.id === 'desktop' && scenario.checks.zoom200 === null) {
      errors.push(`scenario ${scenario.id} is missing the 200 percent zoom fixture`);
    }
    if (scenario.viewport.id !== 'desktop' && scenario.checks.zoom200 !== null) {
      errors.push(`scenario ${scenario.id} has an unexpected 200 percent zoom fixture`);
    }
    const derivedFindings = [
      ...scenario.checks.journey.findings,
      ...(scenario.checks.layout.horizontalOverflow ? ['document-overflow'] : []),
      ...(scenario.checks.zoom200?.horizontalOverflow ? ['zoom-overflow'] : []),
      ...scenario.checks.accessibility.unnamed.map(() => 'accessible-name'),
      ...scenario.checks.accessibility.absentFromTree.map(() => 'accessibility-tree'),
      ...scenario.checks.keyboard.missingVisibleFocus.map(() => 'visible-focus'),
      ...(!scenario.checks.keyboard.cycleComplete ? ['tab-sequence-incomplete'] : []),
      ...scenario.checks.touchTargets.failures.map(() => 'touch-target'),
      ...scenario.checks.pageErrors.map(() => 'page-error'),
      ...scenario.checks.runtimeErrors.map(() => 'runtime-error'),
      ...scenario.checks.consoleMessages
        .filter((message) => message.type === 'error')
        .map(() => 'console-error'),
    ];
    const findingCodes = scenario.findings.map((finding) => finding.code);
    for (const code of derivedFindings) {
      if (!findingCodes.includes(code)) errors.push(`scenario ${scenario.id} omits derived finding ${code}`);
    }
    const expectedBlocking = scenario.findings.some((finding) =>
      ['critical', 'major'].includes(finding.severity),
    );
    if (scenario.blocking !== expectedBlocking) {
      errors.push(`scenario ${scenario.id} blocking flag is stale`);
    }
  }

  const expectedSummaries = plan.candidateRefs.map((candidateRef) =>
    summarizeBrowserCandidate(candidateRef, evidence.scenarios),
  );
  if (!same(evidence.candidateSummaries, expectedSummaries)) {
    errors.push('browser evidence candidate summaries are stale');
  }
  const buildCandidates = evidence.build.candidateFootprints.map((footprint) => footprint.candidateRef);
  if (!same(sorted(buildCandidates), sorted(plan.candidateRefs))) {
    errors.push('browser evidence build footprint must cover every candidate exactly once');
  }
  if (duplicates(buildCandidates).length > 0) errors.push('browser evidence has duplicate build footprints');
  for (const footprint of evidence.build.candidateFootprints) {
    const rawBytes = footprint.artifacts.reduce((sum, artifact) => sum + artifact.rawBytes, 0);
    const gzipBytes = footprint.artifacts.reduce((sum, artifact) => sum + artifact.gzipBytes, 0);
    const javascriptRawBytes = footprint.artifacts
      .filter((artifact) => artifact.type === 'javascript')
      .reduce((sum, artifact) => sum + artifact.rawBytes, 0);
    const cssRawBytes = footprint.artifacts
      .filter((artifact) => artifact.type === 'css')
      .reduce((sum, artifact) => sum + artifact.rawBytes, 0);
    if (
      footprint.rawBytes !== rawBytes ||
      footprint.gzipBytes !== gzipBytes ||
      footprint.javascriptRawBytes !== javascriptRawBytes ||
      footprint.cssRawBytes !== cssRawBytes
    ) {
      errors.push(`build footprint ${footprint.candidateRef} totals are stale`);
    }
  }

  const requiredManual = evidence.manualChecks.filter((check) => check.requiredForSelection);
  const manualComplete =
    requiredManual.length > 0 && requiredManual.every((check) => check.status === 'complete');
  const automatedBlocking = evidence.candidateSummaries.some((summary) => summary.blocking);
  const expectedDecisionEligible = evidence.status === 'complete' && manualComplete && !automatedBlocking;
  if (evidence.decisionEligible !== expectedDecisionEligible) {
    errors.push('browser evidence decisionEligible flag is stale');
  }
  if (evidence.status === 'complete' && !manualComplete) {
    errors.push('complete browser evidence requires every selection-blocking manual check');
  }
  if (
    benchmark.browserEvaluation.status === 'complete' &&
    evidence.status !== 'complete'
  ) {
    errors.push('benchmark cannot claim complete browser evaluation from automated-only evidence');
  }
  if (
    !benchmark.browserEvaluation.artifactRefs.includes(evidence.source.planRef) ||
    !benchmark.browserEvaluation.artifactRefs.includes('design/evidence/adapter-browser/manifest.json')
  ) {
    errors.push('benchmark browser evaluation must reference the plan and evidence manifest');
  }
  return errors;
}

export function validateAdapterDependencyAudit(audit, plan, { root }) {
  const errors = [];
  verifyDigest(
    errors,
    root,
    audit.source.packageLockRef,
    audit.source.packageLockSha256,
    'adapter dependency audit package lock',
  );
  verifyDigest(
    errors,
    root,
    audit.source.rawResultRef,
    audit.source.rawResultSha256,
    'adapter dependency audit raw result',
  );
  const rawPath = safeRepositoryPath(root, audit.source.rawResultRef);
  if (rawPath && existsSync(rawPath)) {
    const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
    if (!same(raw.metadata?.vulnerabilities, {
      info: audit.summary.info,
      low: audit.summary.low,
      moderate: audit.summary.moderate,
      high: audit.summary.high,
      critical: audit.summary.critical,
      total: audit.summary.total,
    })) {
      errors.push('adapter dependency audit summary does not match the raw npm result');
    }
    if (
      raw.metadata?.dependencies?.prod !== audit.summary.productionDependencies ||
      raw.metadata?.dependencies?.dev !== audit.summary.developmentDependencies ||
      raw.metadata?.dependencies?.total !== audit.summary.totalDependencies
    ) {
      errors.push('adapter dependency counts do not match the raw npm result');
    }
    const rawAdvisoryUrls = new Set(
      Object.values(raw.vulnerabilities ?? {})
        .flatMap((vulnerability) => vulnerability.via ?? [])
        .filter((via) => via && typeof via === 'object')
        .map((via) => via.url),
    );
    for (const finding of audit.findings) {
      if (!rawAdvisoryUrls.has(finding.advisoryUrl)) {
        errors.push(`dependency audit finding ${finding.id} is absent from the raw npm result`);
      }
    }
  }
  const severityTotal =
    audit.summary.info +
    audit.summary.low +
    audit.summary.moderate +
    audit.summary.high +
    audit.summary.critical;
  if (audit.summary.total !== severityTotal) {
    errors.push('adapter dependency audit severity summary is stale');
  }
  const reportedTotal = audit.findings.reduce(
    (sum, finding) => sum + finding.reportedVulnerabilityCount,
    0,
  );
  if (reportedTotal !== audit.summary.total) {
    errors.push('adapter dependency audit finding counts do not reconcile with summary total');
  }
  const candidateIds = new Set(plan.candidateRefs);
  for (const finding of audit.findings) {
    for (const candidateRef of finding.candidateRefs) {
      if (!candidateIds.has(candidateRef)) {
        errors.push(`dependency audit finding ${finding.id} references unknown candidate ${candidateRef}`);
      }
    }
    if (finding.resolution === 'open' && !finding.action) {
      errors.push(`dependency audit finding ${finding.id} requires an action`);
    }
  }
  if (audit.status === 'clean' && audit.summary.total !== 0) {
    errors.push('clean dependency audit cannot contain vulnerabilities');
  }
  if (audit.status === 'open-findings' && !audit.findings.some((finding) => finding.resolution === 'open')) {
    errors.push('open-findings dependency audit requires at least one open finding');
  }
  return errors;
}

export function validateShadcnRegistrySnapshot(snapshot, { root }) {
  const errors = [];
  verifyDigest(
    errors,
    root,
    snapshot.source.packageLockRef,
    snapshot.source.packageLockSha256,
    'shadcn registry snapshot package lock',
  );
  const requiredItems = [
    'alert',
    'badge',
    'button',
    'checkbox',
    'dialog',
    'dropdown-menu',
    'input',
    'select',
    'table',
  ];
  const itemNames = snapshot.items.map((item) => item.name);
  if (!same(sorted(itemNames), requiredItems)) {
    errors.push('shadcn registry snapshot must contain the exact Spike component set');
  }
  if (duplicates(itemNames).length > 0) errors.push('shadcn registry snapshot has duplicate items');
  for (const item of snapshot.items) {
    const filePaths = item.files.map((file) => file.path);
    if (duplicates(filePaths).length > 0) {
      errors.push(`shadcn registry item ${item.name} has duplicate files`);
    }
    for (const file of item.files) {
      if (sha256(file.content) !== file.contentSha256) {
        errors.push(`shadcn registry item ${item.name} file ${file.path} digest is stale`);
      }
    }
  }
  return errors;
}
