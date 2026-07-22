---
name: accessibility
description: Use when building, reviewing, testing, or remediating web interfaces for accessibility, including semantics, keyboard interaction, focus, assistive technology, visual access, motion, and cognitive access.
---

# Accessibility

Build access in from the first implementation. Use [WCAG 2.2](https://www.w3.org/TR/WCAG22/) as the current W3C conformance framework, then include advisory and user-centered evidence where a criterion is not sufficient for a person's task.

## Review order

1. **Native semantics.** Use native HTML before ARIA: buttons for actions, links for navigation, inputs with labels, headings, lists, tables, and landmarks. Add ARIA only to express semantics native HTML cannot.
2. **Keyboard and focus.** Every operation must work without a pointer; keep a visible focus indicator, a logical focus order, no traps, deliberate focus movement, and focus restoration after transient UI.
3. **Names, roles, and states.** Verify accessible names, roles, values, relationships, and live updates. Keep visual, DOM, focus, and exposed state synchronized.
4. **Perception.** Check text alternatives, captions where relevant, contrast, non-color cues, text spacing, forced colors, responsive visual order, and 200% zoom/reflow.
5. **Cognitive access.** Prefer recognition over recall; make state and next actions clear; reduce unnecessary choices, time pressure, and interruption; give errors a concrete recovery path.
6. **Motion and input.** Respect reduced-motion preferences; avoid unexpected movement; provide an alternative to complex dragging, multi-pointer gestures, and device motion; preserve pointer cancellation.
7. **Recovery.** Make destructive or consequential actions reviewable, reversible when practical, and understandable after errors or asynchronous updates.

## Evidence and findings

Scope the source, running interface, and complete task path before reviewing. Record each finding with the affected people and interaction modes, observed behavior, evidence type, relevant WCAG 2.2 success criterion when applicable, classification (`normative`, `advisory`, or `supplemental`), smallest practical remediation, and verification step.

Automated scans and source inspection are useful evidence, but do not establish conformance or prove the experience works with assistive technology. Run the available checks, label unavailable runtime checks as unverified, and use the [verification matrix](references/verification.md) to plan keyboard, screen-reader, zoom/reflow, and user testing.

## Routing

Keep semantic and assistive-technology compliance here: native controls, ARIA exposure, focus behavior, keyboard interaction, and verification with assistive technology.

Route task-path friction, surface-level experience, and product trade-offs to `intentional-ux`: confusing flows, decision burden, hierarchy, or choices that need design intent beyond a specific accessibility barrier. Keep the accessibility evidence attached when the same issue affects both areas.

## Specialists

When the project has a strong domain shape, apply the matching specialist lens on top of this review order. Each one keeps the same evidence and verification discipline but re-weights the criteria that matter most for that context:

- **`accessibility-gaming`** — games and real-time interactive experiences: photosensitivity and flash safety, input remapping, captions for audio cues, assist and difficulty modes.
- **`accessibility-business`** — enterprise and SaaS: long forms, data tables, session timeouts, authentication, error recovery, and procurement or conformance evidence.
- **`accessibility-design`** — visual design and design systems: color and contrast, non-color cues, typography and text spacing, motion budgets, and accessible component specs.

Pick the specialist that fits what is being built; use this general skill directly when none clearly applies.

## Practical guardrails

- Do not replace a real control with a click handler on a generic element when native HTML fits.
- Do not use positive `tabindex` to repair a broken order.
- Do not hide focusable content from view or expose decorative content to assistive technology.
- Do not announce everything; use status messages that are timely, relevant, and appropriate to the task.
- Do not claim “accessible” or “WCAG compliant” from a scan, lint rule, or source review alone.

For detailed test coverage and reporting evidence, read [references/verification.md](references/verification.md).
