import { describe, expect, it } from 'vitest';

import {
  decodeOutboundCursor,
  encodeOutboundCursor,
  paginateOutboundRows,
} from './pagination';
import {
  serializeOutboundLeadDetail,
  serializeOutboundLeadSummary,
  serializeOutboundRun,
} from './serialization';

describe('outbound serialization', () => {
  const createdAt = new Date('2026-06-05T10:00:00.000Z');
  const updatedAt = new Date('2026-06-05T10:05:00.000Z');

  it('serializes active runs with polling guidance and compact status fields', () => {
    expect(
      serializeOutboundRun({
        run: {
          id: '7d6e7c8a-c20a-45e1-9128-70288f2ed8d0',
          domain: 'example.com',
          status: 'RUNNING',
          reasoningEffort: 'medium',
          leadCount: 3,
          contactCount: 1,
          draftCount: 0,
          summary: '  researching likely buyers  ',
          errorMessage: null,
          createdAt,
          updatedAt,
          startedAt: createdAt,
          finishedAt: null,
        },
        latestMessage: '  Found early buyer signals  ',
      }),
    ).toEqual({
      id: '7d6e7c8a-c20a-45e1-9128-70288f2ed8d0',
      domain: 'example.com',
      status: 'RUNNING',
      reasoningEffort: 'medium',
      leadCount: 3,
      contactCount: 1,
      draftCount: 0,
      summary: 'researching likely buyers',
      latestMessage: 'Found early buyer signals',
      errorMessage: null,
      pollAfterSeconds: 2,
      createdAt,
      updatedAt,
      startedAt: createdAt,
      finishedAt: null,
    });
  });

  it('does not expose internal lead ranking fields in summaries', () => {
    const summary = serializeOutboundLeadSummary({
      lead: {
        id: '3b38d860-b397-4f63-b719-9c8773403948',
        businessDomain: 'buyer.example',
        status: 'contact_now',
        contactReadiness: 'contact_found',
        rationale: '  Uses a similar brand and may benefit from the domain. ',
        content: 'fallback content',
      },
      contactCount: 2,
      draftCount: 1,
    });

    expect(summary).toEqual({
      id: '3b38d860-b397-4f63-b719-9c8773403948',
      businessDomain: 'buyer.example',
      status: 'contact_now',
      contactReadiness: 'contact_found',
      buyerSummary: 'Uses a similar brand and may benefit from the domain.',
      contactCount: 2,
      draftCount: 1,
    });
    expect(summary).not.toHaveProperty('rank');
    expect(summary).not.toHaveProperty('score');
  });

  it('normalizes detail text without exposing contact or draft internals', () => {
    const detail = serializeOutboundLeadDetail({
      lead: {
        id: '3b38d860-b397-4f63-b719-9c8773403948',
        businessDomain: 'buyer.example',
        status: 'validate_first',
        contactReadiness: 'generic_fallback',
        rationale: '  Strong buyer rationale. ',
        content: ' Long context. ',
      },
      contacts: [
        {
          email: 'founder@buyer.example',
          name: '  Pat Founder ',
          title: 'CEO',
          sourceUrl: 'https://buyer.example/about',
          context: '  listed on company site ',
        },
      ],
      drafts: [
        {
          contactEmail: 'founder@buyer.example',
          subject: '  Domain opportunity ',
          fullEmail: '  Hello Pat, ... ',
        },
      ],
    });

    expect(detail.contacts).toEqual([
      {
        email: 'founder@buyer.example',
        name: 'Pat Founder',
        title: 'CEO',
        sourceUrl: 'https://buyer.example/about',
        context: 'listed on company site',
      },
    ]);
    expect(detail.drafts).toEqual([
      {
        contactEmail: 'founder@buyer.example',
        subject: 'Domain opportunity',
        fullEmail: 'Hello Pat, ...',
      },
    ]);
    expect(detail.contacts[0]).not.toHaveProperty('id');
    expect(detail.drafts[0]).not.toHaveProperty('id');
  });
});

describe('outbound pagination', () => {
  it('returns an opaque next cursor when more rows are available', () => {
    const result = paginateOutboundRows(['a', 'b', 'c'], {
      limit: 2,
      cursor: undefined,
    });

    expect(result.items).toEqual(['a', 'b']);
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(decodeOutboundCursor(result.nextCursor ?? undefined)).toBe(2);
  });

  it('returns a null next cursor on the final page', () => {
    expect(
      paginateOutboundRows(['c'], {
        limit: 2,
        cursor: undefined,
      }),
    ).toEqual({
      items: ['c'],
      nextCursor: null,
    });
  });

  it('rejects cursors outside the supported offset range', () => {
    expect(() => decodeOutboundCursor(encodeOutboundCursor(100_001))).toThrow();
  });
});
