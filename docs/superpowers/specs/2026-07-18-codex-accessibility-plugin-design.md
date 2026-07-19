# Codex Accessibility Plugin Design

## Purpose

Turn `accessibility-devkit` into the canonical, easily installed accessibility package for Codex while preserving its framework-agnostic TypeScript libraries. The first release consolidates the strongest material from `actually-useful-ai/accessibility` and `lukeslp/accessibility-devkit-llm` without requiring Node.js, an API key, an MCP server, or a model-provider account for the core audit workflow.

The primary installation path is a Codex plugin marketplace. The repository also retains a conventional skill layout so cross-agent skill installers can consume the same workflow without maintaining a second source of truth.

## Goals

- Let a Codex user add the repository as a marketplace and install the accessibility plugin through `/plugins` or the desktop Plugins Directory.
- Provide one high-quality accessibility skill that activates for web-interface construction, review, and remediation.
- Combine deterministic checks with manual-review guidance and clearly distinguish their confidence and coverage.
- Cover motor, cognitive, visual, screen-reader, and communication accessibility rather than reducing accessibility to contrast and alt text.
- Keep the existing audit, component, and accommodation packages independently installable.
- Establish a structure that can later support additional focused accessibility skills without changing the installation model.

## Non-goals for the First Milestone

- Merging every package from `accessibility-devkit-llm` into the target repository.
- Requiring hosted inference or provider-specific APIs.
- Shipping an accessibility overlay or runtime widget.
- Claiming that automated analysis proves WCAG conformance.
- Replacing assistive-technology testing or evaluation by disabled users.
- Expanding into a broad design-system or general frontend-development plugin.

## Repository Architecture

```text
accessibility-devkit/
├── .agents/
│   └── plugins/
│       └── marketplace.json
├── plugins/
│   └── accessibility/
│       ├── .codex-plugin/
│       │   └── plugin.json
│       └── skills/
│           └── accessibility/
│               ├── SKILL.md
│               ├── scripts/
│               ├── references/
│               └── assets/
├── skills/
│   └── accessibility -> ../plugins/accessibility/skills/accessibility
├── packages/
│   ├── audit/
│   ├── components/
│   └── accommodations/
├── tests/
│   ├── fixtures/
│   ├── plugin/
│   └── scripts/
└── docs/
```

The plugin copy is canonical. The root `skills/accessibility` exposure must resolve to that canonical directory through a packaging-safe link or generated synchronization check. CI must fail if two physical copies diverge.

## Distribution and Installation

The repository is both the source project and a Codex marketplace. A user starts with:

```bash
codex plugin marketplace add lukeslp/accessibility-devkit
```

The user then installs **Accessibility Devkit** through `/plugins` or the desktop Plugins Directory. The README must show the exact marketplace and plugin identifiers produced by the manifests and include verification instructions.

For cross-agent use, the root skill exposure should permit:

```bash
npx skills add lukeslp/accessibility-devkit --skill accessibility
```

This secondary path must not dictate the internal architecture or weaken the native Codex experience.

## Plugin Boundary

The first plugin contains one skill named `accessibility`. The skill owns:

- accessibility review and remediation workflow;
- deterministic Python audit scripts;
- focused reference documents loaded only when relevant;
- reusable assets or fixtures needed to produce accessible output;
- reporting requirements and verification gates.

The plugin does not initially expose an MCP server, hosted service, separate agent personas, or provider abstraction. Those can be added only when a demonstrated workflow requires them.

## Skill Information Architecture

`SKILL.md` remains concise enough to load reliably. Its frontmatter description contains all trigger conditions because Codex uses the description for skill selection. The body defines the audit sequence, evidence rules, reporting contract, and routing to references.

Proposed references:

- `references/motor-accessibility.md`
- `references/cognitive-accessibility.md`
- `references/visual-accessibility.md`
- `references/semantics-and-screen-readers.md`
- `references/css-accessibility.md`
- `references/dom-events-and-focus.md`
- `references/aac-and-communication.md`
- `references/manual-testing.md`
- `references/wcag-2.2-map.md`

The existing accessibility plugin content supplies the initial domain guidance. It must be edited for Codex terminology, progressive disclosure, source accuracy, and removal of Claude-specific paths or tool names.

## Audit Model

The skill evaluates four coupled layers before producing findings:

1. **Human performance:** motor acquisition, precision, fatigue, attention, memory, language, and decision burden.
2. **Semantic structure:** native elements, names, roles, states, relationships, landmarks, headings, and accessible descriptions.
3. **Presentation:** CSS cascade, visual order, focus visibility, forced colors, contrast preferences, zoom, reflow, target geometry, and reduced motion.
4. **Behavior:** JavaScript events, focus movement, keyboard interaction, pointer cancellation, DOM mutation, live-region updates, and state synchronization.

A finding is incomplete when it identifies only a visual symptom while ignoring the semantic or behavioral cause.

## Fitts's Law and Motor Accessibility

