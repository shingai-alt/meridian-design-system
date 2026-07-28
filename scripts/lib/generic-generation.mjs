import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { computeDirectionReviewDigest } from './structure-planning.mjs';

const REQUIRED_STATES = ['default', 'loading', 'empty', 'error', 'permission'];
const REQUIRED_VIEWPORTS = ['desktop', 'tablet', 'mobile'];
const FORBIDDEN_KEYS = new Set([
  'html', 'rawHtml', 'css', 'style', 'styles', 'class', 'className', 'selector',
  'script', 'token', 'tokenValue', 'color', 'shadow', 'radius', 'motion',
]);
const PRESENTATION_CAPABILITY = new Map([
  ['action', 'action.trigger'],
  ['text-input', 'input.text'],
  ['choice-input', 'input.choice'],
  ['editable-collection', 'collection.editable'],
  ['field-validation', 'feedback.field-validation'],
  ['section-status', 'feedback.section-status'],
  ['confirmation', 'disclosure.confirmation'],
  ['status-list', 'data.status-list'],
  ['task-progress', 'navigation.task-progress'],
]);

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function digestBuffer(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}

function safePath(root, ref) {
  if (isAbsolute(ref)) return null;
  const absolute = resolve(root, ref);
  const rel = relative(root, absolute);
  return rel.startsWith('..') || isAbsolute(rel) ? null : absolute;
}

function readBoundJson(root, binding, label, errors) {
  const absolute = safePath(root, binding.ref);
  if (!absolute) {
    errors.push(`${label} path escapes the repository: ${binding.ref}`);
    return null;
  }
  if (!existsSync(absolute)) {
    errors.push(`${label} source does not exist: ${binding.ref}`);
    return null;
  }
  const bytes = readFileSync(absolute);
  if (digestBuffer(bytes) !== binding.digest) errors.push(`${label} source digest is stale: ${binding.ref}`);
  try {
    return JSON.parse(bytes);
  } catch {
    errors.push(`${label} source is not valid JSON: ${binding.ref}`);
    return null;
  }
}

function sameMembers(actual, expected) {
  return actual.length === expected.length && [...actual].sort().every((value, index) => value === [...expected].sort()[index]);
}

function unsafeManifestValues(value, path = '$', errors = []) {
  if (typeof value === 'string') {
    if (/<\/?[a-z][^>]*>/i.test(value)) errors.push(`${path} contains raw HTML`);
    if (/(?:^|[^a-z])#[a-f0-9]{3,8}\b/i.test(value)) errors.push(`${path} contains a raw color`);
    if (/\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|dvh|dvw)\b/i.test(value)) errors.push(`${path} contains a raw dimension`);
    if (/var\(--|url\(|expression\(|javascript:/i.test(value)) errors.push(`${path} contains a raw CSS or script value`);
    return errors;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => unsafeManifestValues(item, `${path}[${index}]`, errors));
    return errors;
  }
  if (!value || typeof value !== 'object') return errors;
  for (const [key, item] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key) || /^on[A-Z]/.test(key)) errors.push(`${childPath} is a forbidden raw implementation field`);
    unsafeManifestValues(item, childPath, errors);
  }
  return errors;
}

export function validateLayoutRecipeRegistry(registry, options = {}) {
  const errors = [];
  const recipeIds = registry.recipes.map((recipe) => recipe.id);
  const presetIds = registry.presets.map((preset) => preset.id);
  for (const id of duplicates(recipeIds)) errors.push(`duplicate layout recipe ${id}`);
  for (const id of duplicates(presetIds)) errors.push(`duplicate layout preset ${id}`);
  const kinds = new Set();
  for (const recipe of registry.recipes) {
    if (kinds.has(recipe.kind)) errors.push(`layout kind ${recipe.kind} must have one canonical recipe`);
    kinds.add(recipe.kind);
    for (const option of recipe.options) {
      if (!option.allowedValues.includes(option.defaultValue)) {
        errors.push(`${recipe.id}.${option.name} default is not allowed`);
      }
      if (duplicates(option.allowedValues).length) errors.push(`${recipe.id}.${option.name} has duplicate values`);
    }
  }
  for (const kind of ['stack', 'cluster', 'grid', 'section', 'responsive-switch']) {
    if (!kinds.has(kind)) errors.push(`layout registry is missing ${kind}`);
  }
  if (options.css) {
    const declared = new Set([...options.css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));
    for (const preset of registry.presets) {
      if (preset.valueRef.startsWith('--') && !declared.has(preset.valueRef)) {
        errors.push(`${preset.id} references undeclared token ${preset.valueRef}`);
      }
    }
  }
  return errors;
}

