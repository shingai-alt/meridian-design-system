import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const spikeRoot = resolve(here, '..');
const repositoryRoot = resolve(spikeRoot, '..', '..');
const packageLockPath = join(spikeRoot, 'package-lock.json');
const outputPath = join(
  repositoryRoot,
  'design/evidence/adapter-browser/shadcn-registry-snapshot.json',
);
const items = [
  'button',
  'input',
  'select',
  'checkbox',
  'dialog',
  'table',
  'badge',
  'alert',
  'dropdown-menu',
];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const pathRef = (path) => relative(repositoryRoot, path).split('\\').join('/');

const registryBase = 'https://ui.shadcn.com/r/styles/new-york-v4';
const registryItems = [];
for (const item of items) {
  const url = `${registryBase}/${item}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Registry request failed (${response.status}) for ${url}`);
  registryItems.push(await response.json());
}
const snapshot = {
  $schema: '../../../schemas/shadcn-registry-snapshot.schema.json',
  schemaVersion: '0.1.0',
  kind: 'shadcn-registry-snapshot',
  id: 'shadcn-new-york-v4-browser-spike-2026-07-27',
  capturedAt: new Date().toISOString(),
  cli: {
    package: 'shadcn',
    version: '4.8.3',
    command: `shadcn view ${items.join(' ')} (captured from the equivalent item endpoints)`,
  },
  source: {
    registry: `${registryBase}/{item}.json`,
    packageLockRef: pathRef(packageLockPath),
    packageLockSha256: sha256(readFileSync(packageLockPath)),
  },
  items: registryItems.map((item) => ({
    name: item.name,
    registrySchema: item.$schema,
    type: item.type,
    dependencies: item.dependencies ?? [],
    files: item.files.map((file) => ({
      path: file.path,
      type: file.type,
      content: file.content,
      contentSha256: sha256(file.content),
    })),
  })),
};

writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
process.stdout.write(`Wrote ${pathRef(outputPath)} with ${snapshot.items.length} registry items.\n`);
