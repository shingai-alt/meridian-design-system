import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { validateAgainstSchema } from './schema-validator.mjs';

const INSPECTOR_VERSION = '0.1.0';

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function digest(bytes) {
  return `sha256-${createHash('sha256').update(bytes).digest('hex')}`;
}

function safePath(root, path) {
  if (isAbsolute(path)) return null;
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  return absolute;
}

function allAdapterPaths(adapter) {
  return [
    ...(adapter.root ? [adapter.root] : []),
    ...adapter.componentSources,
    ...adapter.tokenSources,
    ...adapter.themeSources,
    ...adapter.iconSources,
    ...adapter.catalogSources,
  ];
}

export function validateMeridianDesignConfig(config, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const adapterIds = config.designSystem.adapters.map((adapter) => adapter.id);
  for (const id of duplicates(adapterIds)) errors.push(`duplicate adapter id ${id}`);

  for (const [key, declaration] of Object.entries(config.technology)) {
    if (declaration.mode === 'explicit' && declaration.values.length === 0) {
      errors.push(`technology.${key} explicit mode requires at least one value`);
    }
    if (declaration.mode === 'auto' && declaration.values.length > 0) {
      errors.push(`technology.${key} auto mode cannot claim explicit values`);
    }
  }
  for (const adapter of config.designSystem.adapters) {
    if (adapter.kind === 'project' && adapter.root === null) errors.push(`project adapter ${adapter.id} requires a project root`);
    if (adapter.kind === 'external' && adapter.root === null && adapter.packageName === null) {
      errors.push(`external adapter ${adapter.id} requires a package name or source root`);
    }
    if (adapter.status === 'available' && adapter.componentSources.length === 0) {
      errors.push(`available adapter ${adapter.id} requires component sources`);
    }
    if (adapter.status === 'available' && adapter.catalogSources.length === 0) {
      errors.push(`available adapter ${adapter.id} requires a machine-readable catalog source`);
    }
  }

  const configuredPaths = [
    ...config.inspection.includePaths,
    ...config.inspection.packageManifestPaths,
    ...config.designSystem.tokens.sources,
    ...config.designSystem.tokens.generatedOutputs,
    ...config.designSystem.themes.sources,
    ...config.designSystem.components.contractRoots,
    ...config.designSystem.components.implementationRoots,
    ...config.designSystem.components.catalogRefs,
    ...config.designSystem.icons.registryRefs,
    ...config.designSystem.icons.implementationRoots,
    ...config.designSystem.adapters.flatMap(allAdapterPaths),
  ];
  for (const path of configuredPaths) {
    const absolute = safePath(root, path);
    if (!absolute) errors.push(`configured path escapes the project root: ${path}`);
    else if (!existsSync(absolute)) errors.push(`configured path does not exist: ${path}`);
  }

  return errors;
}

export function loadMeridianDesignConfig(options = {}) {
  const root = resolve(options.root || process.cwd());
  const configRef = options.configRef || 'meridian.design.json';
  const configPath = safePath(root, configRef);
  if (!configPath || !existsSync(configPath)) throw new Error(`Design configuration does not exist within project root: ${configRef}`);
  const schemaRef = options.schemaRef || 'schemas/meridian-design-config.schema.json';
  const schemaPath = safePath(root, schemaRef);
  if (!schemaPath || !existsSync(schemaPath)) throw new Error(`Design configuration schema does not exist within project root: ${schemaRef}`);

  const bytes = readFileSync(configPath);
  const config = JSON.parse(bytes);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const errors = [
    ...validateAgainstSchema(config, schema, { label: configRef }),
    ...validateMeridianDesignConfig(config, { root }).map((error) => `${configRef}: ${error}`),
  ];
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return { config, configRef, configDigest: digest(bytes) };
}

function explicitFinding(id, category, values, configRef, observation) {
  return {
    id,
    category,
    values,
    provenance: 'explicit',
    confidence: 1,
    evidence: [{ path: configRef, sourceType: 'config', observation }],
  };
}

