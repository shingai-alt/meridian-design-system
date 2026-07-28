import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import test from 'node:test';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const spikeRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = resolve(spikeRoot, '..', '..');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const packageJson = readJson(join(spikeRoot, 'package.json'));
const plan = readJson(join(repositoryRoot, 'design/adapter-browser-evaluation-plan.json'));
const evidence = readJson(join(repositoryRoot, 'design/evidence/adapter-browser/manifest.json'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

const adapterSources = {
  'shadcn-ui': 'src/adapters/shadcn-registry.tsx',
  'radix-primitives': 'src/adapters/radix.mjs',
  'react-aria': 'src/adapters/react-aria.mjs',
  'material-ui': 'src/adapters/material-ui.mjs',
  carbon: 'src/adapters/carbon.mjs',
};

test('isolated spike implements every planned candidate', () => {
  assert.deepEqual(Object.keys(adapterSources).sort(), [...plan.candidateRefs].sort());
  for (const source of Object.values(adapterSources)) {
    assert.equal(existsSync(join(spikeRoot, source)), true, source);
  }
});

test('all spike dependencies are exact-pinned', () => {
  for (const [name, version] of Object.entries({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  })) {
    assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must use an exact version`);
  }
});

test('spike remains isolated from Meridian runtime workspaces', () => {
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.name, '@meridian/spike-external-adapters');
  assert.equal(packageJson.workspaces, undefined);
});

test('shadcn candidate is compiled from every captured registry source file', () => {
  const snapshot = readJson(
    join(repositoryRoot, 'design/evidence/adapter-browser/shadcn-registry-snapshot.json'),
  );
  const materialization = readJson(
    join(spikeRoot, 'registry-parity/generated/materialization-manifest.json'),
  );
  const captured = snapshot.items.flatMap((item) =>
    item.files.map((file) => `${file.path}:${file.contentSha256}`),
  );
  const materialized = materialization.files
    .filter((file) => file.item !== 'required-support')
    .map((file) => `${file.snapshotPath}:${file.sha256}`);
  assert.deepEqual(materialized.sort(), captured.sort());
  assert.match(
    readFileSync(join(spikeRoot, 'src/main.mjs'), 'utf8'),
    /shadcn-registry\.tsx/,
  );
});

test('recorded build footprints match the current dist artifacts byte for byte', () => {
  for (const footprint of evidence.build.candidateFootprints) {
    for (const artifact of footprint.artifacts) {
      const path = join(spikeRoot, 'dist', artifact.file);
      assert.equal(existsSync(path), true, artifact.file);
      const bytes = readFileSync(path);
      assert.equal(bytes.byteLength, artifact.rawBytes, `${artifact.file} raw size`);
      assert.equal(gzipSync(bytes).byteLength, artifact.gzipBytes, `${artifact.file} gzip size`);
      assert.equal(sha256(bytes), artifact.sha256, `${artifact.file} digest`);
    }
  }
});
