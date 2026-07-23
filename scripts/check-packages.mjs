import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
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
  const manifest = JSON.parse(readFileSync(path.join(packagePath, 'package.json'), 'utf8'));

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
  assert.equal(result.version, '1.1.1', `${result.name} is not version 1.1.1`);
  for (const [dependency, range] of Object.entries(manifest.dependencies ?? {})) {
    assert.equal(
      range.startsWith('workspace:'),
      false,
      `${result.name} dependency ${dependency} uses a workspace-only range`,
    );
  }
  assert.equal(
    [...files].some((file) => file.startsWith('src/')),
    false,
    `${result.name} unexpectedly includes source files`,
  );
  if (result.name === '@accessibility-devkit/cli') {
    assert.ok(files.has('dist/cli.mjs'), 'CLI tarball is missing its executable');
    assert.ok(files.has('dist/cli.mjs.map'), 'CLI tarball is missing its executable source map');
    assert.equal(
      manifest.bin?.['accessibility-devkit'],
      'dist/cli.mjs',
      'CLI bin path must already use npm’s normalized form',
    );
  }
  process.stdout.write(`checked ${result.name}@${result.version}\n`);
}
