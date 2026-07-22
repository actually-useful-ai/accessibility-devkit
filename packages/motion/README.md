# @accessibility-devkit/motion

Utilities for seizure and vestibular safety: gating animation on the reduced-motion preference, scrolling without motion sickness, and metering flash rate against the WCAG threshold. These protect people with vestibular disorders and photosensitive conditions.

## Install

```bash
npm install @accessibility-devkit/motion
```

## Reduced Motion (WCAG 2.3.3)

### prefersReducedMotion / withReducedMotion

```ts
import { withReducedMotion } from '@accessibility-devkit/motion';

withReducedMotion(
  () => element.animate(slideKeyframes, 300),
  () => element.animate(fadeKeyframes, 0),
);
```

`prefersReducedMotion()` is safe to call outside the browser (returns `false`).

### applyMotionPreference

Toggles animated/static classes to match the preference and keeps them in sync as it changes.

```ts
import { applyMotionPreference } from '@accessibility-devkit/motion';

const stop = applyMotionPreference(hero, {
  animatedClass: 'hero--parallax',
  staticClass: 'hero--flat',
});
```

### safeScrollIntoView

Scrolls instantly under reduced motion, smoothly otherwise — avoiding the large motion that can trigger vestibular symptoms.

```ts
import { safeScrollIntoView } from '@accessibility-devkit/motion';

safeScrollIntoView(section, { block: 'start' });
```

## Flash Safety (WCAG 2.3.1)

### isUnsafeFlashRate / createFlashMeter

The general threshold is three flashes per second. Feed each light/dark transition to a meter to self-check a strobing effect.

```ts
import { createFlashMeter, isUnsafeFlashRate } from '@accessibility-devkit/motion';

isUnsafeFlashRate(4); // true

const meter = createFlashMeter({ onUnsafe: () => stopAnimation() });
onEachFrameToggle(() => meter.record());
```

## License

MIT. Author: Luke Steuber.
