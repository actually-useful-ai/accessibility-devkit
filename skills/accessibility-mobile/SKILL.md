---
name: accessibility-mobile
description: Use when building or reviewing mobile or touch-first web experiences for accessibility — touch target size and spacing, gesture alternatives, orientation and reflow, pinch-zoom, on-screen keyboards, and mobile screen readers.
---

# Mobile & Touch Accessibility

A specialist lens over the core `accessibility` skill for the mobile web: responsive sites, touch-first interfaces, and anything used on a phone or tablet. The baseline review order still applies; this skill weights the barriers that appear on small touch screens and with mobile assistive technology, which desktop review often misses.

Start from the core review, then apply the priorities below. Test on real devices with the platform screen reader, not just a narrow desktop viewport.

## Where the risk concentrates

1. **Touch targets.** Small or tightly-packed controls are hard or impossible to hit for people with tremor, large fingers, or limited dexterity.
2. **Gestures.** Swipes, pinches, long-presses, and drags with no simple alternative lock out switch, voice, and one-handed users.
3. **Orientation and reflow.** Content that only works in one orientation, or forces horizontal scrolling, breaks for mounted devices and zoomed-in reading.
4. **Zoom and keyboards.** Disabled pinch-zoom and the wrong on-screen keyboard make forms and text unreadable or unusable.

## Review lens

- **Reachable, well-spaced targets.** Interactive controls meet the target-size minimum (24px, 44px preferred) with enough spacing that a neighbour is not hit by accident (WCAG 2.5.8 / 2.5.5).
- **Every gesture has a simple alternative.** Path-based or multi-point gestures and dragging each have a single-tap or button equivalent, and actions fire on release so a mistouch can be slid off (2.5.1 / 2.5.7 / 2.5.2).
- **Orientation is free; content reflows.** Nothing is locked to portrait or landscape (1.3.4), and layout reflows at 320 CSS px wide with no horizontal scrolling (1.4.10).
- **Zoom is allowed.** The viewport meta does not disable pinch-zoom (no `user-scalable=no` or `maximum-scale=1`), and text stays readable when zoomed and under the text-spacing overrides (1.4.4 / 1.4.12).
- **The right keyboard, the first time.** Inputs set `type`, `inputmode`, and `autocomplete` so the on-screen keyboard matches the field and can be auto-filled (1.3.5), and paste is never blocked on codes or credentials.
- **Device motion has an alternative.** Anything triggered by shaking or tilting also has an on-screen control, and respects reduced motion (2.5.4 / 2.3.3).

## Packages to reach for

| Need                              | Package                                | Key utilities                                               |
| --------------------------------- | -------------------------------------- | ----------------------------------------------------------- |
| Target size and spacing           | `@accessibility-devkit/motor`          | `meetsTargetSize`, `findUndersizedTargets`, `getTargetSize` |
| Gesture and drag alternatives     | `@accessibility-devkit/motor`          | `makeKeyboardDraggable`, `makePointerCancellable`           |
| Reflow, zoom, text spacing        | `@accessibility-devkit/accommodations` | `applyTextSpacingTest`, `meetsContrastThreshold`            |
| Device motion and reduced motion  | `@accessibility-devkit/motion`         | `withReducedMotion`, `applyMotionPreference`                |
| Mobile auth (SSO, one-time codes) | `@accessibility-devkit/cognitive`      | `allowPaste`, `auditAuthentication`                         |
| Sheets, drawers, and menus        | `@accessibility-devkit/components`     | `FocusTrap`, `AccessibleDialog`, `AccessibleMenu`           |

## Domain patterns

- Bottom sheets and drawers built with focus management and a real close affordance, not a swipe-only dismiss.
- Tap targets sized and spaced for thumbs, verified with `findUndersizedTargets` against the touch minimum.
- Swipe actions (delete, archive) paired with a visible button that does the same thing.
- A responsive layout that reflows to a single column at 320px instead of side-scrolling or clipping.
- A `<meta name="viewport">` that sets width and initial scale but leaves zoom enabled.
- Form fields with matching `type`/`inputmode`/`autocomplete` so the keyboard and autofill are correct.

## Guardrails

- Do not disable pinch-zoom (`user-scalable=no`, `maximum-scale=1`).
- Do not lock orientation unless the task genuinely requires it.
- Do not ship a swipe, drag, or long-press with no single-tap alternative.
- Do not rely on hover, and do not place actions where only a two-handed grip can reach them.

## Routing

Keep semantic, keyboard, and assistive-technology work — including VoiceOver and TalkBack behaviour — in the core `accessibility` skill. Route thumb-reach, navigation cost, and small-screen hierarchy decisions to `intentional-ux`. Bring the touch-target and gesture evidence along when an issue spans both.
