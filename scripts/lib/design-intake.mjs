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

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function safePath(root, path) {
  if (isAbsolute(path)) return null;
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  return rel.startsWith('..') || isAbsolute(rel) ? null : absolute;
}

function fileDigest(path) {
  return `sha256-${createHash('sha256').update(readFileSync(path)).digest('hex')}`;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalDigest(value) {
  return `sha256-${createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex')}`;
}

export function computeBriefReviewDigest(brief) {
  const reviewable = structuredClone(brief);
  reviewable.meta.status = 'ready-for-review';
  reviewable.review = {
    status: 'pending',
    requiredRole: brief.review.requiredRole,
    approval: null,
  };
  return canonicalDigest(reviewable);
}

function validateFileDigest(root, path, expectedDigest, label, errors) {
  const absolute = safePath(root, path);
  if (!absolute) errors.push(`${label} escapes the project root`);
  else if (!existsSync(absolute)) errors.push(`${label} does not exist: ${path}`);
  else if (fileDigest(absolute) !== expectedDigest) errors.push(`${label} digest is stale`);
}

export function validateDesignBrief(brief, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = brief.meta?.id || 'design-brief';
  const policy = options.policy;
  const evidenceIds = new Set(brief.evidence.map((item) => item.id));
  const actorIds = new Set(brief.actors.map((item) => item.id));
  const entityIds = new Set(brief.entities.map((item) => item.id));
  const unknownIds = new Set(brief.unknowns.map((item) => item.id));

  const collections = [
    ['evidence', brief.evidence],
    ['actor', brief.actors],
    ['secondary task', brief.secondaryTasks],
    ['entity', brief.entities],
    ['action', brief.actions],
    ['constraint', brief.constraints],
    ['risk', brief.risks],
    ['assumption', brief.assumptions],
    ['unknown', brief.unknowns],
  ];
  for (const [label, items] of collections) {
    for (const id of duplicates(items.map((item) => item.id))) errors.push(`${prefix}: duplicate ${label} id ${id}`);
  }

  validateFileDigest(root, brief.source.requestRef, brief.source.requestDigest, `${prefix}: requestRef`, errors);
  validateFileDigest(root, brief.source.projectContextRef, brief.source.projectContextDigest, `${prefix}: projectContextRef`, errors);

  const evidenceOwners = [
    ...brief.actors,
    brief.primaryGoal,
    brief.primaryTask,
    ...brief.secondaryTasks,
    ...brief.entities,
    ...brief.actions,
    ...brief.constraints,
    ...brief.risks,
    ...brief.assumptions,
    ...brief.unknowns,
  ];
  for (const owner of evidenceOwners) {
    for (const evidenceRef of owner.evidenceRefs) {
      if (!evidenceIds.has(evidenceRef)) errors.push(`${prefix}: ${owner.id || 'brief section'} references unknown evidence ${evidenceRef}`);
    }
  }

  for (const action of brief.actions) {
    if (!actorIds.has(action.actorRef)) errors.push(`${prefix}: action ${action.id} references unknown actor ${action.actorRef}`);
    for (const entityRef of action.entityRefs) {
      if (!entityIds.has(entityRef)) errors.push(`${prefix}: action ${action.id} references unknown entity ${entityRef}`);
    }
  }
  for (const assumption of brief.assumptions) {
    if (assumption.sourceUnknownRef !== null && !unknownIds.has(assumption.sourceUnknownRef)) {
      errors.push(`${prefix}: assumption ${assumption.id} references unknown unknown ${assumption.sourceUnknownRef}`);
    }
  }

  for (const unknown of brief.unknowns) {
    if (unknown.structuralImpacts.length === 0) errors.push(`${prefix}: unknown ${unknown.id} requires structural impact classification`);
    if (unknown.impact === 'blocking' && (unknown.structuralImpacts.length === 0 || unknown.structuralImpacts.every((impact) => impact === 'none'))) {
      errors.push(`${prefix}: blocking unknown ${unknown.id} requires a structural impact`);
    }
    if (unknown.impact === 'non-blocking' && unknown.structuralImpacts.some((impact) => impact !== 'none')) {
      errors.push(`${prefix}: non-blocking unknown ${unknown.id} cannot claim a structural impact`);
    }
    if (unknown.status === 'open') {
      if (unknown.answer !== null || unknown.resolutionRationale !== null) errors.push(`${prefix}: open unknown ${unknown.id} cannot contain a resolution`);
    } else if (!hasText(unknown.answer) || !hasText(unknown.resolutionRationale)) {
      errors.push(`${prefix}: resolved unknown ${unknown.id} requires answer and rationale`);
    }
    if (unknown.status === 'assumed' && !brief.assumptions.some((assumption) => assumption.sourceUnknownRef === unknown.id && assumption.status === 'active')) {
      errors.push(`${prefix}: assumed unknown ${unknown.id} requires an active linked assumption`);
    }
    if (policy && unknown.priority !== expectedUnknownPriority(unknown, policy)) {
      errors.push(`${prefix}: unknown ${unknown.id} priority must equal its highest structural impact weight`);
    }
  }

  const openBlocking = brief.unknowns.filter((unknown) => unknown.status === 'open' && unknown.impact === 'blocking');
  if (brief.meta.status === 'clarification-required' && openBlocking.length === 0) {
    errors.push(`${prefix}: clarification-required status needs an open blocking unknown`);
  }
  if (['ready-for-review', 'approved'].includes(brief.meta.status) && openBlocking.length > 0) {
    errors.push(`${prefix}: ${brief.meta.status} brief cannot retain open blocking unknowns`);
  }
  if (brief.meta.status === 'ready-for-review' && (brief.review.status !== 'pending' || brief.review.approval !== null)) {
    errors.push(`${prefix}: ready-for-review brief must have pending review without approval`);
  }
  if (brief.meta.status === 'approved') {
    if (brief.review.status !== 'approved' || brief.review.approval === null) {
      errors.push(`${prefix}: approved brief requires Human Approval`);
    } else {
      if (brief.review.approval.actorType !== 'human') errors.push(`${prefix}: AI cannot approve a Design Brief`);
      if (brief.review.approval.role !== brief.review.requiredRole) errors.push(`${prefix}: brief approval requires role ${brief.review.requiredRole}`);
      if (brief.review.approval.decision !== 'approved') errors.push(`${prefix}: approved brief has a non-approval decision`);
      if (brief.review.approval.briefDigest !== computeBriefReviewDigest(brief)) errors.push(`${prefix}: brief approval digest is stale`);
    }
  } else if (brief.review.status === 'approved' || brief.review.approval?.decision === 'approved') {
    errors.push(`${prefix}: only an approved brief may contain approval`);
  }
  if (brief.meta.status === 'revision-requested') {
    if (brief.review.status !== 'revision-requested' || brief.review.approval?.decision !== 'revision-requested') {
      errors.push(`${prefix}: revision-requested brief requires a matching Human Decision`);
    }
  }
  if (brief.meta.updatedAt < brief.meta.createdAt) errors.push(`${prefix}: updatedAt cannot precede createdAt`);

  return errors;
}

export function expectedUnknownPriority(unknown, policy) {
  return Math.max(...unknown.structuralImpacts.map((impact) => policy.structuralImpactWeights[impact] ?? 0), 0);
}

export function createClarificationRound(brief, policy, options = {}) {
  const root = resolve(options.root || process.cwd());
  const briefRef = options.briefRef;
  if (!briefRef) throw new Error('briefRef is required');
  const absoluteBrief = safePath(root, briefRef);
  if (!absoluteBrief || !existsSync(absoluteBrief)) throw new Error(`briefRef does not exist within project root: ${briefRef}`);
  const persistedBrief = JSON.parse(readFileSync(absoluteBrief, 'utf8'));
  if (canonicalDigest(persistedBrief) !== canonicalDigest(brief)) {
    throw new Error(`briefRef content does not match supplied Design Brief: ${briefRef}`);
  }
  const openBlocking = brief.unknowns
    .filter((unknown) => unknown.status === 'open' && unknown.impact === 'blocking')
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
  const selected = openBlocking.slice(0, policy.questionLimit.maximum);
  const questions = selected.map((unknown, index) => ({
    unknownRef: unknown.id,
    rank: index + 1,
    prompt: unknown.question,
    whyNow: `回答によって${unknown.structuralImpacts.join('、')}が変わるため、画面構造を決める前に確認します。`,
    answerType: 'free-text',
    options: [],
  }));
  return {
    meta: {
      schemaVersion: '0.1.0',
      kind: 'clarification-round',
      id: options.id || `clarification_${brief.meta.id}_${brief.meta.revision}`,
      status: questions.length > 0 ? 'awaiting-answers' : 'no-questions',
      createdAt: options.createdAt,
      mergedAt: null,
    },
    briefRef,
    briefRevision: brief.meta.revision,
    briefDigest: fileDigest(absoluteBrief),
    questions,
    deferredUnknownRefs: openBlocking.slice(policy.questionLimit.maximum).map((unknown) => unknown.id),
    responses: [],
  };
}

function validateUpdate(update, brief, label, errors) {
  const rules = {
    'primary-goal': { fields: ['statement'], collection: null },
    'primary-task': { fields: ['statement', 'frequency', 'workMode'], collection: null },
    actor: { fields: ['role', 'description'], collection: brief.actors },
    entity: { fields: ['name', 'volume', 'sensitivity'], collection: brief.entities },
    action: { fields: ['verb', 'frequency', 'risk'], collection: brief.actions },
    constraint: { fields: ['statement'], collection: brief.constraints },
    risk: { fields: ['statement', 'mitigation'], collection: brief.risks },
  };
  const rule = rules[update.targetSection];
  if (!rule.fields.includes(update.field)) errors.push(`${label} cannot update ${update.targetSection}.${update.field}`);
  if (rule.collection === null && update.targetId !== null) errors.push(`${label} ${update.targetSection} update cannot use targetId`);
  if (rule.collection !== null && !rule.collection.some((item) => item.id === update.targetId)) {
    errors.push(`${label} references unknown ${update.targetSection} ${update.targetId}`);
  }
  const enumValues = {
    frequency: ['continuous', 'daily', 'weekly', 'occasional', 'one-time', 'unknown'],
    workMode: ['compare', 'process-one', 'create', 'review', 'monitor', 'configure', 'explore', 'unknown'],
    volume: ['single', 'few', 'many', 'unknown'],
    sensitivity: ['public', 'internal', 'confidential', 'restricted', 'unknown'],
    risk: ['reversible', 'irreversible', 'high-impact', 'unknown'],
  };
  if (enumValues[update.field] && !enumValues[update.field].includes(update.value)) {
    errors.push(`${label} has invalid ${update.field} value ${update.value}`);
  }
}

export function validateClarificationRound(round, brief, policy, options = {}) {
  const errors = [];
  const root = resolve(options.root || process.cwd());
  const prefix = round.meta?.id || 'clarification-round';
  const unknownsById = new Map(brief.unknowns.map((unknown) => [unknown.id, unknown]));
  validateFileDigest(root, round.briefRef, round.briefDigest, `${prefix}: briefRef`, errors);
  const absoluteBrief = safePath(root, round.briefRef);
  if (absoluteBrief && existsSync(absoluteBrief)) {
    try {
      if (canonicalDigest(JSON.parse(readFileSync(absoluteBrief, 'utf8'))) !== canonicalDigest(brief)) {
        errors.push(`${prefix}: supplied Design Brief does not match briefRef content`);
      }
    } catch (error) {
      errors.push(`${prefix}: briefRef is not valid JSON: ${error.message}`);
    }
  }
  if (round.briefRevision !== brief.meta.revision) errors.push(`${prefix}: brief revision is stale`);

  const expected = brief.unknowns
    .filter((unknown) => unknown.status === 'open' && unknown.impact === 'blocking')
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id));
  const expectedSelected = expected.slice(0, policy.questionLimit.maximum).map((unknown) => unknown.id);
  const expectedDeferred = expected.slice(policy.questionLimit.maximum).map((unknown) => unknown.id);
  if (round.questions.map((question) => question.unknownRef).join(',') !== expectedSelected.join(',')) {
    errors.push(`${prefix}: questions do not match the highest-priority blocking unknowns`);
  }
  if (round.deferredUnknownRefs.join(',') !== expectedDeferred.join(',')) {
    errors.push(`${prefix}: deferred unknowns do not match remaining blocking unknowns`);
  }
  for (const [index, question] of round.questions.entries()) {
    const unknown = unknownsById.get(question.unknownRef);
    if (!unknown) errors.push(`${prefix}: question references unknown ${question.unknownRef}`);
    if (question.rank !== index + 1) errors.push(`${prefix}: question ranks must be contiguous`);
    for (const term of policy.questionLanguage.prohibitedTerms) {
      if (question.prompt.toLocaleLowerCase().includes(term.toLocaleLowerCase())) {
        errors.push(`${prefix}: question ${question.unknownRef} uses prohibited implementation term ${term}`);
      }
    }
    if (question.answerType === 'choice' && question.options.length < 2) errors.push(`${prefix}: choice question ${question.unknownRef} requires at least two options`);
    if (question.answerType !== 'choice' && question.options.length > 0) errors.push(`${prefix}: non-choice question ${question.unknownRef} cannot contain options`);
  }

  const responseRefs = round.responses.map((response) => response.unknownRef);
  for (const duplicate of duplicates(responseRefs)) errors.push(`${prefix}: duplicate response for ${duplicate}`);
  for (const response of round.responses) {
    if (!round.questions.some((question) => question.unknownRef === response.unknownRef)) {
      errors.push(`${prefix}: response ${response.unknownRef} was not asked in this round`);
    }
    if (response.resolution === 'assumed' && response.assumption === null) errors.push(`${prefix}: assumed response ${response.unknownRef} requires assumption`);
    if (response.resolution !== 'assumed' && response.assumption !== null) errors.push(`${prefix}: ${response.resolution} response ${response.unknownRef} cannot contain assumption`);
    for (const update of response.briefUpdates) validateUpdate(update, brief, `${prefix}: response ${response.unknownRef}`, errors);
  }

  if (round.meta.status === 'no-questions' && (round.questions.length > 0 || round.responses.length > 0)) {
    errors.push(`${prefix}: no-questions round must be empty`);
  }
  if (round.meta.status === 'awaiting-answers' && round.responses.length > 0) errors.push(`${prefix}: awaiting-answers round cannot contain responses`);
  if (['answered', 'merged'].includes(round.meta.status)) {
    if (round.responses.length !== round.questions.length || !expectedSelected.every((id) => responseRefs.includes(id))) {
      errors.push(`${prefix}: ${round.meta.status} round requires one response for every question`);
    }
  }
  if (round.meta.status === 'merged' && !hasText(round.meta.mergedAt)) errors.push(`${prefix}: merged round requires mergedAt`);
  if (round.meta.status !== 'merged' && round.meta.mergedAt !== null) errors.push(`${prefix}: only merged round may contain mergedAt`);
  return errors;
}

