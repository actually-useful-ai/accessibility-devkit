# @accessibility-devkit/audit

Runs axe-core accessibility audits, formats results as text/JSON/markdown, and provides a pre-built ESLint flat-config for jsx-a11y.

## Install

```bash
npm install @accessibility-devkit/audit
```

## Usage

### runAudit

Runs an axe-core audit on any element context and returns structured results.

```ts
import { runAudit, formatReport } from '@accessibility-devkit/audit';

// Audit the full document at WCAG AA
const result = await runAudit(document, { level: 'AA' });

// Print a markdown report
console.log(formatReport(result, 'markdown'));

// Audit a specific section at AAA, excluding a noisy element
const result2 = await runAudit('#main-content', {
  level: 'AAA',
  exclude: ['#legacy-widget'],
});

console.log(result2.summary.critical); // number of critical violations
```

### AuditOptions

| Property  | Type                   | Default | Description                                             |
| --------- | ---------------------- | ------- | ------------------------------------------------------- |
| `level`   | `'A' \| 'AA' \| 'AAA'` | `'AA'`  | WCAG conformance level to test against                  |
| `tags`    | `string[]`             | `[]`    | Additional axe tag filters applied alongside level tags |
| `include` | `string[]`             | —       | CSS selectors to include in the audit                   |
| `exclude` | `string[]`             | —       | CSS selectors to exclude from the audit                 |

### AuditResult

```ts
interface AuditResult {
  violations: axe.Result[]; // Rules that failed
  passes: axe.Result[]; // Rules that passed
  incomplete: axe.Result[]; // Rules that need manual review
  inapplicable: axe.Result[]; // Rules not applicable to this context
  summary: AuditViolationSummary;
}

interface AuditViolationSummary {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}
```

### formatReport

Formats an `AuditResult` into a readable string.

```ts
formatReport(result); // plain text (default)
formatReport(result, 'markdown'); // markdown with tables and code blocks
formatReport(result, 'json'); // full JSON for tooling
```

### eslintConfig

Drop-in ESLint flat-config entry that adds all jsx-a11y rules as warnings.

```js
// eslint.config.js
import { eslintConfig } from '@accessibility-devkit/audit';

export default [
  eslintConfig,
  // ...your other config entries
];
```

This adds every rule from `eslint-plugin-jsx-a11y` at the `warn` level, so violations surface during development without blocking builds.

## Dependencies

- [`axe-core`](https://github.com/dequelabs/axe-core) — accessibility rules engine
- [`eslint-plugin-jsx-a11y`](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y) — static JSX accessibility checks

## License

MIT. Author: Luke Steuber.
