import { digest } from '../../packages/html-runtime/src/harness-core.mjs';
import { assertGenerationReady } from './generic-generation.mjs';

function componentIndex(registry) {
  return new Map(registry.components.map((component) => [component.id, component]));
}

function uniqueId(base, used) {
  let candidate = base;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}

function createUsageBuilder({ registry, resolution }) {
  const components = componentIndex(registry);
  const resolutionByRequirement = new Map(resolution.results.map((item) => [item.capabilityRequirementRef, item]));
  const instances = [];
  const usedIds = new Set();

  function add(node, componentId, suffix, props = {}, repeat = null) {
    const resolved = resolutionByRequirement.get(node.capabilityRequirementRef);
    if (!resolved?.targetRefs.includes(componentId)) {
      throw new Error(`${node.id}: ${componentId} is not resolved by ${node.capabilityRequirementRef}`);
    }
    const component = components.get(componentId);
    if (!component) throw new Error(`${node.id}: runtime registry does not contain ${componentId}`);
    const instanceId = uniqueId(suffix ? `${node.id}-${suffix}` : node.id, usedIds);
    const instance = {
      component: componentId,
      instanceId,
      ...(repeat ? { repeat } : {}),
      contractVersion: component.contractVersion,
      props,
      allowedVariants: component.variants,
      allowedStates: component.states,
      decisionRef: node.decisionRef,
      capabilityRequirementRef: node.capabilityRequirementRef,
    };
    instances.push(instance);
    return instanceId;
  }

  return { add, instances };
}

function compileCapability(node, builder) {
  const content = structuredClone(node.content);
  const usages = {};
  switch (node.presentation) {
    case 'action':
      usages.action = builder.add(node, 'button', 'action', { variant: 'primary' });
      break;
    case 'field-validation':
      usages.message = builder.add(node, 'validation-message', 'message', { variant: 'error' });
      break;
    case 'section-status':
      usages.alert = builder.add(node, 'alert', 'alert', { variant: content.tone ?? 'info' });
      if (content.actionLabel) usages.action = builder.add(node, 'button', 'action', { variant: 'secondary' });
      break;
    case 'task-progress':
      usages.steps = content.steps.map((step) =>
        builder.add(node, 'workflow-step', `step-${step.id}`, { state: step.state }, 'content.steps'));
      break;
    case 'status-list':
      usages.table = builder.add(node, 'table', 'table', { state: 'default' });
      usages.rows = content.rows.map((row) => ({
        status: builder.add(node, 'status-indicator', `status-${row.id}`, { variant: 'idle' }, 'content.rows'),
        ...(row.actionLabel
          ? { action: builder.add(node, 'button', `action-${row.id}`, { variant: 'secondary' }, 'content.rows') }
          : {}),
      }));
      break;
    case 'confirmation':
      usages.trigger = builder.add(node, 'button', 'trigger', { variant: 'primary' });
      usages.dialog = builder.add(node, 'dialog', 'dialog', { variant: 'default', state: 'closed' });
      usages.summary = builder.add(node, 'description-list', 'summary', { state: 'default' });
      usages.confirm = builder.add(node, 'button', 'confirm', { variant: 'primary' });
      usages.cancel = builder.add(node, 'button', 'cancel', { variant: 'secondary' });
      break;
    case 'text-input':
    case 'choice-input':
    case 'editable-collection': {
      usages.fields = content.fields.map((field) => {
        const control = node.presentation === 'choice-input' || field.options?.length
          ? 'select'
          : 'text-field';
        return {
          field: builder.add(node, 'form-field', `field-${field.id}`, { state: field.state === 'error' ? 'error' : 'default' }, 'content.fields'),
          control: builder.add(node, control, `control-${field.id}`, { state: field.state }, 'content.fields'),
          message: builder.add(node, 'validation-message', `message-${field.id}`, { variant: 'error' }, 'content.fields'),
        };
      });
      if (node.presentation === 'editable-collection' && content.actionLabel) {
        usages.action = builder.add(node, 'button', 'action', { variant: 'secondary' });
      }
      break;
    }
    default:
      throw new Error(`${node.id}: unsupported presentation ${node.presentation}`);
  }
  return { ...node, content, usages };
}

function compileNode(node, builder) {
  if (node.kind === 'layout') return { ...node, children: node.children.map((child) => compileNode(child, builder)) };
  if (node.kind === 'capability') return compileCapability(node, builder);
  return structuredClone(node);
}

function withoutCapabilityRef(instance) {
  const { capabilityRequirementRef, ...usage } = instance;
  return usage;
}

