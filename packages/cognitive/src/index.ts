/**
 * @module @accessibility-devkit/cognitive
 * Utilities for cognitive accessibility: adjustable session timeouts with
 * warnings, redundant-entry memory, accessible-authentication helpers, and an
 * undo controller for reversible actions. These reduce time pressure, memory
 * load, and the cost of mistakes for people with cognitive, learning, or
 * attention-related disabilities.
 */

// ============================================================
// Session Timeout (WCAG 2.2.1 Timing Adjustable, 2.2.6 Timeouts)
// ============================================================

export interface SessionTimeoutOptions {
  /** Total idle time before the session expires, in milliseconds. */
  idleMs: number;
  /** How long before expiry to fire `onWarn`, in milliseconds (default 60000). */
  warnMs?: number;
  /** Called `warnMs` before expiry, so the UI can offer more time. */
  onWarn?: () => void;
  /** Called when the idle period elapses without an extension. */
  onExpire: () => void;
  /**
   * DOM events that count as activity and reset the timer. Pass an empty array
   * to disable automatic reset and drive it only with `extend()`.
   * Default: `['pointerdown', 'keydown']`.
   */
  activityEvents?: string[];
  /** Target that activity is observed on (default `document`). */
  target?: EventTarget;
}

/** Controls a running session-timeout watcher. */
export interface SessionTimeout {
  /** Reset the countdown, e.g. when the person asks for more time. */
  extend: () => void;
  /** Stop the watcher and remove its activity listeners. */
  stop: () => void;
}

/**
 * Warns before a session times out and gives the person a way to extend it,
 * satisfying WCAG 2.2.1 (timing adjustable) and 2.2.6 (timeouts). Any activity
 * in `activityEvents` — or an explicit `extend()` — restarts the countdown.
 *
 * @param options - Timing, callbacks, and activity configuration
 * @returns A controller with `extend()` and `stop()`
 *
 * @example
 * ```ts
 * const session = createSessionTimeout({
 *   idleMs: 15 * 60_000,
 *   warnMs: 2 * 60_000,
 *   onWarn: () => showExtendDialog(),
 *   onExpire: () => logout(),
 * });
 * // when the person clicks "Stay signed in":
 * session.extend();
 * ```
 */
export function createSessionTimeout(options: SessionTimeoutOptions): SessionTimeout {
  const warnMs = options.warnMs ?? 60_000;
  const activityEvents = options.activityEvents ?? ['pointerdown', 'keydown'];
  const target = options.target ?? document;

  let warnTimer: ReturnType<typeof setTimeout> | null = null;
  let expireTimer: ReturnType<typeof setTimeout> | null = null;

  const clear = (): void => {
    if (warnTimer !== null) clearTimeout(warnTimer);
    if (expireTimer !== null) clearTimeout(expireTimer);
    warnTimer = null;
    expireTimer = null;
  };

  const schedule = (): void => {
    clear();
    if (options.onWarn && warnMs < options.idleMs) {
      warnTimer = setTimeout(() => options.onWarn?.(), options.idleMs - warnMs);
    }
    expireTimer = setTimeout(() => {
      clear();
      options.onExpire();
    }, options.idleMs);
  };

  const onActivity = (): void => schedule();
  for (const event of activityEvents) {
    target.addEventListener(event, onActivity);
  }

  schedule();

  return {
    extend: schedule,
    stop: () => {
      clear();
      for (const event of activityEvents) {
        target.removeEventListener(event, onActivity);
      }
    },
  };
}

// ============================================================
// Redundant Entry (WCAG 3.3.7)
// ============================================================

/** Minimal synchronous key/value store, compatible with `localStorage`. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface FieldMemoryOptions {
  /** Storage key under which the form's values are saved. */
  storageKey?: string;
  /** Where to persist values (default `sessionStorage`). */
  storage?: KeyValueStore;
}

/** Controls a form's field-memory persistence. */
export interface FieldMemory {
  /** Persist the current field values immediately. */
  save: () => void;
  /** Remove the stored values, e.g. after a successful submit. */
  clear: () => void;
  /** Stop listening for input and remove the handler. */
  stop: () => void;
}

/**
 * Remembers what a person has typed into a form and restores it, so information
 * already provided in a process is not requested again (WCAG 3.3.7). Values are
 * keyed by field `name`, saved on input, and restored on setup.
 *
 * @param form - The form whose named fields should be remembered
 * @param options - Storage key and backing store
 * @returns A controller with `save()`, `clear()`, and `stop()`
 *
 * @example
 * ```ts
 * const memory = createFieldMemory(checkoutForm, { storageKey: 'checkout' });
 * form.addEventListener('submit', () => memory.clear());
 * ```
 */
export function createFieldMemory(
  form: HTMLFormElement,
  options: FieldMemoryOptions = {},
): FieldMemory {
  const storageKey = options.storageKey ?? `field-memory:${form.id || form.name || 'form'}`;
  const storage = options.storage ?? sessionStorage;

  const fields = (): HTMLInputElement[] =>
    Array.from(form.querySelectorAll<HTMLInputElement>('input[name], textarea[name], select[name]'))
      // Never persist passwords or one-time secrets.
      .filter((el) => el.type !== 'password');

  const save = (): void => {
    const values: Record<string, string> = {};
    for (const field of fields()) values[field.name] = field.value;
    storage.setItem(storageKey, JSON.stringify(values));
  };

  const restore = (): void => {
    const raw = storage.getItem(storageKey);
    if (!raw) return;
    let values: Record<string, string>;
    try {
      values = JSON.parse(raw) as Record<string, string>;
    } catch {
      return;
    }
    for (const field of fields()) {
      if (field.name in values && field.value === '') field.value = values[field.name];
    }
  };

  const onInput = (): void => save();

  restore();
  form.addEventListener('input', onInput);

  return {
    save,
    clear: () => storage.removeItem(storageKey),
    stop: () => form.removeEventListener('input', onInput),
  };
}

