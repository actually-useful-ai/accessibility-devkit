# @accessibility-devkit/accommodations

Utilities for disability accommodations: color blindness simulation, WCAG contrast math, and media-query watchers for user preferences.

## Install

```bash
npm install @accessibility-devkit/accommodations
```

## Color Blindness Simulation

### simulateColorBlindness

Returns the hex color as it appears to someone with the given color vision deficiency.

```ts
import { simulateColorBlindness } from '@accessibility-devkit/accommodations';

simulateColorBlindness('#ff0000', 'protanopia'); // red as seen with protanopia
simulateColorBlindness('#00ff00', 'deuteranomaly'); // green as seen with partial deutan deficiency
```

### ColorBlindType

All 7 supported deficiency types:

| Value             | Description                             |
| ----------------- | --------------------------------------- |
| `'protanopia'`    | Complete red insensitivity              |
| `'deuteranopia'`  | Complete green insensitivity            |
| `'tritanopia'`    | Complete blue insensitivity             |
| `'achromatopsia'` | Complete color blindness (monochromacy) |
| `'protanomaly'`   | Partial red insensitivity               |
| `'deuteranomaly'` | Partial green insensitivity             |
| `'tritanomaly'`   | Partial blue insensitivity              |

The `-omaly` variants are partial deficiencies; the others are complete loss of that channel.

## Contrast and WCAG Checks

### getContrastRatio

Calculates the WCAG relative luminance contrast ratio between two hex colors. Returns a value between 1 (no contrast) and 21 (black on white).

```ts
import { getContrastRatio } from '@accessibility-devkit/accommodations';

getContrastRatio('#ffffff', '#000000'); // 21
getContrastRatio('#777777', '#ffffff'); // ~4.48
```

### meetsWCAG

Checks whether a foreground/background pair meets a WCAG contrast threshold.

```ts
import { meetsWCAG } from '@accessibility-devkit/accommodations';

meetsWCAG('#767676', '#ffffff'); // false — fails AA normal text
meetsWCAG('#595959', '#ffffff'); // true  — passes AA normal text
meetsWCAG('#767676', '#ffffff', 'AA', 'large'); // true  — passes AA large text
meetsWCAG('#595959', '#ffffff', 'AAA'); // false — fails AAA normal text
```

WCAG thresholds: AA normal = 4.5:1, AA large = 3:1, AAA normal = 7:1, AAA large = 4.5:1.

### findAccessibleColor

Adjusts a foreground color (darkening first, then lightening) until it meets the WCAG threshold against the given background. Returns the original color unchanged if it already passes.

```ts
import { findAccessibleColor } from '@accessibility-devkit/accommodations';

findAccessibleColor('#aaaaaa', '#ffffff'); // returns a darker gray that passes AA
findAccessibleColor('#aaaaaa', '#ffffff', 'AAA'); // returns an even darker shade for AAA
```

## Media Query Utilities

### prefersReducedMotion

```ts
import { prefersReducedMotion } from '@accessibility-devkit/accommodations';

if (prefersReducedMotion()) {
  // use a simple fade instead of a complex animation
}
```

### watchPrefersReducedMotion

Subscribes to changes in `prefers-reduced-motion`. Returns an unsubscribe function.

```ts
import { watchPrefersReducedMotion } from '@accessibility-devkit/accommodations';

const unsubscribe = watchPrefersReducedMotion((prefers) => {
  animator.setReduced(prefers);
});

// When the component unmounts:
unsubscribe();
```

### Other preference checks

```ts
import { prefersHighContrast, prefersDarkMode } from '@accessibility-devkit/accommodations';

if (prefersHighContrast()) {
  /* apply high-contrast theme */
}
if (prefersDarkMode()) {
  /* apply dark theme */
}
```

## Readable Typography (WCAG 1.4.12)

### applyDyslexiaFriendlyFont

Applies a dyslexia-friendly font and spacing via inline styles, and returns a function that restores the previous styles. Load the `OpenDyslexic` web font yourself if you want it; the fallbacks work without it.

```ts
import { applyDyslexiaFriendlyFont } from '@accessibility-devkit/accommodations';

const restore = applyDyslexiaFriendlyFont(article);
// to undo:
restore();
```

### applyTextSpacing / meetsTextSpacing

Applies the WCAG 1.4.12 text-spacing minimums (line height 1.5, letter spacing 0.12em, word spacing 0.16em) and checks whether an element already meets them.

```ts
import { applyTextSpacing, meetsTextSpacing } from '@accessibility-devkit/accommodations';

if (!meetsTextSpacing(article)) {
  applyTextSpacing(article);
}
```

Paragraph spacing (2em following paragraphs) should be set on the paragraph elements themselves.

## Dependencies

- [`color-blind`](https://github.com/skratchdot/color-blind) — color vision deficiency simulation

## License

MIT. Author: Luke Steuber.
