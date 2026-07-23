# @accessibility-devkit/audit

Browser accessibility audits through axe-core, plus jsx-a11y's maintained recommended flat configuration.

```bash
npm install @accessibility-devkit/audit
```

## Browser audit

```js
import { formatReport, runAudit } from '@accessibility-devkit/audit';

const result = await runAudit(document, { level: 'AA' });
console.log(formatReport(result, 'markdown'));
```

AA requests the applicable WCAG 2.0, 2.1, and 2.2 axe tags. Results preserve violations, passes, incomplete checks, and inapplicable rules.

```js
const scoped = await runAudit(document, {
  level: 'AA',
  include: ['#checkout'],
  exclude: ['#known-third-party-widget'],
});
```

`incomplete` is not a pass. Review it manually in the browser and continue with keyboard, screen-reader, zoom, reflow, forced-color, and human testing.

## ESLint

```js
// eslint.config.js
import { eslintConfig } from '@accessibility-devkit/audit';

export default [eslintConfig];
```

This is `eslint-plugin-jsx-a11y`'s maintained recommended flat configuration, including its own severities and future updates.

For live URLs from a shell, use Deque's maintained CLI instead of adding a browser runtime here:

```bash
npx @axe-core/cli https://example.com
```

Automated findings cover configured rules only and do not establish conformance.

MIT © Luke Steuber.
