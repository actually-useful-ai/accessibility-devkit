import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const canonical = 'https://github.com/actually-useful-ai/accessibility-devkit';
const packageNames = [
  'core',
  'cli',
  'audit',
  'components',
  'accommodations',
  'motor',
  'cognitive',
  'language',
  'media',
  'motion',
];

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('leads with one-minute outcomes and keeps tool-specific shortcuts secondary', async () => {
  const readme = await read('README.md');

  assert.match(readme, /## Start in a minute/i);
  assert.match(readme, /### Run a check/i);
  assert.match(readme, /### Import a utility/i);
  assert.match(readme, /### Add the review workflow/i);
  assert.match(readme, /Plugins Directory/i);
  assert.match(readme, /marketplace.*import|import.*marketplace/i);
  assert.match(readme, /\.claude-plugin\/marketplace\.json/);
  assert.match(
    readme,
    /\[OpenAI Plugins documentation\]\(https:\/\/learn\.chatgpt\.com\/docs\/plugins\)/,
  );
  assert.match(readme, /Review this interface for accessibility barriers/i);
  assert.match(readme, /Expected (result|output)/i);
  assert.match(readme, /Verif(y|ication)/i);
  assert.doesNotMatch(readme.split('## Start in a minute')[0], /Codex|Claude|TypeScript/i);
});

test('offers a repository-backed direct skill fallback and separate Claude commands', async () => {
  const readme = await read('README.md');

  assert.match(
    readme,
    /git clone https:\/\/github\.com\/actually-useful-ai\/accessibility-devkit\.git/i,
  );
  assert.match(readme, /\.agents\/skills\/accessibility/);
  assert.match(readme, /target="\$HOME\/\.agents\/skills\/accessibility"/);
  assert.match(readme, /\[ -e "\$target" \] \|\| \[ -L "\$target" \]/);
  assert.match(readme, /ls -ld "\$target"/);
  assert.match(readme, /remove only that entry with: rm/i);
  assert.match(readme, /different.*destination/i);
  assert.match(readme, /never overwrite.*nest/i);
  assert.match(readme, /\/plugin marketplace add actually-useful-ai\/accessibility-devkit/);
  assert.match(readme, /\/plugin install accessibility@accessibility-devkit/);
});

test('the component review demonstrates every requested remediation without an overlay', async () => {
  const examplePath = path.join(root, 'examples/accessible-component-review.md');
  await access(examplePath);
  const example = await read('examples/accessible-component-review.md');

  assert.match(example, /## Before/i);
  assert.match(example, /## After/i);
  assert.match(example, /semantic/i);
  assert.match(example, /keyboard/i);
  assert.match(example, /focus/i);
  assert.match(example, /error recovery/i);
  assert.match(example, /target size/i);
  assert.match(example, /<button[^>]*type="submit"/i);
  assert.match(example, /\.focus\(\)/);
  assert.match(example, /aria-describedby/i);
  assert.match(example, /aria-live="polite"/i);
  assert.match(example, /min-(?:inline-)?size:\s*44px/i);
  assert.match(example, /min-(?:block-)?size:\s*44px/i);
  assert.doesNotMatch(example, /accessibility overlay/i);
});

test('keeps plugin, skill, and package identifiers valid for the quick start', async () => {
  const codex = JSON.parse(await read('.codex-plugin/plugin.json'));
  const claude = JSON.parse(await read('.claude-plugin/plugin.json'));
  const marketplace = JSON.parse(await read('.claude-plugin/marketplace.json'));
  const skill = await read('skills/accessibility/SKILL.md');
  const workspace = JSON.parse(await read('package.json'));
  const packages = await Promise.all(
    packageNames.map(async (name) => JSON.parse(await read(`packages/${name}/package.json`))),
  );

  assert.equal(codex.name, 'accessibility');
  assert.equal(codex.skills, './skills/');
  assert.equal(claude.name, 'accessibility');
  assert.match(marketplace.description, /accessibility/i);
  assert.equal(marketplace.plugins[0].name, 'accessibility');
  assert.match(skill, /^---\nname: accessibility\ndescription: /);
  assert.deepEqual(
    packages.map(({ name }) => name),
    packageNames.map((name) => `@accessibility-devkit/${name}`),
  );
  assert.match(workspace.scripts['test:docs'], /tests\/docs\/adoption-quick-start\.test\.mjs/);
  assert.match(workspace.scripts.test, /pnpm test:docs/);
});

test('keeps canonical repository metadata accurate', async () => {
  const codex = JSON.parse(await read('.codex-plugin/plugin.json'));
  const claude = JSON.parse(await read('.claude-plugin/plugin.json'));
  const workspace = JSON.parse(await read('package.json'));
  const packages = await Promise.all(
    packageNames.map(async (name) => JSON.parse(await read(`packages/${name}/package.json`))),
  );

  assert.equal(codex.repository, canonical);
  assert.equal(claude.repository, canonical);
  assert.equal(workspace.repository.url, `git+${canonical}.git`);
  assert.equal(codex.interface.privacyPolicyURL, undefined);
  assert.equal(codex.interface.termsOfServiceURL, undefined);
  assert.equal(workspace.bugs.url, `${canonical}/issues`);
  assert.equal(workspace.homepage, `${canonical}#readme`);
  for (const [index, packageManifest] of packages.entries()) {
    assert.equal(packageManifest.repository.url, `git+${canonical}.git`);
    assert.equal(packageManifest.bugs.url, `${canonical}/issues`);
    assert.equal(
      packageManifest.homepage,
      `${canonical}/tree/master/packages/${packageNames[index]}#readme`,
    );
  }
});

test('documents installable npm and Python routes without hiding source development', async () => {
  const publicReadmes = ['README.md', ...packageNames.map((name) => `packages/${name}/README.md`)];

  for (const relativePath of publicReadmes) {
    const readme = await read(relativePath);
    assert.match(readme, /npm install|npm i|npx|pipx|pip install/i, relativePath);
    assert.match(readme, /manual|human|browser|assistive technolog/i, relativePath);
    assert.doesNotMatch(readme, /pnpm release/i, relativePath);
  }

  const readme = await read('README.md');
  assert.match(readme, /npm install @accessibility-devkit\/core/i);
  assert.match(readme, /pipx run accessibility-devkit/i);
  assert.match(readme, /from accessibility_devkit import/i);
  assert.match(readme, /require\('@accessibility-devkit\/core'\)/i);
  assert.match(readme, /## v1\.0 to v1\.1 migration/i);
  assert.match(readme, /JSON Schema 2020-12/i);
});

test('publishes dual module metadata for every package when releases begin', async () => {
  const packages = await Promise.all(
    packageNames.map(async (name) => JSON.parse(await read(`packages/${name}/package.json`))),
  );

  for (const packageManifest of packages) {
    assert.equal(packageManifest.module, './dist/index.mjs');
    assert.deepEqual(packageManifest.exports, {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.mjs',
        require: './dist/index.js',
      },
    });
    assert.deepEqual(packageManifest.publishConfig, { access: 'public', provenance: true });
    assert.equal(packageManifest.version, '1.1.0');
    assert.ok(packageManifest.files.includes('LICENSE'));
  }
});

test('keeps legacy repository ownership out of public readmes and manifests', async () => {
  const publicFiles = [
    'README.md',
    'package.json',
    '.codex-plugin/plugin.json',
    '.claude-plugin/plugin.json',
    ...packageNames.flatMap((name) => [
      `packages/${name}/README.md`,
      `packages/${name}/package.json`,
    ]),
  ];

  for (const relativePath of publicFiles) {
    assert.doesNotMatch(await read(relativePath), /lukeslp\/accessibility-devkit/i, relativePath);
  }
});

test('runs a reproducible spelling check for the adoption documentation', async () => {
  const workspace = JSON.parse(await read('package.json'));
  const cspell = JSON.parse(await read('cspell.json'));

  assert.match(workspace.scripts.spelling, /packages\/\*\/README\.md/);
  assert.match(workspace.scripts.spelling, /python\/README\.md/);
  assert.match(workspace.scripts.test, /test:contracts/);
  assert.ok(cspell.words.includes('Codex'));
  assert.ok(cspell.words.includes('WCAG'));
});
