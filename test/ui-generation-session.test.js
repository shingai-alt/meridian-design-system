import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAgainstSchema } from '../scripts/lib/schema-validator.mjs';
import {
  validateUiGenerationSession,
  validateUiGenerationSessionPolicy,
} from '../scripts/lib/ui-generation-session.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => structuredClone(value);
const policy = readJson('design/ui-generation-session-policy.json');
const fixture = readJson('examples/ui-generation/session-foundation.session.json');
const teamInvitation = readJson('examples/ui-generation/team-invitation.session.json');
const digest = `sha256-${createHash('sha256')
  .update(readFileSync(join(root, 'examples/ui-generation/session-foundation.request.json')))
  .digest('hex')}`;

function artifact(id, type, ownership) {
  return {
    id,
    type,
    path: 'examples/ui-generation/session-foundation.request.json',
    schemaVersion: '0.1.0',
    digest,
    revision: 1,
    ownership,
    status: 'current',
  };
}

function digestRefs(artifacts) {
  return artifacts.map((item) => ({ artifactId: item.id, digest: item.digest }));
}

function approvedBriefSession() {
  const session = clone(fixture);
  session.blockers = [];
  session.meta.state = 'direction_planning';
  session.meta.revision = 4;
  session.meta.updatedAt = '2026-07-27T00:03:00Z';
  session.artifacts = [
    artifact('request_session_foundation', 'user_request', 'canonical'),
    artifact('project_context_reference', 'project_context', 'evidence'),
    artifact('design_brief_reference', 'design_brief', 'canonical'),
  ];
  const refs = digestRefs(session.artifacts);
  session.approvals = [{
    id: 'approval_brief_reference',
    transitionId: 'approve_brief',
    actor: { type: 'human', id: 'product-owner-1', role: 'product-owner' },
    decision: 'approved',
    recordedAt: '2026-07-27T00:03:00Z',
    artifactDigests: refs,
    notes: 'The structured brief is accepted for direction planning.',
  }];
  session.transitionHistory = [
    fixture.transitionHistory[0],
    {
      id: 'inspect_project',
      from: 'created',
      to: 'project_inspected',
      actorType: 'system',
      actorId: 'meridian-ui-generation',
      occurredAt: '2026-07-27T00:01:00Z',
      approvalRef: null,
      inputArtifactDigests: refs.slice(0, 2),
    },
    {
      id: 'submit_brief',
      from: 'project_inspected',
      to: 'brief_review',
      actorType: 'ai',
      actorId: 'meridian-ui-generation',
      occurredAt: '2026-07-27T00:02:00Z',
      approvalRef: null,
      inputArtifactDigests: refs,
    },
    {
      id: 'approve_brief',
      from: 'brief_review',
      to: 'direction_planning',
      actorType: 'human',
      actorId: 'product-owner-1',
      occurredAt: '2026-07-27T00:03:00Z',
      approvalRef: 'approval_brief_reference',
      inputArtifactDigests: refs,
    },
  ];
  return session;
}

test('UI Generation Session policy and reference fixture satisfy their schemas', () => {
  const policySchema = readJson('schemas/ui-generation-session-policy.schema.json');
  const sessionSchema = readJson('schemas/ui-generation-session.schema.json');
  assert.deepEqual(validateAgainstSchema(policy, policySchema), []);
  assert.deepEqual(validateAgainstSchema(fixture, sessionSchema), []);
});

test('Session policy has valid state, artifact, transition, and gate references', () => {
  assert.deepEqual(validateUiGenerationSessionPolicy(policy), []);
});

test('Reference session preserves inspected evidence but remains created until its Research Decision is approved', () => {
  assert.deepEqual(validateUiGenerationSession(fixture, policy, { root }), []);
  assert.equal(fixture.meta.state, 'created');
  assert.ok(fixture.artifacts.some((artifact) => artifact.type === 'project_context'));
  assert.ok(fixture.blockers.some((blocker) => blocker.kind === 'research' && blocker.status === 'open'));
});

test('Team Invitation session binds its Design Brief to the current request and Project Context', () => {
  const sessionSchema = readJson('schemas/ui-generation-session.schema.json');
  assert.deepEqual(validateAgainstSchema(teamInvitation, sessionSchema), []);
  assert.deepEqual(validateUiGenerationSession(teamInvitation, policy, { root }), []);
  assert.equal(teamInvitation.meta.state, 'created');
  assert.ok(teamInvitation.artifacts.some((artifact) => artifact.type === 'design_brief'));
  assert.ok(teamInvitation.artifacts.some((artifact) => artifact.type === 'requirement_allocation'));
  assert.ok(teamInvitation.artifacts.some((artifact) => artifact.type === 'screen_responsibilities'));
  assert.ok(teamInvitation.artifacts.some((artifact) => artifact.type === 'pattern_selection'));
  assert.ok(teamInvitation.artifacts.some((artifact) => artifact.type === 'direction_set'));
  assert.ok(teamInvitation.blockers.some((blocker) => blocker.blocksTransitions.includes('inspect_project')));
});

