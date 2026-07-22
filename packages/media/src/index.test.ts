// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  auditMedia,
  ensureAudioControl,
  findAutoplayingAudio,
  hasCaptions,
  isAutoplayingAudio,
  linkTranscript,
} from './index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('caption checks', () => {
  it('detects a captions or subtitles track with a source', () => {
    document.body.innerHTML = `
      <video id="cc"><track kind="captions" src="cc.vtt" /></video>
      <video id="none"></video>
      <video id="empty"><track kind="captions" /></video>
    `;
    expect(hasCaptions(document.querySelector('#cc')!)).toBe(true);
    expect(hasCaptions(document.querySelector('#none')!)).toBe(false);
    expect(hasCaptions(document.querySelector('#empty')!)).toBe(false);
  });
});

describe('autoplay audio', () => {
  it('flags autoplaying, audible media only', () => {
    const audible = document.createElement('audio');
    audible.autoplay = true;
    audible.muted = false;
    const muted = document.createElement('audio');
    muted.autoplay = true;
    muted.muted = true;
    document.body.append(audible, muted);

    expect(isAutoplayingAudio(audible)).toBe(true);
    expect(isAutoplayingAudio(muted)).toBe(false);
    expect(findAutoplayingAudio()).toEqual([audible]);
  });
});

describe('media audit', () => {
  it('reports missing captions, autoplay audio, and unreachable media', () => {
    document.body.innerHTML = '<video id="v"></video>';
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.muted = false;
    document.body.appendChild(audio);

    const issues = auditMedia().map((f) => f.issue);
    expect(issues).toContain('missing-captions'); // the video
    expect(issues).toContain('autoplay-audio'); // the audio
    expect(issues).toContain('missing-controls'); // the video (no controls, no autoplay)
  });
});

describe('remediation helpers', () => {
  it('injects a pause control for autoplaying media without controls', () => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.muted = false;
    // jsdom never truly plays, so model an actively-playing element.
    Object.defineProperty(audio, 'paused', { value: false, configurable: true });
    audio.play = vi.fn().mockResolvedValue(undefined);
    audio.pause = vi.fn();
    document.body.appendChild(audio);

    const control = ensureAudioControl(audio);
    expect(control).not.toBeNull();
    expect(audio.nextElementSibling).toBe(control!.button);
    expect(control!.button.textContent).toBe('Pause');

    control!.remove();
    expect(audio.nextElementSibling).toBeNull();
  });

  it('does nothing when the element already has controls', () => {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.muted = false;
    audio.controls = true;
    expect(ensureAudioControl(audio)).toBeNull();
  });

  it('associates a transcript through aria-describedby', () => {
    const video = document.createElement('video');
    const transcript = document.createElement('div');
    document.body.append(video, transcript);

    linkTranscript(video, transcript);

    expect(transcript.id).not.toBe('');
    expect(video.getAttribute('aria-describedby')).toBe(transcript.id);
  });
});
