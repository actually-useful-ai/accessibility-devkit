// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyTextSpacingTest,
  applyTypographyPreference,
  findNearestPassingColor,
  getContrastRatio,
  meetsContrastThreshold,
  simulateColorVisionDeficiency,
  type ColorVisionDeficiency,
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

  it('rejects invalid colors rather than interpreting them as black', () => {
    expect(() => getContrastRatio('not-a-color', '#fff')).toThrow(/hex color/i);
  });
});

describe('WCAG thresholds', () => {
  it('applies the AA normal and large-text thresholds separately', () => {
    expect(meetsContrastThreshold('#777777', '#ffffff', 'AA', 'normal')).toBe(false);
    expect(meetsContrastThreshold('#777777', '#ffffff', 'AA', 'large')).toBe(true);
  });

  it('applies the AAA threshold', () => {
    expect(meetsContrastThreshold('#000000', '#ffffff', 'AAA', 'normal')).toBe(true);
    expect(meetsContrastThreshold('#767676', '#ffffff', 'AAA', 'normal')).toBe(false);
  });
});

describe('accessible color adjustment', () => {
  it('preserves a color that already passes', () => {
    expect(findNearestPassingColor('#000000', '#ffffff')).toBe('#000000');
  });

  it('adjusts a failing color until it passes the requested threshold', () => {
    const adjusted = findNearestPassingColor('#aaaaaa', '#ffffff');

    expect(adjusted).toBe('#767676');
    expect(meetsContrastThreshold(adjusted, '#ffffff', 'AA', 'normal')).toBe(true);
  });
});

describe('color-vision simulation', () => {
  it('returns a simulated hex color for every supported deficiency type', () => {
    const types: ColorVisionDeficiency[] = [
      'protanopia',
      'deuteranopia',
      'tritanopia',
      'achromatopsia',
    ];

    for (const type of types) {
      expect(simulateColorVisionDeficiency('#ff6347', type)).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(simulateColorVisionDeficiency('#ff6347', 'achromatopsia')).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('readable typography', () => {
  it('applies a dyslexia-friendly font and restores the prior inline styles', () => {
    const el = document.createElement('p');
    el.style.lineHeight = '1';
    document.body.appendChild(el);

    const restore = applyTypographyPreference(el, {
      fontFamily: 'Atkinson Hyperlegible, sans-serif',
      lineHeight: '1.6',
    });
    expect(el.style.fontFamily).toContain('Atkinson Hyperlegible');
    expect(el.style.lineHeight).toBe('1.6');

    restore();
    expect(el.style.fontFamily).toBe('');
    expect(el.style.lineHeight).toBe('1');
  });

  it('applies and restores the complete WCAG text-spacing test override', () => {
    const el = document.createElement('article');
    el.style.lineHeight = '1';
    el.innerHTML = '<p>First</p><p>Second</p>';
    document.body.appendChild(el);
    const paragraphs = Array.from(el.querySelectorAll('p'));

    const restore = applyTextSpacingTest(el);
    expect(el.style.lineHeight).toBe('1.5');
    expect(paragraphs[0].style.marginBlockEnd).toBe('2em');

    restore();
    expect(el.style.lineHeight).toBe('1');
    expect(paragraphs[0].style.marginBlockEnd).toBe('');
  });
});
