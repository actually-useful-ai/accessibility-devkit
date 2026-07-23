import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { executeCommand } from './command';

function jsonResult(result: Awaited<ReturnType<typeof executeCommand>>) {
  return JSON.parse(result.stdout) as {
    schemaVersion: string;
    producer: { runtime: string };
    summary: { findings: number; manualChecks: number };
    findings: Array<{ ruleId: string }>;
  };
}

describe('CLI command contract', () => {
  it('returns 1 for a contrast error and 0 when configured never to fail', async () => {
    const failing = await executeCommand(['contrast', '#777777', '#ffffff', '--format', 'json']);
    expect(failing.exitCode).toBe(1);
    expect(jsonResult(failing).findings[0].ruleId).toBe('contrast-text');

    const advisory = await executeCommand([
      'contrast',
      '#777777',
      '#ffffff',
      '--format',
      'json',
      '--fail-on',
      'never',
    ]);
    expect(advisory.exitCode).toBe(0);
  });

  it('returns 2 for invalid input', async () => {
    const result = await executeCommand(['contrast', 'red', '#fff']);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/hex color/i);
  });

  it('uses the exact timing boundaries', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'a11y-timing-'));
    const passingPath = join(directory, 'passing.json');
    const failingPath = join(directory, 'failing.json');
    writeFileSync(passingPath, JSON.stringify({ warningDurationMs: 20_000, extensionCount: 10 }));
    writeFileSync(failingPath, JSON.stringify({ warningDurationMs: 19_999, extensionCount: 10 }));

    expect((await executeCommand(['timing', passingPath, '--format', 'json'])).exitCode).toBe(0);
    expect((await executeCommand(['timing', failingPath, '--format', 'json'])).exitCode).toBe(1);
  });

  it('keeps manual checks from failing CI', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'a11y-scan-'));
    const path = join(directory, 'manual-only.html');
    writeFileSync(path, '<html lang="en"><main><img src="dot.png" alt=""></main></html>');

    const result = await executeCommand(['scan', path, '--format', 'json', '--profile', 'all']);
    const report = jsonResult(result);
    expect(result.exitCode).toBe(0);
    expect(report.summary.findings).toBe(0);
    expect(report.summary.manualChecks).toBeGreaterThan(0);
  });

  it('emits the same versioned report envelope for readability', async () => {
    const result = await executeCommand(['readability', '-', '--format', 'json'], {
      stdin: 'We can help. Ask us any time.',
    });
    const report = jsonResult({ ...result, stdout: result.stdout });
    expect(report.schemaVersion).toBe('1.0.0');
    expect(report.producer.runtime).toBe('node');
  });
});
