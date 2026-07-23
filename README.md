# Accessibility Devkit

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v1.1.0-blue.svg)](https://github.com/actually-useful-ai/accessibility-devkit/releases/tag/v1.1.0)

Accessibility is the distance between intention and outcome. Accessibility Devkit helps shorten that distance with portable checks, focused browser utilities, and a review workflow that says exactly what still needs a browser, assistive technology, or a person.

Accessibility Devkit ships no overlay and assigns no accessibility score. A clean result only means the covered checks found nothing. You still need the listed browser, assistive-technology, and human verification.

## Start in a minute

### Run a check

Use either runtime. The commands, JSON schema, findings, and exit codes match.

```bash
npx @accessibility-devkit/cli contrast '#595959' '#ffffff'
pipx run accessibility-devkit contrast '#595959' '#ffffff'
```

Scan local HTML and add the profiles that need more than a generic source check:

```bash
npx @accessibility-devkit/cli scan ./index.html --profile all
pipx run accessibility-devkit scan ./index.html --profile cvi --format json
```

Live URLs need a browser. The CLI deliberately hands that work to Deque's maintained runner:

```bash
npx @axe-core/cli https://example.com
```

### Import a utility

```bash
npm install @accessibility-devkit/core
```

Plain JavaScript with ECMAScript modules:

```js
import { getContrastRatio, meetsContrastThreshold } from '@accessibility-devkit/core';

const ratio = getContrastRatio('#595959', '#ffffff');
const passes = meetsContrastThreshold('#595959', '#ffffff', 'AA', 'normal');
```

CommonJS:

```js
const { assessTimeLimit } = require('@accessibility-devkit/core');

const result = assessTimeLimit({ warningDurationMs: 20_000, extensionCount: 10 });
```

TypeScript:

```ts
import { assessTimeLimit, type TimeLimitPolicy } from '@accessibility-devkit/core';

const policy: TimeLimitPolicy = { adjustmentMultiplier: 10 };
console.log(assessTimeLimit(policy));
```

Python:

```bash
python -m pip install accessibility-devkit
```

```python
from accessibility_devkit import get_contrast_ratio, meets_contrast_threshold

ratio = get_contrast_ratio("#595959", "#ffffff")
passes = meets_contrast_threshold("#595959", "#ffffff", "AA", "normal")
```

### Add the review workflow

Clone the repository, then install the included Accessibility plugin through your coding tool's local marketplace flow:

```bash
git clone https://github.com/actually-useful-ai/accessibility-devkit.git
```

The portable review source is [`skills/accessibility`](skills/accessibility). Codex can import [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json) from the Plugins Directory. Claude Code can use:

```text
/plugin marketplace add actually-useful-ai/accessibility-devkit
/plugin install accessibility@accessibility-devkit
```

Start with:

```text
$accessibility Review this interface for accessibility barriers. Start with semantics, keyboard behavior, focus, error recovery, and target size. Make the smallest practical fixes and name the manual checks still needed.
```

Expected output: evidence-backed findings, focused changes or a practical plan, affected interaction modes, and a clear list of unverified checks. In a fresh task, verify that **Accessibility** appears in the skill picker and that the review separates completed evidence from planned or unverified work. Current Codex steps are in the [OpenAI Plugins documentation](https://learn.chatgpt.com/docs/plugins).

If marketplace import is unavailable, link the skill without replacing anything already installed:

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

mkdir -p "$HOME/.agents/skills"
ln -s "$skill_source" "$target"
```

The guard will never overwrite an entry or nest a link inside it.

## CLI commands

Node 22+ and Python 3.11+ expose the same interface:

```text
accessibility-devkit scan <files...> [--profile cvi|switch|all] [--format text|json]
accessibility-devkit contrast <foreground> <background> [--level AA|AAA] [--text-size normal|large]
accessibility-devkit readability <file|->
accessibility-devkit timing <policy.json>
```

Every command accepts `--fail-on error|warning|never`.

- Exit `0`: the selected failure threshold has no matching automated findings.
- Exit `1`: at least one automated finding meets the threshold.
- Exit `2`: the input, command, or runtime failed.
- Manual checks never fail CI.

`readability` uses English-specific formulas. `timing` evaluates the deterministic WCAG 2.2.1 alternatives: disable the limit, allow at least 10× adjustment, or warn for at least 20 seconds with at least ten extensions. Essential and real-time exceptions stay manual.

## Profiles that need more than a scan

Profiles keep specialized review visible without pretending it can be reduced to one threshold.

| Profile or need         | What the tools can detect                                                                   | What still needs verification                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Switch access           | Positive focus order, source-visible pointer-only risks, timing-policy boundaries           | System Switch Control, scan speed, dwell, repeat filtering, simple-action completion                          |
| CVI                     | Exact WCAG checks where the source supplies measurable evidence                             | Individual profile, visual complexity, salience, fatigue, clutter, latency, motion, multisensory alternatives |
| Color-vision deficiency | Four simulation modes and exact color contrast math                                         | Meaning beyond color, real components and states, individual perception                                       |
| Motion and flash        | Reduced-motion preference handling and frequency screening                                  | Flash luminance, area, saturated red, vestibular comfort, content context                                     |
| Cognitive access        | Time-limit policies, blocked paste, repeated entry, undo helpers, English readability clues | Comprehension, attention demands, recovery, pacing, fatigue, real task completion                             |

CVI is not color-vision deficiency. Low vision and photophobia are also distinct. The Devkit keeps their language and verification separate.

## Package map

### Portable core and command line

| Package                                       | Purpose                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`@accessibility-devkit/core`](packages/core) | Contrast, English readability analysis, flash-frequency screening, and timing-policy assessment |
| [`@accessibility-devkit/cli`](packages/cli)   | Conservative static scans and the shared command-line report contract                           |
| [`accessibility-devkit`](python)              | Dependency-free Python core and CLI with the same commands and contract                         |

### Focused browser packages

| Package                                                           | Purpose                                                                                             |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [`@accessibility-devkit/audit`](packages/audit)                   | axe-core browser audits and jsx-a11y's maintained flat configuration                                |
| [`@accessibility-devkit/components`](packages/components)         | Focus traps, roving tabindex, dialogs, menus, skip links, and live announcements                    |
| [`@accessibility-devkit/accommodations`](packages/accommodations) | Explicit typography preferences, text-spacing override tests, contrast, and color-vision simulation |
| [`@accessibility-devkit/motor`](packages/motor)                   | Target measurement, pointer cancellation, drag alternatives, dwell, and repeat filtering            |
| [`@accessibility-devkit/cognitive`](packages/cognitive)           | Timing policy, session helpers, repeated-entry memory, authentication, and undo                     |
| [`@accessibility-devkit/language`](packages/language)             | English readability clues, long-sentence flags, complex words, and abbreviations                    |
| [`@accessibility-devkit/media`](packages/media)                   | Captions, transcripts, autoplay-audio review, and media controls                                    |
| [`@accessibility-devkit/motion`](packages/motion)                 | Reduced-motion behavior, safe scrolling, and flash-frequency screening                              |

All ten npm packages publish ECMAScript modules, CommonJS, TypeScript declarations, source maps, a README, and the full MIT license.

## Report contract

The versioned contract lives at [`spec/report.schema.json`](spec/report.schema.json) and uses JSON Schema 2020-12. Golden fixtures in [`spec/fixtures`](spec/fixtures) keep the Node and Python implementations aligned.

Reports include:

- schema, producer, runtime, and target metadata;
- a summary with no synthetic accessibility score;
- findings classified as `normative`, `advisory`, or `supplemental`;
- certainty of `detected`, `potential`, or `manual`;
- severity, evidence level, WCAG references, location, remediation, and verification;
- a separate `manualChecks` collection.

The scanner is conservative by design. An empty `alt` can be intentional. A small source dimension does not prove a target-size failure without rendered spacing and exception review. A nested `<header>` is not a second banner. An unnamed `<section>` is not a defect. Words such as “autoplay” or “animation” in prose are not executable timing evidence.

## Evidence boundaries

Automation catches a useful subset of accessibility barriers. It cannot establish full conformance, assistive-technology usability, comprehension, comfort, or task completion.

A release review should combine:

1. Source inspection and deterministic checks.
2. Browser automation, preserving incomplete results.
3. Keyboard-only navigation and visible focus.
4. Screen-reader review on supported browser and platform combinations.
5. 200% zoom, narrow reflow, forced colors, and reduced motion.
6. Switch Control for switch-critical paths.
7. Human testing, including an individual CVI profile when CVI claims matter.

Record completed checks, open verification, and only the claims the evidence supports.

## v1.0 to v1.1 migration

v1.1 makes a clean pre-registry API break so names describe what the code can prove.

| v1.0                         | v1.1                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `meetsWCAG`                  | `meetsContrastThreshold`                                                      |
| `findAccessibleColor`        | `findNearestPassingColor`                                                     |
| `simulateColorBlindness`     | `simulateColorVisionDeficiency`                                               |
| `applyDyslexiaFriendlyFont`  | `applyTypographyPreference` with caller-supplied values                       |
| `applyTextSpacing`           | `applyTextSpacingTest`, including paragraph spacing and restore               |
| `meetsTextSpacing`           | Removed; author spacing values alone do not establish WCAG 1.4.12 conformance |
| accommodation motion helpers | Use `@accessibility-devkit/motion`                                            |
| `isUnsafeFlashRate`          | `exceedsFlashFrequencyLimit`; frequency is only one part of flash review      |

Invalid colors now throw instead of becoming black. Dwell and repeat intervals are explicit. English readability results identify their method. `createSessionTimeout` remains an implementation helper; use `assessTimeLimit` for policy boundaries.

## Develop from source

```bash
git clone https://github.com/actually-useful-ai/accessibility-devkit.git
cd accessibility-devkit
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm test:pack
```

Python has no runtime dependencies:

```bash
PYTHONPATH=python/src python3 -m unittest discover -s python/tests -v
```

Node CI covers versions 22 and 24. Python CI covers 3.11 through 3.14. Changesets keeps every npm package in one fixed version group; the PyPI distribution and GitHub release use the same version.

Security guidance is in [`SECURITY.md`](SECURITY.md). Runtime dependency licenses and review notes are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## License and credit

MIT © 2026 [Luke Steuber](https://github.com/lukeslp). Accessibility Devkit is maintained at [`actually-useful-ai/accessibility-devkit`](https://github.com/actually-useful-ai/accessibility-devkit).
