'use client';

/**
 * Audio cue for fresh notifications. Played by the watcher hook on
 * count rise *only if* the rising set contains a notification at
 * `'normal'` priority or higher (see
 * `isAudibleNotificationPriority`). Best-effort: browsers block
 * autoplay until the user has interacted with the page, so the first
 * audible rise after a hard load may be silent. Subsequent rises
 * play as soon as the user has clicked anywhere (including the bell).
 */

const AUDIO_SRC = '/audio/blop-boop.wav';

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (audio) return audio;
  try {
    audio = new Audio(AUDIO_SRC);
    audio.preload = 'auto';
    return audio;
  } catch {
    return null;
  }
}

export function playNewNotificationSound(): void {
  const a = getAudio();
  if (!a) return;
  try {
    a.currentTime = 0;
    const result = a.play();
    if (result && typeof result.catch === 'function') {
      void result.catch(() => {
        // Autoplay blocked — silent until the next user gesture.
      });
    }
  } catch {
    /* swallow */
  }
}