test('Session rejects a Design Brief bound to a stale request or Project Context', () => {
  const staleRequest = clone(teamInvitation);
  const request = staleRequest.artifacts.find((artifact) => artifact.type === 'user_request');
  request.path = 'examples/ui-generation/session-foundation.request.json';
  request.digest = digest;
  assert.match(
    validateUiGenerationSession(staleRequest, policy, { root }).join('\n'),
    /requestRef does not bind current user_request artifact|requestDigest is stale/,
  );

  const staleContext = clone(teamInvitation);
  const context = staleContext.artifacts.find((artifact) => artifact.type === 'project_context');
  context.path = 'examples/ui-generation/session-foundation.request.json';
  context.digest = digest;
  assert.match(
    validateUiGenerationSession(staleContext, policy, { root }).join('\n'),
    /projectContextRef does not bind current project_context artifact|projectContextDigest is stale/,
  );
});

test('Session rejects an M3 artifact chain that does not bind the current predecessor', () => {
  const broken = clone(teamInvitation);
  const allocationArtifact = broken.artifacts.find((artifact) => artifact.type === 'requirement_allocation');
  allocationArtifact.path = 'examples/ui-generation/session-foundation.request.json';
  allocationArtifact.digest = digest;
  const errors = validateUiGenerationSession(broken, policy, { root }).join('\n');
  assert.match(errors, /requirementAllocationRef does not bind current requirement_allocation artifact|requirementAllocationDigest is stale/);
});

test('Session rejects stale artifacts and state advancement without required artifacts', () => {
  const stale = clone(fixture);
  stale.artifacts[0].digest = `sha256-${'0'.repeat(64)}`;
  assert.match(validateUiGenerationSession(stale, policy, { root }).join('\n'), /digest is stale/);

  const missingContext = clone(fixture);
  missingContext.meta.state = 'project_inspected';
  missingContext.transitionHistory.push({
    id: 'inspect_project',
    from: 'created',
    to: 'project_inspected',
    actorType: 'system',
    actorId: 'meridian-project-inspector',
    occurredAt: '2026-07-27T01:00:00Z',
    approvalRef: null,
    inputArtifactDigests: digestRefs(missingContext.artifacts),
  });
  missingContext.artifacts = missingContext.artifacts.filter((artifact) => artifact.type !== 'project_context');
  assert.match(validateUiGenerationSession(missingContext, policy, { root }).join('\n'), /requires current artifact type project_context/);
});

test('Human gate accepts exact artifact digests and the required human role', () => {
  assert.deepEqual(validateUiGenerationSession(approvedBriefSession(), policy, { root }), []);
});

test('Human gate rejects AI execution, wrong roles, and stale approval evidence', () => {
  const aiApproved = approvedBriefSession();
  aiApproved.transitionHistory.at(-1).actorType = 'ai';
  aiApproved.approvals[0].actor.type = 'ai';
  assert.match(validateUiGenerationSession(aiApproved, policy, { root }).join('\n'), /must be authored by a human|must be executed by a human/);

  const wrongRole = approvedBriefSession();
  wrongRole.approvals[0].actor.role = 'designer';
  assert.match(validateUiGenerationSession(wrongRole, policy, { root }).join('\n'), /requires role product-owner/);

  const staleApproval = approvedBriefSession();
  staleApproval.approvals[0].artifactDigests[0].digest = `sha256-${'0'.repeat(64)}`;
  assert.match(validateUiGenerationSession(staleApproval, policy, { root }).join('\n'), /stale digest/);
});

test('Transition history must be continuous and end at the declared current state', () => {
  const broken = approvedBriefSession();
  broken.transitionHistory[2].from = 'created';
  broken.meta.state = 'brief_review';
  const errors = validateUiGenerationSession(broken, policy, { root }).join('\n');
  assert.match(errors, /does not continue from project_inspected/);
  assert.match(errors, /current state does not match final transition destination/);
});

test('Current artifact revision must be unique and newer than superseded revisions', () => {
  const session = clone(fixture);
  session.artifacts.push({
    ...session.artifacts[0],
    id: 'request_session_foundation_old',
    revision: 2,
    status: 'superseded',
  });
  assert.match(validateUiGenerationSession(session, policy, { root }).join('\n'), /current artifact type user_request must have the highest revision/);
});
