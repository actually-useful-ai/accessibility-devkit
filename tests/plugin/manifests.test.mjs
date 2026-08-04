import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const canonicalRepository = 'https://github.com/actually-useful-ai/accessibility-devkit';

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

test('keeps public plugin manifests aligned with the package release', async () => {
  const [claude, codex, cursor, marketplace, corePackage] = await Promise.all([
    readJson('.claude-plugin/plugin.json'),
    readJson('.codex-plugin/plugin.json'),
    readJson('.cursor-plugin/plugin.json'),
    readJson('.claude-plugin/marketplace.json'),
    readJson('packages/core/package.json'),
  ]);
  const marketplacePlugin = marketplace.plugins[0];
  const manifests = [claude, codex, cursor, marketplacePlugin];

  assert.equal(corePackage.version, '1.1.1');
  for (const manifest of manifests) {
    assert.equal(manifest.name, 'accessibility');
    assert.equal(manifest.version, corePackage.version);
    assert.match(manifest.description, /accessibility/i);
    assert.equal(manifest.author.name, 'Luke Steuber');
  }

  for (const manifest of [claude, codex, cursor]) {
    assert.equal(manifest.repository, canonicalRepository);
  }
  assert.equal(marketplacePlugin.source, './');
});

test('declares Cursor skill discovery using the portable skill tree', async () => {
  const [cursor, codex] = await Promise.all([
    readJson('.cursor-plugin/plugin.json'),
    readJson('.codex-plugin/plugin.json'),
  ]);

  assert.equal(cursor.displayName, codex.interface.displayName);
  assert.equal(cursor.skills, './skills/');
  assert.equal(cursor.skills, codex.skills);

  const skillsPath = path.resolve(root, cursor.skills);
  assert.equal(path.relative(root, skillsPath), 'skills');
  const entries = await readdir(skillsPath, { withFileTypes: true });
  const skillDirectories = entries.filter((entry) => entry.isDirectory());
  assert.ok(skillDirectories.length > 0);
  await Promise.all(
    skillDirectories.map((entry) => access(path.join(skillsPath, entry.name, 'SKILL.md'))),
  );
});
