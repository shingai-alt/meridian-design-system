import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeDirectionReviewDigest } from './lib/structure-planning.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const fixtureDirectory = 'test/fixtures/ui-generation';
const sourceRefs = {
  manifest: 'examples/ui-generation/team-invitation.generation-manifest.json',
  resolution: 'examples/ui-generation/team-invitation.adapter-resolution.json',
  direction: 'examples/ui-generation/team-invitation.direction-set.json',
};
const outputRefs = {
  manifest: `${fixtureDirectory}/team-invitation.generation-manifest.json`,
  resolution: `${fixtureDirectory}/team-invitation.adapter-resolution.json`,
  direction: `${fixtureDirectory}/team-invitation.direction-set.json`,
};

const readJson = (ref) => JSON.parse(readFileSync(join(root, ref), 'utf8'));
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const digestBytes = (bytes) => `sha256-${createHash('sha256').update(bytes).digest('hex')}`;
const digestObject = (value) => digestBytes(json(value));

function writeOrCheck(ref, content) {
  const absolute = join(root, ref);
  if (check) {
    if (readFileSync(absolute, 'utf8') !== content) throw new Error(`${ref} is stale`);
    return;
  }
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, content);
}

const resolution = structuredClone(readJson(sourceRefs.resolution));
resolution.meta.id = 'fixture_resolution_team_invitation';
resolution.meta.status = 'resolved';
resolution.generationGate = {
  status: 'pass',
  reasons: ['Synthetic test fixture only; production approval remains blocked.'],
};

const direction = structuredClone(readJson(sourceRefs.direction));
direction.meta.id = 'fixture_directions_team_invitation';
direction.meta.status = 'approved';
direction.meta.updatedAt = '2026-07-27T10:00:00Z';
direction.review = {
  status: 'approved',
  requiredRole: 'design-owner',
  approval: {
    actorType: 'human',
    actorId: 'synthetic-fixture-design-owner',
    role: 'design-owner',
    decision: 'approved',
    selectedDirectionRef: direction.recommendation.directionRef,
    directionSetDigest: '',
    decidedAt: '2026-07-27T10:00:00Z',
  },
};
direction.review.approval.directionSetDigest = computeDirectionReviewDigest(direction);

const manifest = structuredClone(readJson(sourceRefs.manifest));
manifest.meta.id = 'fixture_generation_team_invitation';
manifest.meta.status = 'ready';
manifest.meta.mode = 'fixture';
manifest.meta.createdAt = '2026-07-27T10:00:00Z';
manifest.directionRef = direction.review.approval.selectedDirectionRef;
manifest.source.adapterResolution = {
  ref: outputRefs.resolution,
  digest: digestObject(resolution),
};
manifest.source.directionSet = {
  ref: outputRefs.direction,
  digest: digestObject(direction),
};
manifest.output = {
  reviewUi: 'test/fixtures/generated/team-invitation.review.html',
  reviewModel: 'test/fixtures/generated/team-invitation.review-model.json',
  usageManifest: 'test/fixtures/generated/team-invitation.usage.json',
};

for (const [ref, value] of [
  [outputRefs.resolution, resolution],
  [outputRefs.direction, direction],
  [outputRefs.manifest, manifest],
]) {
  writeOrCheck(ref, json(value));
}
console.log(`${check ? 'Verified' : 'Generated'} synthetic Team Invitation fixture chain.`);
