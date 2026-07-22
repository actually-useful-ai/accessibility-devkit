/**
 * @module @accessibility-devkit/media
 * Utilities for auditory and media accessibility: caption and audio-description
 * checks, autoplay-audio detection, transcript association, and an injected
 * pause control. These support people who are Deaf or hard of hearing, and
 * anyone disrupted by unexpected sound.
 */

// ============================================================
// Track Checks (WCAG 1.2.2 Captions, 1.2.5 Audio Description)
// ============================================================

/**
 * Returns true if a video has at least one captions or subtitles track with a
 * source (WCAG 1.2.2).
 *
 * @param video - The video element to inspect
 */
export function hasCaptions(video: HTMLVideoElement): boolean {
  return Array.from(video.querySelectorAll('track')).some(
    (track) => (track.kind === 'captions' || track.kind === 'subtitles') && Boolean(track.src),
  );
}

/**
 * Returns true if a video has an audio-description track with a source
 * (WCAG 1.2.5). Audio description tracks are declared as `kind="descriptions"`.
 *
 * @param video - The video element to inspect
 */
export function hasAudioDescription(video: HTMLVideoElement): boolean {
  return Array.from(video.querySelectorAll('track')).some(
    (track) => track.kind === 'descriptions' && Boolean(track.src),
  );
}

// ============================================================
// Autoplay Audio (WCAG 1.4.2 Audio Control)
// ============================================================

/**
 * Returns true if a media element is set to autoplay with audible sound — the
 * condition WCAG 1.4.2 requires a pause/stop mechanism for.
 *
 * @param media - An `<audio>` or `<video>` element
 */
export function isAutoplayingAudio(media: HTMLMediaElement): boolean {
  return media.autoplay && !media.muted;
}

/**
 * Finds media elements in a subtree that autoplay audible sound.
 *
 * @param root - The subtree to scan (defaults to `document.body`)
 * @returns The offending `<audio>`/`<video>` elements
 */
export function findAutoplayingAudio(root: ParentNode = document.body): HTMLMediaElement[] {
  return Array.from(root.querySelectorAll<HTMLMediaElement>('audio, video')).filter(
    isAutoplayingAudio,
  );
}

// ============================================================
// Media Audit
// ============================================================

/** A media accessibility concern found by {@link auditMedia}. */
export interface MediaFinding {
  element: HTMLMediaElement;
  issue: 'missing-captions' | 'autoplay-audio' | 'missing-controls';
  /** The relevant WCAG success criterion. */
  wcag: string;
  detail: string;
}

/**
 * Inspects a subtree for the most common media accessibility problems: videos
 * without captions (1.2.2), media that autoplays audible sound (1.4.2), and
 * media exposing neither native controls nor autoplay (leaving no obvious way
 * to start it). Static markup only — it cannot judge caption quality or whether
 * a transcript exists elsewhere on the page.
 *
 * @param root - The subtree to inspect (defaults to `document.body`)
 * @returns The findings, in document order
 */
export function auditMedia(root: ParentNode = document.body): MediaFinding[] {
  const findings: MediaFinding[] = [];
  const mediaElements = Array.from(root.querySelectorAll<HTMLMediaElement>('audio, video'));

  for (const media of mediaElements) {
    if (media instanceof HTMLVideoElement && !hasCaptions(media)) {
      findings.push({
        element: media,
        issue: 'missing-captions',
        wcag: '1.2.2',
        detail: 'Video has no captions or subtitles track.',
      });
    }
    if (isAutoplayingAudio(media)) {
      findings.push({
        element: media,
        issue: 'autoplay-audio',
        wcag: '1.4.2',
        detail: 'Media autoplays audible sound with no guaranteed pause mechanism.',
      });
    }
    if (!media.controls && !media.autoplay) {
      findings.push({
        element: media,
        issue: 'missing-controls',
        wcag: '1.4.2',
        detail: 'Media has neither native controls nor autoplay; it may be unreachable.',
      });
    }
  }

  return findings;
}

// ============================================================
// Remediation Helpers
// ============================================================

/** The control injected by {@link ensureAudioControl}. */
export interface AudioControl {
  /** The inserted button. */
  button: HTMLButtonElement;
  /** Remove the button and its listener. */
  remove: () => void;
}

/**
 * Ensures an autoplaying, audible media element has a way to stop it: if it
 * exposes no native controls, a labelled pause/play toggle button is inserted
 * immediately after it (WCAG 1.4.2). Returns `null` when no control is needed.
 *
 * @param media - The media element to guard
 * @returns The injected control, or `null` if the element is fine as-is
 *
 * @example
 * ```ts
 * findAutoplayingAudio().forEach(ensureAudioControl);
 * ```
 */
export function ensureAudioControl(media: HTMLMediaElement): AudioControl | null {
  if (!isAutoplayingAudio(media) || media.controls) return null;

  const doc = media.ownerDocument;
  const button = doc.createElement('button');
  button.type = 'button';

  const sync = (): void => {
    button.textContent = media.paused ? 'Play' : 'Pause';
    button.setAttribute('aria-pressed', String(!media.paused));
  };
  const onClick = (): void => {
    if (media.paused) void media.play();
    else media.pause();
    sync();
  };

  sync();
  button.addEventListener('click', onClick);
  media.addEventListener('play', sync);
  media.addEventListener('pause', sync);
  media.after(button);

  return {
    button,
    remove: () => {
      button.removeEventListener('click', onClick);
      media.removeEventListener('play', sync);
      media.removeEventListener('pause', sync);
      button.remove();
    },
  };
}

/**
 * Associates a transcript element with a media element via `aria-describedby`,
 * so assistive technology can reach the transcript from the player. A missing
 * `id` on the transcript is generated.
 *
 * @param media - The media element
 * @param transcript - The element containing the transcript text
 *
 * @example
 * ```ts
 * linkTranscript(video, document.querySelector('#episode-transcript')!);
 * ```
 */
export function linkTranscript(media: HTMLMediaElement, transcript: HTMLElement): void {
  if (!transcript.id) {
    transcript.id = `transcript-${Math.random().toString(36).slice(2, 9)}`;
  }
  const existing = media.getAttribute('aria-describedby');
  const ids = new Set(existing ? existing.split(/\s+/) : []);
  ids.add(transcript.id);
  media.setAttribute('aria-describedby', Array.from(ids).join(' '));
}