function inspectPackages(root, config) {
  const manifests = [];
  for (const path of config.inspection.packageManifestPaths) {
    const value = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
    manifests.push({ path, value });
  }
  return manifests;
}

function scanProjectFiles(root, config, limit = 20000) {
  const files = [];
  const excluded = config.inspection.excludePaths.map((path) => path.replace(/\/+$/, ''));
  const isExcluded = (path) => excluded.some((entry) => path === entry || path.startsWith(`${entry}/`));

  function visit(path) {
    if (files.length >= limit || isExcluded(path)) return;
    const absolute = resolve(root, path);
    if (!existsSync(absolute)) return;
    const entries = readdirSync(absolute, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= limit) return;
      const child = path === '.' ? entry.name : `${path}/${entry.name}`;
      if (isExcluded(child)) continue;
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) files.push(child);
    }
  }

  for (const path of config.inspection.includePaths) {
    const absolute = resolve(root, path);
    if (!existsSync(absolute) || isExcluded(path)) continue;
    try {
      const entries = readdirSync(absolute, { withFileTypes: true });
      if (entries) visit(path);
    } catch {
      files.push(path);
    }
  }
  return files;
}

function dependencyEvidence(manifests, packageName) {
  return manifests
    .filter(({ value }) =>
      value.name === packageName
      || Object.hasOwn(value.dependencies ?? {}, packageName)
      || Object.hasOwn(value.devDependencies ?? {}, packageName)
      || Object.hasOwn(value.peerDependencies ?? {}, packageName)
    )
    .map(({ path }) => path);
}

export function inferTechnology(key, manifests, files, options = {}) {
  const root = resolve(options.root || process.cwd());
  const values = [];
  const evidence = [];
  const addPackage = (value, packageName) => {
    const paths = dependencyEvidence(manifests, packageName);
    if (paths.length === 0) return;
    values.push(value);
    for (const path of paths) {
      evidence.push({ path, sourceType: 'package-manifest', observation: `${packageName} is declared by this package manifest.` });
    }
  };
  const addFile = (value, path, observation) => {
    values.push(value);
    evidence.push({ path, sourceType: 'source', observation });
  };

  if (key === 'frameworks') {
    addPackage('react', 'react');
    addPackage('next', 'next');
    addPackage('vue', 'vue');
    addPackage('svelte', 'svelte');
    addPackage('angular', '@angular/core');
    if (values.length === 0) {
      const html = files.find((path) => path.endsWith('.html'));
      if (html) addFile('framework-agnostic-html', html, 'HTML entry point exists without a detected application framework package.');
    }
  } else if (key === 'styling') {
    addPackage('tailwind-css', 'tailwindcss');
    addPackage('styled-components', 'styled-components');
    addPackage('emotion', '@emotion/react');
    addPackage('sass', 'sass');
    const css = files.find((path) => path.endsWith('.css'));
    if (css) {
      addFile('plain-css', css, 'CSS source file exists.');
      if (/--[a-z0-9-]+\s*:/.test(readFileSync(resolve(root, css), 'utf8'))) {
        addFile('css-custom-properties', css, 'CSS source declares custom properties.');
      }
    }
  } else if (key === 'languages') {
    const languageExtensions = [
      ['typescript-react', '.tsx'],
      ['typescript', '.ts'],
      ['javascript-es-modules', '.mjs'],
      ['javascript', '.js'],
      ['html', '.html'],
      ['css', '.css'],
      ['json', '.json'],
    ];
    for (const [value, extension] of languageExtensions) {
      const path = files.find((candidate) => candidate.endsWith(extension));
      if (path) addFile(value, path, `Source with ${extension} extension exists.`);
    }
  } else if (key === 'runtime') {
    const nodeSource = files.find((path) => path.endsWith('.mjs'));
    const browserSource = files.find((path) => path.endsWith('.html'));
    if (nodeSource) addFile('node', nodeSource, 'Executable ES module source indicates a Node-compatible tool runtime.');
    if (browserSource) addFile('browser', browserSource, 'HTML entry point indicates a browser runtime.');
  }

  return {
    values: [...new Set(values)],
    evidence: evidence.filter((item, index, list) =>
      list.findIndex((candidate) => candidate.path === item.path && candidate.observation === item.observation) === index
    ),
    confidence: values.length > 0 ? 0.8 : 0,
  };
}

