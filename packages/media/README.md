# @accessibility-devkit/media

Utilities for auditory and media accessibility: caption and audio-description checks, autoplay-audio detection, transcript association, and an injected pause control. These support people who are Deaf or hard of hearing, and anyone disrupted by unexpected sound.

```bash
npm install @accessibility-devkit/media
```

Static checks cannot judge caption accuracy, audio-description quality, transcript completeness, or player usability. Review the final media manually in the browser and with supported assistive technology.

## Track Checks (WCAG 1.2.2 / 1.2.5)

### hasCaptions / hasAudioDescription

```ts
import { hasCaptions, hasAudioDescription } from '@accessibility-devkit/media';

hasCaptions(video); // true if a captions/subtitles track with a src exists
hasAudioDescription(video); // true if a descriptions track with a src exists
```

## Autoplay Audio (WCAG 1.4.2)

### isAutoplayingAudio / findAutoplayingAudio

```ts
import { findAutoplayingAudio } from '@accessibility-devkit/media';

findAutoplayingAudio(document.body); // media that autoplays audible sound
```

## Media Audit

### auditMedia

Reports the most common media problems: videos without captions (1.2.2), media that autoplays audible sound (1.4.2), and media with neither controls nor autoplay.

```ts
import { auditMedia } from '@accessibility-devkit/media';

for (const finding of auditMedia()) {
  console.warn(`[${finding.wcag}] ${finding.issue}`, finding.detail, finding.element);
}
```

Static markup only — it cannot judge caption quality or find a transcript elsewhere on the page.

## Remediation Helpers

### ensureAudioControl

Adds a labelled pause/play button after any autoplaying, audible media element that lacks native controls.

```ts
import { findAutoplayingAudio, ensureAudioControl } from '@accessibility-devkit/media';

findAutoplayingAudio().forEach(ensureAudioControl);
```

### linkTranscript

Associates a transcript element with a player through `aria-describedby`.

```ts
import { linkTranscript } from '@accessibility-devkit/media';

linkTranscript(video, document.querySelector('#episode-transcript')!);
```

## License

MIT. Author: Luke Steuber.
