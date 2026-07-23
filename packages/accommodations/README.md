# @accessibility-devkit/accommodations

Explicit visual and typography preferences, contrast math, text-spacing override tests, and color-vision simulation.

```bash
npm install @accessibility-devkit/accommodations
```

## Contrast

```js
import {
  findNearestPassingColor,
  getContrastRatio,
  meetsContrastThreshold,
} from '@accessibility-devkit/accommodations';

getContrastRatio('#595959', '#ffffff');
meetsContrastThreshold('#595959', '#ffffff', 'AA', 'normal');
findNearestPassingColor('#aaaaaa', '#ffffff');
```

Invalid colors throw. Suggestions still need browser and human review in the real palette and every interaction state.

## Color-vision deficiency

```js
import { simulateColorVisionDeficiency } from '@accessibility-devkit/accommodations';

simulateColorVisionDeficiency('#ff6347', 'deuteranopia');
```

Supported simulations are `protanopia`, `deuteranopia`, `tritanopia`, and `achromatopsia`. Simulation is a design-review aid. It does not model CVI, low vision, photophobia, or an individual's perception.

The package uses the zero-dependency MIT implementation from `@bjornlu/colorblind`, held behind golden tests.

## Typography preferences

```js
import { applyTypographyPreference } from '@accessibility-devkit/accommodations';

const restore = applyTypographyPreference(article, {
  fontFamily: 'Atkinson Hyperlegible, sans-serif',
  fontSize: '1.125rem',
  lineHeight: '1.6',
});
```

There is no universal dyslexia typeface or spacing preset. Values come from the caller or person and restore cleanly.

## Text-spacing test

```js
import { applyTextSpacingTest } from '@accessibility-devkit/accommodations';

const restore = applyTextSpacingTest(article);
// Inspect clipping, overlap, truncation, and lost controls, then restore.
restore();
```

WCAG 1.4.12 requires content to survive the override. It does not require authors to apply these values by default, so this function never returns a conformance result.

Motion preferences live only in [`@accessibility-devkit/motion`](../motion).

MIT © Luke Steuber.
