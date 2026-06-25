import { describe, expect, it } from 'vitest';
import {
  createVersionInfo,
  formatVersionStamp,
  normalizeCommitDate,
  normalizeVersion,
} from './version-info';

describe('version-info', () => {
  it('normalizes package versions with a v prefix', () => {
    expect(normalizeVersion('3.5.8')).toBe('v3.5.8');
    expect(normalizeVersion('v3.5.8-beta.1')).toBe('v3.5.8-beta.1');
  });

  it('normalizes commit dates to UTC ISO strings ending in Z', () => {
    expect(normalizeCommitDate('2026-06-25T11:13:26-07:00')).toBe(
      '2026-06-25T18:13:26.000Z',
    );
  });

  it('formats the public version stamp with a 6 character commit hash', () => {
    const versionInfo = createVersionInfo({
      version: '3.5.8',
      commitHash: 'e54def16207b86e812eb84a4d92212bce0934f8d',
      commitDate: '2026-06-25T11:13:26-07:00',
    });

    expect(versionInfo).toEqual({
      version: 'v3.5.8',
      commit_hash: 'e54def16207b86e812eb84a4d92212bce0934f8d',
      commit_date: '2026-06-25T18:13:26.000Z',
    });
    expect(formatVersionStamp(versionInfo)).toBe('v3.5.8-e54def-2026-06-25');
  });
});
