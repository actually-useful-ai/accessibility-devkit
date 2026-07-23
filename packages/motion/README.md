# @accessibility-devkit/motion

Reduced-motion behavior, calm scrolling, and flash-frequency screening for browser interfaces.

```bash
npm install @accessibility-devkit/motion
```

## Reduced motion

```js
import { applyMotionPreference, withReducedMotion } from '@accessibility-devkit/motion';

withReducedMotion(
  () => element.animate(slideKeyframes, 300),
  () => element.animate(fadeKeyframes, 0),
);

const stop = applyMotionPreference(hero, {
  animatedClass: 'hero--moving',
  staticClass: 'hero--still',
});
```

`prefersReducedMotion()` is safe outside a browser. `safeScrollIntoView()` switches smooth scrolling to immediate scrolling when reduced motion is requested.

## Flash-frequency screening

```js
import { createFlashMeter, exceedsFlashFrequencyLimit } from '@accessibility-devkit/motion';

exceedsFlashFrequencyLimit(3.1); // true
const meter = createFlashMeter({ onUnsafe: () => stopAnimation() });
```

The name is intentionally narrow. Frequency alone cannot establish flash safety; browser and human review must also cover luminance, affected area, saturated red, and the final animation.

MIT © Luke Steuber.