Target-size analysis must go beyond a fixed minimum. Fitts's Law models acquisition difficulty as a function of distance to a target and its effective width. The plugin should therefore inspect:

- target size and effective hit area;
- distance from likely pointer origin or preceding control;
- spacing from competing targets;
- edge and corner placement, where constrained pointer travel can increase effective target width;
- repeated travel across large viewports;
- target movement, layout shift, and hover-triggered displacement;
- precision demands for drag handles, resize affordances, sliders, and dense menus;
- alternate-input implications for tremor, switch scanning, head tracking, and eye gaze.

WCAG target-size thresholds remain conformance checks, but the report must not imply that passing the minimum makes a control easy to acquire. Findings should distinguish a normative WCAG failure from a usability risk predicted by motor-performance principles.

The research basis includes Fitts's original speed-accuracy model and later human-computer-interaction formulations in which smaller or more distant targets have greater acquisition difficulty.

## Cognitive Load

The plugin treats cognitive accessibility as a task-flow property, not a prose-only concern. Reviews should identify:

- excessive simultaneous choices and poorly grouped actions;
- information that must be remembered across views or steps;
- inconsistent placement, naming, or interaction behavior;
- hidden state and status changes that require inference;
- interruptions, auto-updates, motion, time pressure, and competing calls to action;
- error messages that describe failure without a concrete recovery path;
- unnecessary mode switches or context changes;
- long instructions presented before the point of use;
- ambiguous labels, uncommon words, nested clauses, and dense blocks;
- repeated entry of information already supplied;
- workflows that cannot be paused, resumed, reviewed, or undone.

Reports should connect the implementation detail to the imposed burden: working memory, attention switching, language processing, decision load, or error recovery. Recommendations should favor recognition over recall, progressive disclosure, consistent navigation, short chunks, visible state, and reversible actions.

W3C cognitive-accessibility guidance is supplemental rather than a WCAG conformance standard. The plugin must label these findings accordingly while still treating them as essential usability evidence.

## CSS Cascade Layers and Accessibility

CSS is not merely visual polish; cascade behavior can silently remove focus indicators, hide semantics-adjacent content, defeat user preferences, or create visual/DOM-order divergence.

The devkit should publish an explicit layer contract, declared before layer contents:

```css
@layer reset, base, components, states, accessibility, utilities, overrides;
```

The exact final names may change during implementation, but the contract must satisfy these rules:

- Layer order is declared once and documented.
- Accessibility states have predictable precedence over component defaults.
- Third-party CSS can be imported into a deliberately low-priority layer.
- Consumer overrides remain possible without specificity escalation.
- `!important` is reserved for narrowly documented cases, especially where preserving a user-selectable accessibility mode requires it.
- Unlayered styles are either prohibited by linting or explicitly documented because they override normal layered declarations.
- Important declarations reverse layer priority, and tests must cover that behavior.
- User-origin styles and browser/OS accessibility settings must remain effective.

Reviews must check `display: none`, `visibility`, clipping, generated content, `content-visibility`, focus outlines, forced-color adjustments, transitions, animations, and flex/grid reordering for accessibility consequences. Visual order must not diverge from logical DOM and tab order.

## JavaScript, DOM, and Event Behavior

The plugin should prefer native HTML controls because their activation semantics unify pointer, touch, keyboard, focus, and accessibility APIs. Reviews must flag static elements made interactive only with click handlers unless the complete native behavior is intentionally reproduced.

Behavioral review includes:

- use `click` or an equivalent up-event for ordinary activation rather than completing actions on `pointerdown`, `mousedown`, or `touchstart`;
- provide abort or undo for complex pointer operations;
- ensure every pointer interaction has the expected keyboard operation;
- keep DOM focus, visual focus, selected state, `tabindex`, and `aria-activedescendant` synchronized;
- update `aria-expanded`, `aria-pressed`, `aria-selected`, `aria-busy`, names, descriptions, and live-region content when state changes;
- move focus deliberately after dialogs, route changes, deletion, insertion, and validation failures;
- restore focus when transient UI closes;
- avoid positive `tabindex` as a repair for incorrect DOM structure;
- ensure delegated event handlers do not make non-semantic descendants accidentally interactive;
- handle dynamically inserted or removed controls without losing focus or creating stale ARIA references;
- test hydration, portals, shadow DOM, virtualization, and asynchronous rendering when present;
- avoid DOM/CSS reordering that makes keyboard focus appear to jump unpredictably.

The audit should distinguish source inspection from runtime proof. Static analysis can detect suspicious handlers and ARIA mutations, but computed accessibility trees, focus movement, hit geometry, and asynchronous announcements require browser or assistive-technology testing.

## Deterministic Audit Scripts

The existing stdlib Python scripts from `actually-useful-ai/accessibility` form the baseline. All scripts must:

- work without third-party Python dependencies;
- accept explicit file targets;
- return stable exit codes;
- support human-readable and JSON output;
- identify the inspected evidence and rule;
- avoid claiming correctness for behavior they cannot observe;
- include accessible and inaccessible fixtures;
- run independently and through one aggregate command.

