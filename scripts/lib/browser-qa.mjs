import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

const REQUIRED_VIEWPORTS = ['desktop', 'tablet', 'mobile'];
const REQUIRED_STATES = ['default', 'loading', 'empty', 'error', 'permission'];
const REQUIRED_CHECKS = [
  'console', 'page-error', 'horizontal-overflow', 'semantic-integrity',
  'keyboard-reachability', 'visible-focus', 'focus-not-obscured',
  'state-signal', 'runtime-provenance',
];

function digestBuffer(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}

function safePath(root, ref) {
  if (isAbsolute(ref)) return null;
  const absolute = resolve(root, ref);
  const rel = relative(root, absolute);
  return rel.startsWith('..') || isAbsolute(rel) ? null : absolute;
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function sameMembers(actual, expected) {
  return actual.length === expected.length
    && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

function finding(id, severity, layer, code, message) {
  return { id, severity, layer, code, message, lockedStructureImpact: false };
}

export function validateBrowserQaPolicy(policy) {
  const errors = [];
  if (!sameMembers(policy.viewports.map((item) => item.id), REQUIRED_VIEWPORTS)) {
    errors.push('Browser QA policy requires desktop, tablet, and mobile exactly once');
  }
  if (!sameMembers(policy.states, REQUIRED_STATES)) {
    errors.push('Browser QA policy requires default, loading, empty, error, and permission exactly once');
  }
  if (policy.viewports.find((item) => item.id === 'tablet')?.width !== 768) {
    errors.push('Tablet Browser QA width must be 768px');
  }
  if (policy.viewports.find((item) => item.id === 'mobile')?.width !== 375) {
    errors.push('Mobile Browser QA width must be 375px');
  }
  if ((policy.viewports.find((item) => item.id === 'desktop')?.width ?? 0) < 1200) {
    errors.push('Desktop Browser QA width must be at least 1200px');
  }
  if (duplicates(policy.checks).length) errors.push('Browser QA checks must be unique');
  if (!sameMembers(policy.checks, REQUIRED_CHECKS)) {
    errors.push('Browser QA policy must include the complete semantic, keyboard, focus, state, and provenance check set');
  }
  if (!policy.repair.lockedLayers.includes('selected-direction')) {
    errors.push('Browser QA repair must lock the selected direction');
  }
  if (!sameMembers(policy.repair.blockingSeverities, ['critical', 'major'])) {
    errors.push('Critical and major findings must block Browser QA');
  }
  return errors;
}

export function deriveScenarioFindings(checks, scenarioRef = null) {
  const findings = [];
  let index = 0;
  const add = (severity, layer, code, message) => {
    index += 1;
    const scope = scenarioRef ? `${scenarioRef}-` : '';
    findings.push(finding(`finding-${scope}${String(index).padStart(2, '0')}-${code}`, severity, layer, code, message));
  };
  for (const message of checks.consoleErrors) add('major', 'component-runtime', 'console-error', message);
  for (const message of checks.pageErrors) add('critical', 'component-runtime', 'page-error', message);
  if (checks.horizontalOverflow) add('major', 'layout-recipe', 'horizontal-overflow', 'Document requires horizontal scrolling at the tested viewport.');
  for (const id of checks.duplicateIds) add('major', 'component-runtime', 'duplicate-id', `Duplicate DOM id: ${id}`);
  for (const ref of checks.danglingAriaRefs) add('major', 'component-runtime', 'dangling-aria-ref', `ARIA reference has no target: ${ref}`);
  for (const control of checks.unnamedControls) add('major', 'component-runtime', 'unnamed-control', `Interactive control has no accessible name: ${control}`);
  for (const control of checks.keyboard.missing) add('major', 'component-runtime', 'keyboard-unreachable', `Keyboard sequence did not reach: ${control}`);
  for (const control of checks.keyboard.missingVisibleFocus) add('major', 'component-runtime', 'focus-not-visible', `Keyboard focus indicator is not visible: ${control}`);
  for (const control of checks.keyboard.obscured) add('major', 'layout-recipe', 'focus-obscured', `Focused control is entirely obscured: ${control}`);
  if (checks.keyboard.reached + checks.keyboard.missing.length !== checks.keyboard.expected) {
    add('critical', 'browser-environment', 'keyboard-accounting-invalid', 'Keyboard evidence counts do not account for every expected control.');
  }
  if (!checks.stateSignal.pass || checks.stateSignal.observed < 1) {
    add('major', 'generation-manifest', 'state-signal-missing', `${checks.stateSignal.expected} state has no observable signal.`);
  }
  if (checks.runtimeProvenance.rendered < 1) {
    add('critical', 'component-runtime', 'runtime-not-rendered', 'No Component runtime provenance was observed.');
  }
  for (const usage of checks.runtimeProvenance.unknown) add('critical', 'component-runtime', 'unknown-usage', `Rendered usage is not declared: ${usage}`);
  for (const usage of checks.runtimeProvenance.incomplete) add('major', 'component-runtime', 'incomplete-provenance', `Rendered usage lacks required provenance: ${usage}`);
  return findings;
}

export function measureManifestStressCoverage(manifest, policy) {
  let longestJapanese = 0;
  let densestRows = 0;
  const longSources = [];
  const denseSources = [];
  function visit(value, path = '$') {
    if (typeof value === 'string') {
      const japaneseLength = [...value].filter((char) => /[\u3040-\u30ff\u3400-\u9fff]/u.test(char)).length;
      if (japaneseLength > longestJapanese) {
        longestJapanese = japaneseLength;
        longSources.splice(0, longSources.length, path);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value.rows) && value.rows.length > densestRows) {
      densestRows = value.rows.length;
      denseSources.splice(0, denseSources.length, `${path}.rows`);
    }
    for (const [key, item] of Object.entries(value)) visit(item, `${path}.${key}`);
  }
  visit(manifest.screens, '$.screens');
  return {
    longJapanese: {
      status: longestJapanese >= policy.stressCoverage.minimumJapaneseTextLength ? 'pass' : 'fail',
      observed: longestJapanese,
      required: policy.stressCoverage.minimumJapaneseTextLength,
      sourceRefs: longSources,
    },
    highDensity: {
      status: densestRows >= policy.stressCoverage.minimumDenseRows ? 'pass' : 'fail',
      observed: densestRows,
      required: policy.stressCoverage.minimumDenseRows,
      sourceRefs: denseSources,
    },
  };
}

function expectedScenarioKeys(manifest, policy) {
  return new Set(manifest.stateFixtures.flatMap((fixture) =>
    fixture.screenRefs.flatMap((screenRef) =>
      policy.viewports.map((viewport) => `${screenRef}:${fixture.state}:${viewport.id}`))));
}

function validateBinding(binding, root, label, errors) {
  const absolute = safePath(root, binding.ref);
  if (!absolute) {
    errors.push(`${label} escapes the repository`);
    return null;
  }
  if (!existsSync(absolute)) {
    errors.push(`${label} does not exist: ${binding.ref}`);
    return null;
  }
  const bytes = readFileSync(absolute);
  if (digestBuffer(bytes) !== binding.digest) errors.push(`${label} digest is stale`);
  try {
    return JSON.parse(bytes);
  } catch {
    return bytes;
  }
}

function stableFindingProjection(value) {
  return value.map(({ id, severity, layer, code, message, lockedStructureImpact }) =>
    ({ id, severity, layer, code, message, lockedStructureImpact }));
}

export function validateBrowserQaEvidence(evidence, manifest, policy, options = {}) {
  const root = resolve(options.root || process.cwd());
  const errors = validateBrowserQaPolicy(policy);
  const boundSources = {};
  for (const [name, binding] of Object.entries(evidence.source)) {
    boundSources[name] = validateBinding(binding, root, `Browser QA source ${name}`, errors);
  }
  if (JSON.stringify(boundSources.generationManifest) !== JSON.stringify(manifest)) {
    errors.push('Browser QA evidence is bound to a different Generation Manifest');
  }
  if (JSON.stringify(boundSources.policy) !== JSON.stringify(policy)) {
    errors.push('Browser QA evidence is bound to a different Browser QA policy');
  }
  if (options.manifestRef && evidence.source.generationManifest.ref !== options.manifestRef) {
    errors.push('Browser QA Generation Manifest ref differs from the requested source');
  }
  if (options.policyRef && evidence.source.policy.ref !== options.policyRef) {
    errors.push('Browser QA policy ref differs from the requested source');
  }
  for (const [name, ref] of [
    ['reviewUi', manifest.output.reviewUi],
    ['reviewModel', manifest.output.reviewModel],
    ['usageManifest', manifest.output.usageManifest],
  ]) {
    if (evidence.source[name].ref !== ref) errors.push(`Browser QA ${name} ref differs from Generation Manifest output`);
  }
  if (evidence.environment.engine !== policy.browser.engine) errors.push('Browser QA engine differs from policy');
  if (evidence.environment.playwrightVersion !== policy.browser.playwrightVersion) errors.push('Playwright version differs from policy');

  const expected = expectedScenarioKeys(manifest, policy);
  const actual = new Set();
  let passed = 0;
  let blocked = 0;
  let criticalFindings = 0;
  let majorFindings = 0;
  let minorFindings = 0;
  const findingIds = new Set();
  for (const scenario of evidence.scenarios) {
    const key = `${scenario.screenRef}:${scenario.state}:${scenario.viewport}`;
    if (!expected.has(key)) errors.push(`Unexpected Browser QA scenario ${key}`);
    if (actual.has(key)) errors.push(`Duplicate Browser QA scenario ${key}`);
    actual.add(key);
    const viewport = policy.viewports.find((item) => item.id === scenario.viewport);
    if (scenario.dimensions.width !== viewport?.width || scenario.dimensions.height !== viewport?.height) {
      errors.push(`${scenario.id}: viewport dimensions differ from policy`);
    }
    const expectedScreenshot = `test/fixtures/generated/browser-qa/${evidence.meta.pilotId}/${scenario.screenRef}.${scenario.state}.${scenario.viewport}.png`;
    if (scenario.screenshot.ref !== expectedScreenshot) errors.push(`${scenario.id}: unexpected screenshot path`);
    const screenshotPath = safePath(root, scenario.screenshot.ref);
    if (!screenshotPath || !existsSync(screenshotPath)) {
      errors.push(`${scenario.id}: screenshot does not exist`);
    } else {
      const bytes = readFileSync(screenshotPath);
      if (digestBuffer(bytes) !== scenario.screenshot.digest) errors.push(`${scenario.id}: screenshot digest is stale`);
      if (
        bytes.readUInt32BE(16) !== scenario.screenshot.width
        || bytes.readUInt32BE(20) !== scenario.screenshot.height
      ) {
        errors.push(`${scenario.id}: screenshot dimensions are stale`);
      }
      if (scenario.screenshot.width !== viewport?.width) {
        errors.push(`${scenario.id}: screenshot width differs from the declared viewport`);
      }
    }
    const expectedFindings = deriveScenarioFindings(scenario.checks, scenario.id);
    if (JSON.stringify(stableFindingProjection(scenario.findings)) !== JSON.stringify(expectedFindings)) {
      errors.push(`${scenario.id}: findings do not match Browser QA checks`);
    }
    for (const item of scenario.findings) {
      if (findingIds.has(item.id)) errors.push(`Duplicate Browser QA finding ${item.id}`);
      findingIds.add(item.id);
    }
    if (scenario.checks.keyboard.reached > scenario.checks.keyboard.expected) {
      errors.push(`${scenario.id}: keyboard reached count exceeds expected controls`);
    }
    if (
      scenario.checks.keyboard.reached + scenario.checks.keyboard.missing.length
      !== scenario.checks.keyboard.expected
    ) {
      errors.push(`${scenario.id}: keyboard evidence accounting is inconsistent`);
    }
    if (scenario.checks.stateSignal.pass !== (scenario.checks.stateSignal.observed > 0)) {
      errors.push(`${scenario.id}: state signal pass flag is inconsistent`);
    }
    const blocks = expectedFindings.some((item) => policy.repair.blockingSeverities.includes(item.severity));
    if (scenario.status !== (blocks ? 'blocked' : 'pass')) errors.push(`${scenario.id}: status does not match findings`);
    if (blocks) blocked += 1;
    else passed += 1;
    criticalFindings += expectedFindings.filter((item) => item.severity === 'critical').length;
    majorFindings += expectedFindings.filter((item) => item.severity === 'major').length;
    minorFindings += expectedFindings.filter((item) => item.severity === 'minor').length;
  }
  if (actual.size !== expected.size || [...expected].some((key) => !actual.has(key))) {
    errors.push(`Browser QA matrix is incomplete: expected ${expected.size}, received ${actual.size}`);
  }
  const expectedSummary = {
    expected: expected.size,
    completed: actual.size,
    passed,
    blocked,
    criticalFindings,
    majorFindings,
    minorFindings,
  };
  if (JSON.stringify(evidence.summary) !== JSON.stringify(expectedSummary)) errors.push('Browser QA summary is stale');
  if (JSON.stringify(evidence.stressCoverage) !== JSON.stringify(measureManifestStressCoverage(manifest, policy))) {
    errors.push('Browser QA stress coverage is stale');
  }
  if (evidence.meta.status !== (blocked ? 'blocked' : 'pass')) errors.push('Browser QA evidence status is stale');
  return errors;
}

export function browserQaSummary(scenarios) {
  const findings = scenarios.flatMap((scenario) => scenario.findings);
  const blocked = scenarios.filter((scenario) => scenario.status === 'blocked').length;
  return {
    expected: scenarios.length,
    completed: scenarios.length,
    passed: scenarios.length - blocked,
    blocked,
    criticalFindings: findings.filter((item) => item.severity === 'critical').length,
    majorFindings: findings.filter((item) => item.severity === 'major').length,
    minorFindings: findings.filter((item) => item.severity === 'minor').length,
  };
}

export function digestFile(path) {
  return digestBuffer(readFileSync(path));
}
