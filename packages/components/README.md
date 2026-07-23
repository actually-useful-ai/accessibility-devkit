# @accessibility-devkit/components

Accessible UI primitives implemented to spec: focus containment, roving tabindex, screen reader announcements, skip links, dialogs, and menus. Framework-agnostic TypeScript.

```bash
npm install @accessibility-devkit/components
```

These primitives supply interaction mechanics, not finished product behavior. Verify labels, focus placement, dismissal, recovery, visual states, and content manually in the browser and with supported assistive technology.

## Primitives

### FocusTrap

Confines keyboard focus to a container element. Essential for modals and off-canvas panels. Focus returns to the trigger element on deactivation.

```ts
import { FocusTrap } from '@accessibility-devkit/components';

const trap = new FocusTrap(document.getElementById('modal')!, {
  initialFocus: '#modal-heading',
  allowOutsideClick: false,
});

openButton.addEventListener('click', () => trap.activate());
closeButton.addEventListener('click', () => trap.deactivate());

// For nested modals, pause the outer trap rather than deactivating it
trap.pause();
trap.unpause();
```

### createRovingTabindex

Implements the roving tabindex pattern for composite widgets (toolbars, radio groups, tab lists, menu items). Arrow keys move focus within the group; Tab exits it entirely.

```ts
import { createRovingTabindex } from '@accessibility-devkit/components';

const { destroy } = createRovingTabindex(document.getElementById('toolbar')!, '[role="button"]');

// Remove event listeners when the component unmounts
destroy();
```

### announceToScreenReader

Posts a message to an ARIA live region. Use `'polite'` for non-urgent status updates and `'assertive'` for errors that need immediate attention.

```ts
import { announceToScreenReader } from '@accessibility-devkit/components';

announceToScreenReader('3 results found');
announceToScreenReader('Session expired. Please sign in again.', 'assertive');
```

The first call creates the live region; later calls reuse it.

### createSkipLink

Creates a visually-hidden skip-to-main-content link that becomes visible on keyboard focus. Insert it as the first child of `<body>`.

```ts
import { createSkipLink } from '@accessibility-devkit/components';

const skip = createSkipLink('main-content', 'Skip to main content');
document.body.insertBefore(skip, document.body.firstChild);
```

### AccessibleDialog

Wraps a `<dialog>` or `role="dialog"` element with focus trapping, ARIA attributes, and Escape-key handling.

```ts
import { AccessibleDialog } from '@accessibility-devkit/components';

const dialog = new AccessibleDialog(document.getElementById('confirm-dialog')!, {
  closeSelector: '[data-dialog-close]',
  closeOnEscape: true,
  onOpen: () => console.log('opened'),
  onClose: () => console.log('closed'),
});

document.getElementById('open-btn')!.addEventListener('click', () => dialog.open());
```

The constructor sets `aria-modal="true"` and `role="dialog"` if not already present, and hides the element until `open()` is called.

### AccessibleMenu

Manages a disclosure-style dropdown menu: trigger button, arrow-key navigation, Escape to close, and click-outside dismissal.

```ts
import { AccessibleMenu } from '@accessibility-devkit/components';

const menu = new AccessibleMenu(
  document.getElementById('menu-trigger')!,
  document.getElementById('menu-list')!,
  '[role="menuitem"]', // optional selector, this is the default
);

// Remove all listeners when done
menu.destroy();
```

The trigger automatically receives `aria-haspopup="true"` and `aria-expanded` is toggled on open/close.

## License

MIT. Author: Luke Steuber.
