# accessibility-devkit

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA-blue.svg)](https://www.w3.org/TR/WCAG22/)

Not another overlay widget. Not a snippet pack. This is a collection of code-level tools, interaction patterns, and runtime utilities for building accessible applications from the ground up.

Accessibility technical debt compounds fast. It's expensive to retrofit, and it locks real people out of what you built. Building it in from the start is easier than fixing it later. It's also the right thing to do.

Eight packages of framework-agnostic TypeScript, each mapped to specific WCAG 2.x success criteria. Most tools cover visual and structural access, then stop. These go further, into motor, cognitive, sensory, literacy, and vestibular access.

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

## Specialize for your project

Two entry points, depending on how you work.

**Working with an agent (Claude Code, Codex).** Install the plugin above and run the first prompt. The `accessibility` skill reviews your interface, and when the project has a clear shape it hands off to a specialist that re-weights the review for your context. Each specialist keeps the same evidence and verification discipline; it just changes what to check first.

| If you're building…                        | Specialist skill         | What it puts first                                                                  |
| ------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------- |
| A game or real-time interactive experience | `accessibility-gaming`   | Flash safety, input remapping, captions for audio cues, assist and difficulty modes |
| Enterprise, SaaS, or internal tools        | `accessibility-business` | Forms, session timeouts, authentication, error recovery, conformance evidence       |
| Visual design or a design system           | `accessibility-design`   | Color and contrast, typography, motion budgets, accessible component specs          |

Ask for a specialist by name, or let the general skill route you. Design work also leans on the separate [`intentional-ux`](https://github.com/actually-useful-ai/intentional-ux) skill for flow and decision-cost questions.

**Writing code directly.** Reach for the package that matches the barrier:

| Barrier                                                      | Package          |
| ------------------------------------------------------------ | ---------------- |
| Small tap targets, drag-only interactions, tremor            | `motor`          |
| Sessions timing out, re-entered data, blocked paste, no undo | `cognitive`      |
| Text too hard to read, unexpanded abbreviations              | `language`       |
| Missing captions, autoplaying sound                          | `media`          |
| Flashing, parallax, motion sickness                          | `motion`         |
| Low contrast, color-only meaning, hard-to-read type          | `accommodations` |
| Focus traps, dialogs, menus, skip links, live regions        | `components`     |
| Automated WCAG scanning and CI gates                         | `audit`          |

The two axes compose: the specialists (what you're building) prioritize the packages (what human need is served). Each package section below links to its full API reference.

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

The same package also covers dyslexia-friendly typography and WCAG 1.4.12 text spacing (`applyDyslexiaFriendlyFont`, `applyTextSpacing`, `meetsTextSpacing`).

---

### [@accessibility-devkit/motor](./packages/motor)

Motor and mobility support for people who use switches, eye-gaze, head pointers, or who have limited dexterity or tremor.

- **Target size** checks against WCAG 2.5.8 (24px) and 2.5.5 (44px), plus a scanner for undersized controls
- **Pointer cancellation** (2.5.2): fire on release, abort by sliding off the control
- **Keyboard dragging alternative** (2.5.7): drive any drag with arrow keys
- **Tremor tolerance**: drop accidental repeat activations, or activate on dwell instead of click

```ts
import { findUndersizedTargets, makeKeyboardDraggable } from '@accessibility-devkit/motor';

findUndersizedTargets(document.body); // controls below the target-size threshold
makeKeyboardDraggable(sliderThumb, { onMove: ({ dx }) => setValue((v) => v + dx) });
```

---

### [@accessibility-devkit/cognitive](./packages/cognitive)

Reduce time pressure, memory load, and the cost of mistakes for people with cognitive, learning, or attention-related disabilities.

- **Session timeouts** (2.2.1 / 2.2.6): warn before expiry and let people ask for more time
- **Redundant-entry memory** (3.3.7): remember what was typed, never persist passwords
- **Accessible authentication** (3.3.8): re-enable blocked paste, flag credential-field barriers
- **Undo controller** (3.3.4 / 3.3.6): make consequential actions reversible

```ts
import { createSessionTimeout, allowPaste } from '@accessibility-devkit/cognitive';

createSessionTimeout({ idleMs: 900_000, onWarn: showExtendDialog, onExpire: logout });
allowPaste(document.querySelector('#one-time-code')!);
```

---

### [@accessibility-devkit/language](./packages/language)

Reading level and literacy support for people with reading, language, and learning disabilities.

- **Readability scoring**: Flesch Reading Ease, Flesch–Kincaid grade, and the Automated Readability Index
- **Plain-language flags**: over-long sentences and multi-syllable words
- **Abbreviation annotation** (3.1.4): wrap first use in `<abbr title>`

```ts
import { readingLevel, findLongSentences } from '@accessibility-devkit/language';

readingLevel(paragraph).band; // 'easy' | 'moderate' | 'difficult'
findLongSentences(paragraph, 20); // sentences to shorten
```

---

### [@accessibility-devkit/media](./packages/media)

Auditory and media access for people who are Deaf or hard of hearing, and anyone disrupted by unexpected sound.

- **Caption and audio-description checks** (1.2.2 / 1.2.5)
- **Autoplay-audio detection and control** (1.4.2): find it, then inject a pause button
- **Transcript association** through `aria-describedby`

```ts
import { auditMedia, ensureAudioControl, findAutoplayingAudio } from '@accessibility-devkit/media';

auditMedia(document.body); // missing captions, autoplay audio, unreachable players
findAutoplayingAudio().forEach(ensureAudioControl);
```

---

### [@accessibility-devkit/motion](./packages/motion)

Seizure and vestibular safety for people with vestibular disorders and photosensitive conditions.

- **Reduced-motion gating** (2.3.3): pick a calm alternative, sync classes to the preference
- **Safe scrolling**: instant under reduced motion, smooth otherwise
- **Flash metering** (2.3.1): self-check a strobing effect against the three-per-second threshold

```ts
import { withReducedMotion, createFlashMeter } from '@accessibility-devkit/motion';

withReducedMotion(
  () => slide(),
  () => fade(),
);
const meter = createFlashMeter({ onUnsafe: () => stopAnimation() });
```

---

### Install packages

Install only the packages your application needs:

```bash
npm install @accessibility-devkit/audit          # testing and auditing
npm install @accessibility-devkit/components     # accessible UI primitives
npm install @accessibility-devkit/accommodations # color, contrast, preferences, typography
npm install @accessibility-devkit/motor          # target size, pointer, dragging, tremor
npm install @accessibility-devkit/cognitive      # timeouts, redundant entry, auth, undo
npm install @accessibility-devkit/language       # readability, plain language, abbreviations
npm install @accessibility-devkit/media          # captions, transcripts, autoplay audio
npm install @accessibility-devkit/motion         # reduced motion, safe scroll, flash safety
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

| Project                                                                   | What it does                                                                              |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [awesome-accessibility](https://github.com/lukeslp/awesome-accessibility) | Curated list of accessibility resources and tools                                         |
| [accessibility-atlas](https://github.com/lukeslp/accessibility-atlas)     | 53 datasets on disability demographics, web accessibility, and assistive technology usage |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Author

**Luke Steuber** · [lukesteuber.com](https://lukesteuber.com) · [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com)

## License

MIT
