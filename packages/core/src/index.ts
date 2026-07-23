/** Runtime-neutral deterministic checks shared by Accessibility Devkit tools. */

export type ContrastLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';

const CONTRAST_THRESHOLDS: Record<ContrastLevel, Record<TextSize, number>> = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
};

/** Convert a three- or six-digit hexadecimal color to RGB. */
export function hexToRgb(color: string): [number, number, number] {
  if (!/^#?(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color)) {
    throw new TypeError(
      `Expected a three- or six-digit hex color; received ${JSON.stringify(color)}`,
    );
  }

  const compact = color.replace(/^#/, '');
  const full = compact.length === 3 ? compact.replace(/./g, (digit) => digit + digit) : compact;
  return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function linearize(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Calculate WCAG relative luminance for a hexadecimal sRGB color. */
export function relativeLuminance(color: string): number {
  const [red, green, blue] = hexToRgb(color).map(linearize);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Calculate the WCAG contrast ratio between two hexadecimal sRGB colors. */
export function getContrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Check one text color pair against a WCAG contrast threshold. */
export function meetsContrastThreshold(
  foreground: string,
  background: string,
  level: ContrastLevel = 'AA',
  textSize: TextSize = 'normal',
): boolean {
  return getContrastRatio(foreground, background) >= CONTRAST_THRESHOLDS[level][textSize];
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Find a nearby grayscale shift that passes the requested text contrast threshold.
 * This is a deterministic suggestion, not a substitute for reviewing the resulting palette.
 */
export function findNearestPassingColor(
  foreground: string,
  background: string,
  level: ContrastLevel = 'AA',
  textSize: TextSize = 'normal',
): string {
  if (meetsContrastThreshold(foreground, background, level, textSize)) {
    hexToRgb(background);
    const compact = foreground.replace(/^#/, '');
    return `#${compact.length === 3 ? compact.replace(/./g, (digit) => digit + digit) : compact}`.toLowerCase();
  }

  const [red, green, blue] = hexToRgb(foreground);
  hexToRgb(background);

  for (let distance = 2; distance <= 510; distance += 2) {
    for (const direction of [-1, 1] as const) {
      const candidate = rgbToHex(
        Math.max(0, Math.min(255, red + direction * distance)),
        Math.max(0, Math.min(255, green + direction * distance)),
        Math.max(0, Math.min(255, blue + direction * distance)),
      );
      if (meetsContrastThreshold(candidate, background, level, textSize)) return candidate;
    }
  }

  return relativeLuminance(background) > 0.179 ? '#000000' : '#ffffff';
}

function splitEnglishSentences(text: string): string[] {
  return text
    .split(/[.!?]+(?:\s|$)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitEnglishWords(text: string): string[] {
  return text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [];
}

/** Estimate syllables in one English word. */
export function countEnglishSyllables(word: string): number {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized) return 0;
  if (normalized.length <= 3) return 1;
  const trimmed = normalized
    .replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  return trimmed.match(/[aeiouy]{1,2}/g)?.length ?? 1;
}

export interface ReadableTextAnalysis {
  /** Formula language. Other languages require a different method. */
  language: 'en';
  /** Explicit reminder that these scores are estimates rather than comprehension tests. */
  method: 'english-heuristic';
  sentences: number;
  words: number;
  syllables: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  automatedReadabilityIndex: number;
}

function roundTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Analyze English prose using established, approximate readability formulas. */
export function analyzeReadableText(text: string): ReadableTextAnalysis {
  const wordTokens = splitEnglishWords(text);
  const sentences = Math.max(splitEnglishSentences(text).length, text.trim() ? 1 : 0);
  const words = wordTokens.length;

  if (words === 0 || sentences === 0) {
    return {
      language: 'en',
      method: 'english-heuristic',
      sentences,
      words,
      syllables: 0,
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      automatedReadabilityIndex: 0,
    };
  }

  const syllables = wordTokens.reduce((sum, word) => sum + countEnglishSyllables(word), 0);
  const letters = (text.match(/[A-Za-z0-9]/g) ?? []).length;
  const wordsPerSentence = words / sentences;
  const syllablesPerWord = syllables / words;
  const lettersPerWord = letters / words;

  return {
    language: 'en',
    method: 'english-heuristic',
    sentences,
    words,
    syllables,
    fleschReadingEase: roundTwo(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord),
    fleschKincaidGrade: roundTwo(0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59),
    automatedReadabilityIndex: roundTwo(4.71 * lettersPerWord + 0.5 * wordsPerSentence - 21.43),
  };
}

export const GENERAL_FLASH_FREQUENCY_LIMIT_HZ = 3;

/**
 * Screen frequency only. A complete flash-threshold test also needs luminance,
 * affected area, and saturated-red measurements.
 */
export function exceedsFlashFrequencyLimit(flashesPerSecond: number): boolean {
  if (!Number.isFinite(flashesPerSecond) || flashesPerSecond < 0) {
    throw new RangeError('Flash frequency must be a finite, non-negative number.');
  }
  return flashesPerSecond > GENERAL_FLASH_FREQUENCY_LIMIT_HZ;
}

export interface TimeLimitPolicy {
  /** The person can disable the limit before encountering it. */
  canDisable?: boolean;
  /** Maximum available limit divided by the default limit. */
  adjustmentMultiplier?: number;
  /** Time between the expiration warning and expiration. */
  warningDurationMs?: number;
  /** Number of times the person can extend the limit from the warning. */
  extensionCount?: number;
  /** The time limit is essential to the activity. Requires contextual review. */
  essential?: boolean;
  /** The limit is part of a real-time event. Requires contextual review. */
  realTime?: boolean;
}

export interface TimeLimitAssessment {
  status: 'passes' | 'fails' | 'manual';
  satisfiedBy: 'disabled' | 'adjustment' | 'extensions' | null;
  reason: string;
}

function validateOptionalNonNegative(value: number | undefined, label: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new RangeError(`${label} must be a finite, non-negative number.`);
  }
}

/** Assess the deterministic alternatives in WCAG 2.2.1 Timing Adjustable. */
export function assessTimeLimit(policy: TimeLimitPolicy): TimeLimitAssessment {
  validateOptionalNonNegative(policy.adjustmentMultiplier, 'adjustmentMultiplier');
  validateOptionalNonNegative(policy.warningDurationMs, 'warningDurationMs');
  validateOptionalNonNegative(policy.extensionCount, 'extensionCount');

  if (policy.essential || policy.realTime) {
    return {
      status: 'manual',
      satisfiedBy: null,
      reason: 'Essential and real-time exceptions require contextual human review.',
    };
  }
  if (policy.canDisable) {
    return { status: 'passes', satisfiedBy: 'disabled', reason: 'The time limit can be disabled.' };
  }
  if ((policy.adjustmentMultiplier ?? 0) >= 10) {
    return {
      status: 'passes',
      satisfiedBy: 'adjustment',
      reason: 'The time limit can be adjusted to at least ten times its default duration.',
    };
  }
  if ((policy.warningDurationMs ?? 0) >= 20_000 && (policy.extensionCount ?? 0) >= 10) {
    return {
      status: 'passes',
      satisfiedBy: 'extensions',
      reason: 'The warning provides at least 20 seconds and at least ten extensions.',
    };
  }
  return {
    status: 'fails',
    satisfiedBy: null,
    reason: 'No deterministic Timing Adjustable alternative was established by this policy.',
  };
}
