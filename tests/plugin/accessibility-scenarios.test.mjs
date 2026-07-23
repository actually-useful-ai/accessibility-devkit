import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('publishes the canonical accessibility plugin and skill', async () => {
  const codex = JSON.parse(await read('.codex-plugin/plugin.json'));
  const claude = JSON.parse(await read('.claude-plugin/plugin.json'));
  const marketplace = JSON.parse(await read('.claude-plugin/marketplace.json'));
  const skill = await read('skills/accessibility/SKILL.md');

  assert.equal(codex.name, 'accessibility');
  assert.equal(codex.skills, './skills/');
  assert.equal(claude.name, 'accessibility');
  assert.equal(marketplace.plugins[0].name, 'accessibility');
  assert.match(skill, /^---\nname: accessibility\ndescription: Use when /);
});

test('routes a review through the required accessibility evidence', async () => {
  const skill = await read('skills/accessibility/SKILL.md');
  const verification = await read('skills/accessibility/references/verification.md');

  assert.match(skill, /native HTML.*before ARIA/i);
  assert.match(skill, /keyboard and focus/i);
  assert.match(skill, /names, roles, and states/i);
  assert.match(skill, /perception/i);
  assert.match(skill, /cognitive access/i);
  assert.match(skill, /motion/i);
  assert.match(skill, /recovery/i);
  assert.match(skill, /intentional-ux/i);
  assert.match(skill, /assistive technology/i);
  assert.match(skill, /do not establish.*conformance/i);
  for (const evidence of [
    'Source inspection',
    'Automated scan',
    'Keyboard',
    'Screen reader',
    'Zoom and reflow',
    'User testing',
  ]) {
    assert.match(verification, new RegExp(evidence, 'i'));
  }
});

test('keeps versioned baseline and post-skill review scenarios for the same prompts', async () => {
  const fixture = JSON.parse(
    await read('tests/plugin/fixtures/accessibility-review-scenarios.v1.json'),
  );

  assert.equal(fixture.schemaVersion, 1);
  assert.ok(fixture.scenarios.length >= 2);

  for (const scenario of fixture.scenarios) {
    assert.match(scenario.prompt, /\S/);
    assert.ok(scenario.baseline.omittedUserGroups.length > 0);
    assert.ok(scenario.baseline.omittedManualEvidence.length > 0);
    assert.ok(scenario.baseline.falseConfidenceRisks.length > 0);
    assert.ok(scenario.baseline.output.length > 0);

    assert.ok(scenario.postSkill.affectedUsers.length >= 3);
    for (const evidence of [
      'Source inspection',
      'Automated scan',
      'Keyboard',
      'Screen reader',
      'Zoom and reflow',
      'User testing',
    ]) {
      assert.ok(scenario.postSkill.manualEvidence.includes(evidence));
      assert.match(scenario.postSkill.verification[evidence], /completed|unverified|planned/i);
    }
    assert.ok(scenario.postSkill.routing.accessibility.length > 0);
    assert.ok(scenario.postSkill.routing.intentionalUx.length > 0);
    assert.ok(scenario.postSkill.remediation.length > 0);
    assert.match(scenario.postSkill.conclusion, /not.*conformance|does not.*conformance/i);
    assert.ok(scenario.postSkill.output.length > 0);
  }
});

test('runs plugin scenarios from the root test command', async () => {
  const workspace = JSON.parse(await read('package.json'));

  assert.match(
    workspace.scripts['test:docs'],
    /node --test tests\/plugin\/accessibility-scenarios\.test\.mjs/,
  );
  assert.match(
    workspace.scripts['test:packages'],
    /pnpm --filter="\.\/packages\/\*" --parallel test/,
  );
  assert.match(workspace.scripts.test, /pnpm test:docs/);
  assert.match(workspace.scripts.test, /pnpm test:packages/);
});
