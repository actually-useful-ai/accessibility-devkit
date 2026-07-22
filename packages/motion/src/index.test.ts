// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyMotionPreference,
  createFlashMeter,
  isUnsafeFlashRate,
  prefersReducedMotion,
  safeScrollIntoView,
  withReducedMotion,
} from './index';

/** Installs a controllable `matchMedia` stub for the reduced-motion query. */
function stubReducedMotion(initial: boolean) {
  let matches = initial;
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.delete(cb),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return {
    set(value: boolean) {
      matches = value;
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('reduced-motion preference', () => {
  it('reads the preference and chooses the matching branch', () => {
    stubReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(
      withReducedMotion(
        () => 'move',
        () => 'calm',
      ),
    ).toBe('calm');

    stubReducedMotion(false);
    expect(prefersReducedMotion()).toBe(false);
    expect(
      withReducedMotion(
        () => 'move',
        () => 'calm',
      ),
    ).toBe('move');
  });

  it('toggles classes and responds to preference changes, then cleans up', () => {
    const control = stubReducedMotion(false);
    const el = document.createElement('div');

    const stop = applyMotionPreference(el, { animatedClass: 'anim', staticClass: 'flat' });
    expect(el.classList.contains('anim')).toBe(true);
    expect(el.classList.contains('flat')).toBe(false);

    control.set(true);
    expect(el.classList.contains('flat')).toBe(true);
    expect(el.classList.contains('anim')).toBe(false);

    stop();
    expect(control.listenerCount()).toBe(0);
  });

  it('scrolls instantly under reduced motion and smoothly otherwise', () => {
    stubReducedMotion(true);
    const el = document.createElement('div');
    el.scrollIntoView = vi.fn();

    safeScrollIntoView(el, { block: 'start' });
    expect(el.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });

    stubReducedMotion(false);
    safeScrollIntoView(el);
    expect(el.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth' });
  });
});

describe('flash safety', () => {
  it('applies the three-per-second threshold', () => {
    expect(isUnsafeFlashRate(3)).toBe(false);
    expect(isUnsafeFlashRate(4)).toBe(true);
  });

  it('fires onUnsafe when too many flashes fall inside the window', () => {
    const onUnsafe = vi.fn();
    const meter = createFlashMeter({ windowMs: 1000, maxFlashes: 3, onUnsafe });

    expect(meter.record(0)).toBe(false);
    expect(meter.record(100)).toBe(false);
    expect(meter.record(200)).toBe(false);
    expect(meter.record(300)).toBe(true); // 4 within 1s
    expect(onUnsafe).toHaveBeenCalledWith(4);
  });

  it('drops flashes that age out of the window', () => {
    const meter = createFlashMeter({ windowMs: 1000 });
    meter.record(0);
    meter.record(100);
    expect(meter.count(1200)).toBe(0); // both older than the 1s window at t=1200
  });
});