function applyUpdate(brief, update) {
  const sectionMap = {
    'primary-goal': brief.primaryGoal,
    'primary-task': brief.primaryTask,
    actor: brief.actors.find((item) => item.id === update.targetId),
    entity: brief.entities.find((item) => item.id === update.targetId),
    action: brief.actions.find((item) => item.id === update.targetId),
    constraint: brief.constraints.find((item) => item.id === update.targetId),
    risk: brief.risks.find((item) => item.id === update.targetId),
  };
  sectionMap[update.targetSection][update.field] = update.value;
}

export function mergeClarificationRound(brief, round, policy, options = {}) {
  const validationErrors = validateClarificationRound(round, brief, policy, options);
  if (validationErrors.length > 0) throw new Error(validationErrors.join('\n'));
  if (round.meta.status !== 'answered') throw new Error('Only an answered clarification round can be merged');
  const merged = structuredClone(brief);
  for (const response of round.responses) {
    const unknown = merged.unknowns.find((item) => item.id === response.unknownRef);
    unknown.status = response.resolution;
    unknown.answer = response.answer;
    unknown.resolutionRationale = response.rationale;
    const evidenceId = `answer_${response.unknownRef}`;
    merged.evidence.push({
      id: evidenceId,
      sourceType: 'human-answer',
      ref: options.roundRef || round.meta.id,
      observation: response.answer,
    });
    unknown.evidenceRefs.push(evidenceId);
    if (response.resolution === 'assumed') {
      merged.assumptions.push({
        ...response.assumption,
        status: 'active',
        sourceUnknownRef: response.unknownRef,
        evidenceRefs: [evidenceId],
      });
    }
    for (const update of response.briefUpdates) applyUpdate(merged, update);
  }
  merged.meta.revision += 1;
  merged.meta.updatedAt = options.mergedAt;
  const hasOpenBlocking = merged.unknowns.some((unknown) => unknown.status === 'open' && unknown.impact === 'blocking');
  merged.meta.status = hasOpenBlocking ? 'clarification-required' : 'ready-for-review';
  merged.review = { status: 'pending', requiredRole: merged.review.requiredRole, approval: null };
  return merged;
}

export function approveDesignBrief(brief, approval) {
  if (brief.meta.status !== 'ready-for-review') throw new Error('Only a ready-for-review brief can be approved');
  if (approval.actorType !== 'human') throw new Error('AI cannot approve a Design Brief');
  if (approval.role !== brief.review.requiredRole) throw new Error(`Brief approval requires role ${brief.review.requiredRole}`);
  const approved = structuredClone(brief);
  approved.meta.revision += 1;
  approved.meta.updatedAt = approval.decidedAt.replace(/\.\d{3}Z$/, 'Z');
  approved.meta.status = approval.decision === 'approved' ? 'approved' : 'revision-requested';
  approved.review.status = approval.decision;
  approved.review.approval = {
    ...approval,
    briefDigest: computeBriefReviewDigest(approved),
  };
  return approved;
}
