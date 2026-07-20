# accessibility-devkit

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA-blue.svg)](https://www.w3.org/TR/WCAG22/)

Not another overlay widget. Not a snippet pack. This is a collection of code-level tools, interaction patterns, and runtime utilities for building accessible applications from the ground up.

Accessibility technical debt compounds fast. It's expensive to retrofit, and it locks real people out of what you built. Building it in from the start is easier than fixing it later. It's also the right thing to do.

Three packages, all framework-agnostic TypeScript, all mapped to specific WCAG 2.x success criteria.

---

## Five-minute quick start

The plugin is the quickest way to bring the review workflow into a task. The optional TypeScript packages below are separate: install them only when your application needs their runtime utilities.

### Codex desktop app

1. Clone this repository and open it in the Codex desktop app.

   ```bash
   git clone https://github.com/lukeslp/accessibility-devkit.git
   ```

2. Open **Plugins**, then the **Plugins Directory**. Use the marketplace import flow and select this repository’s `.claude-plugin/marketplace.json` file. Choose **Accessibility** and install it.
3. Start a new task and use this first prompt:

   ```text
   $accessibility Review this interface for accessibility barriers. Start with semantics, keyboard behavior, focus, error recovery, and target size. Make the smallest practical fixes and name the manual checks still needed.
   ```

   **Expected output:** a short, evidence-based list of barriers, a focused patch or implementation plan, the people and interaction modes affected, and a checklist of the manual checks that remain.

4. Verify the install by opening a fresh task: **Accessibility** should appear in the skill picker, and the prompt should produce a review that distinguishes completed checks from checks that still need a browser, assistive technology, or people who use the interface.

For current desktop-app details, see the official [OpenAI Plugins documentation](https://learn.chatgpt.com/docs/plugins).

### Direct skill fallback

If the marketplace import is unavailable, make the repository’s skill discoverable directly. From the cloned repository:

```bash
skill_source="$PWD/skills/accessibility"
target="$HOME/.agents/skills/accessibility"

if [ -e "$target" ] || [ -L "$target" ]; then
  printf 'Stopped: %s already exists or is a symlink.\n' "$target"
  ls -ld "$target"
  printf 'After confirming it is no longer needed, remove only that entry with: rm "%s"\n' "$target"
  printf 'Or choose a different destination that you control.\n'
  exit 1
fi

if [ ! -d "$skill_source" ]; then
  printf 'Stopped: expected skill directory is missing: %s\n' "$skill_source"
  exit 1
fi

mkdir -p "$HOME/.agents/skills"
ln -s "$skill_source" "$target"
```

The guard catches both existing entries and broken symlinks before making a change. It will never overwrite an entry or nest a link inside it. Codex scans `~/.agents/skills`; restart the app if **Accessibility** does not appear in the skill picker after linking it. Use the same first prompt above to verify it.

### Claude Code

Claude Code uses its own marketplace commands. Run these in Claude Code, then use the same first prompt:

```text
/plugin marketplace add lukeslp/accessibility-devkit
/plugin install accessibility@accessibility-devkit
```

---

## Optional TypeScript packages

### [@accessibility-devkit/audit](./packages/audit)

Runs axe-core accessibility audits and formats the results. Fits into CI pipelines, PR workflows, or one-off spot checks.

- **axe-core runner** with configurable WCAG conformance level (A, AA, or AAA)
- **Scoped audits**: include or exclude selectors to audit one section at a time
- **Structured results**: violations include severity counts (critical, serious, moderate, minor), not just pass/fail
- **Three report formats**: plain text for the console, markdown for docs and PRs, JSON for pipelines
- **ESLint flat-config** for jsx-a11y: add it to `eslint.config.js` to surface JSX accessibility rules as warnings without blocking builds

```ts
import { runAudit, formatReport } from '@accessibility-devkit/audit';

const result = await runAudit(document, { level: 'AA' });
console.log(formatReport(result, 'markdown'));
console.log(`${result.summary.critical} critical, ${result.summary.serious} serious`);

// Audit a specific section, skip a noisy element
const scoped = await runAudit('#main-content', {
  level: 'AAA',
  exclude: ['#legacy-widget'],
});
```

---

### [@accessibility-devkit/components](./packages/components)

Accessible UI primitives cover interaction patterns that are tedious to get right and painful to get wrong.

- **FocusTrap** confines keyboard focus to a container such as a modal or drawer. It supports initial focus targeting, pause and resume for nested modals, and focus restoration on deactivation
- **Roving Tabindex** adds arrow-key navigation to composite widgets such as toolbars, tab lists, radio groups, and menus. Tab exits the group. Wrap-around and cleanup are built in
- **Screen Reader Announcements** post messages to an ARIA live region. Use polite updates for status and assertive updates for errors. The utility creates one region and reuses it
- **Skip Link** stays visually hidden until keyboard focus, then jumps past navigation to main content
- **AccessibleDialog** wraps `<dialog>` or `role="dialog"` elements with focus trapping, ARIA attributes, and Escape-key dismissal
- **AccessibleMenu** provides a disclosure-style dropdown with expanded state, arrow-key navigation, Escape handling, and outside-click dismissal

```ts
import {
  FocusTrap,
  createRovingTabindex,
  announceToScreenReader,
} from '@accessibility-devkit/components';

// Trap focus in a modal
const trap = new FocusTrap(document.getElementById('modal')!);
trap.activate();

// Arrow key navigation in a toolbar
const { destroy } = createRovingTabindex(toolbar, '[role="button"]');

// Tell screen readers what happened
announceToScreenReader('File saved');
announceToScreenReader('Session expired. Please sign in again.', 'assertive');
```

---

### [@accessibility-devkit/accommodations](./packages/accommodations)

Color perception, contrast math, and user preference detection.

- **Color blindness simulation** transforms any hex color across seven color-vision deficiency types: protanopia, deuteranopia, tritanopia, protanomaly, deuteranomaly, tritanomaly, and achromatopsia
- **Contrast ratio calculation** applies WCAG relative-luminance math and returns a value from 1 (no contrast) to 21 (black on white)
- **WCAG threshold checking** returns pass or fail for AA or AAA on normal or large text (AA normal = 4.5:1, AA large = 3:1, AAA normal = 7:1, AAA large = 4.5:1)
- **Automatic color adjustment** takes a failing foreground and background pair, then darkens or lightens the foreground until it reaches the requested level
- **Preference detection** includes `prefersReducedMotion()`, `prefersHighContrast()`, `prefersDarkMode()`, and a live `watchPrefersReducedMotion()` subscription with cleanup

```ts
import {
  meetsWCAG,
  findAccessibleColor,
  simulateColorBlindness,
} from '@accessibility-devkit/accommodations';

// Check before shipping
if (!meetsWCAG('#aaaaaa', '#ffffff')) {
  const fixed = findAccessibleColor('#aaaaaa', '#ffffff');
}

// See how a color looks with deuteranopia
const simulated = simulateColorBlindness('#ff0000', 'deuteranopia');
```

---

### Install packages

Install only the packages your application needs:

```bash
npm install @accessibility-devkit/audit
npm install @accessibility-devkit/components
npm install @accessibility-devkit/accommodations
```

Or all three at once:

```bash
npm install @accessibility-devkit/audit @accessibility-devkit/components @accessibility-devkit/accommodations
```

All packages ship CJS and ESM builds with full TypeScript declarations.

---

## Development

```bash
pnpm install
pnpm build       # Build all packages in parallel
pnpm lint        # Lint
pnpm test        # Run tests across all packages
pnpm changeset   # Create a changeset for versioning
pnpm release     # Build and publish
```

---

## Related Projects

| Project                                                                         | What it does                                                                                                    |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| [accessibility-devkit-llm](https://github.com/lukeslp/accessibility-devkit-llm) | Language model extension for alt text generation, WCAG auditing with LLMs, an MCP server, and skill definitions |
| [awesome-accessibility](https://github.com/lukeslp/awesome-accessibility)       | Curated list of accessibility resources and tools                                                               |
| [accessibility-atlas](https://github.com/lukeslp/accessibility-atlas)           | 53 datasets on disability demographics, web accessibility, and assistive technology usage                       |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Author

**Luke Steuber** · [lukesteuber.com](https://lukesteuber.com) · [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com)

## License

MIT
