/**
 * @module @accessibility-devkit/accommodations
 * Utilities for disability accommodations: color blindness simulation,
 * contrast ratios, WCAG compliance checks, and media-query watchers.
 */

import colorBlind from 'color-blind';

// ============================================================
// Color Blindness Simulation
// ============================================================

/**
 * Supported color vision deficiency types.
 * The `-omaly` variants are partial deficiencies; the rest are complete.
 */
export type ColorBlindType =
  | 'protanopia'
  | 'deuteranopia'
  | 'tritanopia'
  | 'achromatopsia'
  | 'protanomaly'
  | 'deuteranomaly'
  | 'tritanomaly';

// color-blind package function map
const CB_FN_MAP: Record<ColorBlindType, (hex: string) => string> = {
  protanopia: (h) => colorBlind.protanopia(h),
  deuteranopia: (h) => colorBlind.deuteranopia(h),
  tritanopia: (h) => colorBlind.tritanopia(h),
  achromatopsia: (h) => colorBlind.achromatopsia(h),
  protanomaly: (h) => colorBlind.protanomaly(h),
  deuteranomaly: (h) => colorBlind.deuteranomaly(h),
  tritanomaly: (h) => colorBlind.tritanomaly(h),
};

/**
 * Simulates how a hex color appears to someone with a color vision deficiency.
 *
 * @param hex - Hex color string (e.g. '#ff6347' or 'ff6347')
 * @param type - The type of color vision deficiency to simulate
 * @returns The simulated hex color as seen with the given deficiency
 *
 * @example
 * ```ts
 * simulateColorBlindness('#ff0000', 'protanopia'); // '#9a9a00' (approx)
 * ```
 */
export function simulateColorBlindness(hex: string, type: ColorBlindType): string {
  return CB_FN_MAP[type](hex);
}

// ============================================================
// Contrast & WCAG Checks
// ============================================================

/**
 * Parses a hex string to RGB components.
 * @internal
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace(/^#/, '');
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Converts an sRGB channel value (0–255) to its linear counterpart.
 * @internal
 */
