#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGenerationReport,
  validateGenerationReport,
} from './lib/generation-report.mjs';
import { validateAgainstSchema } from './lib/schema-validator.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const check = args.includes('--check');
const requestedManifest = args.find((arg) => !arg.startsWith('--'));
const manifestRefs = requestedManifest ? [requestedManifest] : [
  'test/fixtures/ui-generation/team-invitation.generation-manifest.json',
  'test/fixtures/ui-generation/issue-triage.generation-manifest.json',
];
const policy = readJson('design/ui-generation-browser-qa-policy.json');
const reportSchema = readJson('schemas/generation-report.schema.json');
const browserEvidenceSchema = readJson('schemas/browser-qa-evidence.schema.json');
const repairRecordSchema = readJson('schemas/ui-generation-repair-record.schema.json');

function readJson(ref) {
  return JSON.parse(readFileSync(join(root, ref), 'utf8'));
}

function binding(ref) {
  const bytes = readFileSync(join(root, ref));
  return { ref, digest: `sha256-${createHash('sha256').update(bytes).digest('hex')}` };
}

function pilotId(manifest) {
  return manifest.meta.id.replace(/^fixture_generation_/, '').replace(/^generation_/, '').replaceAll('_', '-');
}

function outputRef(manifest) {
  return `test/fixtures/generated/generation-reports/${pilotId(manifest)}.report.json`;
}

let failed = false;
for (const manifestRef of manifestRefs) {
  try {
    const manifest = readJson(manifestRef);
    const sources = Object.fromEntries(
      Object.entries(manifest.source).map(([name, sourceBinding]) => [name, readJson(sourceBinding.ref)]),
    );
    const browserRef = `test/fixtures/generated/browser-qa/${pilotId(manifest)}.evidence.json`;
    const repairRef = `test/fixtures/generated/browser-qa/${pilotId(manifest)}.repair.json`;
    const browserEvidence = existsSync(join(root, browserRef)) ? readJson(browserRef) : null;
    const repairRecord = existsSync(join(root, repairRef)) ? readJson(repairRef) : null;
    const report = createGenerationReport({
      manifest,
      manifestBinding: binding(manifestRef),
      sources,
      browserEvidence,
      browserEvidenceBinding: browserEvidence ? binding(browserRef) : null,
      repairRecord,
      repairRecordBinding: repairRecord ? binding(repairRef) : null,
      policy,
    });
    const errors = [
      ...validateAgainstSchema(report, reportSchema),
      ...(browserEvidence ? validateAgainstSchema(browserEvidence, browserEvidenceSchema) : []),
      ...(repairRecord ? validateAgainstSchema(repairRecord, repairRecordSchema) : []),
      ...validateGenerationReport(report, manifest, sources, {
        root,
        browserEvidence,
        repairRecord,
        policy,
        policyRef: 'design/ui-generation-browser-qa-policy.json',
      }),
    ];
    if (errors.length) throw new Error(errors.join('\n'));
    const ref = outputRef(manifest);
    const content = `${JSON.stringify(report, null, 2)}\n`;
    const absolute = join(root, ref);
    if (check) {
      if (!existsSync(absolute)) throw new Error(`${ref} is missing`);
      if (readFileSync(absolute, 'utf8') !== content) throw new Error(`${ref} is stale`);
      console.log(`Verified ${ref}.`);
    } else {
      mkdirSync(dirname(absolute), { recursive: true });
      writeFileSync(absolute, content);
      console.log(`Generated ${ref} (${report.meta.status}).`);
    }
  } catch (error) {
    failed = true;
    console.error(`${manifestRef}: ${error.message}`);
  }
}
if (failed) process.exit(1);