// ============================================================
// Accessible Authentication (WCAG 3.3.8)
// ============================================================

/**
 * Re-enables pasting into a field that blocks it. Password managers and copy
 * from a note are common ways people avoid a memory or transcription test, and
 * blocking paste undermines WCAG 3.3.8.
 *
 * It clears inline `onpaste` blockers on the field and installs a capturing
 * listener on `root` that stops the paste event before any field-level blocker
 * runs. Because it neutralises the field's own paste handlers, apply it only to
 * fields whose paste is being wrongly suppressed.
 *
 * @param field - The input, textarea, or editable element to unblock
 * @param root - Ancestor to capture on (default `document`)
 * @returns A cleanup function that removes the override
 *
 * @example
 * ```ts
 * allowPaste(document.querySelector('#one-time-code')!);
 * ```
 */
export function allowPaste(
  field: HTMLElement,
  root: Document | HTMLElement = document,
): () => void {
  field.removeAttribute('onpaste');
  field.onpaste = null;

  const allow = (event: Event): void => {
    const target = event.target;
    if (target === field || (target instanceof Node && field.contains(target))) {
      // Capture-phase stop: the field's own blocking listener never runs,
      // and default paste is left intact.
      event.stopImmediatePropagation();
    }
  };
  root.addEventListener('paste', allow, true);
  return () => root.removeEventListener('paste', allow, true);
}

/** A potential accessible-authentication barrier found by {@link auditAuthentication}. */
export interface AuthBarrier {
  /** The field or control the concern relates to. */
  element: HTMLElement;
  /** What the concern is. */
  issue: 'paste-blocked' | 'autocomplete-missing';
  /** A short, human-readable explanation. */
  detail: string;
}

/**
 * Inspects a form for common cognitive-function-test barriers under WCAG 3.3.8:
 * inputs that block paste, and credential fields without an `autocomplete`
 * attribute (which prevents password managers from filling them).
 *
 * This is a static heuristic — it flags things to review, not confirmed
 * failures — and cannot detect paste-blocking added later at runtime.
 *
 * @param form - The form to inspect
 * @returns Any barriers found
 */
export function auditAuthentication(form: HTMLFormElement): AuthBarrier[] {
  const barriers: AuthBarrier[] = [];
  const credentialInputs = Array.from(
    form.querySelectorAll<HTMLInputElement>('input[type="password"], input[type="email"]'),
  );

  for (const input of credentialInputs) {
    if (input.getAttribute('onpaste') === 'return false' || input.dataset.blockPaste === 'true') {
      barriers.push({
        element: input,
        issue: 'paste-blocked',
        detail: 'Field blocks paste, defeating password managers and manual copy.',
      });
    }
    if (!input.hasAttribute('autocomplete')) {
      barriers.push({
        element: input,
        issue: 'autocomplete-missing',
        detail: 'Credential field has no autocomplete attribute for assistive fill.',
      });
    }
  }

  return barriers;
}

// ============================================================
// Undo Controller (WCAG 3.3.4 / 3.3.6 — reversible actions)
// ============================================================

/** An undo/redo controller over snapshots of type `T`. */
export interface UndoController<T> {
  /** Record a new committed state, clearing any redo history. */
  push: (state: T) => void;
  /** Step back one state and return it, or `undefined` if none. */
  undo: () => T | undefined;
  /** Step forward one state and return it, or `undefined` if none. */
  redo: () => T | undefined;
  /** Whether a prior state is available to undo to. */
  canUndo: () => boolean;
  /** Whether a later state is available to redo to. */
  canRedo: () => boolean;
  /** The current state, or `undefined` before the first push. */
  current: () => T | undefined;
}

/**
 * A small undo/redo stack for making consequential actions reversible, which
 * lowers the stakes of a mistake for everyone and supports WCAG 3.3.4/3.3.6.
 *
 * @param initial - Optional starting state
 * @returns An {@link UndoController}
 *
 * @example
 * ```ts
 * const history = createUndoController(document.body.innerHTML);
 * history.push(nextHtml);
 * const previous = history.undo();
 * ```
 */
export function createUndoController<T>(initial?: T): UndoController<T> {
  const stack: T[] = initial === undefined ? [] : [initial];
  let index = stack.length - 1;

  return {
    push: (state: T) => {
      stack.splice(index + 1);
      stack.push(state);
      index = stack.length - 1;
    },
    undo: () => {
      if (index <= 0) return undefined;
      index -= 1;
      return stack[index];
    },
    redo: () => {
      if (index >= stack.length - 1) return undefined;
      index += 1;
      return stack[index];
    },
    canUndo: () => index > 0,
    canRedo: () => index < stack.length - 1,
    current: () => (index >= 0 ? stack[index] : undefined),
  };
}
