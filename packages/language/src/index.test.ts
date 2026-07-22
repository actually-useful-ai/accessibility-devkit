// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import {
  annotateAbbreviations,
  countSyllables,
  findComplexWords,
  findLongSentences,
  readabilityScores,
  readingLevel,
} from './index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('syllable counting', () => {
  it('handles short words, silent-e, and long words', () => {
    expect(countSyllables('cat')).toBe(1);
    expect(countSyllables('cake')).toBe(1);
    expect(countSyllables('apple')).toBe(2);
    expect(countSyllables('accessibility')).toBe(6);
    expect(countSyllables('')).toBe(0);
  });
});

describe('readability scores', () => {
  it('scores a simple sentence as very easy, low grade', () => {
    const scores = readabilityScores('The cat sat on the mat.');
    expect(scores.words).toBe(6);
    expect(scores.sentences).toBe(1);
    expect(scores.fleschReadingEase).toBeGreaterThan(90);
    expect(scores.fleschKincaidGrade).toBeLessThan(3);
  });

  it('returns zeroed scores for empty input without dividing by zero', () => {
    const scores = readabilityScores('   ');
    expect(scores).toMatchObject({ words: 0, sentences: 0, fleschKincaidGrade: 0 });
  });

  it('bands a dense sentence as harder than a plain one', () => {
    const plain = readingLevel('We can help. Ask us any time.');
    const dense = readingLevel(
      'The aforementioned constitutional infrastructure necessitates comprehensive administrative reconfiguration.',
    );
    expect(plain.band).toBe('easy');
    expect(dense.band).toBe('difficult');
    expect(dense.grade).toBeGreaterThan(plain.grade);
  });
});

describe('plain-language flags', () => {
  it('flags sentences over the word limit', () => {
    const text =
      'This one sentence deliberately runs on and on and on and on with far too many small ordinary words to ever stay readable for anyone. Short one.';
    const long = findLongSentences(text, 20);
    expect(long).toHaveLength(1);
    expect(long[0]).toContain('runs on');
  });

  it('returns distinct multi-syllable words only', () => {
    const complex = findComplexWords('The accessibility of accessibility matters to everyone.', 4);
    expect(complex).toEqual(['accessibility']);
  });
});

describe('abbreviation annotation', () => {
  it('wraps the first occurrence and leaves existing abbr elements alone', () => {
    document.body.innerHTML = '<p>WCAG covers this. WCAG again. <abbr>WCAG</abbr></p>';

    const count = annotateAbbreviations(document.body, {
      WCAG: 'Web Content Accessibility Guidelines',
    });

    expect(count).toBe(1);
    const titled = document.body.querySelectorAll(
      'abbr[title="Web Content Accessibility Guidelines"]',
    );
    expect(titled).toHaveLength(1);
    expect(titled[0].textContent).toBe('WCAG');
  });
});
