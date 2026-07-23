// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  allowPaste,
  assessTimeLimit,
  auditAuthentication,
  createFieldMemory,
  createSessionTimeout,
  createUndoController,
  type KeyValueStore,
} from './index';

describe('time-limit policy', () => {
  it('exposes deterministic WCAG assessment separately from the timer helper', () => {
    expect(assessTimeLimit({ warningDurationMs: 20_000, extensionCount: 10 })).toMatchObject({
      status: 'passes',
      satisfiedBy: 'extensions',
    });
    expect(assessTimeLimit({ warningDurationMs: 19_999, extensionCount: 10 })).toMatchObject({
      status: 'fails',
    });
  });
});

/** A deterministic in-memory store standing in for sessionStorage. */
function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('session timeout', () => {
  it('warns before expiry and resets the countdown on extend', () => {
    vi.useFakeTimers();
    const onWarn = vi.fn();
    const onExpire = vi.fn();
    const session = createSessionTimeout({
      idleMs: 1000,
      warnMs: 200,
      onWarn,
      onExpire,
      activityEvents: [],
    });

    vi.advanceTimersByTime(800);
    expect(onWarn).toHaveBeenCalledTimes(1);
    expect(onExpire).not.toHaveBeenCalled();

    session.extend(); // person asked for more time
    vi.advanceTimersByTime(800);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onExpire).toHaveBeenCalledTimes(1);
    session.stop();
  });

  it('resets when observed activity occurs', () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const session = createSessionTimeout({
      idleMs: 1000,
      onExpire,
      activityEvents: ['pointerdown'],
    });

    vi.advanceTimersByTime(900);
    document.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(900);
    expect(onExpire).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onExpire).toHaveBeenCalledTimes(1);
    session.stop();
  });
});

describe('field memory (redundant entry)', () => {
  it('restores previously entered values and skips password fields', () => {
    const store = memoryStore();
    store.setItem('checkout', JSON.stringify({ email: 'a@b.co', secret: 'leaked' }));

    document.body.innerHTML = `
      <form id="checkout">
        <input name="email" />
        <input name="secret" type="password" />
      </form>
    `;
    const form = document.querySelector('form')!;
    createFieldMemory(form, { storageKey: 'checkout', storage: store });

    expect(form.querySelector<HTMLInputElement>('[name="email"]')!.value).toBe('a@b.co');
    expect(form.querySelector<HTMLInputElement>('[name="secret"]')!.value).toBe('');
  });

  it('saves on input and clears on demand', () => {
    const store = memoryStore();
    document.body.innerHTML = `<form id="f"><input name="city" /></form>`;
    const form = document.querySelector('form')!;
    const memory = createFieldMemory(form, { storageKey: 'f', storage: store });

    const city = form.querySelector<HTMLInputElement>('[name="city"]')!;
    city.value = 'Portland';
    form.dispatchEvent(new Event('input', { bubbles: true }));
    expect(store.getItem('f')).toContain('Portland');

    memory.clear();
    expect(store.getItem('f')).toBeNull();
  });
});

describe('accessible authentication', () => {
  it('re-enables paste that a field tries to block', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const siteHandler = vi.fn((e: Event) => e.preventDefault());
    input.addEventListener('paste', siteHandler);

    const stop = allowPaste(input);
    input.dispatchEvent(new Event('paste', { bubbles: true, cancelable: true }));

    // The ancestor capture-phase handler stops propagation before the field's
    // own blocking listener can run.
    expect(siteHandler).not.toHaveBeenCalled();
    stop();
  });

  it('flags paste-blocked and autocomplete-missing credential fields', () => {
    document.body.innerHTML = `
      <form>
        <input type="email" autocomplete="username" />
        <input type="password" data-block-paste="true" />
      </form>
    `;
    const form = document.querySelector('form')!;

    const barriers = auditAuthentication(form);
    const issues = barriers.map((b) => b.issue).sort();

    expect(issues).toEqual(['autocomplete-missing', 'paste-blocked']);
  });
});

describe('undo controller', () => {
  it('walks backward and forward and truncates redo on a new push', () => {
    const history = createUndoController('a');
    history.push('b');
    history.push('c');

    expect(history.undo()).toBe('b');
    expect(history.canRedo()).toBe(true);

    history.push('d'); // diverge — redo history is dropped
    expect(history.canRedo()).toBe(false);
    expect(history.current()).toBe('d');
    expect(history.undo()).toBe('b');
    expect(history.redo()).toBe('d');
  });
});
