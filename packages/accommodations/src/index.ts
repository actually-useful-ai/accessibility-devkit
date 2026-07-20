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
