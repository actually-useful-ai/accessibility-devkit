/**
 * @module @accessibility-devkit/motor
 * Utilities for motor and mobility accommodations: target-size checks,
 * pointer cancellation, keyboard alternatives to dragging, and tremor
 * tolerance. These address barriers for people who use switches, eye-gaze,
 * head pointers, or who have limited dexterity or tremor.
 */

// ============================================================
// Target Size (WCAG 2.5.8 Minimum, 2.5.5 Enhanced)
// ============================================================

/** WCAG target-size level. `AA` requires 24×24 CSS px; `AAA` requires 44×44. */
export type TargetSizeLevel = 'AA' | 'AAA';

/** Minimum target dimension in CSS pixels for each level. */
const TARGET_SIZE_THRESHOLDS: Record<TargetSizeLevel, number> = {
  AA: 24,
  AAA: 44,
};

/**
 * Default selector for interactive targets. Covers native controls plus the
 * common ARIA widget roles that receive pointer or keyboard activation.
 */
const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** The rendered size of a target, in CSS pixels. */
export interface TargetSize {
  width: number;
  height: number;
}

/**
 * Returns the rendered size of an element from its bounding box.
 *
 * @param element - The element to measure
 * @returns Its width and height in CSS pixels
 */
export function getTargetSize(element: Element): TargetSize {
  const rect = element.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/**
 * Checks whether an interactive element meets the WCAG target-size threshold.
 *
 * This measures the element's own box. WCAG 2.5.8 also passes small targets
 * that have sufficient spacing or an equivalent larger control elsewhere;
 * those exceptions are not evaluated here, so a `false` result means "review",
 * not automatically "fail".
 *
 * @param element - The interactive element to check
 * @param level - `'AA'` (24px, default) or `'AAA'` (44px)
 * @returns true if both dimensions meet the threshold
 *
 * @example
 * ```ts
 * meetsTargetSize(button); // false if the button is smaller than 24×24
 * ```
 */
export function meetsTargetSize(element: Element, level: TargetSizeLevel = 'AA'): boolean {
  const threshold = TARGET_SIZE_THRESHOLDS[level];
  const { width, height } = getTargetSize(element);
  return width >= threshold && height >= threshold;
}

/**
 * Finds interactive targets within `root` that are smaller than the threshold.
 * Zero-size elements (display:none, not yet laid out) are skipped, since they
 * cannot be measured meaningfully.
 *
 * @param root - The subtree to scan (defaults to `document.body`)
 * @param level - `'AA'` (24px, default) or `'AAA'` (44px)
 * @returns The elements that fall below the threshold
 */
export function findUndersizedTargets(
  root: ParentNode = document.body,
  level: TargetSizeLevel = 'AA',
): HTMLElement[] {
  const elements = Array.from(root.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR));
  return elements.filter((el) => {
    const { width, height } = getTargetSize(el);
    if (width === 0 && height === 0) return false;
    return !meetsTargetSize(el, level);
  });
}

// ============================================================
// Pointer Cancellation (WCAG 2.5.2)
// ============================================================

/**
 * Binds an action so it fires on pointer *up* over the target — not on
 * pointer down — and is cancelled if the pointer leaves the target before
 * release. This lets a person who presses the wrong control slide off it to
 * abort, satisfying the up-event and abort requirements of WCAG 2.5.2.
 *
 * @param element - The element to activate
 * @param onActivate - Called when a completed press-and-release occurs on the element
 * @returns A cleanup function that removes the listeners
 *
 * @example
 * ```ts
 * const stop = makePointerCancellable(deleteBtn, () => remove());
 * // later: stop();
 * ```
 */
export function makePointerCancellable(
  element: HTMLElement,
  onActivate: (event: PointerEvent) => void,
): () => void {
  let armed = false;

  const onPointerDown = (): void => {
    armed = true;
  };
  const onPointerUp = (event: PointerEvent): void => {
    if (armed) onActivate(event);
    armed = false;
  };
  const disarm = (): void => {
    armed = false;
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointerleave', disarm);
  element.addEventListener('pointercancel', disarm);

  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointerleave', disarm);
    element.removeEventListener('pointercancel', disarm);
  };
}

// ============================================================
// Dragging Alternative (WCAG 2.5.7)
// ============================================================

/** A movement emitted by the keyboard drag alternative. */
export interface DragMove {
  /** Horizontal step: -1 (left), 0, or 1 (right). */
  dx: -1 | 0 | 1;
  /** Vertical step: -1 (up), 0, or 1 (down). */
  dy: -1 | 0 | 1;
}

