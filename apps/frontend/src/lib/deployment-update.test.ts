import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BUILD_ID_ENDPOINT,
  UNKNOWN_BUILD_ID,
  fetchBuildId,
  isKnownBuildId,
  shouldPromptReload,
} from './deployment-update';

describe('isKnownBuildId', () => {
  it('treats a real commit sha as known', () => {
    expect(isKnownBuildId('a1b2c3d4')).toBe(true);
  });

  it.each([
    undefined,
    null,
    '',
    UNKNOWN_BUILD_ID,
  ])('treats %p as unknown', (value) => {
    expect(isKnownBuildId(value)).toBe(false);
  });
});

describe('shouldPromptReload', () => {
  it('prompts when both ids are known and differ', () => {
    expect(shouldPromptReload('old-sha', 'new-sha')).toBe(true);
  });

  it('does not prompt when both ids are known and equal', () => {
    expect(shouldPromptReload('same-sha', 'same-sha')).toBe(false);
  });

  it.each([
    ['unknown current', UNKNOWN_BUILD_ID, 'new-sha'],
    ['unknown latest', 'old-sha', UNKNOWN_BUILD_ID],
    ['both unknown', UNKNOWN_BUILD_ID, UNKNOWN_BUILD_ID],
    ['undefined current', undefined, 'new-sha'],
    ['undefined latest', 'old-sha', undefined],
    ['null latest', 'old-sha', null],
    ['empty latest', 'old-sha', ''],
  ] as const)('does not prompt: %s', (_label, current, latest) => {
    expect(shouldPromptReload(current, latest)).toBe(false);
  });
});

describe('fetchBuildId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the build id from a successful response, bypassing caches', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'deadbeef' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchBuildId()).resolves.toBe('deadbeef');
    expect(fetchMock).toHaveBeenCalledWith(
      BUILD_ID_ENDPOINT,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('throws when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(fetchBuildId()).rejects.toThrow('503');
  });

  it('forwards the abort signal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ buildId: 'x' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    await fetchBuildId(controller.signal);
    expect(fetchMock).toHaveBeenCalledWith(
      BUILD_ID_ENDPOINT,
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});
