import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const spikeRoot = resolve(here, '..');
const repositoryRoot = resolve(spikeRoot, '..', '..');
const snapshotPath = join(
  repositoryRoot,
  'design/evidence/adapter-browser/shadcn-registry-snapshot.json',
);
const generatedRoot = join(spikeRoot, 'registry-parity/generated');
const manifestPath = join(generatedRoot, 'materialization-manifest.json');
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const pathRef = (path) => relative(repositoryRoot, path).split(sep).join('/');
const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));

const files = [];
for (const item of snapshot.items) {
  for (const file of item.files) {
    if (sha256(file.content) !== file.contentSha256) {
      throw new Error(`Snapshot content digest is stale for ${file.path}`);
    }
    const normalized = normalize(file.path);
    if (
      normalized === '..' ||
      normalized.startsWith(`..${sep}`) ||
      normalized.startsWith(sep)
    ) {
      throw new Error(`Registry path escapes generated root: ${file.path}`);
    }
    const outputPath = join(generatedRoot, normalized);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, file.content);
    files.push({
      item: item.name,
      snapshotPath: file.path,
      generatedRef: pathRef(outputPath),
      sha256: file.contentSha256,
    });
  }
}

const utilsContent = `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
const utilsPath = join(generatedRoot, 'lib/utils.ts');
await mkdir(dirname(utilsPath), { recursive: true });
await writeFile(utilsPath, utilsContent);
files.push({
  item: 'required-support',
  snapshotPath: null,
  generatedRef: pathRef(utilsPath),
  sha256: sha256(utilsContent),
});

const manifest = {
  snapshotRef: pathRef(snapshotPath),
  snapshotSha256: sha256(await readFile(snapshotPath)),
  generatedAt: new Date().toISOString(),
  files,
};
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Materialized ${files.length - 1} captured registry files and cn support.\n`);