function adapterAvailability(root, adapter, manifests) {
  if (adapter.status === 'disabled') {
    return { availability: 'disabled', evidencePaths: [], unresolvedReasons: [] };
  }
  const evidencePaths = [];
  const unresolvedReasons = [];
  for (const path of allAdapterPaths(adapter)) {
    if (existsSync(resolve(root, path))) evidencePaths.push(path);
    else unresolvedReasons.push(`Configured source is missing: ${path}`);
  }
  if (adapter.packageName) {
    const manifest = manifests.find(({ value }) => value.name === adapter.packageName);
    if (manifest) evidencePaths.push(manifest.path);
    else unresolvedReasons.push(`Package manifest for ${adapter.packageName} was not found`);
  }
  if (unresolvedReasons.length > 0) return { availability: 'unavailable', evidencePaths: [...new Set(evidencePaths)], unresolvedReasons };
  return {
    availability: adapter.status === 'available' ? 'available' : 'candidate',
    evidencePaths: [...new Set(evidencePaths)],
    unresolvedReasons: [],
  };
}

export function selectProjectAdapter(candidates) {
  const order = (items) => [...items].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
  const project = order(candidates.filter((candidate) => candidate.kind === 'project' && candidate.availability === 'available'));
  if (project.length > 0) {
    return {
      selectedAdapterId: project[0].id,
      reason: `Selected available project adapter ${project[0].id} before any external adapter.`,
    };
  }
  const external = order(candidates.filter((candidate) => candidate.kind === 'external' && candidate.availability === 'available'));
  if (external.length > 0) {
    return {
      selectedAdapterId: external[0].id,
      reason: `No project adapter was available; selected configured external adapter ${external[0].id}.`,
    };
  }
  return {
    selectedAdapterId: null,
    reason: 'No configured adapter is currently available; component resolution must remain blocked.',
  };
}

