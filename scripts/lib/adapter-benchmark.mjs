function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

const coveredStatuses = new Set(['native', 'composition', 'extension', 'generator-owned']);

export function summarizeAdapterCandidate(candidate, benchmark) {
  const requiredByPilot = new Map(
    benchmark.pilots.map((pilot) => [
      pilot.id,
      new Set(pilot.capabilities.filter((capability) => capability.required).map((capability) => capability.id)),
    ]),
  );
  const statuses = [];
  for (const pilotCoverage of candidate.pilotCoverage) {
    const required = requiredByPilot.get(pilotCoverage.pilotRef) ?? new Set();
    for (const coverage of pilotCoverage.capabilities) {
      if (required.has(coverage.capabilityRef)) statuses.push(coverage.status);
    }
  }
  const count = (status) => statuses.filter((value) => value === status).length;
  const covered = statuses.filter((status) => coveredStatuses.has(status)).length;
  return {
    candidateRef: candidate.id,
    requiredCapabilities: statuses.length,
    native: count('native'),
    composition: count('composition'),
    extension: count('extension'),
    commercial: count('commercial'),
    unresolved: count('unresolved'),
    generatorOwned: count('generator-owned'),
    coverageRatio: Number((covered / statuses.length).toFixed(4)),
    blocking: statuses.some((status) => ['commercial', 'unresolved'].includes(status)),
  };
}

export function validateAdapterBenchmark(benchmark) {
  const errors = [];
  const pilotIds = new Set(benchmark.pilots.map((pilot) => pilot.id));
  const candidateIds = new Set(benchmark.candidates.map((candidate) => candidate.id));
  const allCapabilityIds = new Set(benchmark.pilots.flatMap((pilot) => pilot.capabilities.map((capability) => capability.id)));
  for (const id of duplicates(benchmark.pilots.map((pilot) => pilot.id))) errors.push(`duplicate pilot id ${id}`);
  for (const id of duplicates(benchmark.candidates.map((candidate) => candidate.id))) errors.push(`duplicate candidate id ${id}`);
  for (const pilot of benchmark.pilots) {
    for (const id of duplicates(pilot.capabilities.map((capability) => capability.id))) errors.push(`pilot ${pilot.id} has duplicate capability ${id}`);
  }

  for (const candidate of benchmark.candidates) {
    const coverageByPilot = new Map(candidate.pilotCoverage.map((coverage) => [coverage.pilotRef, coverage]));
    if (coverageByPilot.size !== candidate.pilotCoverage.length) errors.push(`candidate ${candidate.id} has duplicate pilot coverage`);
    for (const pilot of benchmark.pilots) {
      const coverage = coverageByPilot.get(pilot.id);
      if (!coverage) {
        errors.push(`candidate ${candidate.id} is missing pilot ${pilot.id}`);
        continue;
      }
      const expected = [...pilot.capabilities.map((capability) => capability.id)].sort();
      const received = [...coverage.capabilities.map((capability) => capability.capabilityRef)].sort();
      if (JSON.stringify(expected) !== JSON.stringify(received)) {
        errors.push(`candidate ${candidate.id} pilot ${pilot.id} does not assess the exact shared capability set`);
      }
      for (const item of coverage.capabilities) {
        if (!allCapabilityIds.has(item.capabilityRef)) errors.push(`candidate ${candidate.id} references unknown capability ${item.capabilityRef}`);
        if (item.status === 'unresolved' && item.resolution !== null) errors.push(`unresolved capability ${candidate.id}.${item.capabilityRef} cannot claim a resolution`);
        if (item.status !== 'unresolved' && item.resolution === null) errors.push(`resolved capability ${candidate.id}.${item.capabilityRef} requires a resolution`);
        if (item.status === 'commercial' && !/commercial|paid|license|Pro|Premium/i.test(`${item.notes} ${candidate.licenseBoundary}`)) {
          errors.push(`commercial capability ${candidate.id}.${item.capabilityRef} must expose its license boundary`);
        }
      }
    }
  }

  const expectedSummary = benchmark.candidates.map((candidate) => summarizeAdapterCandidate(candidate, benchmark));
  if (JSON.stringify(benchmark.summary) !== JSON.stringify(expectedSummary)) errors.push('adapter benchmark summary is stale');
  for (const summary of benchmark.summary) {
    if (!candidateIds.has(summary.candidateRef)) errors.push(`summary references unknown candidate ${summary.candidateRef}`);
  }
  if (benchmark.status === 'decision-ready' && benchmark.browserEvaluation.status !== 'complete') {
    errors.push('decision-ready benchmark requires completed browser evaluation');
  }
  if (benchmark.browserEvaluation.status === 'complete' && benchmark.browserEvaluation.artifactRefs.length === 0) {
    errors.push('completed browser evaluation requires artifact evidence');
  }
  if (benchmark.status !== 'decision-ready' && benchmark.browserEvaluation.blockers.length === 0) {
    errors.push('incomplete benchmark must state its blockers');
  }
  if (pilotIds.size !== benchmark.pilots.length || candidateIds.size !== benchmark.candidates.length) {
    errors.push('pilot and candidate IDs must be unique');
  }
  return errors;
}
