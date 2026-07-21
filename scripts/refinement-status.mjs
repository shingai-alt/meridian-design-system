#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveStatuses, getReadyItems } from './lib/refinement-state.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const registry = JSON.parse(readFileSync(join(root, 'design/system-registry.json'), 'utf8'));
const allItems = new Map(registry.domains.flatMap((domain) => domain.items).map((item) => [item.id, item]));
const reviewsById = new Map();
const reviewHistory = [];

for (const item of allItems.values()) {
  if (!item.reviewRecord || !existsSync(join(root, item.reviewRecord))) {
    continue;
  }
  const review = JSON.parse(readFileSync(join(root, item.reviewRecord), 'utf8'));
  reviewsById.set(item.id, review);
}

for (const name of readdirSync(join(root, 'design/reviews'))) {
  if (!name.endsWith('.review.json') || name.startsWith('_')) continue;
  reviewHistory.push(JSON.parse(readFileSync(join(root, 'design/reviews', name), 'utf8')));
}

const statusById = deriveStatuses(registry, reviewsById, reviewHistory);
const ready = getReadyItems(registry, statusById);
const allComplete = [...statusById.values()].every((status) => status === 'complete');
const researchCounts = { complete: 0, 'not-required': 0, pending: 0 };
for (const review of reviewsById.values()) researchCounts[review.research.status] += 1;

console.log('Meridian refinement status');
console.log('');
for (const domain of registry.domains.sort((a, b) => a.order - b.order)) {
  const counts = { complete: 0, 'needs-review': 0, 'in-progress': 0, blocked: 0, 'not-started': 0 };
  for (const item of domain.items) counts[statusById.get(item.id)] += 1;
  console.log(
    `${domain.title}: ${counts.complete}/${domain.items.length} complete, ` +
      `${counts['needs-review']} need review, ${counts['in-progress']} in progress, ` +
      `${counts.blocked} blocked, ${counts['not-started']} not started`,
  );
}

console.log(
  `Research Gate: ${researchCounts.complete} complete, ` +
    `${researchCounts['not-required']} not required, ${researchCounts.pending} pending`,
);

console.log('');
if (allComplete) {
  console.log(`All ${statusById.size} items are complete.`);
} else if (ready.length === 0) {
  console.log('No item is ready. Inspect blocked reviews and unresolved dependencies.');
} else {
  console.log(`Next recommended: ${ready[0].id} (${ready[0].name})`);
  console.log('Ready now:');
  ready.slice(0, 10).forEach((item) => console.log(`- ${item.id}: ${item.name}`));
  if (ready.length > 10) console.log(`- ...and ${ready.length - 10} more`);
}
