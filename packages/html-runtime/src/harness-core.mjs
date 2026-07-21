import { createHash } from 'node:crypto';

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function digest(value) {
  return `sha256-${createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex')}`;
}

function fail(code, message, context = {}) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  error.context = context;
  throw error;
}

export function validateComposition({ composition, registry, conceptId = null }) {
  if (conceptId && composition.conceptId !== conceptId) {
    fail('COMPOSITION_CONCEPT_MISMATCH', `Composition belongs to ${composition.conceptId}, expected ${conceptId}`);
  }
  if (composition.translationPackDigest !== registry.translationPackDigest) {
    fail('TRANSLATION_PACK_STALE', 'Composition references a different Translation Pack digest', {
      expected: registry.translationPackDigest,
      received: composition.translationPackDigest,
    });
  }

  const components = new Map(registry.components.map((component) => [component.id, component]));
  const patterns = new Map(registry.patterns.map((pattern) => [pattern.id, pattern]));
  const decisions = new Map(composition.decisions.map((decision) => [decision.id, decision]));
  if (decisions.size !== composition.decisions.length) fail('DECISION_DUPLICATE', 'Decision IDs must be unique');
  const instanceIds = new Set();
  const usedDecisionIds = new Set();
  const validSourceRefs = new Set([
    ...(registry.sourcePackageIds ?? []),
    ...registry.components.flatMap((component) => [
      `component.${component.id}.intent`,
      `component.${component.id}.accessibility`,
      `component.${component.id}.selection.primary`,
    ]),
  ]);

  for (const pattern of composition.patterns) {
    const registeredPattern = patterns.get(pattern);
    if (!registeredPattern) fail('PATTERN_UNKNOWN', `Pattern ${pattern} is not registered`, { pattern });
    if (registeredPattern.status === 'deprecated') fail('PATTERN_DEPRECATED', `Pattern ${pattern} is deprecated`, { pattern });
    if (registeredPattern.status === 'draft' && !registry.draftPatternAllowlist.includes(pattern)) {
      fail('PATTERN_DRAFT_NOT_ALLOWED', `Pattern ${pattern} is not in the pilot allowlist`, { pattern });
    }
  }

  for (const exception of composition.exceptions) {
    const approval = (registry.exceptionApprovals ?? []).find((record) => record.id === exception.approvalRef);
    if (exception.status !== 'approved' || !approval || approval.exceptionId !== exception.id || approval.scope !== exception.scope || approval.owner !== exception.owner || approval.expiresAt !== exception.expiresAt || Date.parse(`${approval.expiresAt}T23:59:59Z`) < Date.now()) {
      fail('EXCEPTION_UNAPPROVED', `Exception ${exception.id} is not approved`, { exceptionId: exception.id });
    }
  }

  for (const node of composition.nodes) {
    const component = components.get(node.component);
    if (!component) fail('COMPONENT_UNKNOWN', `Component ${node.component} is not registered`, { instanceId: node.instanceId });
    if (component.status === 'deprecated') fail('COMPONENT_DEPRECATED', `${node.component} is deprecated`, { instanceId: node.instanceId });
    if (component.status === 'draft' && !registry.draftAllowlist.includes(node.component)) {
      fail('COMPONENT_DRAFT_NOT_ALLOWED', `${node.component} is not in the pilot allowlist`, { instanceId: node.instanceId });
    }
    if (instanceIds.has(node.instanceId)) fail('INSTANCE_DUPLICATE', `Duplicate instanceId ${node.instanceId}`);
    instanceIds.add(node.instanceId);

    const allowedProps = new Set(component.props.map((prop) => prop.name));
    for (const prop of Object.keys(node.props)) {
      if (!allowedProps.has(prop)) fail('COMPONENT_PROP_UNKNOWN', `${node.component}.${prop} is not declared by the Contract`, { instanceId: node.instanceId });
    }
    for (const prop of component.props.filter((candidate) => candidate.required)) {
      const fulfilledByContent = prop.name === 'children' && Boolean(node.contentRef);
      if (!Object.hasOwn(node.props, prop.name) && !fulfilledByContent) {
        fail('COMPONENT_PROP_REQUIRED', `${node.component}.${prop.name} is required by the Contract`, { instanceId: node.instanceId });
      }
    }
    for (const [propName, propValue] of Object.entries(node.props)) {
      const declaration = component.props.find((prop) => prop.name === propName);
      const declaredType = declaration?.type.toLowerCase() ?? '';
      if (declaredType === 'boolean' && typeof propValue !== 'boolean') {
        fail('COMPONENT_PROP_TYPE', `${node.component}.${propName} must be boolean`, { instanceId: node.instanceId });
      }
      if (declaredType === 'string' && typeof propValue !== 'string') {
        fail('COMPONENT_PROP_TYPE', `${node.component}.${propName} must be string`, { instanceId: node.instanceId });
      }
    }
    if (node.props.variant !== undefined && !component.variants.includes(node.props.variant)) {
      fail('COMPONENT_VARIANT_UNKNOWN', `${node.component} does not define variant ${node.props.variant}`, { instanceId: node.instanceId, allowed: component.variants });
    }
    if (node.props.size !== undefined && !component.sizes.includes(node.props.size)) {
      fail('COMPONENT_SIZE_UNKNOWN', `${node.component} does not define size ${node.props.size}`, { instanceId: node.instanceId, allowed: component.sizes });
    }
    if (node.props.state !== undefined && !component.states.includes(node.props.state)) {
      fail('COMPONENT_STATE_UNKNOWN', `${node.component} does not define state ${node.props.state}`, { instanceId: node.instanceId, allowed: component.states });
    }
    for (const variant of node.allowedVariants) {
      if (!component.variants.includes(variant)) {
        fail('COMPONENT_VARIANT_UNKNOWN', `${node.component} does not define allowed variant ${variant}`, { instanceId: node.instanceId, allowed: component.variants });
      }
    }
    for (const state of node.allowedStates) {
      if (!component.states.includes(state)) {
        fail('COMPONENT_STATE_UNKNOWN', `${node.component} does not define allowed state ${state}`, { instanceId: node.instanceId, allowed: component.states });
      }
    }

    const decision = decisions.get(node.decisionRef);
    if (!decision) fail('DECISION_UNKNOWN', `Decision ${node.decisionRef} does not exist`, { instanceId: node.instanceId });
    if (![node.component, 'pattern'].includes(decision.component)) {
      fail('DECISION_COMPONENT_MISMATCH', `${node.decisionRef} records ${decision.component}, expected ${node.component}`, { instanceId: node.instanceId });
    }
    usedDecisionIds.add(node.decisionRef);
  }

  for (const decision of composition.decisions) {
    if (!usedDecisionIds.has(decision.id)) fail('DECISION_UNUSED', `Decision ${decision.id} is not referenced by a node`);
    for (const sourceRef of decision.sourceRefs) {
      if (!validSourceRefs.has(sourceRef)) fail('DECISION_SOURCE_UNKNOWN', `Decision ${decision.id} references unknown source ${sourceRef}`);
    }
  }

  return true;
}

