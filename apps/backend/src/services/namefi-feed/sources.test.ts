import { describe, expect, it } from 'vitest';
import {
  buildNamefiFeedAdminSources,
  readNamefiFeedEnabledSourcesFromMetadata,
} from './sources';

describe('Namefi feed sources', () => {
  it('defaults missing source metadata to all auto scan sources enabled', () => {
    expect(readNamefiFeedEnabledSourcesFromMetadata({})).toEqual([
      'x',
      'namepros',
      'dnforum',
    ]);
  });

  it('preserves an explicit empty enabled source list', () => {
    expect(
      readNamefiFeedEnabledSourcesFromMetadata({ enabledSources: [] }),
    ).toEqual([]);
  });

  it('normalizes invalid and duplicate source ids', () => {
    expect(
      readNamefiFeedEnabledSourcesFromMetadata({
        enabledSources: ['namepros', 'invalid', 'namepros', 'dnforum'],
      }),
    ).toEqual(['namepros', 'dnforum']);
  });

  it('builds admin source rows from enabled source ids', () => {
    expect(
      buildNamefiFeedAdminSources(['x']).map(({ id, enabled }) => ({
        id,
        enabled,
      })),
    ).toEqual([
      { id: 'x', enabled: true },
      { id: 'namepros', enabled: false },
      { id: 'dnforum', enabled: false },
    ]);
  });
});
