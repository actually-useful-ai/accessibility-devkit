// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createDwellActivation,
  findUndersizedTargets,
  getTargetSize,
  makeKeyboardDraggable,
  makePointerCancellable,
  meetsTargetSize,
  preventRapidRepeat,
  type DragMove,
} from './index';

/** jsdom does not lay out elements, so fix a size for measurement tests. */
function sizeOf(el: HTMLElement, width: number, height: number): void {
  el.getBoundingClientRect = () =>
    ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0 }) as DOMRect;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('target size', () => {
  it('measures an element and applies the AA and AAA thresholds', () => {
    const button = document.createElement('button');
    sizeOf(button, 24, 30);

    expect(getTargetSize(button)).toEqual({ width: 24, height: 30 });
    expect(meetsTargetSize(button, 'AA')).toBe(true);
    expect(meetsTargetSize(button, 'AAA')).toBe(false);
  });

  it('collects only the undersized interactive targets, ignoring zero-size ones', () => {
    document.body.innerHTML = `
      <button id="small">a</button>
      <button id="big">b</button>
      <button id="hidden">c</button>
      <span id="static">not interactive</span>
    `;
    sizeOf(document.querySelector('#small')!, 20, 20);
    sizeOf(document.querySelector('#big')!, 40, 40);
    sizeOf(document.querySelector('#hidden')!, 0, 0);

    const undersized = findUndersizedTargets(document.body, 'AA');

    expect(undersized.map((el) => el.id)).toEqual(['small']);
  });
});

describe('pointer cancellation', () => {
  it('fires on a completed press but not when the pointer leaves first', () => {
    const el = document.createElement('button');
    document.body.appendChild(el);
    const onActivate = vi.fn();
    makePointerCancellable(el, onActivate);

    el.dispatchEvent(new Event('pointerdown'));
    el.dispatchEvent(new Event('pointerup'));
    expect(onActivate).toHaveBeenCalledTimes(1);

    el.dispatchEvent(new Event('pointerdown'));
    el.dispatchEvent(new Event('pointerleave'));
    el.dispatchEvent(new Event('pointerup'));
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('stops firing after cleanup', () => {
    const el = document.createElement('button');
    const onActivate = vi.fn();
    const stop = makePointerCancellable(el, onActivate);
    stop();

    el.dispatchEvent(new Event('pointerdown'));
    el.dispatchEvent(new Event('pointerup'));
    expect(onActivate).not.toHaveBeenCalled();
  });
});

describe('keyboard drag alternative', () => {
  it('emits single-step moves for arrow keys and makes the handle focusable', () => {
    const handle = document.createElement('div');
    document.body.appendChild(handle);
    const moves: DragMove[] = [];
    makeKeyboardDraggable(handle, { onMove: (m) => moves.push(m) });

    expect(handle.getAttribute('tabindex')).toBe('0');

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

    expect(moves).toEqual([
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
    ]);
  });

  it('commits on Enter and restores the original tabindex on cleanup', () => {
    const handle = document.createElement('div');
    const onCommit = vi.fn();
    const stop = makeKeyboardDraggable(handle, { onMove: vi.fn(), onCommit });

    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onCommit).toHaveBeenCalledTimes(1);

    stop();
    expect(handle.hasAttribute('tabindex')).toBe(false);
  });
});

describe('tremor tolerance', () => {
  it('drops repeat calls inside the interval and allows them after it', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    const guarded = preventRapidRepeat(handler, 500);

    guarded();
    guarded();
    expect(handler).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    guarded();
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('activates on dwell and cancels when the pointer leaves early', () => {
    vi.useFakeTimers();
    const el = document.createElement('button');
    const onActivate = vi.fn();
    createDwellActivation(el, { delayMs: 800, onActivate });

    el.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(400);
    el.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(800);
    expect(onActivate).not.toHaveBeenCalled();

    el.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(800);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });
});
