# The Layered Approach

Accessibility Devkit has three layers. Each addresses a different part of implementation and can work alone or with the others.

## Layer 1: Testing and Auditing (`@accessibility-devkit/audit`)

This layer is about catching problems early. It integrates into the developer's existing workflow through linting and automated testing.

**What it includes:**

A pre-configured `axe-core` integration for running accessibility audits against rendered DOM. This can be used in unit tests, integration tests, or as a standalone CLI tool. It also includes a pre-configured `eslint-plugin-jsx-a11y` ruleset for catching common accessibility issues in JSX at the linting stage, before the code even runs.

**When to use it:**

Every project should use this layer. It is the foundation of an accessible development workflow.

## Layer 2: Components and Patterns (`@accessibility-devkit/components`)

This layer provides the building blocks for accessible interfaces. It includes unstyled, framework-agnostic component patterns that handle the complex ARIA and keyboard interaction logic.

**What it includes:**

Focus management utilities (wrapping `focus-trap`), a skip navigation component, a live region announcer for screen readers, and keyboard navigation helpers. These are not styled components; they are behavioral primitives that can be composed into any design system.

**When to use it:**

Use this layer when building custom interactive components like modals, dropdowns, tabs, or any element that requires keyboard navigation and screen reader support.

## Layer 3: Accommodations by disability domain

This layer addresses specific disability needs that go beyond structural accessibility. Most accessibility tooling stops at visual and structural checks; this layer deliberately covers motor, cognitive, sensory, literacy, and vestibular access as well. It is a family of small, framework-agnostic packages, each mapped to the WCAG success criteria it serves.

### `@accessibility-devkit/accommodations`

Color and perception: color blindness simulation (protanopia, deuteranopia, tritanopia, and the partial variants), WCAG contrast math, automatic color adjustment, system-preference detection (`prefers-reduced-motion`, `prefers-contrast`, `prefers-color-scheme`), dyslexia-friendly typography, and WCAG 1.4.12 text spacing.

### `@accessibility-devkit/motor`

Motor and mobility: target-size checks (2.5.8 / 2.5.5), pointer cancellation (2.5.2), a keyboard alternative to dragging (2.5.7), and tremor tolerance (rapid-repeat suppression, dwell activation). For people who use switches, eye-gaze, head pointers, or who have limited dexterity or tremor.

### `@accessibility-devkit/cognitive`

Cognitive load: adjustable session timeouts with warnings (2.2.1 / 2.2.6), redundant-entry memory (3.3.7), accessible-authentication helpers (3.3.8), and an undo controller for reversible actions (3.3.4 / 3.3.6).

### `@accessibility-devkit/language`

Reading level and literacy: readability scoring (Flesch Reading Ease, Flesch–Kincaid grade, Automated Readability Index), plain-language flags for long sentences and complex words, and abbreviation annotation (3.1.4).

### `@accessibility-devkit/media`

Auditory and media access: caption and audio-description checks (1.2.2 / 1.2.5), autoplay-audio detection and an injected pause control (1.4.2), and transcript association.

### `@accessibility-devkit/motion`

Seizure and vestibular safety: reduced-motion gating (2.3.3), motion-safe scrolling, and flash-rate metering against the three-per-second threshold (2.3.1).

**When to use it:**

Use these packages when you need to go beyond a baseline WCAG scan and actively accommodate specific user needs. Reach for the package that matches the barrier — motor, cognitive, language, media, motion, or general perception — and compose them as your interface requires.
