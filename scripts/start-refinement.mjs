#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReviewRecord, nextCycleId } from './lib/review-cycle.mjs';
import { deriveStatuses, getReadyItems } from './lib/refinement-state.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const itemId = process.argv[2];
const forceReopen = process.argv.includes('--force');

if (!itemId) {
  console.error('Usage: npm run refine:start -- <item-id> [--force]');
  process.exit(2);
}

const registryPath = join(root, 'design/system-registry.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const items = registry.domains.flatMap((domain) => domain.items);
const item = items.find((candidate) => candidate.id === itemId);

if (!item) {
  console.error(`Unknown refinement item: ${itemId}`);
  process.exit(1);
}

const currentReviews = new Map();
for (const candidate of items) {
  if (!candidate.reviewRecord) continue;
  const reviewPath = join(root, candidate.reviewRecord);
  if (!existsSync(reviewPath)) continue;
  currentReviews.set(candidate.id, JSON.parse(readFileSync(reviewPath, 'utf8')));
}

const reviewDir = join(root, 'design/reviews');
const reviewHistory = [];
for (const name of readdirSync(reviewDir)) {
  if (!name.endsWith('.review.json') || name.startsWith('_')) continue;
  reviewHistory.push(JSON.parse(readFileSync(join(reviewDir, name), 'utf8')));
}

const statuses = deriveStatuses(registry, currentReviews, reviewHistory);
const readyIds = new Set(getReadyItems(registry, statuses).map((candidate) => candidate.id));
const dependenciesComplete = item.dependsOn.every((dependency) => statuses.get(dependency) === 'complete');
const restartingBlockedItem = statuses.get(itemId) === 'blocked' && dependenciesComplete;
const explicitlyReopeningCompleteItem =
  forceReopen && statuses.get(itemId) === 'complete' && dependenciesComplete;
if (!readyIds.has(itemId) && !restartingBlockedItem && !explicitlyReopeningCompleteItem) {
  const dependencies = item.dependsOn
    .filter((dependency) => statuses.get(dependency) !== 'complete')
    .map((dependency) => `${dependency} (${statuses.get(dependency)})`);
  const detail = dependencies.length > 0
    ? ` Waiting for: ${dependencies.join(', ')}.`
    : ` Current status: ${statuses.get(itemId)}.`;
  console.error(`${itemId} is not ready.${detail}`);
  process.exit(1);
}

const now = new Date();
const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
  .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
  .join('-');
const existingCycleIds = new Set(reviewHistory.map((review) => review.cycleId));
const cycleId = nextCycleId(itemId, date, existingCycleIds);
const relReviewPath = `design/reviews/${itemId}.${cycleId}.review.json`;
const absReviewPath = join(root, relReviewPath);
if (existsSync(absReviewPath)) {
  console.error(`Review record already exists: ${relReviewPath}`);
  process.exit(1);
}

const record = buildReviewRecord({
  item,
  date,
  cycleId,
  currentReview: currentReviews.get(itemId),
  reviewHistory,
});

writeFileSync(absReviewPath, `${JSON.stringify(record, null, 2)}\n`);
item.reviewRecord = relReviewPath;
writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);

console.log(`Started ${itemId}`);
console.log(`Review record: ${relReviewPath}`);
console.log('Fill the decisions, differences, changes, validations, impacts, and completion status before closing the cycle.');
