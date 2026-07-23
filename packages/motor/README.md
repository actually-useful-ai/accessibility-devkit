# @accessibility-devkit/motor

Utilities for motor and mobility accommodations: target-size checks, pointer cancellation, keyboard alternatives to dragging, and tremor tolerance. These address barriers for people who use switches, eye-gaze, head pointers, or who have limited dexterity or tremor.

```bash
npm install @accessibility-devkit/motor
```

Rendered size checks and interaction helpers identify implementation risks. Verify spacing, exceptions, focus reachability, dwell, repeat timing, and task completion manually with the person's input method and browser.

## Target Size (WCAG 2.5.8 / 2.5.5)

### meetsTargetSize / getTargetSize

Measures an element's rendered box and checks it against the WCAG target-size threshold — 24×24 CSS px for `'AA'` (2.5.8 Minimum), 44×44 for `'AAA'` (2.5.5 Enhanced).

```ts
import { meetsTargetSize, getTargetSize } from '@accessibility-devkit/motor';

getTargetSize(button); // { width, height }
meetsTargetSize(button); // false if smaller than 24×24
meetsTargetSize(button, 'AAA'); // require 44×44
```

WCAG 2.5.8 also passes small targets with sufficient spacing or an equivalent larger control; those exceptions are not evaluated, so `false` means "review", not automatically "fail".

### findUndersizedTargets

Scans a subtree for interactive targets below the threshold.

```ts
import { findUndersizedTargets } from '@accessibility-devkit/motor';

findUndersizedTargets(document.body).forEach((el) => el.classList.add('too-small'));
```

## Pointer Cancellation (WCAG 2.5.2)

### makePointerCancellable

Fires an action on pointer _up_ over the target, and cancels if the pointer leaves before release — so a mis-press can be aborted by sliding off.

```ts
import { makePointerCancellable } from '@accessibility-devkit/motor';

const stop = makePointerCancellable(deleteButton, () => remove());
// later: stop();
```

## Dragging Alternative (WCAG 2.5.7)

### makeKeyboardDraggable

Adds a keyboard path to any drag interaction. Arrow keys on the focused handle emit single-step moves; Enter or Space commits.

```ts
import { makeKeyboardDraggable } from '@accessibility-devkit/motor';

makeKeyboardDraggable(sliderThumb, {
  onMove: ({ dx }) => setValue((v) => v + dx),
  onCommit: () => save(),
});
```

## Tremor Tolerance

### preventRapidRepeat

Ignores repeat calls within an interval, absorbing accidental double-activations.

```ts
import { preventRapidRepeat } from '@accessibility-devkit/motor';

button.addEventListener('click', preventRapidRepeat(submit, 500));
```

### createDwellActivation

Activates an element when a pointer rests on it, instead of requiring a click — supporting head pointers and eye-gaze.

```ts
import { createDwellActivation } from '@accessibility-devkit/motor';

const stop = createDwellActivation(playButton, { delayMs: 800, onActivate: () => play() });
```

## License

MIT. Author: Luke Steuber.
