import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

const digestFile = (path) => `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`;

export function validateUiGenerationMigrationMap(map, sessionPolicy, options = {}) {
  const errors = [];
  const prefix = map.meta?.id || 'ui-generation-migration-map';
  const root = resolve(options.root || process.cwd());
  const sourceIds = new Set(map.sourceArtifacts.map((artifact) => artifact.id));
  const mappingIds = new Set(map.mappings.map((mapping) => mapping.id));
  const mappingsById = new Map(map.mappings.map((mapping) => [mapping.id, mapping]));
  const artifactTypeIds = new Set(sessionPolicy.artifactTypes.map((artifact) => artifact.id));
  const statesById = new Map(sessionPolicy.states.map((state) => [state.id, state]));

  for (const id of duplicates(map.sourceArtifacts.map((artifact) => artifact.id))) errors.push(`${prefix}: duplicate source artifact id ${id}`);
  for (const id of duplicates(map.mappings.map((mapping) => mapping.id))) errors.push(`${prefix}: duplicate mapping id ${id}`);
  for (const id of duplicates(map.targetCoverage.map((coverage) => coverage.targetArtifactType))) {
    errors.push(`${prefix}: duplicate target coverage for ${id}`);
  }

  for (const artifact of map.sourceArtifacts) {
    const absolute = resolve(root, artifact.path);
    const rel = relative(root, absolute);
    if (isAbsolute(artifact.path) || rel.startsWith('..') || isAbsolute(rel)) {
      errors.push(`${prefix}: source artifact ${artifact.id} path escapes the repository`);
    } else if (!existsSync(absolute)) {
      errors.push(`${prefix}: source artifact ${artifact.id} does not exist: ${artifact.path}`);
    } else if (digestFile(absolute) !== artifact.digest) {
      errors.push(`${prefix}: source artifact ${artifact.id} digest is stale`);
    }
  }

  const mappedSourceIds = new Set();
  for (const mapping of map.mappings) {
    for (const sourceRef of mapping.sourceArtifactRefs) {
      if (!sourceIds.has(sourceRef)) errors.push(`${prefix}: mapping ${mapping.id} references unknown source ${sourceRef}`);
      mappedSourceIds.add(sourceRef);
    }
    for (const targetType of mapping.targetArtifactTypes) {
      if (!artifactTypeIds.has(targetType)) errors.push(`${prefix}: mapping ${mapping.id} references unknown target type ${targetType}`);
    }
  }
  for (const sourceId of sourceIds) {
    if (!mappedSourceIds.has(sourceId)) errors.push(`${prefix}: source artifact ${sourceId} is not preserved by any mapping`);
  }

  const coverageByType = new Map();
  for (const coverage of map.targetCoverage) {
    coverageByType.set(coverage.targetArtifactType, coverage);
    if (!artifactTypeIds.has(coverage.targetArtifactType)) {
      errors.push(`${prefix}: coverage references unknown target type ${coverage.targetArtifactType}`);
    }
    for (const mappingRef of coverage.mappingRefs) {
      if (!mappingIds.has(mappingRef)) {
        errors.push(`${prefix}: coverage ${coverage.targetArtifactType} references unknown mapping ${mappingRef}`);
      } else if (!mappingsById.get(mappingRef).targetArtifactTypes.includes(coverage.targetArtifactType)) {
        errors.push(`${prefix}: mapping ${mappingRef} does not produce target type ${coverage.targetArtifactType}`);
      }
    }
    if ((coverage.status === 'ready' || coverage.status === 'partial') && coverage.mappingRefs.length === 0) {
      errors.push(`${prefix}: ${coverage.status} coverage ${coverage.targetArtifactType} requires a mapping`);
    }
    if (coverage.status === 'ready' && coverage.gap !== null) errors.push(`${prefix}: ready coverage ${coverage.targetArtifactType} cannot retain a gap`);
    if ((coverage.status === 'partial' || coverage.status === 'missing') && !coverage.gap) {
      errors.push(`${prefix}: ${coverage.status} coverage ${coverage.targetArtifactType} requires a concrete gap`);
    }
  }
  for (const type of artifactTypeIds) {
    if (!coverageByType.has(type)) errors.push(`${prefix}: target coverage is missing ${type}`);
  }

  const placementState = statesById.get(map.placement.recommendedState);
  if (!placementState) {
    errors.push(`${prefix}: placement references unknown state ${map.placement.recommendedState}`);
  } else {
    const unavailable = placementState.requiredArtifactTypes.filter((type) => coverageByType.get(type)?.status !== 'ready');
    if (map.placement.canEnter && unavailable.length > 0) {
      errors.push(`${prefix}: cannot enter ${placementState.id}; target types are not ready: ${unavailable.join(', ')}`);
    }
  }
  if (map.placement.nextState !== null && !statesById.has(map.placement.nextState)) {
    errors.push(`${prefix}: placement references unknown next state ${map.placement.nextState}`);
  } else if (map.placement.nextState !== null) {
    const hasNextTransition = sessionPolicy.transitions.some((transition) =>
      (transition.from === map.placement.recommendedState || transition.from === 'any_active_state')
      && transition.to === map.placement.nextState
    );
    if (!hasNextTransition) {
      errors.push(`${prefix}: no Session transition connects ${map.placement.recommendedState} to ${map.placement.nextState}`);
    }
  }
  for (const type of map.placement.blockingTargetTypes) {
    if (!artifactTypeIds.has(type)) errors.push(`${prefix}: placement blocker references unknown target type ${type}`);
    if (coverageByType.get(type)?.status === 'ready') errors.push(`${prefix}: placement blocker ${type} is already ready`);
  }

  for (const blocker of map.blockers) {
    for (const type of blocker.targetArtifactTypes) {
      if (!artifactTypeIds.has(type)) errors.push(`${prefix}: blocker ${blocker.id} references unknown target type ${type}`);
      if (coverageByType.get(type)?.status === 'ready') errors.push(`${prefix}: blocker ${blocker.id} targets ready artifact type ${type}`);
    }
  }

  return errors;
}
