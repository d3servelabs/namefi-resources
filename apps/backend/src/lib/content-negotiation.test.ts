import { describe, expect, it } from 'vitest';
import {
  acceptIncludesHtml,
  acceptOnlyHtml,
  isBrowserUserAgent,
  parseAcceptMediaTypes,
} from './content-negotiation';

describe('parseAcceptMediaTypes', () => {
  it('returns an empty array when the header is absent', () => {
    expect(parseAcceptMediaTypes(undefined)).toEqual([]);
    expect(parseAcceptMediaTypes('')).toEqual([]);
  });

  it('splits, lowercases, and strips quality/params', () => {
    expect(
      parseAcceptMediaTypes(
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ),
    ).toEqual(['text/html', 'application/xhtml+xml', 'application/xml', '*/*']);
  });

  it('trims whitespace and ignores empty entries', () => {
    expect(parseAcceptMediaTypes('  TEXT/HTML ,, application/json ')).toEqual([
      'text/html',
      'application/json',
    ]);
  });
});

describe('acceptIncludesHtml', () => {
  it('is true when an HTML media type is present', () => {
    expect(acceptIncludesHtml(['application/json', 'text/html'])).toBe(true);
    expect(acceptIncludesHtml(['application/xhtml+xml'])).toBe(true);
  });

  it('is false when no HTML media type is present', () => {
    expect(acceptIncludesHtml(['application/json', '*/*'])).toBe(false);
    expect(acceptIncludesHtml([])).toBe(false);
  });
});

describe('acceptOnlyHtml', () => {
  it('is true when every media type is HTML', () => {
    expect(acceptOnlyHtml(['text/html'])).toBe(true);
    expect(acceptOnlyHtml(['text/html', 'application/xhtml+xml'])).toBe(true);
  });

  it('is false when any non-HTML media type is present', () => {
    expect(acceptOnlyHtml(['text/html', '*/*'])).toBe(false);
    expect(acceptOnlyHtml(['application/json'])).toBe(false);
  });

  it('is false for an empty list', () => {
    expect(acceptOnlyHtml([])).toBe(false);
  });
});

describe('isBrowserUserAgent', () => {
  it('recognizes common browser user-agents', () => {
    expect(
      isBrowserUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      ),
    ).toBe(true);
    expect(
      isBrowserUserAgent(
        'Mozilla/5.0 (Windows NT 10.0) Gecko/20100101 Firefox/125.0',
      ),
    ).toBe(true);
  });

  it('treats CLI/programmatic agents as non-browsers', () => {
    expect(isBrowserUserAgent('curl/8.4.0')).toBe(false);
    expect(isBrowserUserAgent('Wget/1.21.4')).toBe(false);
    expect(isBrowserUserAgent('node')).toBe(false);
  });

  it('is false when the user-agent is absent', () => {
    expect(isBrowserUserAgent(undefined)).toBe(false);
    expect(isBrowserUserAgent('')).toBe(false);
  });
});
