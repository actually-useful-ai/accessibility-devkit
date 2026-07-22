import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

const SPECIALISTS = ['accessibility-gaming', 'accessibility-business', 'accessibility-design'];

test('every specialist skill has valid frontmatter and the required sections', async () => {
  for (const name of SPECIALISTS) {
    const skill = await read(`skills/${name}/SKILL.md`);

    assert.match(
      skill,
      new RegExp(`^---\\nname: ${name}\\ndescription: Use when `),
      `${name} frontmatter`,
    );
    assert.match(skill, /## Review lens/i, `${name} review lens`);
    assert.match(skill, /## Packages to reach for/i, `${name} package routing`);
    assert.match(skill, /@accessibility-devkit\//, `${name} references a package`);
    assert.match(skill, /## Guardrails/i, `${name} guardrails`);
    // Specialists layer over the core skill and hand UX work to intentional-ux.
    assert.match(skill, /core `accessibility` skill/i, `${name} routes to core`);
    assert.match(skill, /intentional-ux/i, `${name} routes to intentional-ux`);
  }
});

test('the core accessibility skill routes to each specialist', async () => {
  const skill = await read('skills/accessibility/SKILL.md');

  assert.match(skill, /## Specialists/i);
  for (const name of SPECIALISTS) {
    assert.match(skill, new RegExp(`\`${name}\``), `core skill links ${name}`);
  }
});
