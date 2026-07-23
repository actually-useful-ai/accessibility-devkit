import { describe, expect, it } from 'vitest';

import {
  analyzeReadableText,
  assessTimeLimit,
  exceedsFlashFrequencyLimit,
  findNearestPassingColor,
  getContrastRatio,
  meetsContrastThreshold,
} from './index';

describe('contrast', () => {
  it('calculates WCAG contrast and accepts short hex', () => {
    expect(getContrastRatio('#fff', '#000000')).toBeCloseTo(21, 10);
    expect(meetsContrastThreshold('#777', '#fff', 'AA', 'large')).toBe(true);
  });

  it.each(['', '#12', '#abcd', '#gggggg', 'red', '#00000000'])(
    'rejects invalid color %j',
    (color) => {
      expect(() => getContrastRatio(color, '#fff')).toThrow(/hex color/i);
    },
  );

  it('finds the nearest grayscale adjustment that passes', () => {
    const result = findNearestPassingColor('#aaaaaa', '#ffffff');
    expect(result).toBe('#767676');
    expect(meetsContrastThreshold(result, '#ffffff')).toBe(true);
  });
});

describe('readable-text analysis', () => {
  it('labels the formulas as English-specific approximations', () => {
    const result = analyzeReadableText('We can help. Ask us any time.');
    expect(result.language).toBe('en');
    expect(result.method).toBe('english-heuristic');
    expect(result.words).toBe(7);
    expect(result.fleschKincaidGrade).toBeLessThan(5);
  });
});

describe('flash frequency screening', () => {
  it('treats frequency above three hertz as a potential concern only', () => {
    expect(exceedsFlashFrequencyLimit(3)).toBe(false);
    expect(exceedsFlashFrequencyLimit(3.01)).toBe(true);
    expect(() => exceedsFlashFrequencyLimit(-1)).toThrow(/non-negative/i);
  });
});

describe('time-limit assessment', () => {
  it('passes when the time limit can be disabled', () => {
    expect(assessTimeLimit({ canDisable: true })).toMatchObject({
      status: 'passes',
      satisfiedBy: 'disabled',
    });
  });

  it('checks the ten-times adjustment boundary', () => {
    expect(assessTimeLimit({ adjustmentMultiplier: 9.999 })).toMatchObject({ status: 'fails' });
    expect(assessTimeLimit({ adjustmentMultiplier: 10 })).toMatchObject({
      status: 'passes',
      satisfiedBy: 'adjustment',
    });
  });

  it('checks the warning and extension boundaries together', () => {
    expect(assessTimeLimit({ warningDurationMs: 19_999, extensionCount: 10 })).toMatchObject({
      status: 'fails',
    });
    expect(assessTimeLimit({ warningDurationMs: 20_000, extensionCount: 9 })).toMatchObject({
      status: 'fails',
    });
    expect(assessTimeLimit({ warningDurationMs: 20_000, extensionCount: 10 })).toMatchObject({
      status: 'passes',
      satisfiedBy: 'extensions',
    });
  });

  it('routes essential and real-time exceptions to manual review', () => {
    expect(assessTimeLimit({ essential: true })).toMatchObject({ status: 'manual' });
    expect(assessTimeLimit({ realTime: true })).toMatchObject({ status: 'manual' });
  });
});