export function validateVisualProfileRegistry(registry) {
  const errors = [];
  const profileIds = registry.profiles.map((profile) => profile.id);
  for (const id of duplicates(profileIds)) errors.push(`duplicate visual profile ${id}`);
  if (!profileIds.includes(registry.selectionPolicy.defaultProfileRef)) {
    errors.push(`default visual profile ${registry.selectionPolicy.defaultProfileRef} does not exist`);
  }
  if (registry.selectionPolicy.requiresExplicitManifestSelection !== true) {
    errors.push('visual profiles must require explicit manifest selection');
  }
  if (registry.selectionPolicy.adapterIndependent !== true) {
    errors.push('visual profiles must remain independent from Design System Adapters');
  }
  if (registry.selectionPolicy.structuralMutationAllowed !== false) {
    errors.push('visual profiles must not mutate approved structure');
  }
  return errors;
}

function validateNode(node, context) {
  const { errors, recipes, decisions, resolutionByRequirement, nodeIds, usedDecisions } = context;
  if (nodeIds.has(node.id)) errors.push(`duplicate generation node ${node.id}`);
  nodeIds.add(node.id);
  if (!decisions.has(node.decisionRef)) errors.push(`${node.id} references unknown decision ${node.decisionRef}`);
  else usedDecisions.add(node.decisionRef);

  const fields = new Set(Object.keys(node));
  const allowedByKind = {
    layout: new Set(['id', 'kind', 'decisionRef', 'recipeRef', 'options', 'children']),
    heading: new Set(['id', 'kind', 'decisionRef', 'level', 'text']),
    text: new Set(['id', 'kind', 'decisionRef', 'text', 'tone']),
    capability: new Set(['id', 'kind', 'decisionRef', 'capabilityRequirementRef', 'presentation', 'content']),
  };
  const allowed = allowedByKind[node.kind] ?? new Set();
  for (const field of fields) if (!allowed.has(field)) errors.push(`${node.id}.${field} is not valid for ${node.kind}`);

  if (node.kind === 'layout') {
    if (!node.recipeRef || !Array.isArray(node.options) || !Array.isArray(node.children)) {
      errors.push(`${node.id} layout requires recipeRef, options, and children`);
      return;
    }
    const recipe = recipes.get(node.recipeRef);
    if (!recipe) errors.push(`${node.id} references unknown layout recipe ${node.recipeRef}`);
    else {
      const optionMap = new Map(recipe.options.map((option) => [option.name, option]));
      const supplied = new Set();
      for (const option of node.options) {
        if (supplied.has(option.name)) errors.push(`${node.id} repeats layout option ${option.name}`);
        supplied.add(option.name);
        const declaration = optionMap.get(option.name);
        if (!declaration) errors.push(`${node.id} uses unknown ${recipe.id} option ${option.name}`);
        else if (!declaration.allowedValues.includes(option.value)) errors.push(`${node.id}.${option.name} value ${option.value} is not allowed`);
      }
    }
    if (node.children.length === 0) errors.push(`${node.id} layout cannot be empty`);
    node.children.forEach((child) => validateNode(child, context));
    return;
  }

  if (node.kind === 'heading' && (!node.text || !node.level)) errors.push(`${node.id} heading requires level and text`);
  if (node.kind === 'text' && !node.text) errors.push(`${node.id} text requires text`);
  if (node.kind !== 'capability') return;

  const result = resolutionByRequirement.get(node.capabilityRequirementRef);
  if (!result) {
    errors.push(`${node.id} references unresolved capability requirement ${node.capabilityRequirementRef}`);
    return;
  }
  if (['partial', 'unresolved'].includes(result.status) || result.compatibility.status !== 'compatible') {
    errors.push(`${node.id} capability ${node.capabilityRequirementRef} is not generation-compatible`);
  }
  const expectedCapability = PRESENTATION_CAPABILITY.get(node.presentation);
  if (expectedCapability !== result.capabilityRef) {
    errors.push(`${node.id} presentation ${node.presentation} requires ${expectedCapability}, received ${result.capabilityRef}`);
  }
  const content = node.content ?? {};
  const required = {
    action: ['label'],
    'text-input': ['fields'],
    'choice-input': ['fields'],
    'editable-collection': ['fields'],
    'field-validation': ['body'],
    'section-status': ['title', 'body'],
    confirmation: ['title', 'items', 'actionLabel'],
    'status-list': ['columns', 'rows'],
    'task-progress': ['steps'],
  }[node.presentation] ?? [];
  for (const field of required) {
    if (content[field] === undefined || (Array.isArray(content[field]) && content[field].length === 0)) {
      errors.push(`${node.id} ${node.presentation} content requires ${field}`);
    }
  }
}

