import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDirectory = path.join(root, 'packages');

for (const directory of readdirSync(packagesDirectory, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const packagePath = path.join(packagesDirectory, directory.name);
  const packed = spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: packagePath,
    encoding: 'utf8',
  });
  assert.equal(packed.status, 0, packed.stderr || packed.stdout);
  const result = JSON.parse(packed.stdout)[0];
  const files = new Set(result.files.map(({ path: file }) => file));

  for (const required of [
    'LICENSE',
    'README.md',
    'package.json',
    'dist/index.js',
    'dist/index.js.map',
    'dist/index.mjs',
    'dist/index.mjs.map',
    'dist/index.d.ts',
  ]) {
    assert.ok(files.has(required), `${result.name} tarball is missing ${required}`);
  }
  assert.equal(result.version, '1.1.0', `${result.name} is not version 1.1.0`);
  assert.equal(
    [...files].some((file) => file.startsWith('src/')),
    false,
    `${result.name} unexpectedly includes source files`,
  );
  if (result.name === '@accessibility-devkit/cli') {
    assert.ok(files.has('dist/cli.mjs'), 'CLI tarball is missing its executable');
    assert.ok(files.has('dist/cli.mjs.map'), 'CLI tarball is missing its executable source map');
  }
  process.stdout.write(`checked ${result.name}@${result.version}\n`);
}
