import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server.js';
import { getRedirectUrl } from 'next/experimental/testing/server';
import { middleware } from '@/middleware';

describe('middleware redirect behaviour', () => {
  function createRequest(
    pathname: string,
    options?: { origin?: string; search?: string },
  ) {
    const origin = options?.origin ?? 'http://localhost:3000';
    const search = options?.search ?? '';
    return new NextRequest(`${origin}/${pathname}${search}`);
  }

  it('redirects non-localized paths to the detected locale', () => {
    const response = middleware(createRequest('foo'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/en/foo');
  });

  it('handles root paths', () => {
    const response = middleware(createRequest(''));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/en/blog');

    const response3 = middleware(createRequest('en'));
    expect(getRedirectUrl(response3)).toBe(null);

    const response4 = middleware(createRequest('en/blog'));
    expect(getRedirectUrl(response4)).toBe(null);
  });

  it('redirects bare paths with additional segments', () => {
    const response = middleware(createRequest('blog'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/en/blog');
  });

  it('does not redirect internals and static assets', () => {
    const response2 = middleware(createRequest('chunk.jpg'));
    expect(getRedirectUrl(response2)).toBe(null);
  });

  it('skips public files that match the PUBLIC_FILE regex', () => {
    const publicFiles = [
      'favicon.ico',
      'robots.txt',
      'images/logo.svg',
      'fonts/open-sans.woff2',
    ];

    for (const path of publicFiles) {
      const response = middleware(createRequest(path));
      expect(getRedirectUrl(response)).toBe(null);
    }
  });

  it('redirects legacy resources host URLs to first-party /r URLs', () => {
    const response = middleware(
      createRequest('en/blog/what-are-xstocks', {
        origin: 'https://r.namefi.io',
        search: '?utm=legacy',
      }),
    );
    expect(getRedirectUrl(response)).toBe(
      'https://namefi.io/r/en/blog/what-are-xstocks?utm=legacy',
    );
  });

  it('keeps /r-prefixed legacy resources host URLs on the same request host', () => {
    const response = middleware(
      createRequest('r/en/tld/able', {
        origin: 'https://r.namefi.io',
      }),
    );
    expect(getRedirectUrl(response)).toBe(null);
  });

  it('does not redirect legacy host when request is proxied from first-party host', () => {
    const response = middleware(
      new NextRequest('https://r.namefi.io/r/en/tld/able', {
        headers: {
          'x-forwarded-host': 'namefi.io',
        },
      }),
    );
    expect(getRedirectUrl(response)).toBe(null);
  });

  it('does not redirect legacy host when request is proxied from preview host', () => {
    const response = middleware(
      new NextRequest('https://r.namefi.dev/r/en/tld/able', {
        headers: {
          'x-forwarded-host': 'namefi-preview.vercel.app',
        },
      }),
    );
    expect(getRedirectUrl(response)).toBe(null);
  });

  it('accepts /r-prefixed paths when base path is present in pathname', () => {
    const response = middleware(createRequest('r/en/blog'));
    expect(getRedirectUrl(response)).toBe(null);
  });

  it('keeps /r prefix when redirecting /r root to localized blog index', () => {
    const response = middleware(createRequest('r'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/r/en/blog');
  });

  it('keeps /r prefix when localizing non-localized /r paths', () => {
    const response = middleware(createRequest('r/foo'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/r/en/foo');
  });
});
