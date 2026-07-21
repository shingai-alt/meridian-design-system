#!/usr/bin/env node
import { readdirSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const targets = [];

function collect(relDir) {
  const absDir = join(root, relDir);
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const absPath = join(absDir, entry.name);
    if (entry.isDirectory()) {
      collect(relative(root, absPath));
    } else if (['.js', '.mjs'].includes(extname(entry.name))) {
      targets.push(absPath);
    }
  }
}
['js', 'src', 'scripts'].forEach(collect);
targets.sort();

const failures = [];
for (const target of targets) {
  const result = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
  if (result.status !== 0) failures.push({ target, output: `${result.stdout}${result.stderr}`.trim() });
}

if (failures.length > 0) {
  console.error(`JavaScript syntax check failed for ${failures.length} file(s):`);
  for (const failure of failures) {
    console.error(`- ${relative(root, failure.target)}`);
    console.error(failure.output);
  }
  process.exitCode = 1;
} else {
  console.log(`JavaScript syntax check passed: ${targets.length} files.`);
}
