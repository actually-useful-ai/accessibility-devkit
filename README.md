# Accessibility Devkit

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA-blue.svg)](https://www.w3.org/TR/WCAG22/)

Accessibility Devkit helps a team turn accessibility concerns into work people can act on.

The review plugin looks for barriers in an interface and explains each finding in practical terms: what someone is trying to do, what gets in the way, who it affects, the smallest useful repair, and how the team should verify the result. Advocates can use that evidence to describe the impact on people. Engineering managers can use it to set priorities, assign work, and define what “done” means. Engineers can use the TypeScript packages to fix common problems in code.

The project has three parts:

- **A review plugin for Codex and Claude Code.** It inspects an interface, helps plan or make focused repairs, and keeps automated findings separate from checks that still need a keyboard, screen reader, zoom test, or human judgment.
- **Ten npm packages.** They include a portable core and CLI, plus auditing, focus and keyboard behavior, color and text, motor access, cognitive access, language, media, and motion.
- **A Python core and CLI.** It shares the command-line report contract with the Node CLI.

No overlay. No claim that a scan proves conformance. The work stays in the design, content, and source code where a team can test and maintain it.

## Start with the outcome

You do not need to know a Web Content Accessibility Guidelines (WCAG) criterion number to ask for a useful review. Start with the task people need to complete:

```text
$accessibility Review this interface for accessibility barriers. Start with semantics, keyboard behavior, focus, error recovery, and target size. Make the smallest practical fixes and name the manual checks still needed.
```

A useful finding should tell you:

- **The blocked task:** what a person cannot complete, understand, or control.
- **Who and what it affects:** for example, keyboard users, people using screen readers, people who zoom the page, or people who need more time.
- **The evidence:** the code or observed behavior behind the finding.
- **The repair:** a focused change that removes the barrier without redesigning unrelated parts of the product.
- **The verification:** what the agent checked and what a person still needs to test.

This gives advocates and engineering teams a shared record. It also makes uncertainty visible. An automated check can identify some problems; it cannot establish that a person can complete the whole task.

## Choose the part you need

| Your situation                                                     | Start here                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| You need to understand the barriers in an interface                | Install the review plugin and begin with the prompt above                                                               |
| You have findings but need help turning them into engineering work | Ask the plugin to group findings by affected task, owner, risk, and verification step                                   |
| You already know the code-level problem                            | Use the package map below to find a focused utility                                                                     |
| You need a compliance decision or evidence of real-world access    | Use the review to prepare testing, then verify with assistive technology and people who use the relevant access methods |

## What the review can establish

The plugin can inspect source, identify likely barriers, explain their impact, make focused changes, and record automated evidence. When a browser or other test environment is available, it can also check rendered behavior.

Some conclusions still require people and tools outside the repository. Keyboard use, screen-reader output, zoom and reflow, visual states, captions, error recovery, and complete task flows all need suitable testing. A review should label each check as completed, planned, or unverified. It should never turn an automated scan into a compliance claim.

## Install the published release

Version 1.1.2 is available for all ten npm packages and the Python package. The examples below select that published release. Changes on the default branch, including dependency updates, are available from source until a later release is published.

Use Node 22+ or Python 3.11+ to run a check:

```bash
npx @accessibility-devkit/cli@1.1.2 contrast '#595959' '#ffffff'
pipx run --spec accessibility-devkit==1.1.2 accessibility-devkit contrast '#595959' '#ffffff'
```

Import a portable utility:

```bash
npm install @accessibility-devkit/core@1.1.2
python -m pip install accessibility-devkit==1.1.2
```

```js
import { getContrastRatio } from '@accessibility-devkit/core';

getContrastRatio('#595959', '#ffffff');
```

CommonJS is also supported:

```js
const { getContrastRatio } = require('@accessibility-devkit/core');
```

```python
from accessibility_devkit import get_contrast_ratio

get_contrast_ratio("#595959", "#ffffff")
```

A passing automated check still needs the manual verification described above.

## Five-minute quick start

The plugin is the quickest way to bring the review workflow into a project. The npm and Python packages are optional; install the published release above or build the current source below.

### Codex desktop app

1. Clone this repository and open it in the Codex desktop app.

   ```bash
   git clone https://github.com/actually-useful-ai/accessibility-devkit.git
   ```

2. Open **Plugins**, then the **Plugins Directory**. Use the marketplace import flow and select this repository's `.claude-plugin/marketplace.json` file. Choose **Accessibility** and install it.
3. Start a new task and use the prompt under [Start with the outcome](#start-with-the-outcome).
4. Verify the installation in a fresh task. **Accessibility** should appear in the skill picker. The review should distinguish completed checks from work that still needs a browser, assistive technology, or people who use the interface.

**Expected output:** a short, evidence-based set of findings; a focused patch or implementation plan; the affected people and interaction methods; and a checklist of the manual work that remains.

For current desktop-app details, see the official [OpenAI Plugins documentation](https://learn.chatgpt.com/docs/plugins).

### Direct skill fallback

If marketplace import is unavailable, make the repository's skill discoverable directly. Run this from the cloned repository:

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

The guard catches both existing entries and broken symlinks before making a change. It will never overwrite an entry or nest a link inside it. Codex scans `~/.agents/skills`; restart the app if **Accessibility** does not appear in the skill picker. Use the same first prompt to verify the installation.

### Claude Code

Run these marketplace commands in Claude Code, then use the same first prompt:

```text
/plugin marketplace add actually-useful-ai/accessibility-devkit
/plugin install accessibility@accessibility-devkit
```

## Optional drafting and agent tools

Two additional packages are available from this repository's source. They are separate
from the ten published 1.1.2 packages and are not included in the installed 1.1.2 plugin:

- [`assist`](./packages/assist): contextual alt-text drafts, accessibility review suggestions,
  and selectable word suggestions through an explicitly chosen provider and model. It
  includes a CLI. Generated text is always a draft for human review.
- [`mcp`](./packages/mcp): a local stdio MCP server exposing source scanning, contrast,
  readability, and timing checks to compatible agents. It uses the existing deterministic
  functions and does not read local files, fetch URLs, or contact model providers.

These packages recover useful capabilities from the archived
[`accessibility-devkit-llm`](https://github.com/lukeslp/accessibility-devkit-llm) prototype.
See the [migration map](./docs/04-prototype-migration.md) for each old API's disposition
and the package READMEs for source build and usage instructions. The separate
[`intentional-ux`](https://github.com/actually-useful-ai/intentional-ux) plugin remains
the companion for goals, decisions, navigation, and interaction cost.

## Review lenses for different products

The general `accessibility` skill starts with the task, evidence, repair, and verification. It can route a review to a specialist when the product has a clear shape.

| Product                                       | Specialist               | What it checks first                                                                           |
| --------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| Games and real-time interactive experiences   | `accessibility-gaming`   | Flash safety, input remapping, captions for audio cues, assist modes, and difficulty settings  |
| Enterprise software, SaaS, and internal tools | `accessibility-business` | Forms, timeouts, authentication, error recovery, and conformance evidence                      |
| Visual design and design systems              | `accessibility-design`   | Color and contrast, typography, motion budgets, and accessible component specifications        |
| Mobile and touch-first web apps               | `accessibility-mobile`   | Target size, alternatives to gestures, orientation and reflow, zoom, and mobile screen readers |

Ask for a specialist by name or let the general skill route the review. Design work can also use the separate [`intentional-ux`](https://github.com/actually-useful-ai/intentional-ux) skill to examine goals, decisions, and interaction cost.

## TypeScript package map

The published packages include a [portable core](./packages/core) and [CLI](./packages/cli), plus the eight browser-focused packages below. The [Python package](./python) provides the same portable checks and command-line report contract.

| Barrier                                                                | Package                                       | Examples                                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Automated checks and pipeline reporting                                | [`audit`](./packages/audit)                   | axe-core audits, report formatting, ESLint configuration                      |
| Focus, keyboard behavior, dialogs, menus, and status messages          | [`components`](./packages/components)         | focus traps, roving tabindex, skip links, live regions                        |
| Contrast, color perception, text spacing, and system preferences       | [`accommodations`](./packages/accommodations) | contrast checks, color adjustment, reduced-motion detection                   |
| Small targets, drag-only controls, and repeated accidental input       | [`motor`](./packages/motor)                   | target-size checks, pointer cancellation, keyboard dragging, tremor tolerance |
| Time pressure, repeated entry, blocked paste, and irreversible actions | [`cognitive`](./packages/cognitive)           | timeout warnings, field memory, authentication checks, undo                   |
| Hard-to-read text and unexplained abbreviations                        | [`language`](./packages/language)             | readability scores, long-sentence flags, abbreviation annotation              |
| Missing captions, transcripts, and controls for sound                  | [`media`](./packages/media)                   | media audits, autoplay detection, pause controls, transcript links            |
| Flashing and motion that can cause seizures or vestibular symptoms     | [`motion`](./packages/motion)                 | reduced-motion handling, safe scrolling, flash-rate checks                    |

Each package README documents its functions and shows code examples. The packages help implement repairs; they do not replace the review or the manual verification that follows it.

### Build packages from source

Clone the repository and use its pnpm workspace:

```bash
git clone https://github.com/actually-useful-ai/accessibility-devkit.git
cd accessibility-devkit
pnpm install
pnpm build
pnpm test
```

The build produces CommonJS, ECMAScript module, and TypeScript declaration files. Use source builds for changes that have not yet been released; package imports also work with the published packages.

## Report contract

The shared [report schema](./spec/report.schema.json) uses JSON Schema 2020-12. Reports keep automated findings separate from manual checks; [golden fixtures](./spec/fixtures) verify Node and Python parity.

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

## Repository map

| Path                                                                                   | Contents                                                             |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`skills/accessibility`](./skills/accessibility)                                       | General review workflow and verification guidance                    |
| [`skills/accessibility-*`](./skills)                                                   | Four specialist review lenses                                        |
| [`packages`](./packages)                                                               | Ten npm packages and their API documentation                         |
| [`examples/accessible-component-review.md`](./examples/accessible-component-review.md) | One component followed from evidence through repair and verification |
| [`docs/01-philosophy.md`](./docs/01-philosophy.md)                                     | Project principles                                                   |
| [`docs/02-why-not-overlays.md`](./docs/02-why-not-overlays.md)                         | Why source-level repairs matter                                      |
| [`docs/03-layered-approach.md`](./docs/03-layered-approach.md)                         | How reviews, code, and testing fit together                          |

## Development

```bash
pnpm install
pnpm build       # build all packages in parallel
pnpm lint        # lint TypeScript
pnpm test        # test documentation, plugins, and packages
pnpm changeset   # describe a change for versioning
```

## Related projects

| Project                                                                   | What it does                                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [awesome-accessibility](https://github.com/lukeslp/awesome-accessibility) | Curated accessibility resources and tools                                     |
| [accessibility-atlas](https://github.com/lukeslp/accessibility-atlas)     | Disability demographics, web accessibility, and assistive-technology datasets |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Author

**Luke Steuber** · [lukesteuber.com](https://lukesteuber.com) · [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com)

## License

MIT