export function inspectProject(options = {}) {
  const root = resolve(options.root || process.cwd());
  const { config, configRef, configDigest } = loadMeridianDesignConfig({ root, configRef: options.configRef });
  const manifests = inspectPackages(root, config);
  const needsSourceInference = Object.values(config.technology).some((declaration) => declaration.mode === 'auto');
  const projectFiles = needsSourceInference ? scanProjectFiles(root, config) : [];
  const rootManifest = manifests.find(({ path }) => path === 'package.json')?.value;
  const findings = [];

  const technologyCategories = {
    runtime: 'runtime',
    frameworks: 'framework',
    styling: 'styling',
    languages: 'language',
  };
  for (const [key, category] of Object.entries(technologyCategories)) {
    const declaration = config.technology[key];
    if (declaration.mode === 'explicit') {
      findings.push(explicitFinding(
        `configured_${category.replaceAll('-', '_')}`,
        category,
        declaration.values,
        configRef,
        `${key} values are explicitly configured and are not inferred from package names.`
      ));
    } else {
      const inferred = inferTechnology(key, manifests, projectFiles, { root });
      if (inferred.values.length > 0) {
        findings.push({
          id: `inferred_${category.replaceAll('-', '_')}`,
          category,
          values: inferred.values,
          provenance: 'inferred',
          confidence: inferred.confidence,
          evidence: inferred.evidence,
        });
      }
    }
  }

  if (rootManifest?.packageManager) {
    findings.push({
      id: 'inferred_package_manager',
      category: 'package-manager',
      values: [rootManifest.packageManager],
      provenance: 'inferred',
      confidence: 0.95,
      evidence: [{
        path: 'package.json',
        sourceType: 'package-manifest',
        observation: 'The root packageManager field declares the contributor package manager and version.',
      }],
    });
  }

  findings.push(explicitFinding(
    'configured_token_format',
    'token-format',
    [config.designSystem.tokens.format],
    configRef,
    'Token interchange format is explicitly configured.'
  ));
  findings.at(-1).evidence.push({
    path: config.designSystem.tokens.sources[0],
    sourceType: 'token-source',
    observation: 'Configured token source exists in the project.',
  });
  findings.push(explicitFinding(
    'configured_themes',
    'theme',
    [
      ...config.designSystem.themes.modes.map((mode) => `theme:${mode}`),
      ...config.designSystem.themes.contrastModes.map((mode) => `contrast:${mode}`),
      ...config.designSystem.themes.densityModes.map((mode) => `density:${mode}`),
    ],
    configRef,
    'Theme, contrast, and density axes are explicitly configured.'
  ));
  findings.push(explicitFinding(
    'configured_component_system',
    'component-system',
    [...config.designSystem.components.contractRoots, ...config.designSystem.components.implementationRoots],
    configRef,
    'Component contract and implementation roots are explicitly configured.'
  ));
  findings.push(explicitFinding(
    'configured_icon_system',
    'icon-system',
    [...config.designSystem.icons.registryRefs, ...config.designSystem.icons.implementationRoots],
    configRef,
    'Icon registry and implementation roots are explicitly configured.'
  ));
  findings.push(explicitFinding(
    'configured_catalogs',
    'catalog',
    config.designSystem.components.catalogRefs,
    configRef,
    'Machine-readable component catalogs are explicitly configured.'
  ));
  const registryRef = config.designSystem.components.catalogRefs.find((path) => path.endsWith('system-registry.json'));
  if (registryRef) {
    const registry = JSON.parse(readFileSync(resolve(root, registryRef), 'utf8'));
    const registryIds = registry.domains.flatMap((domain) => domain.items.map((item) => item.id));
    const formIds = registryIds.filter((id) =>
      ['components.form-field', 'components.text-field', 'components.textarea', 'components.select', 'components.checkbox', 'components.radio', 'components.switch'].includes(id)
    );
    const tableIds = registryIds.filter((id) =>
      ['components.table', 'components.data-table', 'components.pagination'].includes(id)
    );
    if (formIds.length > 0) {
      findings.push({
        id: 'inferred_form_system',
        category: 'form-system',
        values: formIds,
        provenance: 'inferred',
        confidence: 0.98,
        evidence: [{ path: registryRef, sourceType: 'registry', observation: 'Registry contains form control and field component entries.' }],
      });
    }
    if (tableIds.length > 0) {
      findings.push({
        id: 'inferred_table_system',
        category: 'table-system',
        values: tableIds,
        provenance: 'inferred',
        confidence: 0.98,
        evidence: [{ path: registryRef, sourceType: 'registry', observation: 'Registry contains table and data navigation component entries.' }],
      });
    }
  }

  const candidates = config.designSystem.adapters.map((adapter) => ({
    id: adapter.id,
    kind: adapter.kind,
    configuredStatus: adapter.status,
    priority: adapter.priority,
    ...adapterAvailability(root, adapter, manifests),
  }));
  const selection = selectProjectAdapter(candidates);
  findings.push({
    id: 'resolved_adapter_selection',
    category: 'adapter',
    values: selection.selectedAdapterId ? [selection.selectedAdapterId] : ['unresolved'],
    provenance: 'inferred',
    confidence: selection.selectedAdapterId ? 0.99 : 0,
    evidence: candidates.flatMap((candidate) =>
      candidate.evidencePaths.map((path) => ({
        path,
        sourceType: path.endsWith('package.json') ? 'package-manifest' : 'source',
        observation: `Evidence for configured ${candidate.kind} adapter ${candidate.id}.`,
      }))
    ),
  });

  const unresolved = [];
  for (const candidate of candidates) {
    if (candidate.unresolvedReasons.length === 0) continue;
    unresolved.push({
      id: `adapter_${candidate.id}_unavailable`,
      category: 'adapter',
      question: `Can adapter ${candidate.id} be made available?`,
      impact: candidate.unresolvedReasons.join('; '),
      blocking: selection.selectedAdapterId === null,
      evidencePaths: candidate.evidencePaths,
    });
  }
  for (const [key, category] of Object.entries(technologyCategories)) {
    if (config.technology[key].mode !== 'auto') continue;
    if (findings.some((finding) => finding.id === `inferred_${category.replaceAll('-', '_')}`)) continue;
    unresolved.push({
      id: `auto_${category.replaceAll('-', '_')}_unresolved`,
      category,
      question: `Which ${category} should Meridian use for generation?`,
      impact: `The configuration delegates ${category} selection to inspection, but no deterministic detector is registered yet.`,
      blocking: true,
      evidencePaths: config.inspection.packageManifestPaths,
    });
  }

  return {
    meta: {
      schemaVersion: '0.1.0',
      kind: 'project-context',
      id: `project_context_${config.project.id}`,
      status: 'current',
      revision: 1,
      createdAt: config.inspection.asOf,
    },
    project: {
      id: config.project.id,
      name: config.project.name,
      root: config.project.root,
      configRef,
    },
    inspection: {
      inspectorVersion: INSPECTOR_VERSION,
      configDigest,
      asOf: config.inspection.asOf,
      scannedPaths: config.inspection.includePaths,
      excludedPaths: config.inspection.excludePaths,
    },
    findings,
    unresolved,
    adapterSelection: {
      policy: config.designSystem.selectionPolicy,
      candidates,
      selectedAdapterId: selection.selectedAdapterId,
      reason: selection.reason,
    },
    qualityRequirements: {
      requiredViewports: config.quality.requiredViewports,
      requiredStates: config.quality.requiredStates,
    },
  };
}

