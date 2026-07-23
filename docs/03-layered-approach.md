# The layered approach

Accessibility Devkit separates checks by the evidence they can produce. Each layer can stand alone; together they make gaps visible instead of hiding them behind one score.

## 1. Portable checks and static review

`@accessibility-devkit/core`, `@accessibility-devkit/cli`, and the Python `accessibility-devkit` distribution cover deterministic contrast, timing, readable-text, and flash-frequency checks plus conservative source scanning.

Node and Python use the same report schema, finding identities, manual checks, and exit codes. Static source evidence can detect a missing `alt` attribute or duplicate `id`. It cannot measure rendered contrast, prove target spacing, run Switch Control, or understand an individual's CVI profile. Those limits stay in `manualChecks`.

## 2. Rendered browser auditing

`@accessibility-devkit/audit` runs axe-core against a rendered DOM and preserves incomplete results. It also exports jsx-a11y's maintained recommended flat configuration.

Rendered automation catches more than source scanning, but it still covers only configured rules. Keep incomplete results and continue with keyboard, assistive-technology, zoom, reflow, forced-color, motion, and human testing.

## 3. Interaction primitives

`@accessibility-devkit/components` supplies focus traps, roving tabindex, live announcements, skip links, dialogs, and menus. These are unstyled mechanics rather than complete components.

Names, content, focus placement, dismissal, error recovery, visual states, and product-specific behavior remain the implementer's responsibility.

## 4. Focused browser utilities

- `accommodations`: caller-selected typography, text-spacing override tests, contrast, and color-vision simulation.
- `motor`: target measurement, pointer cancellation, keyboard dragging alternatives, explicit repeat filtering, and explicit dwell timing.
- `cognitive`: time-limit assessment, session helpers, repeated-entry memory, authentication support, and undo.
- `language`: English-specific readability clues, long sentences, complex words, and abbreviations.
- `media`: captions, descriptions, transcripts, autoplay-audio review, and controls.
- `motion`: reduced-motion behavior, calm scrolling, and flash-frequency screening.

These packages address different barriers; they are not disability presets. CVI, color-vision deficiency, low vision, and photophobia stay distinct. Timing values come from the interaction and person rather than a universal default.

## Closing the loop

The review workflow ties the layers together: inspect source, run deterministic and browser checks, fix what the evidence supports, then list the keyboard, assistive-technology, profile-specific, and human verification that remains. A result is useful when another person can tell what was checked and what was not.
