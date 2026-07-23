import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

test('links practical alt-text guidance from the core skill', async () => {
  const skill = await read('skills/accessibility/SKILL.md');
  assert.match(skill, /references\/alt-text\.md/);
});

test('covers the decisions an author must make before drafting alt text', async () => {
  const fixture = JSON.parse(await read('tests/plugin/fixtures/alt-text-scenarios.v1.json'));
  assert.equal(fixture.schemaVersion, 1);
  assert.ok(fixture.scenarios.length >= 11);

  const treatments = new Set();
  for (const scenario of fixture.scenarios) {
    assert.match(scenario.purpose, /\S/);
    assert.match(scenario.context, /\S/);
    assert.match(scenario.expectedTreatment, /^(empty|functional|informative|complex)$/);
    assert.ok(scenario.requiredFacts.length > 0);
    assert.ok(scenario.prohibitedInferences.length > 0);
    assert.match(scenario.verification, /\S/);
    treatments.add(scenario.expectedTreatment);
  }
  assert.deepEqual([...treatments].sort(), ['complex', 'empty', 'functional', 'informative']);
});

test('keeps generated descriptions provisional, contextual, and privacy-aware', async () => {
  const reference = await read('skills/accessibility/references/alt-text.md');

  assert.match(reference, /page purpose.*surrounding context/is);
  assert.match(reference, /generated.*draft.*human review/is);
  assert.match(reference, /never apply.*automatically/is);
  assert.match(reference, /decorative.*alt=""/is);
  assert.match(reference, /functional.*action or destination/is);
  assert.match(reference, /complex.*adjacent.*explanation|complex.*equivalent data/is);
  assert.match(reference, /instructions.*image content.*not commands/is);
  assert.match(reference, /warn.*remote provider/is);
  assert.match(reference, /cannot establish.*conformance/is);
  assert.doesNotMatch(
    reference,
    /Google Image Search|fully accessible|all images|1,000.character/i,
  );
});