export function validateProjectContext(context, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = context.meta?.id || 'project-context';
  for (const id of duplicates(context.findings.map((finding) => finding.id))) errors.push(`${prefix}: duplicate finding id ${id}`);
  for (const id of duplicates(context.unresolved.map((item) => item.id))) errors.push(`${prefix}: duplicate unresolved id ${id}`);
  for (const id of duplicates(context.adapterSelection.candidates.map((candidate) => candidate.id))) errors.push(`${prefix}: duplicate adapter candidate id ${id}`);

  const configPath = safePath(root, context.project.configRef);
  if (!configPath || !existsSync(configPath)) {
    errors.push(`${prefix}: configRef does not exist within project root`);
  } else if (digest(readFileSync(configPath)) !== context.inspection.configDigest) {
    errors.push(`${prefix}: configuration digest is stale`);
  }

  for (const finding of context.findings) {
    if (finding.provenance === 'explicit' && finding.confidence !== 1) {
      errors.push(`${prefix}: explicit finding ${finding.id} must have confidence 1`);
    }
    if (finding.provenance === 'inferred' && finding.confidence === 1) {
      errors.push(`${prefix}: inferred finding ${finding.id} cannot claim certainty`);
    }
    for (const evidence of finding.evidence) {
      const absolute = safePath(root, evidence.path);
      if (!absolute) errors.push(`${prefix}: finding ${finding.id} evidence escapes project root: ${evidence.path}`);
      else if (!existsSync(absolute)) errors.push(`${prefix}: finding ${finding.id} evidence does not exist: ${evidence.path}`);
    }
  }

  const selected = context.adapterSelection.candidates.find((candidate) => candidate.id === context.adapterSelection.selectedAdapterId);
  if (context.adapterSelection.selectedAdapterId !== null && !selected) {
    errors.push(`${prefix}: selected adapter does not exist`);
  } else if (selected && selected.availability !== 'available') {
    errors.push(`${prefix}: selected adapter ${selected.id} is not available`);
  }
  const availableProject = context.adapterSelection.candidates
    .filter((candidate) => candidate.kind === 'project' && candidate.availability === 'available')
    .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id))[0];
  if (availableProject && selected?.id !== availableProject.id) {
    errors.push(`${prefix}: project-existing-first requires selecting ${availableProject.id}`);
  }

  for (const candidate of context.adapterSelection.candidates) {
    for (const path of candidate.evidencePaths) {
      const absolute = safePath(root, path);
      if (!absolute || !existsSync(absolute)) errors.push(`${prefix}: adapter ${candidate.id} evidence does not exist: ${path}`);
    }
  }
  return errors;
}