function linearize(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Computes the WCAG relative luminance of a hex color.
 * @internal
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the WCAG contrast ratio between two hex colors.
 *
 * @param color1 - First hex color (e.g. '#ffffff')
 * @param color2 - Second hex color (e.g. '#000000')
 * @returns Contrast ratio between 1 and 21 (higher = more contrast)
 *
 * @example
 * ```ts
 * getContrastRatio('#ffffff', '#000000'); // 21
 * getContrastRatio('#777777', '#ffffff'); // ~4.48
 * ```
 */
export function getContrastRatio(color1: string, color2: string): number {
  const l1 = relativeLuminance(color1);
  const l2 = relativeLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Required contrast ratios per WCAG 2.x. */
const WCAG_THRESHOLDS = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
} as const;

/**
 * Checks whether a foreground/background color pair meets a WCAG contrast threshold.
 *
 * @param fg - Foreground (text) hex color
 * @param bg - Background hex color
 * @param level - 'AA' (default) or 'AAA'
 * @param size - 'normal' (default, ≥18pt bold or ≥24pt) or 'large'
 * @returns true if the contrast ratio meets the threshold
 *
 * @example
 * ```ts
 * meetsWCAG('#767676', '#ffffff'); // false — fails AA normal
 * meetsWCAG('#595959', '#ffffff'); // true  — passes AA normal
 * ```
 */
export function meetsWCAG(
  fg: string,
  bg: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal',
): boolean {
  const ratio = getContrastRatio(fg, bg);
  return ratio >= WCAG_THRESHOLDS[level][size];
}

/**
 * Finds the darkest or lightest variant of `fg` that meets the WCAG threshold
 * against the given `bg`.
 *
 * Walks in steps of 1% lightness toward black or white until the threshold is met.
 *
 * @param fg - Starting foreground hex color
 * @param bg - Background hex color
 * @param level - 'AA' (default) or 'AAA'
 * @returns A hex color that passes the threshold, or the closest found
 *
 * @example
 * ```ts
 * findAccessibleColor('#aaaaaa', '#ffffff'); // '#767676' or darker
 * ```
 */
export function findAccessibleColor(fg: string, bg: string, level: 'AA' | 'AAA' = 'AA'): string {
  if (meetsWCAG(fg, bg, level)) return fg;

  const [r, g, b] = hexToRgb(fg);
  const bgLum = relativeLuminance(bg);

  // Try darkening first, then lightening
  for (const direction of [-1, 1] as const) {
    let [cr, cg, cb] = [r, g, b];
    for (let step = 0; step < 255; step++) {
      cr = Math.max(0, Math.min(255, cr + direction * 2));
      cg = Math.max(0, Math.min(255, cg + direction * 2));
      cb = Math.max(0, Math.min(255, cb + direction * 2));
      const candidate = `#${[cr, cg, cb].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      if (meetsWCAG(candidate, bg, level)) return candidate;
    }
  }

  return bgLum > 0.179 ? '#000000' : '#ffffff';
}

// ============================================================
// Media Query Utilities
// ============================================================

/**
 * Returns true if the user has requested reduced motion.
 *
 * @example
 * ```ts
 * if (prefersReducedMotion()) {
 *   // use simple fade instead of animation
 * }
 * ```
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns true if the user has requested high contrast.
 */
export function prefersHighContrast(): boolean {
  return (
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  );
}

/**
 * Returns true if the user has requested a dark color scheme.
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Subscribes to changes in the `prefers-reduced-motion` media query.
 *
 * @param callback - Called with the new value whenever the preference changes
 * @returns A cleanup function that unsubscribes the listener
 *
 * @example
 * ```ts
 * const unsubscribe = watchPrefersReducedMotion((prefers) => {
 *   animator.setReduced(prefers);
 * });
 * // When done:
 * unsubscribe();
 * ```
 */
export function watchPrefersReducedMotion(callback: (prefers: boolean) => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

// ============================================================
// Readable Typography (WCAG 1.4.12 Text Spacing)
// ============================================================

/**
 * A dyslexia-friendly font stack. `OpenDyslexic` is listed first for pages that
 * load it as a web font; the rest are evenly-spaced sans-serif fallbacks.
 */
export const DYSLEXIA_FRIENDLY_FONT_STACK =
  "'OpenDyslexic', 'Comic Sans MS', 'Trebuchet MS', Verdana, Tahoma, sans-serif";

export interface DyslexiaFontOptions {
  /** Font-family stack to apply (default {@link DYSLEXIA_FRIENDLY_FONT_STACK}). */
  fontFamily?: string;
  /** Letter spacing to apply (default '0.05em'). */
  letterSpacing?: string;
  /** Line height to apply (default '1.5'). */
  lineHeight?: string;
}

/**
 * Applies a dyslexia-friendly font and spacing to an element via inline styles.
 * Loading the `OpenDyslexic` web font (if wanted) is the caller's job; the
 * fallbacks work without it.
 *
 * @param element - The element to restyle
 * @param options - Font and spacing overrides
 * @returns A cleanup function that restores the previous inline styles
 *
 * @example
 * ```ts
 * const restore = applyDyslexiaFriendlyFont(article);
 * // to undo: restore();
 * ```
 */
export function applyDyslexiaFriendlyFont(
  element: HTMLElement,
  options: DyslexiaFontOptions = {},
): () => void {
  const previous = {
    fontFamily: element.style.fontFamily,
    letterSpacing: element.style.letterSpacing,
    lineHeight: element.style.lineHeight,
  };
  element.style.fontFamily = options.fontFamily ?? DYSLEXIA_FRIENDLY_FONT_STACK;
  element.style.letterSpacing = options.letterSpacing ?? '0.05em';
  element.style.lineHeight = options.lineHeight ?? '1.5';
  return () => {
    element.style.fontFamily = previous.fontFamily;
    element.style.letterSpacing = previous.letterSpacing;
    element.style.lineHeight = previous.lineHeight;
  };
}

/** WCAG 1.4.12 text-spacing minimums, expressed relative to font size. */
export const TEXT_SPACING_MINIMUMS = {
  /** Line height ≥ 1.5 × font size. */
  lineHeight: 1.5,
  /** Letter spacing ≥ 0.12 × font size. */
  letterSpacing: 0.12,
  /** Word spacing ≥ 0.16 × font size. */
  wordSpacing: 0.16,
} as const;

export interface TextSpacingOptions {
  /** Line height (default '1.5'). */
  lineHeight?: string;
  /** Letter spacing (default '0.12em'). */
  letterSpacing?: string;
  /** Word spacing (default '0.16em'). */
  wordSpacing?: string;
}

/**
 * Applies WCAG 1.4.12 text spacing to an element via inline styles: line height
 * 1.5, letter spacing 0.12em, and word spacing 0.16em by default. Paragraph
 * spacing (2em following paragraphs) should be set on the paragraph elements
 * themselves.
 *
 * @param element - The element to restyle
 * @param options - Spacing overrides
 * @returns A cleanup function that restores the previous inline styles
 */
export function applyTextSpacing(
  element: HTMLElement,
  options: TextSpacingOptions = {},
): () => void {
  const previous = {
    lineHeight: element.style.lineHeight,
    letterSpacing: element.style.letterSpacing,
    wordSpacing: element.style.wordSpacing,
  };
  element.style.lineHeight = options.lineHeight ?? '1.5';
  element.style.letterSpacing = options.letterSpacing ?? '0.12em';
  element.style.wordSpacing = options.wordSpacing ?? '0.16em';
  return () => {
    element.style.lineHeight = previous.lineHeight;
    element.style.letterSpacing = previous.letterSpacing;
    element.style.wordSpacing = previous.wordSpacing;
  };
}

/**
 * Reads a spacing value as a multiple of font size. `em` values are already
 * relative; `px` values are divided by the font size; unitless values (used for
 * line height) are returned as-is. `normal`, empty, or unparseable values yield
 * `null`.
 * @internal
 */
function spacingRatio(value: string, fontSizePx: number): number | null {
  if (!value || value === 'normal') return null;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return null;
  if (value.endsWith('em')) return num;
  if (value.endsWith('px')) return fontSizePx > 0 ? num / fontSizePx : null;
  return num; // unitless (line height)
}

/**
 * Checks whether an element's computed line height, letter spacing, and word
 * spacing meet the WCAG 1.4.12 minimums. Values of `normal` count as not
 * meeting the requirement, since they fall below the thresholds.
 *
 * @param element - The element to check
 * @returns true if all three spacing metrics meet or exceed the minimums
 */
export function meetsTextSpacing(element: HTMLElement): boolean {
  const computed = window.getComputedStyle(element);
  const fontSizePx = parseFloat(computed.fontSize) || 16;

  const read = (prop: 'lineHeight' | 'letterSpacing' | 'wordSpacing'): number | null =>
    spacingRatio(computed[prop] || element.style[prop], fontSizePx);

  const lineHeight = read('lineHeight');
  const letterSpacing = read('letterSpacing');
  const wordSpacing = read('wordSpacing');

  return (
    lineHeight !== null &&
    lineHeight >= TEXT_SPACING_MINIMUMS.lineHeight &&
    letterSpacing !== null &&
    letterSpacing >= TEXT_SPACING_MINIMUMS.letterSpacing &&
    wordSpacing !== null &&
    wordSpacing >= TEXT_SPACING_MINIMUMS.wordSpacing
  );
}
