# Keyboard shortcuts that respect typing

## Implementation plan

Build a small, dependency-free browser example that keeps character shortcuts
out of editing contexts and lets the person turn them off. Preserve native
buttons as the primary action path. The helper checks events and explicit
application ownership; it does not guess which application scene is active.

Verify real browser key input, editing descendants and shadow DOM, composition,
repeat events, modal ownership, disabled actions and the off switch. Keep
screen-reader and speech-input verification separate from automated evidence.
