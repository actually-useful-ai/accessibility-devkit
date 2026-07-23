# @accessibility-devkit/core

Deterministic accessibility checks that work in Node, browsers, and other JavaScript runtimes. The package has no runtime dependencies.

```bash
npm install @accessibility-devkit/core
```

## Contrast

```js
import {
  findNearestPassingColor,
  getContrastRatio,
  meetsContrastThreshold,
} from '@accessibility-devkit/core';

getContrastRatio('#595959', '#ffffff');
meetsContrastThreshold('#595959', '#ffffff', 'AA', 'normal');
findNearestPassingColor('#aaaaaa', '#ffffff');
```

Colors must be three- or six-digit hexadecimal values. Invalid input throws instead of silently becoming black. A passing pair still needs browser review across actual states, transparency, images, and forced colors.

## Timing

```js
import { assessTimeLimit } from '@accessibility-devkit/core';

assessTimeLimit({ canDisable: true });
assessTimeLimit({ adjustmentMultiplier: 10 });
assessTimeLimit({ warningDurationMs: 20_000, extensionCount: 10 });
```

The result is `passes`, `fails`, or `manual`. Essential and real-time exceptions remain manual because source values cannot establish their context.

## Readability

```js
import { analyzeReadableText } from '@accessibility-devkit/core';

analyzeReadableText('We can help. Ask us any time.');
```

The output identifies `language: "en"` and `method: "english-heuristic"`. These formulas are editing clues, not comprehension tests.

## Flash frequency

```js
import { exceedsFlashFrequencyLimit } from '@accessibility-devkit/core';

exceedsFlashFrequencyLimit(3.1); // true
```

Frequency screening is not a complete flash-threshold test. Human and browser review must also consider luminance, area, saturated red, and the actual animation.

MIT © Luke Steuber.
