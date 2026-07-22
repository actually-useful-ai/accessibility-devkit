// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyDyslexiaFriendlyFont,
  applyTextSpacing,
  findAccessibleColor,
  getContrastRatio,
  meetsTextSpacing,
  meetsWCAG,
  simulateColorBlindness,
  watchPrefersReducedMotion,
  type ColorBlindType,
} from './index';

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('contrast ratio', () => {
  it('returns the WCAG endpoints and is symmetric', () => {
    expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 10);
    expect(getContrastRatio('#777777', '#777777')).toBeCloseTo(1, 10);
    expect(getContrastRatio('#ffffff', '#777777')).toBeCloseTo(
      getContrastRatio('#777777', '#ffffff'),
      10,
    );
  });
});

describe('WCAG thresholds', () => {
  it('applies the AA normal and large-text thresholds separately', () => {
    expect(meetsWCAG('#777777', '#ffffff', 'AA', 'normal')).toBe(false);
    expect(meetsWCAG('#777777', '#ffffff', 'AA', 'large')).toBe(true);
  });

  it('applies the AAA threshold', () => {
    expect(meetsWCAG('#000000', '#ffffff', 'AAA', 'normal')).toBe(true);
    expect(meetsWCAG('#767676', '#ffffff', 'AAA', 'normal')).toBe(false);
  });
});

describe('accessible color adjustment', () => {
  it('preserves a color that already passes', () => {
    expect(findAccessibleColor('#000000', '#ffffff')).toBe('#000000');
  });

  it('adjusts a failing color until it passes the requested threshold', () => {
    const adjusted = findAccessibleColor('#aaaaaa', '#ffffff');

    expect(adjusted).toBe('#767676');
    expect(meetsWCAG(adjusted, '#ffffff', 'AA', 'normal')).toBe(true);
  });
});

describe('color-vision simulation', () => {
  it('returns a simulated hex color for every supported deficiency type', () => {
    const types: ColorBlindType[] = [
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'achromatopsia',
      'protanomaly',
      'deuteranomaly',
      'tritanomaly',
    ];

    for (const type of types) {
      expect(simulateColorBlindness('#ff6347', type)).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(simulateColorBlindness('#ff6347', 'achromatopsia')).toBe('#828282');
  });
});

describe('reduced-motion preference watcher', () => {
  it('stops delivering changes after cleanup', () => {
    const mediaQuery = new EventTarget() as MediaQueryList;
    Object.defineProperties(mediaQuery, {
      matches: { configurable: true, value: false },
      media: { configurable: true, value: '(prefers-reduced-motion: reduce)' },
    });
    vi.stubGlobal('matchMedia', (query: string) => {
      expect(query).toBe('(prefers-reduced-motion: reduce)');
      return mediaQuery;
    });
    const observed: boolean[] = [];
    const stop = watchPrefersReducedMotion((matches) => observed.push(matches));

    const reduced = new Event('change');
    Object.defineProperty(reduced, 'matches', { value: true });
    mediaQuery.dispatchEvent(reduced);
    stop();
    const restored = new Event('change');
    Object.defineProperty(restored, 'matches', { value: false });
    mediaQuery.dispatchEvent(restored);

    expect(observed).toEqual([true]);
  });
});

describe('readable typography', () => {
  it('applies a dyslexia-friendly font and restores the prior inline styles', () => {
    const el = document.createElement('p');
    el.style.lineHeight = '1';
    document.body.appendChild(el);

    const restore = applyDyslexiaFriendlyFont(el);
    expect(el.style.fontFamily).toContain('OpenDyslexic');
    expect(el.style.lineHeight).toBe('1.5');

    restore();
    expect(el.style.fontFamily).toBe('');
    expect(el.style.lineHeight).toBe('1');
  });

  it('applies WCAG 1.4.12 text spacing that meetsTextSpacing accepts', () => {
    const el = document.createElement('p');
    document.body.appendChild(el);
    expect(meetsTextSpacing(el)).toBe(false);

    applyTextSpacing(el);
    expect(meetsTextSpacing(el)).toBe(true);
  });
});
