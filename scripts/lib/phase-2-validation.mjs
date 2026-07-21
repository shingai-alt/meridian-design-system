export const TEAM_INVITATION_COVERAGE = ['primary', 'validation', 'existing-pending', 'seat-exceeded', 'owner-confirmation', 'partial-success', 'max-batch'];

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function eligibleRows(scenario) {
  const seen = new Set();
  return scenario.rows.filter((row) => {
    const email = row.email.trim().toLowerCase();
    if (!validEmail(email) || seen.has(email)) return false;
    seen.add(email);
    return row.existingState === 'new';
  });
}

function invariantHolds(tag, scenario) {
  const eligible = eligibleRows(scenario);
  const available = scenario.contractedSeats - scenario.acceptedMembers - scenario.pendingInvitations;
  const failureEmails = new Set(scenario.sendFailureEmails.map((email) => email.toLowerCase()));
  if (tag === 'primary') {
    return eligible.length === scenario.rows.length && eligible.length > 0 && eligible.length <= available && failureEmails.size === 0;
  }
  if (tag === 'validation') return scenario.rows.some((row) => !validEmail(row.email.trim().toLowerCase()));
  if (tag === 'existing-pending') return scenario.rows.some((row) => row.existingState === 'pending');
  if (tag === 'seat-exceeded') return eligible.length > Math.max(0, available);
  if (tag === 'owner-confirmation') return eligible.some((row) => row.role === 'Owner');
  if (tag === 'partial-success') {
    const failed = eligible.filter((row) => failureEmails.has(row.email.toLowerCase()));
    const succeeded = eligible.filter((row) => !failureEmails.has(row.email.toLowerCase()));
    return failed.length > 0 && succeeded.length > 0;
  }
  if (tag === 'max-batch') return scenario.rows.length === 10;
  return false;
}

export function validatePhaseTwoCoverage(concept) {
  if (concept.generation.renderer !== 'team-invitation') return [];
  const errors = [];
  const coverage = new Set(concept.prototype.scenarios.flatMap((scenario) => scenario.covers));
  const missing = TEAM_INVITATION_COVERAGE.filter((tag) => !coverage.has(tag));
  if (missing.length) errors.push(`missing required scenario coverage: ${missing.join(', ')}`);
  for (const scenario of concept.prototype.scenarios) {
    for (const tag of scenario.covers) {
      if (!invariantHolds(tag, scenario)) errors.push(`scenario ${scenario.id} claims ${tag} but its fixture does not satisfy that invariant`);
    }
  }
  return errors;
}