export function validateGenerationManifest(manifest, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const sourceOverridesAllowed = manifest.meta.mode === 'fixture' && options.allowFixtureSourceOverrides === true;
  if (options.sources && !sourceOverridesAllowed) {
    errors.push('source object overrides are allowed only for explicit fixture validation');
  }
  const sourceEntries = Object.entries(manifest.source);
  const sources = Object.fromEntries(sourceEntries.map(([key, binding]) => [
    key,
    sourceOverridesAllowed && options.sources?.[key]
      ? options.sources[key]
      : readBoundJson(root, binding, key, errors),
  ]));
  for (const [key, object] of Object.entries(sourceOverridesAllowed ? {} : (options.sources ?? {}))) {
    const binding = manifest.source[key];
    if (!binding) continue;
    const absolute = safePath(root, binding.ref);
    if (absolute && existsSync(absolute)) {
      const disk = JSON.parse(readFileSync(absolute, 'utf8'));
      if (JSON.stringify(object) !== JSON.stringify(disk)) errors.push(`${key} object differs from its digest-bound source`);
    }
  }

  errors.push(...unsafeManifestValues(manifest));
  if (!sameMembers(manifest.review.viewports, REQUIRED_VIEWPORTS)) errors.push('review viewports must be desktop, tablet, and mobile exactly once');
  const expectedOutputPrefix = manifest.meta.mode === 'fixture' ? 'test/fixtures/generated/' : 'examples/generated/ui-generation/';
  for (const [name, ref] of Object.entries(manifest.output)) {
    if (!ref.startsWith(expectedOutputPrefix)) errors.push(`${name} output must stay under ${expectedOutputPrefix}`);
    if (!safePath(root, ref)) errors.push(`${name} output escapes the repository`);
  }

  const resolution = sources.adapterResolution;
  if (resolution) {
    const gatePass = resolution.generationGate?.status === 'pass';
    if (manifest.meta.status === 'ready' && !gatePass) errors.push('ready Generation Manifest requires a passing Adapter Resolution gate');
    if (manifest.meta.status === 'blocked' && gatePass) errors.push('blocked Generation Manifest cannot reference a passing Adapter Resolution gate');
  }
  const directionSet = sources.directionSet;
  const directionIds = new Set((directionSet?.directions ?? []).map((direction) => direction.id));
  if (!directionIds.has(manifest.directionRef)) {
    errors.push(`Generation Manifest references unknown direction ${manifest.directionRef}`);
  }
  const directionApproval = directionSet?.review?.approval;
  if (manifest.meta.status === 'ready' && directionApproval?.selectedDirectionRef !== manifest.directionRef) {
    errors.push('ready generation must use the exact Human-selected Direction');
  }

  const visualProfiles = sources.visualProfiles;
  const profileIds = new Set((visualProfiles?.profiles ?? []).map((profile) => profile.id));
  if (!profileIds.has(manifest.visualProfileRef)) {
    errors.push(`Generation Manifest references unknown visual profile ${manifest.visualProfileRef}`);
  }
  if (visualProfiles) errors.push(...validateVisualProfileRegistry(visualProfiles));
  if (manifest.meta.mode === 'production' && manifest.meta.status === 'ready') {
    if (
      directionSet?.meta?.status !== 'approved'
      || directionSet?.review?.status !== 'approved'
      || directionApproval?.actorType !== 'human'
      || directionApproval?.role !== directionSet.review.requiredRole
      || directionApproval?.decision !== 'approved'
    ) {
      errors.push('production generation requires a Human-approved Direction Set');
    } else if (directionApproval.directionSetDigest !== computeDirectionReviewDigest(directionSet)) {
      errors.push('production generation requires a current Human Direction approval digest');
    }
  }

  const layoutRegistry = sources.layoutRecipes;
  const recipes = new Map((layoutRegistry?.recipes ?? []).map((recipe) => [recipe.id, recipe]));
  const decisions = new Map(manifest.decisions.map((decision) => [decision.id, decision]));
  for (const id of duplicates(manifest.decisions.map((decision) => decision.id))) errors.push(`duplicate generation decision ${id}`);
  const responsibilityIds = new Set((sources.screenResponsibilities?.responsibilities ?? []).map((item) => item.id));
  const patternSelections = sources.patternSelection?.selections ?? [];
  const screenIds = new Set(manifest.screens.map((screen) => screen.id));
  for (const id of duplicates([...screenIds])) errors.push(`duplicate generation screen ${id}`);
  const resolutionByRequirement = new Map((resolution?.results ?? []).map((result) => [result.capabilityRequirementRef, result]));
  const nodeIds = new Set();
  const usedDecisions = new Set();
  for (const screen of manifest.screens) {
    if (!responsibilityIds.has(screen.responsibilityRef)) errors.push(`${screen.id} references unknown responsibility ${screen.responsibilityRef}`);
    const selection = patternSelections.find((item) =>
      item.patternRef === screen.patternRef && item.responsibilityRefs.includes(screen.responsibilityRef));
    if (!selection) errors.push(`${screen.id} pattern ${screen.patternRef} is not selected for ${screen.responsibilityRef}`);
    validateNode(screen.root, { errors, recipes, decisions, resolutionByRequirement, nodeIds, usedDecisions });
  }
  for (const decision of manifest.decisions) if (!usedDecisions.has(decision.id)) errors.push(`generation decision ${decision.id} is unused`);

  const fixtureStates = manifest.stateFixtures.map((fixture) => fixture.state);
  if (!sameMembers(fixtureStates, REQUIRED_STATES)) errors.push('state fixtures must cover default, loading, empty, error, and permission exactly once');
  for (const fixture of manifest.stateFixtures) {
    for (const screenRef of fixture.screenRefs) if (!screenIds.has(screenRef)) errors.push(`${fixture.id} references unknown screen ${screenRef}`);
    for (const override of fixture.overrides) if (!nodeIds.has(override.nodeRef)) errors.push(`${fixture.id} override references unknown node ${override.nodeRef}`);
  }
  return errors;
}

export function assertGenerationReady(manifest, options = {}) {
  const errors = validateGenerationManifest(manifest, options);
  if (errors.length) {
    const error = new Error(`Generation Manifest is invalid:\n${errors.map((item) => `- ${item}`).join('\n')}`);
    error.code = 'GENERATION_MANIFEST_INVALID';
    error.errors = errors;
    throw error;
  }
  if (manifest.meta.status !== 'ready') {
    const error = new Error('Generation Manifest is blocked and cannot produce Review UI');
    error.code = 'GENERATION_GATE_BLOCKED';
    throw error;
  }
  return true;
}
