/**
 * @module @accessibility-devkit/motion
 * Utilities for seizure and vestibular safety: gating animation on the
 * reduced-motion preference, scrolling without motion sickness, and metering
 * flash rate against the WCAG threshold. These protect people with vestibular
 * disorders and photosensitive conditions.
 */

// ============================================================
// Reduced-motion Preference (WCAG 2.3.3 Animation from Interactions)
// ============================================================

/**
 * Returns true if the user has asked for reduced motion. Safe to call in
 * non-browser environments, where it returns `false`.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Runs `preferred` unless the user has requested reduced motion, in which case
 * it runs `fallback`. Use it to pick a calm alternative to a moving effect.
 *
 * @param preferred - The full-motion behaviour, returning a value of type `T`
 * @param fallback - The reduced-motion behaviour, returning the same type
 * @returns Whichever branch ran
 *
 * @example
 * ```ts
 * withReducedMotion(
 *   () => element.animate(slideKeyframes, 300),
 *   () => element.animate(fadeKeyframes, 0),
 * );
 * ```
 */
export function withReducedMotion<T>(preferred: () => T, fallback: () => T): T {
  return prefersReducedMotion() ? fallback() : preferred();
}

export interface MotionPreferenceClasses {
  /** Class applied when full motion is allowed. */
  animatedClass: string;
  /** Class applied when reduced motion is requested. */
  staticClass: string;
}

/**
 * Toggles motion classes on an element to match the reduced-motion preference,
 * and keeps them in sync if the preference changes.
 *
 * @param element - The element to toggle classes on
 * @param classes - The animated and static class names
 * @returns A cleanup function that stops watching the preference
 *
 * @example
 * ```ts
 * const stop = applyMotionPreference(hero, {
 *   animatedClass: 'hero--parallax',
 *   staticClass: 'hero--flat',
 * });
 * ```
 */
export function applyMotionPreference(
  element: HTMLElement,
  classes: MotionPreferenceClasses,
): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');

  const apply = (reduced: boolean): void => {
    element.classList.toggle(classes.staticClass, reduced);
    element.classList.toggle(classes.animatedClass, !reduced);
  };
  const onChange = (event: MediaQueryListEvent): void => apply(event.matches);

  apply(mq.matches);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

/**
 * Scrolls an element into view, using instant scrolling when reduced motion is
 * requested and smooth scrolling otherwise — avoiding the large-motion trigger
 * that can cause vestibular symptoms.
 *
 * @param element - The element to reveal
 * @param options - Passed through to `scrollIntoView`; `behavior` is overridden by the preference
 *
 * @example
 * ```ts
 * safeScrollIntoView(section, { block: 'start' });
 * ```
 */
export function safeScrollIntoView(
  element: Element,
  options: Omit<ScrollIntoViewOptions, 'behavior'> = {},
): void {
  element.scrollIntoView({
    ...options,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

// ============================================================
// Flash Safety (WCAG 2.3.1 Three Flashes)
// ============================================================

/** The WCAG general flash threshold: content must not flash more than this many times per second. */
export const MAX_SAFE_FLASHES_PER_SECOND = 3;

/**
 * Returns true if a flash rate exceeds the WCAG 2.3.1 general threshold of
 * three flashes per second.
 *
 * @param flashesPerSecond - Observed flash frequency in hertz
 */
export function isUnsafeFlashRate(flashesPerSecond: number): boolean {
  return flashesPerSecond > MAX_SAFE_FLASHES_PER_SECOND;
}

export interface FlashMeterOptions {
  /** Sliding window to count flashes over, in milliseconds (default 1000). */
  windowMs?: number;
  /** Maximum flashes allowed within the window before `onUnsafe` fires (default 3). */
  maxFlashes?: number;
  /** Called the moment the count within the window exceeds `maxFlashes`. */
  onUnsafe?: (count: number) => void;
}

/** A running counter of flashes within a sliding time window. */
export interface FlashMeter {
  /** Record one flash. Returns true if the window is now over the limit. */
  record: (at?: number) => boolean;
  /** Number of flashes currently within the window. */
  count: (at?: number) => number;
  /** Clear all recorded flashes. */
  reset: () => void;
}

/**
 * Meters flashes against the WCAG 2.3.1 threshold: call `record()` for each
 * light/dark transition your animation produces, and `onUnsafe` fires if more
 * than `maxFlashes` occur within any `windowMs` window. Use it to self-check a
 * blinking or strobing effect before shipping it.
 *
 * @param options - Window size, limit, and callback
 * @returns A {@link FlashMeter}
 *
 * @example
 * ```ts
 * const meter = createFlashMeter({ onUnsafe: () => stopAnimation() });
 * onEachFrameToggle(() => meter.record());
 * ```
 */
export function createFlashMeter(options: FlashMeterOptions = {}): FlashMeter {
  const windowMs = options.windowMs ?? 1000;
  const maxFlashes = options.maxFlashes ?? MAX_SAFE_FLASHES_PER_SECOND;
  let timestamps: number[] = [];

  const prune = (now: number): void => {
    const cutoff = now - windowMs;
    timestamps = timestamps.filter((t) => t > cutoff);
  };

  return {
    record: (at = Date.now()): boolean => {
      timestamps.push(at);
      prune(at);
      const over = timestamps.length > maxFlashes;
      if (over) options.onUnsafe?.(timestamps.length);
      return over;
    },
    count: (at = Date.now()): number => {
      prune(at);
      return timestamps.length;
    },
    reset: () => {
      timestamps = [];
    },
  };
}
