import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import Ajv2020 from 'ajv/dist/2020.js';

const root = new URL('../../', import.meta.url);
const fixture = new URL('spec/fixtures/static-mixed.html', root);
const nodeCli = new URL('packages/cli/dist/cli.mjs', root);
const schema = JSON.parse(readFileSync(new URL('spec/report.schema.json', root), 'utf8'));
const golden = JSON.parse(
  readFileSync(new URL('spec/fixtures/static-mixed.expected.json', root), 'utf8'),
);
const pythonEnvironment = {
  ...process.env,
  PYTHONPATH: new URL('python/src', root).pathname,
};

function nodeReport(extra = []) {
  const result = spawnSync(
    process.execPath,
    [nodeCli.pathname, 'scan', fixture.pathname, '--profile', 'all', '--format', 'json', ...extra],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 1, result.stderr);
  return JSON.parse(result.stdout);
}

function pythonReport(extra = []) {
  const result = spawnSync(
    'python3',
    [
      '-m',
      'accessibility_devkit',
      'scan',
      fixture.pathname,
      '--profile',
      'all',
      '--format',
      'json',
      ...extra,
    ],
    { encoding: 'utf8', env: pythonEnvironment },
  );
  assert.equal(result.status, 1, result.stderr);
  return JSON.parse(result.stdout);
}

function itemContract(item) {
  return {
    ...item,
    location: item.location
      ? {
          line: item.location.line,
          column: item.location.column,
          excerpt: item.location.excerpt ?? null,
        }
      : null,
  };
}

function normalized(report) {
  return {
    schemaVersion: report.schemaVersion,
    version: report.producer.version,
    target: report.target,
    summary: report.summary,
    findings: report.findings.map(itemContract),
    manualChecks: report.manualChecks.map(itemContract),
  };
}

test('Node and Python reports validate against JSON Schema 2020-12', () => {
  const validate = new Ajv2020({ allErrors: true }).compile(schema);
  for (const report of [nodeReport(), pythonReport()]) {
    assert.equal(validate(report), true, JSON.stringify(validate.errors, null, 2));
  }
});

test('Node and Python scanners emit the same findings and guidance', () => {
  assert.deepEqual(normalized(nodeReport()), normalized(pythonReport()));
});

test('both scanners match the checked-in golden fixture', () => {
  for (const report of [nodeReport(), pythonReport()]) {
    assert.deepEqual(report.summary, golden.summary);
    assert.deepEqual(
      report.findings.map(({ ruleId }) => ruleId),
      golden.findings,
    );
    assert.deepEqual(
      report.manualChecks.map(({ ruleId }) => ruleId),
      golden.manualChecks,
    );
  }
});

test('Node and Python use the same exit codes', () => {
  const commands = [
    ['contrast', '#777777', '#ffffff', '--format', 'json'],
    ['contrast', '#777777', '#ffffff', '--format', 'json', '--fail-on', 'never'],
    ['contrast', 'red', '#ffffff'],
  ];
  for (const command of commands) {
    const node = spawnSync(process.execPath, [nodeCli.pathname, ...command], { encoding: 'utf8' });
    const python = spawnSync('python3', ['-m', 'accessibility_devkit', ...command], {
      encoding: 'utf8',
      env: pythonEnvironment,
    });
    assert.equal(node.status, python.status, command.join(' '));
  }
});
