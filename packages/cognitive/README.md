# @accessibility-devkit/cognitive

Utilities for cognitive accessibility: adjustable session timeouts with warnings, redundant-entry memory, accessible-authentication helpers, and an undo controller. These reduce time pressure, memory load, and the cost of mistakes for people with cognitive, learning, or attention-related disabilities.

## Install

```bash
npm install @accessibility-devkit/cognitive
```

## Session Timeout (WCAG 2.2.1 / 2.2.6)

### createSessionTimeout

Warns before a session expires and gives the person a way to extend it. Activity — or an explicit `extend()` — restarts the countdown.

```ts
import { createSessionTimeout } from '@accessibility-devkit/cognitive';

const session = createSessionTimeout({
  idleMs: 15 * 60_000,
  warnMs: 2 * 60_000,
  onWarn: () => showExtendDialog(),
  onExpire: () => logout(),
});

// when the person clicks "Stay signed in":
session.extend();
// on unmount:
session.stop();
```

## Redundant Entry (WCAG 3.3.7)

### createFieldMemory

Remembers what a person typed and restores it, so information already provided in a process is not requested again. Password fields are never persisted.

```ts
import { createFieldMemory } from '@accessibility-devkit/cognitive';

const memory = createFieldMemory(checkoutForm, { storageKey: 'checkout' });
checkoutForm.addEventListener('submit', () => memory.clear());
```

## Accessible Authentication (WCAG 3.3.8)

### allowPaste

Re-enables pasting into a field that wrongly blocks it, so password managers and manual copy keep working.

```ts
import { allowPaste } from '@accessibility-devkit/cognitive';

allowPaste(document.querySelector('#one-time-code')!);
```

### auditAuthentication

Flags credential fields that block paste or lack an `autocomplete` attribute. A static heuristic — it surfaces things to review, not confirmed failures.

```ts
import { auditAuthentication } from '@accessibility-devkit/cognitive';

auditAuthentication(loginForm).forEach((b) => console.warn(b.issue, b.detail, b.element));
```

## Reversible Actions (WCAG 3.3.4 / 3.3.6)

### createUndoController

A small undo/redo stack for making consequential actions reversible.

```ts
import { createUndoController } from '@accessibility-devkit/cognitive';

const history = createUndoController(initialState);
history.push(nextState);
const previous = history.undo();
const restored = history.redo();
```

## License

MIT. Author: Luke Steuber.
