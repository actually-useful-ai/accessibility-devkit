# Keyboard shortcuts that respect typing

Character shortcuts can interrupt typing or trigger actions during dictation.
This example keeps native buttons as the primary controls and lets the person
turn number shortcuts on or off. Shortcuts start off.

[Open the example](keyboard-guard/index.html) from a local web server:

```sh
python3 -m http.server 5017 --bind 127.0.0.1
```

Visit `http://127.0.0.1:5017/examples/keyboard-guard/`. No build or runtime
package is needed. The example and helper use the repository's MIT license,
credited to Luke Steuber. The typing and scene-ownership pattern comes from
Luke's StoryBlocks player; this example adds explicit application context and
checks for composition, shadow DOM and unavailable controls.

## Integrate the guard

```js
import { shouldHandleShortcut, canActivateShortcutButton } from './keyboard-guard/guard.mjs';

document.addEventListener('keydown', (event) => {
  if (
    !shouldHandleShortcut(event, {
      enabled: preferences.numberShortcuts,
      ownsFocus: activeScene && !dialogOpen && !busy,
    })
  )
    return;

  const button = choiceButtons.find((candidate) => candidate.dataset.key === event.key);
  if (!canActivateShortcutButton(button)) return;
  event.preventDefault();
  button.click();
});
```

The handler runs during bubbling, so a widget can consume its own key event
first. It prevents the default only after finding an eligible native button.
Clicks and shortcuts use the same action path; native Enter and Space continue
to work when character shortcuts are off.

`shouldHandleShortcut` defaults to false unless both `enabled` and `ownsFocus`
enable handling. It rejects previously handled, repeated, composing and
modified events, native editing controls, inherited editable content, common
ARIA text widgets and elements marked `data-shortcuts-ignore`. It checks the
composed event path so an open shadow editor remains detectable when the browser
exposes its host as the event target.

`canActivateShortcutButton` checks a connected native button, disabled fieldset
inheritance, hidden/inert/ARIA-disabled ancestors and rendered visibility.
The helper neither changes focus nor installs listeners.

## Application responsibilities

- Keep a clearly labeled off switch or another qualifying mechanism. This
  example removes `aria-keyshortcuts` when shortcuts are off.
- Pass the current modal, scene, busy and focus ownership state for each event.
  The helper cannot infer application state or see inside a closed shadow root.
  A closed editor should consume the event, mark its host with
  `data-shortcuts-ignore`, or provide explicit ownership state.
- Preserve native buttons and their enabled state. Do not create actions that
  are available only through shortcuts.
- Keep visible focus and restore focus when closing a dialog.
- If preference persistence is added, restore it and its exposed state together.
  This demonstration deliberately resets to off when reloaded.

The off switch addresses the character-shortcut requirement in
[WCAG 2.2 SC 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html).
Default-off is a design choice. Filtering modifiers alone does not establish
conformance; Shift-only printable shortcuts are still character shortcuts.

## Verify

With Playwright resolvable through Node, run:

```sh
KEYBOARD_EVIDENCE_DIR=/absolute/output/path node examples/keyboard-guard/check.cjs
```

Optionally set `KEYBOARD_CHROMIUM_PATH` to an existing Chrome/Chromium executable.
The script checks actual typing and shortcut behavior plus synthetic composition,
repeat and shadow-DOM events, disabled controls, dialog focus restoration and
390px layout overflow. It saves screenshots and a JSON evidence file outside
the source tree.

Screen-reader output, speech input, closed shadow editors, other browsers and
complete application flows still need their own checks. Passing these browser
checks is not a claim of overall accessibility conformance.
