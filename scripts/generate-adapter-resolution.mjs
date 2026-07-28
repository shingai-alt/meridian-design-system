import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCapabilityPlan } from './lib/capability-resolution.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes('--check');
const planRef = 'examples/ui-generation/team-invitation.capability-plan.json';
const registryRef = 'design/adapter-registry.json';
const tokenMappingRef = 'design/generated/adapter-token-mapping.json';
const outputRef = 'examples/ui-generation/team-invitation.adapter-resolution.json';
const readJson = (ref) => JSON.parse(readFileSync(join(root, ref), 'utf8'));
const digest = (ref) => `sha256-${createHash('sha256').update(readFileSync(join(root, ref))).digest('hex')}`;
const existing = check ? readJson(outputRef) : null;
const stableProjectTargetRefs = readdirSync(join(root, 'design/contracts/components'))
  .filter((name) => name.endsWith('.contract.json') && !name.startsWith('_'))
  .filter((name) => readJson(`design/contracts/components/${name}`).status === 'stable')
  .map((name) => name.replace(/\.contract\.json$/, ''));
const resolution = resolveCapabilityPlan(readJson(planRef), readJson(registryRef), {
  id: 'resolution_team_invitation_meridian',
  generatedAt: existing?.meta.generatedAt ?? '2026-07-27T07:05:00Z',
  capabilityPlanRef: planRef,
  capabilityPlanDigest: digest(planRef),
  adapterRegistryRef: registryRef,
  adapterRegistryDigest: digest(registryRef),
  tokenMappingRef,
  tokenMappingDigest: digest(tokenMappingRef),
  tokenMapping: readJson(tokenMappingRef),
  root,
  stableProjectTargetRefs,
});
const output = `${JSON.stringify(resolution, null, 2)}\n`;
if (check) {
  const current = readFileSync(join(root, outputRef), 'utf8');
  if (current !== output) {
    console.error(`${outputRef} is stale; run npm run generate:adapter-resolution`);
    process.exit(1);
  }
  console.log('Adapter resolution is current.');
} else {
  writeFileSync(join(root, outputRef), output);
  console.log(`Generated ${outputRef}`);
}
