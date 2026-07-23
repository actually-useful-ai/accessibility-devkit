# @accessibility-devkit/language

Utilities for reading level and literacy: readability scoring, plain-language flags, and abbreviation annotation. These support people with reading, language, and learning disabilities, and back the advisory reading-level guidance in WCAG 3.1.5.

```bash
npm install @accessibility-devkit/language
```

Readability formulas are English-specific approximations. They surface editing clues; only human comprehension and task testing can show whether the content works for its audience.

## Readability Scores

### readabilityScores / readingLevel

Computes Flesch Reading Ease, Flesch–Kincaid grade, and the Automated Readability Index from a block of text. `readingLevel` summarises it into a coarse band, where `'easy'` corresponds to roughly the lower-secondary (~grade 9) target named by WCAG 3.1.5.

```ts
import { readabilityScores, readingLevel } from '@accessibility-devkit/language';

readabilityScores(paragraph).fleschKincaidGrade; // e.g. 7.4
readingLevel(paragraph).band; // 'easy' | 'moderate' | 'difficult'
```

Scores return `language: 'en'` and `method: 'english-heuristic'`. Syllables are estimated, not looked up, so results guide editing rather than certify a reading level.

## Plain-language Flags

### findLongSentences / findComplexWords

Surface the two most fixable readability problems: over-long sentences and multi-syllable words.

```ts
import { findLongSentences, findComplexWords } from '@accessibility-devkit/language';

findLongSentences(text, 20); // sentences over 20 words
findComplexWords(text, 4); // distinct words of 4+ syllables
```

## Abbreviations (WCAG 3.1.4)

### annotateAbbreviations

Wraps the first occurrence of each term in an `<abbr title>` so its expansion is available to everyone. Existing `<abbr>` elements are left untouched.

```ts
import { annotateAbbreviations } from '@accessibility-devkit/language';

annotateAbbreviations(article, {
  WCAG: 'Web Content Accessibility Guidelines',
  ARIA: 'Accessible Rich Internet Applications',
});
```

## License

MIT. Author: Luke Steuber.
