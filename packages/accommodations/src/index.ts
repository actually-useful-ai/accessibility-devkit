/**
 * @module @accessibility-devkit/accommodations
 * Explicit visual and typography preferences. Motion preferences live in
 * `@accessibility-devkit/motion` so each behavior has one canonical home.
 */

import { simulate } from '@bjornlu/colorblind';
import { hexToRgb } from '@accessibility-devkit/core';

export {
  findNearestPassingColor,
  getContrastRatio,
  meetsContrastThreshold,
  relativeLuminance,
  type ContrastLevel,
  type TextSize,
} from '@accessibility-devkit/core';

export type ColorVisionDeficiency = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

function channelToHex(channel: number): string {
  return Math.max(0, Math.min(255, Math.round(channel)))
    .toString(16)
    .padStart(2, '0');
}

/**
 * Simulate a color-vision deficiency for design review.
 * Simulation does not model CVI, low vision, or an individual's perception.
 */
export function simulateColorVisionDeficiency(
  color: string,
  deficiency: ColorVisionDeficiency,
): string {
  const [r, g, b] = hexToRgb(color);
  const result = simulate({ r, g, b }, deficiency);
  return `#${channelToHex(result.r)}${channelToHex(result.g)}${channelToHex(result.b)}`;
}

/** Return whether the browser reports a request for greater contrast. */
export function prefersHighContrast(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-contrast: more)').matches
  );
}

/** Return whether the browser reports a dark color-scheme preference. */
export function prefersDarkMode(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export interface TypographyPreference {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
}

/**
 * Apply caller-selected typography. No typeface or spacing is assumed to be
 * universally preferable; the caller must supply the person's preferences.
 */
export function applyTypographyPreference(
  element: HTMLElement,
  preference: TypographyPreference,
): () => void {
  const previous = {
    fontFamily: element.style.fontFamily,
    fontSize: element.style.fontSize,
    lineHeight: element.style.lineHeight,
    letterSpacing: element.style.letterSpacing,
    wordSpacing: element.style.wordSpacing,
  };

  if (preference.fontFamily !== undefined) element.style.fontFamily = preference.fontFamily;
  if (preference.fontSize !== undefined) element.style.fontSize = preference.fontSize;
  if (preference.lineHeight !== undefined) element.style.lineHeight = preference.lineHeight;
  if (preference.letterSpacing !== undefined) {
    element.style.letterSpacing = preference.letterSpacing;
  }
  if (preference.wordSpacing !== undefined) element.style.wordSpacing = preference.wordSpacing;

  return () => {
    Object.assign(element.style, previous);
  };
}

export interface TextSpacingTestOptions {
  lineHeight?: string;
  letterSpacing?: string;
  wordSpacing?: string;
  paragraphSpacing?: string;
  paragraphSelector?: string;
}

/**
 * Apply the WCAG 1.4.12 test overrides and return a complete restore function.
 * Passing this test means content survives the overrides; the values are not
 * authoring defaults and applying them does not establish conformance.
 */
export function applyTextSpacingTest(
  element: HTMLElement,
  options: TextSpacingTestOptions = {},
): () => void {
  const previous = {
    lineHeight: element.style.lineHeight,
    letterSpacing: element.style.letterSpacing,
    wordSpacing: element.style.wordSpacing,
  };
  const paragraphs = Array.from(
    element.querySelectorAll<HTMLElement>(options.paragraphSelector ?? 'p'),
  );
  const paragraphSpacing = paragraphs.map((paragraph) => paragraph.style.marginBlockEnd);

  element.style.lineHeight = options.lineHeight ?? '1.5';
  element.style.letterSpacing = options.letterSpacing ?? '0.12em';
  element.style.wordSpacing = options.wordSpacing ?? '0.16em';
  for (const paragraph of paragraphs) {
    paragraph.style.marginBlockEnd = options.paragraphSpacing ?? '2em';
  }

  return () => {
    Object.assign(element.style, previous);
    paragraphs.forEach((paragraph, index) => {
      paragraph.style.marginBlockEnd = paragraphSpacing[index];
    });
  };
}
