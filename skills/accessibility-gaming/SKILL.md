---
name: accessibility-gaming
description: Use when building or reviewing games, real-time, or highly interactive web experiences for accessibility — input remapping, photosensitivity and flash safety, captions for audio cues, assist and difficulty modes, and motor-friendly controls.
---

# Gaming Accessibility

A specialist lens over the core `accessibility` skill for games and real-time interactive experiences. The baseline review order still applies; this skill changes what to weight and what to check first, because games fail different people in different ways than a document or form does.

Start from the core review (native semantics, keyboard and focus, names and roles, perception, cognitive access, motion and input, recovery). Then apply the priorities below.

## Where the risk concentrates

1. **Photosensitivity.** Flashing, strobing, and rapid high-contrast motion can trigger seizures. This is the highest-consequence risk in games and the first thing to check.
2. **Motor and input.** Real-time input, held or repeated presses, precise timing, and simultaneous keys lock out people who use one hand, a switch, eye-gaze, or who have tremor.
3. **Sensory.** Audio carries information — footsteps, alerts, dialogue. Without captions and visual equivalents, that information is lost.
4. **Cognitive.** Time pressure, memorization, and hidden objectives raise the floor of who can play.

## Review lens

- **Flash safety first.** No content flashes more than three times per second (WCAG 2.3.1). Meter any strobe, muzzle flash, screen shake, or rapid palette cycle before shipping it, and provide a photosensitivity warning and a reduced-flash toggle.
- **Full input operability.** Every action works from the keyboard and a single input method. Nothing depends on a mouse path, a multi-key chord, rapid mashing, or a gesture with no alternative. Controls are remappable, and the game can be paused at any time.
- **Adjustable timing.** Time limits are extendable, adjustable, or off. Quick-time events have an alternative.
- **Captions and cues.** Dialogue and meaningful non-speech audio (an approaching enemy, a low-health alarm) have captions and a visual signal. Do not encode required information in sound or color alone.
- **Assist over gate.** Difficulty and assist options never sit behind a skill barrier a person cannot pass to reach them.

## Packages to reach for

| Need                      | Package                                | Key utilities                                                                             |
| ------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Flash and motion safety   | `@accessibility-devkit/motion`         | `createFlashMeter`, `isUnsafeFlashRate`, `withReducedMotion`, `applyMotionPreference`     |
| Input and controls        | `@accessibility-devkit/motor`          | `meetsTargetSize`, `makeKeyboardDraggable`, `preventRapidRepeat`, `createDwellActivation` |
| Captions and audio cues   | `@accessibility-devkit/media`          | `auditMedia`, `hasCaptions`, `ensureAudioControl`                                         |
| HUD colour and contrast   | `@accessibility-devkit/accommodations` | `getContrastRatio`, `meetsWCAG`, `simulateColorBlindness`                                 |
| Assist, checkpoints, undo | `@accessibility-devkit/cognitive`      | `createUndoController`, `createSessionTimeout`                                            |

## Domain patterns

- A settings screen that groups accessibility options and is reachable from the first screen, not buried mid-game.
- A subtitle system that names the speaker and describes non-speech audio, with adjustable size and background.
- Colorblind modes plus a non-color cue (shape, icon, label) for every state that color communicates.
- A remap screen covering every action, including menus and prompts.
- A flash budget checked in your render loop, so an effect that exceeds the threshold is caught in development.

## Guardrails

- Never ship content that flashes more than three times per second, at any difficulty.
- Pause must always be available; do not tie it to a timed or skill-gated action.
- Do not lock accessibility options behind gameplay a person may not be able to complete.
- Do not rely on color or sound alone for anything the player must perceive to act.

## Routing

Keep semantic, keyboard, and assistive-technology work in the core `accessibility` skill. Route onboarding friction, tutorial pacing, and decision cost to `intentional-ux`. Bring the flash and input evidence with you when the same issue spans both.
