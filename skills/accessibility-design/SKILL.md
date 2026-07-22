---
name: accessibility-design
description: Use when designing interfaces or design systems for accessibility — color and contrast, non-color cues, typography and text spacing, motion budgets, focus indicators, target sizes, and accessible component specs.
---

# Design & Design-System Accessibility

A specialist lens over the core `accessibility` skill for design work: visual design, design systems, tokens, and component specs. The baseline review order still applies; this skill weights the decisions made before code exists, where accessibility is cheapest to build in and most expensive to retrofit.

Start from the core review, then apply the priorities below. Much of design's accessibility work is also user-experience work, so route freely to `intentional-ux`.

## Where the risk concentrates

1. **Color.** Insufficient contrast and color-only meaning are the most common — and most preventable — visual barriers.
2. **Typography.** Type that cannot take user spacing or scale breaks reading for low-vision and dyslexic readers.
3. **Motion.** Parallax, auto-play animation, and large transitions trigger vestibular symptoms when they cannot degrade.
4. **Specs.** Focus indicators, target sizes, and non-color cues get lost when they are not written into the component spec.

## Review lens

- **Contrast is a constraint, not a preference.** Text and meaningful UI meet WCAG contrast (4.5:1 normal, 3:1 large / non-text). Verify tokens, not just one screen.
- **Never color alone.** Every state color carries a redundant cue — shape, icon, text, or pattern.
- **Type that flexes.** The type scale survives the WCAG 1.4.12 text-spacing overrides and 200% zoom without clipping, and a dyslexia-friendly path exists.
- **A motion budget.** Every animation has a reduced-motion variant, and nothing large moves for people who ask for less.
- **Specs carry the details.** Each component spec states its focus indicator, minimum target size, keyboard behaviour, and non-color cues, so implementation cannot silently drop them.

## Packages to reach for

| Need                               | Package                                | Key utilities                                                                    |
| ---------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| Color, contrast, colorblind checks | `@accessibility-devkit/accommodations` | `getContrastRatio`, `meetsWCAG`, `findAccessibleColor`, `simulateColorBlindness` |
| Typography and text spacing        | `@accessibility-devkit/accommodations` | `applyDyslexiaFriendlyFont`, `applyTextSpacing`, `meetsTextSpacing`              |
| Motion budget and reduced motion   | `@accessibility-devkit/motion`         | `withReducedMotion`, `applyMotionPreference`, `safeScrollIntoView`               |
| Target size in specs               | `@accessibility-devkit/motor`          | `meetsTargetSize`, `getTargetSize`, `findUndersizedTargets`                      |
| Behavioural component primitives   | `@accessibility-devkit/components`     | `FocusTrap`, `AccessibleDialog`, `AccessibleMenu`, `createRovingTabindex`        |
| Reading level of content design    | `@accessibility-devkit/language`       | `readingLevel`, `findLongSentences`                                              |

## Domain patterns

- A color system whose token pairs are contrast-verified, each status color paired with a non-color cue and checked under color-blindness simulation.
- A type scale validated against the text-spacing overrides, with a dyslexia-friendly alternative documented.
- A motion budget in the system: allowed durations and effects, each with a reduced-motion fallback.
- A visible, consistent focus indicator defined as a token and shown in every component state.
- Component specs that name focus, target size, keyboard behaviour, and non-color cues as first-class fields.

## Guardrails

- Do not ship a color token pair that fails contrast, or a status that reads only through color.
- Do not specify motion that has no reduced-motion form.
- Do not treat focus indicators or target sizes as implementation details left out of the spec.

## Routing

Send flow, hierarchy, information scent, and decision-cost questions to `intentional-ux` — that is where design intent beyond a specific barrier belongs. Keep semantic and assistive-technology implementation in the core `accessibility` skill, and bring the color, type, and motion evidence along when an issue spans more than one.
