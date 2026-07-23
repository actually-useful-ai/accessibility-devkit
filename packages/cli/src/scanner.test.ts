import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { scanSource } from './scanner';

const fixturePath = fileURLToPath(
  new URL('../../../spec/fixtures/static-mixed.html', import.meta.url),
);
const source = readFileSync(fixturePath, 'utf8');

function ruleIds(items: Array<{ ruleId: string }>): string[] {
  return items.map((item) => item.ruleId);
}

describe('static scanning', () => {
  it('reports only source-supported findings and preserves manual checks', () => {
    const report = scanSource(source, { target: 'static-mixed.html' });

    expect(ruleIds(report.findings)).toEqual(
      expect.arrayContaining([
        'document-language',
        'duplicate-id',
        'focus-positive-tabindex',
        'form-label',
        'heading-order',
        'image-alt-missing',
      ]),
    );
    expect(ruleIds(report.manualChecks)).toEqual(
      expect.arrayContaining([
        'color-only-communication',
        'contrast-rendered',
        'image-alt-empty-context',
        'landmark-structure',
        'target-size-spacing',
      ]),
    );
    expect(report.summary).toEqual({
      errors: report.findings.filter((finding) => finding.severity === 'error').length,
      warnings: report.findings.filter((finding) => finding.severity === 'warning').length,
      info: report.findings.filter((finding) => finding.severity === 'info').length,
      findings: report.findings.length,
      manualChecks: report.manualChecks.length,
    });
  });

  it('does not turn structural or prose clues into violations', () => {
    const report = scanSource(source, { target: 'static-mixed.html' });
    const allRules = [...ruleIds(report.findings), ...ruleIds(report.manualChecks)];

    expect(allRules).not.toContain('duplicate-banner');
    expect(allRules).not.toContain('unnamed-section');
    expect(allRules).not.toContain('timing-autoplay');
  });

  it('adds honest CVI and switch review without inventing universal thresholds', () => {
    const report = scanSource(source, { target: 'static-mixed.html', profile: 'all' });
    const manual = ruleIds(report.manualChecks);

    expect(manual).toEqual(
      expect.arrayContaining([
        'cvi-individual-profile',
        'cvi-visual-complexity',
        'cvi-fatigue-motion',
        'cvi-multisensory-alternatives',
        'switch-control-verification',
        'switch-timing-preferences',
        'switch-simple-action',
      ]),
    );
    expect(JSON.stringify(report)).not.toMatch(/CVI.safe|10:1/i);
  });
});