export interface KeyboardDraggableOptions {
  /** Called for each arrow-key move while the handle has focus. */
  onMove: (move: DragMove) => void;
  /** Optional callback for Enter/Space to "drop" or commit the position. */
  onCommit?: () => void;
}

/**
 * Adds a keyboard alternative to a drag interaction (WCAG 2.5.7). Arrow keys
 * on the focused handle emit single-step moves; Enter or Space commits. Use it
 * to make anything reorderable, resizable, or repositionable without a pointer.
 *
 * The handle is made focusable (tabindex `0`) if it is not already.
 *
 * @param handle - The element a person tabs to and drives with the keyboard
 * @param options - Move and commit callbacks
 * @returns A cleanup function that removes the listener and restores tabindex
 *
 * @example
 * ```ts
 * makeKeyboardDraggable(sliderThumb, {
 *   onMove: ({ dx }) => setValue((v) => v + dx),
 * });
 * ```
 */
export function makeKeyboardDraggable(
  handle: HTMLElement,
  options: KeyboardDraggableOptions,
): () => void {
  const hadTabindex = handle.hasAttribute('tabindex');
  if (!hadTabindex) handle.setAttribute('tabindex', '0');

  const onKeyDown = (event: KeyboardEvent): void => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        options.onMove({ dx: -1, dy: 0 });
        break;
      case 'ArrowRight':
        event.preventDefault();
        options.onMove({ dx: 1, dy: 0 });
        break;
      case 'ArrowUp':
        event.preventDefault();
        options.onMove({ dx: 0, dy: -1 });
        break;
      case 'ArrowDown':
        event.preventDefault();
        options.onMove({ dx: 0, dy: 1 });
        break;
      case 'Enter':
      case ' ':
        if (options.onCommit) {
          event.preventDefault();
          options.onCommit();
        }
        break;
    }
  };

  handle.addEventListener('keydown', onKeyDown);

  return () => {
    handle.removeEventListener('keydown', onKeyDown);
    if (!hadTabindex) handle.removeAttribute('tabindex');
  };
}

// ============================================================
// Tremor Tolerance
// ============================================================

/**
 * Wraps a handler so repeated calls within `minIntervalMs` are ignored. This
 * absorbs the accidental double-activations common with tremor or spasticity,
 * where a single intended press registers as several.
 *
 * @param handler - The function to guard
 * @param minIntervalMs - Minimum gap between accepted calls (default 500ms)
 * @returns A wrapped handler that drops rapid repeats
 *
 * @example
 * ```ts
 * button.addEventListener('click', preventRapidRepeat(submit));
 * ```
 */
export function preventRapidRepeat<A extends unknown[]>(
  handler: (...args: A) => void,
  minIntervalMs = 500,
): (...args: A) => void {
  let last = 0;
  return (...args: A): void => {
    const now = Date.now();
    if (now - last < minIntervalMs) return;
    last = now;
    handler(...args);
  };
}

export interface DwellActivationOptions {
  /** How long the pointer must rest on the element before activating (default 800ms). */
  delayMs?: number;
  /** Called once the dwell completes without the pointer leaving. */
  onActivate: () => void;
}

/**
 * Activates an element when a pointer rests on it ("dwells") for a set time,
 * instead of requiring a click. This supports head pointers, eye-gaze, and
 * others who can target a control but cannot reliably click it. The timer
 * resets whenever the pointer leaves.
 *
 * @param element - The element to activate on dwell
 * @param options - Dwell delay and activation callback
 * @returns A cleanup function that removes the listeners and clears any timer
 *
 * @example
 * ```ts
 * const stop = createDwellActivation(playButton, { onActivate: () => play() });
 * ```
 */
export function createDwellActivation(
  element: HTMLElement,
  options: DwellActivationOptions,
): () => void {
  const delayMs = options.delayMs ?? 800;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  const onEnter = (): void => {
    clear();
    timer = setTimeout(() => {
      timer = null;
      options.onActivate();
    }, delayMs);
  };

  element.addEventListener('pointerenter', onEnter);
  element.addEventListener('pointerleave', clear);
  element.addEventListener('pointercancel', clear);

  return () => {
    clear();
    element.removeEventListener('pointerenter', onEnter);
    element.removeEventListener('pointerleave', clear);
    element.removeEventListener('pointercancel', clear);
  };
}