export function auditRendererUsage({ source, composition }) {
  const rendererToComponent = {
    button: 'button', textField: 'text-field', select: 'select', formField: 'form-field',
    validationMessage: 'validation-message', checkbox: 'checkbox', alert: 'alert',
    statusIndicator: 'status-indicator', table: 'table',
  };
  const callPattern = /H\.(button|textField|select|formField|validationMessage|checkbox|alert|statusIndicator|table)\s*\(\s*\{([\s\S]*?)\}\s*[,)]/g;
  const usagePattern = /usageId\s*:\s*['"]([^'"]+)['"]/;
  const sites = [];
  for (const match of source.matchAll(callPattern)) {
    const usage = match[2].match(usagePattern);
    if (!usage) fail('RENDER_USAGE_DYNAMIC', `H.${match[1]} must declare a literal usageId`);
    sites.push({ component: rendererToComponent[match[1]], usageId: usage[1] });
  }
  const totalCalls = [...source.matchAll(/H\.(button|textField|select|formField|validationMessage|checkbox|alert|statusIndicator|table)\s*\(/g)].length;
  if (sites.length !== totalCalls) fail('RENDER_USAGE_UNRESOLVED', `Resolved ${sites.length} of ${totalCalls} Runtime component calls`);
  const nodes = new Map(composition.nodes.map((node) => [node.instanceId, node]));
  const counts = new Map();
  for (const site of sites) {
    const node = nodes.get(site.usageId);
    if (!node) fail('RENDER_USAGE_UNKNOWN', `Renderer uses undeclared Composition node ${site.usageId}`);
    if (node.component !== site.component) fail('RENDER_USAGE_COMPONENT_MISMATCH', `${site.usageId} declares ${node.component}, renderer calls ${site.component}`);
    counts.set(site.usageId, (counts.get(site.usageId) ?? 0) + 1);
  }
  for (const node of composition.nodes) {
    if (!counts.has(node.instanceId)) fail('COMPOSITION_NODE_UNRENDERED', `${node.instanceId} is not used by the renderer`);
  }
  return [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([usageId, callCount]) => ({
    usageId, component: nodes.get(usageId).component, callCount,
  }));
}

export function createUsageManifest({ composition, registry, concept, sourcePackageId, renderSites = [] }) {
  validateComposition({ composition, registry, conceptId: concept.meta.id });
  const byId = new Map(registry.components.map((component) => [component.id, component]));
  const instances = composition.nodes.map((node) => ({
    component: node.component,
    instanceId: node.instanceId,
    ...(node.repeat ? { repeat: node.repeat } : {}),
    contractVersion: byId.get(node.component).contractVersion,
    props: node.props,
    allowedVariants: node.allowedVariants,
    allowedStates: node.allowedStates,
    decisionRef: node.decisionRef,
  }));
  const validationDigest = digest({
    compositionId: composition.id,
    instances,
    translationPackDigest: registry.translationPackDigest,
    runtimeVersion: registry.runtimeVersion,
  });
  return {
    schemaVersion: '0.1.0',
    conceptId: concept.meta.id,
    sourcePackageId,
    compositionId: composition.id,
    translationPackDigest: registry.translationPackDigest,
    runtimeVersion: registry.runtimeVersion,
    patterns: composition.patterns,
    instances,
    decisions: composition.decisions,
    exceptions: composition.exceptions,
    renderSites,
    validationDigest,
  };
}
