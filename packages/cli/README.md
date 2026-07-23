# @accessibility-devkit/cli

Conservative static accessibility checks with explicit manual-review boundaries. Requires Node 22 or newer.

```bash
npm install --global @accessibility-devkit/cli
accessibility-devkit scan ./index.html
```

For one-off use:

```bash
npx @accessibility-devkit/cli contrast '#595959' '#ffffff'
npx @accessibility-devkit/cli scan ./index.html --profile all --format json
```

## Commands

```text
accessibility-devkit scan <files...> [--profile cvi|switch|all] [--format text|json]
accessibility-devkit contrast <foreground> <background> [--level AA|AAA] [--text-size normal|large]
accessibility-devkit readability <file|->
accessibility-devkit timing <policy.json>
```

Every command accepts `--fail-on error|warning|never`. Exit `0` means the selected threshold has no automated finding, `1` means it does, and `2` means the input or command failed. Manual checks never fail CI.

## JSON

`--format json` emits the report contract in [`../../spec/report.schema.json`](../../spec/report.schema.json). Findings include certainty, evidence, WCAG references, remediation, and verification. Manual checks are separate so “no detected violations” cannot be mistaken for “accessible.”

## Profiles

- `switch` adds Switch Control, timing preference, focus reachability, and simple-action verification.
- `cvi` adds individualized visual-complexity, salience, fatigue, clutter, motion, and multisensory review.
- `all` adds both.

Never treat a CVI palette or contrast ratio as universally safe. Treat static target dimensions as manual clues until someone reviews rendered size, spacing, and exceptions.

Live URLs require a browser and assistive-technology follow-up. Use the maintained browser runner:

```bash
npx @axe-core/cli https://example.com
```

MIT © Luke Steuber.
