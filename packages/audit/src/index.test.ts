import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import axe from 'axe-core';

import { eslintConfig, runAudit } from './index';

function setMarkup(markup: string): void {
  document.documentElement.lang = 'en';
  document.head.innerHTML = '<title>Audit fixture</title>';
  document.body.innerHTML = markup;
}

function violationIds(result: Awaited<ReturnType<typeof runAudit>>): string[] {
  return result.violations.map((violation) => violation.id);
}

afterEach(() => {
  document.body.innerHTML = '';
});

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('runAudit', () => {
  // Automated axe results cover configured rules only; they do not establish full WCAG conformance.
  it('reports no axe-detected violations for configured rules on valid markup', async () => {
    setMarkup(`
      <main id="fixture">
        <h1>Account settings</h1>
        <label for="email">Email address</label>
        <input id="email" type="email" />
        <button type="button">Save changes</button>
      </main>
    `);

    const result = await runAudit('#fixture');

    expect(result.summary.total).toBe(0);
  });

  it('reports invalid markup with an accessibility violation', async () => {
    setMarkup('<main id="fixture"><h1>Profile</h1><img src="profile.png" /></main>');

    const result = await runAudit('#fixture');

    expect(violationIds(result)).toContain('image-alt');
    expect(result.summary.total).toBeGreaterThan(0);
  });

  it('limits an audit to included selectors', async () => {
    setMarkup(`
      <main id="audited"><h1>Included content</h1><img src="good.png" alt="A mountain" /></main>
      <aside id="outside"><img src="missing-alt.png" /></aside>
    `);

    const result = await runAudit(document, { include: ['#audited'] });

    expect(violationIds(result)).not.toContain('image-alt');
  });

  it('removes excluded selectors from an audit', async () => {
    setMarkup(`
      <main id="fixture">
        <h1>Scoped content</h1>
        <img src="good.png" alt="A mountain" />
        <div id="legacy-widget"><img src="missing-alt.png" /></div>
      </main>
    `);

    const result = await runAudit('#fixture', { exclude: ['#legacy-widget'] });

    expect(violationIds(result)).not.toContain('image-alt');
  });

  it('requests the WCAG 2.1 and 2.2 AA rule tags', async () => {
    const run = vi.spyOn(axe, 'run').mockResolvedValueOnce({
      testEngine: { name: 'axe-core', version: 'test' },
      testRunner: { name: 'vitest' },
      testEnvironment: {
        userAgent: 'vitest',
        windowWidth: 1024,
        windowHeight: 768,
        orientationAngle: 0,
        orientationType: 'landscape-primary',
      },
      timestamp: new Date().toISOString(),
      url: 'https://example.test',
      toolOptions: {},
      passes: [],
      violations: [],
      incomplete: [],
      inapplicable: [],
    });

    await runAudit(document, { level: 'AA' });

    expect(run.mock.calls[0]?.[1]?.runOnly).toMatchObject({
      type: 'tag',
      values: expect.arrayContaining(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']),
    });
  });

  it('uses jsx-a11y maintained recommended flat configuration', () => {
    expect(eslintConfig.rules?.['jsx-a11y/alt-text']).toBe('error');
  });
});