export function compileGenericReview({ manifest, sources, root }) {
  assertGenerationReady(manifest, {
    root,
    sources,
    allowFixtureSourceOverrides: manifest.meta.mode === 'fixture',
  });
  const registry = sources.componentRegistry;
  const resolution = sources.adapterResolution;
  const builder = createUsageBuilder({ registry, resolution });
  const screens = manifest.screens.map((screen) => ({
    id: screen.id,
    title: screen.title,
    responsibilityRef: screen.responsibilityRef,
    patternRef: screen.patternRef,
    root: compileNode(screen.root, builder),
  }));
  const compositionNodes = builder.instances.map((instance) => ({
    component: instance.component,
    instanceId: instance.instanceId,
    props: instance.props,
    allowedVariants: instance.allowedVariants,
    allowedStates: instance.allowedStates,
    decisionRef: instance.decisionRef,
  }));
  const composition = {
    id: `${manifest.meta.id}.composition`,
    conceptId: manifest.meta.id,
    translationPackDigest: registry.translationPackDigest,
    patterns: [...new Set(manifest.screens.map((screen) => screen.patternRef))],
    exceptions: [],
    decisions: manifest.decisions.map((decision) => ({
      ...decision,
      component: 'pattern',
    })),
    nodes: compositionNodes,
  };
  const renderSites = builder.instances.map((instance) => ({
    usageId: instance.instanceId,
    component: instance.component,
    callCount: 1,
  }));
  const usageInstances = builder.instances.map(withoutCapabilityRef);
  const validationDigest = digest({
    generationManifestId: manifest.meta.id,
    translationPackDigest: registry.translationPackDigest,
    runtimeVersion: registry.runtimeVersion,
    screens,
    instances: usageInstances,
    decisions: manifest.decisions,
  });
  const usage = {
    schemaVersion: '0.1.0',
    conceptId: manifest.meta.id,
    sourcePackageId: sources.screenResponsibilities.meta.id,
    compositionId: composition.id,
    translationPackDigest: registry.translationPackDigest,
    runtimeVersion: registry.runtimeVersion,
    patterns: composition.patterns,
    instances: usageInstances,
    decisions: manifest.decisions,
    exceptions: [],
    renderSites,
    validationDigest,
  };
  const model = {
    meta: {
      schemaVersion: '0.1.0',
      kind: 'generic-review-model',
      id: `${manifest.meta.id}.review-model`,
      locale: 'ja-JP',
    },
    source: {
      generationManifestId: manifest.meta.id,
      generationManifestDigest: digest(manifest),
      directionRef: manifest.directionRef,
      visualProfileRef: manifest.visualProfileRef,
      visualProfileRegistryId: sources.visualProfiles.meta.id,
      visualProfileRegistryVersion: sources.visualProfiles.meta.version,
      adapterResolutionId: resolution.meta.id,
      adapterRefs: resolution.policy.eligibleAdapterRefs,
      layoutRecipeRegistryId: sources.layoutRecipes.meta.id,
      layoutRecipeRegistryVersion: sources.layoutRecipes.meta.version,
      componentRegistryDigest: registry.translationPackDigest,
      runtimeVersion: registry.runtimeVersion,
    },
    review: structuredClone(manifest.review),
    screens,
    stateFixtures: structuredClone(manifest.stateFixtures),
    decisions: structuredClone(manifest.decisions),
    usageIndex: Object.fromEntries(builder.instances.map((instance) => [
      instance.instanceId,
      {
        component: instance.component,
        decisionRef: instance.decisionRef,
        allowedVariants: instance.allowedVariants,
        allowedStates: instance.allowedStates,
      },
    ])),
  };
  return { model, usage, composition };
}

export function validateCompiledReview({ model, usage, composition, manifest, registry }) {
  const errors = [];
  if (model.source.generationManifestId !== manifest.meta.id) errors.push('compiled model manifest ID is stale');
  if (model.source.componentRegistryDigest !== registry.translationPackDigest) errors.push('compiled model registry digest is stale');
  if (usage.translationPackDigest !== registry.translationPackDigest) errors.push('usage registry digest is stale');
  const usageIds = usage.instances.map((instance) => instance.instanceId);
  if (duplicates(usageIds).length) errors.push('compiled usage IDs must be unique');
  const compositionIds = composition.nodes.map((node) => node.instanceId);
  if (!sameSet(usageIds, compositionIds)) errors.push('compiled usage and composition instance IDs differ');
  const renderIds = usage.renderSites.map((site) => site.usageId);
  if (!sameSet(usageIds, renderIds)) errors.push('compiled usage and render sites differ');
  return errors;
}

function duplicates(values) {
  const seen = new Set();
  const repeated = [];
  for (const value of values) {
    if (seen.has(value)) repeated.push(value);
    seen.add(value);
  }
  return repeated;
}

function sameSet(left, right) {
  return left.length === right.length
    && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}
