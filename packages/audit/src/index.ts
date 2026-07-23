/**
 * @module @accessibility-devkit/audit
 * axe-core runner with structured results, violation summaries, and a
 * pre-built ESLint jsx-a11y config.
 */

import axe from 'axe-core';
import * as jsxA11y from 'eslint-plugin-jsx-a11y';

// ============================================================
// Types
// ============================================================

export interface AuditOptions {
  /** WCAG conformance level to test against. Defaults to 'AA'. */
  level?: 'A' | 'AA' | 'AAA';
  /** Additional axe tag filters to apply alongside the level tags. */
  tags?: string[];
  /** CSS selectors or elements to include in the audit. */
  include?: string[];
  /** CSS selectors or elements to exclude from the audit. */
  exclude?: string[];
}

export interface AuditViolationSummary {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface AuditResult {
  violations: axe.Result[];
  passes: axe.Result[];
  incomplete: axe.Result[];
  inapplicable: axe.Result[];
  summary: AuditViolationSummary;
}

// ============================================================
// Internals
// ============================================================

const LEVEL_TAGS: Record<NonNullable<AuditOptions['level']>, string[]> = {
  A: ['wcag2a', 'wcag21a'],
  AA: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
  AAA: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
};

function buildSummary(violations: axe.Result[]): AuditViolationSummary {
  return {
    total: violations.length,
    critical: violations.filter((v) => v.impact === 'critical').length,
    serious: violations.filter((v) => v.impact === 'serious').length,
    moderate: violations.filter((v) => v.impact === 'moderate').length,
    minor: violations.filter((v) => v.impact === 'minor').length,
  };
}

function isContextObject(context: axe.ElementContext): context is axe.ContextObject {
  return (
    typeof context === 'object' &&
    context !== null &&
    !Array.isArray(context) &&
    !('nodeType' in context) &&
    ('include' in context || 'exclude' in context)
  );
}

function buildAuditContext(
  context: axe.ElementContext,
  include?: string[],
  exclude?: string[],
): axe.ElementContext {
  if (!include?.length && !exclude?.length) return context;

  const existing = isContextObject(context) ? context : { include: context };
  const resolvedInclude = include?.length ? include : existing.include;
  const resolvedExclude = exclude?.length ? exclude : existing.exclude;

  if (resolvedInclude) {
    return resolvedExclude
      ? { include: resolvedInclude, exclude: resolvedExclude }
      : { include: resolvedInclude };
  }

  return { exclude: resolvedExclude! };
}

// ============================================================
// Core API
// ============================================================

/**
 * Runs an axe-core accessibility audit on the given context.
 *
 * @param context - The element context to audit (HTMLElement, selector, document, etc.)
 * @param options - Optional audit configuration
 * @returns Structured audit results including violations, passes, and a summary
 * @remarks Automated axe results cover configured rules only; they do not establish full WCAG conformance.
 *
 * @example
 * ```ts
 * const result = await runAudit(document, { level: 'AA' });
 * console.log(result.summary.critical); // number of critical violations
 * ```
 */
export async function runAudit(
  context: axe.ElementContext,
  options: AuditOptions = {},
): Promise<AuditResult> {
  const { level = 'AA', tags = [], include, exclude } = options;

  const runOptions: axe.RunOptions = {
    runOnly: {
      type: 'tag',
      values: [...LEVEL_TAGS[level], ...tags],
    },
  };

  const auditContext = buildAuditContext(context, include, exclude);

  const results = await axe.run(auditContext, runOptions);

  return {
    violations: results.violations,
    passes: results.passes,
    incomplete: results.incomplete,
    inapplicable: results.inapplicable,
    summary: buildSummary(results.violations),
  };
}

/**
 * Formats an audit result into a human-readable report.
 *
 * @param result - The audit result to format
 * @param format - Output format: 'text' (default), 'json', or 'markdown'
 * @returns Formatted string report
 */
export function formatReport(
  result: AuditResult,
  format: 'text' | 'json' | 'markdown' = 'text',
): string {
  const { summary, violations } = result;

  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  if (format === 'markdown') {
    const lines: string[] = [
      '# Accessibility Audit Report',
      '',
      '## Summary',
      '',
      '| Severity | Count |',
      '|----------|-------|',
      `| Critical | ${summary.critical} |`,
      `| Serious  | ${summary.serious} |`,
      `| Moderate | ${summary.moderate} |`,
      `| Minor    | ${summary.minor} |`,
      `| **Total**| **${summary.total}** |`,
      '',
    ];

    if (violations.length === 0) {
      lines.push('✅ No violations found.');
    } else {
      lines.push('## Violations', '');
      for (const v of violations) {
        lines.push(`### ${v.id}: ${v.description}`, '');
        lines.push(`- **Impact**: ${v.impact ?? 'unknown'}`);
        lines.push(`- **Help**: [${v.helpUrl}](${v.helpUrl})`);
        lines.push(`- **Affected nodes**: ${v.nodes.length}`, '');
        for (const node of v.nodes) {
          lines.push('```html', node.html, '```', '');
        }
      }
    }

    return lines.join('\n');
  }

  // text format
  const lines: string[] = [
    `Accessibility Audit — ${summary.total} violation(s)`,
    `  Critical: ${summary.critical}  Serious: ${summary.serious}  Moderate: ${summary.moderate}  Minor: ${summary.minor}`,
    '',
  ];

  for (const v of violations) {
    lines.push(`[${(v.impact ?? 'unknown').toUpperCase()}] ${v.id}: ${v.description}`);
    for (const node of v.nodes) {
      lines.push(`  └ ${node.html.slice(0, 120)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Pre-built ESLint flat-config entry for jsx-a11y.
 * Adds all jsx-a11y rules as warnings to your ESLint config.
 *
 * @example
 * ```js
 * // eslint.config.js
 * import { eslintConfig } from '@accessibility-devkit/audit';
 * export default [eslintConfig];
 * ```
 */
export const eslintConfig = jsxA11y.flatConfigs.recommended;

/** Re-export axe-core for direct use when needed. */
export { axe };
