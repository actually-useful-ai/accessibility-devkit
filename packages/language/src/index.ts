/**
 * @module @accessibility-devkit/language
 * Utilities for reading level and literacy: readability scoring, plain-language
 * flags, and abbreviation annotation. These support people with reading,
 * language, and learning disabilities, and back the advisory reading-level
 * guidance in WCAG 3.1.5.
 */

import {
  analyzeReadableText,
  countEnglishSyllables,
  type ReadableTextAnalysis,
} from '@accessibility-devkit/core';

// ============================================================
// Tokenization
// ============================================================

/** Splits text into sentences on terminal punctuation. */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+(?:\s|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Splits text into word tokens, keeping internal apostrophes and hyphens. */
function splitWords(text: string): string[] {
  return text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [];
}

/**
 * Estimates the number of syllables in an English word with the common
 * vowel-group heuristic. It is an approximation, not a dictionary lookup.
 *
 * @param word - A single word
 * @returns The estimated syllable count (at least 1 for any real word)
 */
export function countSyllables(word: string): number {
  return countEnglishSyllables(word);
}

// ============================================================
// Readability Scores
// ============================================================

/** Readability metrics computed from a block of text. */
export interface ReadabilityScores extends ReadableTextAnalysis {}

/**
 * Computes readability metrics for a block of text. Empty or word-less input
 * returns zeroed scores rather than throwing.
 *
 * @param text - The text to score
 * @returns Sentence/word/syllable counts and three readability indices
 *
 * @example
 * ```ts
 * readabilityScores('The cat sat on the mat.').fleschKincaidGrade; // ~0-2
 * ```
 */
export function readabilityScores(text: string): ReadabilityScores {
  return analyzeReadableText(text);
}

/** A coarse reading-difficulty band. */
export type ReadingBand = 'easy' | 'moderate' | 'difficult';

/** The reading level of a text, summarised for a plain-language check. */
export interface ReadingLevel {
  /** Flesch–Kincaid grade level. */
  grade: number;
  /** Flesch Reading Ease. */
  ease: number;
  /** Coarse band derived from the grade level. */
  band: ReadingBand;
}

/**
 * Summarises a text's reading level into a coarse band. `'easy'` corresponds to
 * roughly the lower-secondary (~grade 9) target named by the advisory WCAG
 * 3.1.5 reading-level guidance.
 *
 * @param text - The text to assess
 * @returns The grade, ease, and band
 *
 * @example
 * ```ts
 * readingLevel(paragraph).band; // 'easy' | 'moderate' | 'difficult'
 * ```
 */
export function readingLevel(text: string): ReadingLevel {
  const { fleschKincaidGrade, fleschReadingEase } = readabilityScores(text);
  const band: ReadingBand =
    fleschKincaidGrade <= 9 ? 'easy' : fleschKincaidGrade <= 13 ? 'moderate' : 'difficult';
  return { grade: fleschKincaidGrade, ease: fleschReadingEase, band };
}

// ============================================================
// Plain-language Flags
// ============================================================

/**
 * Returns sentences longer than `maxWords`. Long sentences are one of the most
 * reliable, fixable signals of hard-to-read text.
 *
 * @param text - The text to scan
 * @param maxWords - Word count above which a sentence is flagged (default 20)
 * @returns The offending sentences, in order
 */
export function findLongSentences(text: string, maxWords = 20): string[] {
  return splitSentences(text).filter((sentence) => splitWords(sentence).length > maxWords);
}

/**
 * Returns the distinct multi-syllable words in a text — candidates to replace
 * with simpler wording. Comparison is case-insensitive; the first-seen form of
 * each word is returned.
 *
 * @param text - The text to scan
 * @param minSyllables - Syllable count at or above which a word is flagged (default 4)
 * @returns The distinct complex words, in first-seen order
 */
export function findComplexWords(text: string, minSyllables = 4): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const word of splitWords(text)) {
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    if (countSyllables(word) >= minSyllables) {
      seen.add(key);
      result.push(word);
    }
  }
  return result;
}

// ============================================================
// Abbreviations (WCAG 3.1.4)
// ============================================================

/** Escapes a string for safe use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Wraps the first occurrence of each abbreviation in an `<abbr>` element with a
 * `title`, so its expansion is available to everyone (WCAG 3.1.4). Existing
 * `<abbr>` elements and their contents are left untouched, and only whole-word
 * matches in text nodes are annotated.
 *
 * @param root - The subtree to annotate
 * @param glossary - Map of abbreviation to its expansion, e.g. `{ WCAG: 'Web Content Accessibility Guidelines' }`
 * @returns The number of abbreviations annotated
 *
 * @example
 * ```ts
 * annotateAbbreviations(article, { WCAG: 'Web Content Accessibility Guidelines' });
 * ```
 */
export function annotateAbbreviations(root: HTMLElement, glossary: Record<string, string>): number {
  const remaining = new Map(Object.entries(glossary));
  if (remaining.size === 0) return 0;

  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('abbr') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });

  const textNodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    textNodes.push(node as Text);
  }

  let annotated = 0;
  for (const textNode of textNodes) {
    if (remaining.size === 0) break;
    for (const [abbr, expansion] of remaining) {
      const pattern = new RegExp(`\\b${escapeRegExp(abbr)}\\b`);
      const match = pattern.exec(textNode.textContent ?? '');
      if (!match) continue;

      const after = textNode.splitText(match.index);
      after.splitText(abbr.length);
      const abbrEl = doc.createElement('abbr');
      abbrEl.title = expansion;
      abbrEl.textContent = abbr;
      after.parentNode?.replaceChild(abbrEl, after);

      remaining.delete(abbr);
      annotated += 1;
      break; // this text node has been split; move to the next one
    }
  }

  return annotated;
}
