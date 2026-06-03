import { describe, expect, it } from 'vitest';

import { upsertLeadgenRunByCreatedDesc } from './leadgen-run-order';

type Run = {
  id: string;
  createdAt: Date;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED';
};

function run(id: string, createdAt: string): Run {
  return {
    id,
    createdAt: new Date(createdAt),
    status: 'RUNNING',
  };
}

describe('upsertLeadgenRunByCreatedDesc', () => {
  it('keeps an older updated run behind the newer run', () => {
    const newest = run('newest', '2026-06-03T10:05:00Z');
    const older = run('older', '2026-06-03T10:00:00Z');

    const ordered = upsertLeadgenRunByCreatedDesc({
      runs: [newest, older],
      run: { ...older, status: 'SUCCEEDED' },
      limit: 12,
    });

    expect(ordered.map((item) => item.id)).toEqual(['newest', 'older']);
    expect(ordered[1]?.status).toBe('SUCCEEDED');
  });

  it('inserts a newly created run at the top', () => {
    const newest = run('newest', '2026-06-03T10:10:00Z');
    const older = run('older', '2026-06-03T10:05:00Z');

    const ordered = upsertLeadgenRunByCreatedDesc({
      runs: [older],
      run: newest,
      limit: 12,
    });

    expect(ordered.map((item) => item.id)).toEqual(['newest', 'older']);
  });
});