The initial consolidation includes the complete current script set rather than the README's outdated “10 scripts” claim. Script inventory and documentation must be generated or tested against the filesystem to prevent drift.

Future static checks should include suspicious DOM event binding, visual reordering, hidden focusable content, stale ARIA references, and cascade-layer contract violations. These checks must be designed separately and not improvised as regular-expression claims of runtime behavior.

## Reporting Contract

Every reported issue contains:

- severity;
- confidence and evidence type (`deterministic`, `source-inspection`, or `manual-verification`);
- affected users and interaction modes;
- file and line when available;
- observed behavior;
- relevant WCAG criterion when applicable;
- whether the issue is normative, advisory, or supplemental cognitive guidance;
- smallest practical remediation;
- verification procedure.

Reports are findings-first. Passing automated checks must never be summarized as “accessible” or “WCAG compliant.”

## Data and Control Flow

1. Codex recognizes an accessibility-related task from the skill description or explicit invocation.
2. The skill scopes the target: source files, built page, URL, component, or task flow.
3. It identifies relevant technologies and available runtime tools.
4. Deterministic scripts run against supported static inputs.
5. Codex inspects semantic, CSS, JavaScript, and task-flow evidence using the relevant references.
6. Runtime checks run only when a browser or suitable test environment is available.
7. Findings are normalized into the reporting contract and deduplicated by underlying cause.
8. The result ends with manual verification steps appropriate to the affected interaction modes.

## Failure and Degradation Behavior

- Missing optional tools produce a clear skipped-check notice, not a failed audit.
- Unsupported file types are reported explicitly.
- Script parse failures identify the file and preserve partial results from other checks.
- Browser unavailability falls back to source inspection and labels runtime behavior unverified.
- Conflicting evidence is retained with lower confidence rather than silently resolved.
- Network access is unnecessary for the core workflow.
- No source file is modified during an audit unless the user explicitly requests remediation.

## Verification Strategy

### Packaging

- Validate `.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json` against current Codex expectations.
- Add the repository as a local marketplace in an isolated Codex home.
- Confirm the plugin appears, installs, and exposes the accessibility skill.
- Verify the root skill exposure resolves to the canonical skill content.

### Skill

- Validate exact `SKILL.md` casing, required frontmatter, and name rules.
- Test trigger prompts for building, reviewing, debugging, and explaining accessibility.
- Test non-trigger prompts to detect excessive activation.
- Check every referenced script and document path.

### Scripts

- Unit-test shared parsing and reporting behavior.
- Run every script against positive, negative, malformed, and edge-case fixtures.
- Snapshot JSON schemas and exit codes.
- Ensure aggregate execution reports partial failures correctly.

### TypeScript Packages

- Install dependencies from the lockfile.
- Build all packages.
- Run package tests and type checking.
- Add focused tests for cascade-layer helpers or behavioral primitives introduced by later milestones.

### Manual Accessibility

- Keyboard-only navigation and focus visibility.
- VoiceOver on macOS/iOS, NVDA on Windows when available, and TalkBack on Android when applicable.
- 200% zoom and reflow.
- reduced motion, increased contrast, and forced colors.
- pointer cancellation, touch targets, switch-style linear navigation, and gaze/dwell risk review.
- cognitive walkthrough of the primary task, including interruption and error recovery.

## Documentation

The README leads with the Codex installation path and a short first-use example. It then explains the distinction between the plugin workflow and optional TypeScript libraries. Technical package documentation remains close to each package.

Public documentation credits Luke Steuber and avoids internal workflow terminology. It uses precise terms such as deterministic audit, language model, assistive technology, and manual verification.

## Milestones

1. **Packaging:** marketplace, plugin manifest, canonical skill location, installation smoke test.
2. **Consolidation:** port and restructure the existing accessibility skill, scripts, and references.
3. **Verification:** fixtures, script tests, manifest validation, skill-trigger evaluation.
4. **Documentation:** Codex-first README, installation verification, reporting examples.
5. **Improvement:** deepen Fitts's Law analysis, cognitive-flow checks, cascade-layer tooling, DOM/event analysis, and specialized skills based on observed use.

## Research Basis

- [W3C WCAG 2.2: Pointer Cancellation](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation)
- [W3C ARIA Authoring Practices: Developing a Keyboard Interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
- [W3C Cognitive Accessibility](https://www.w3.org/WAI/cognitive/)
- [W3C: Use Clear and Understandable Content](https://www.w3.org/WAI/WCAG2/supplemental/objectives/o3-clear-content/)
- [W3C: Consistent Navigation](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html)
- [W3C CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/)
- [MDN: Cascade Layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)
- [MDN: CSS `order` Accessibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/order)
- [MacKenzie: Fitts' Law as a Research and Design Tool in Human-Computer Interaction](https://www.lri.fr/~mbl/ENS/FundHCI/2013/papers/Mackenzie-HCI92.pdf)

