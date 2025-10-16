import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server.js';
import { getRedirectUrl } from 'next/experimental/testing/server';
import { middleware } from '@/middleware';

describe('middleware redirect behaviour', () => {
  function createRequest(pathname: string) {
    return new NextRequest(`http://localhost:3000${pathname}`);
  }

  it('redirects non-localized paths to the detected locale under /r', () => {
    const response = middleware(createRequest('/foo'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/r/en/foo');
  });

  it('handles root and bare /r paths', () => {
    const response = middleware(createRequest('/'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/r/en');

    const response2 = middleware(createRequest('/r'));
    expect(getRedirectUrl(response2)).toBe('http://localhost:3000/r/en');

    const response3 = middleware(createRequest('/r/en'));
    expect(getRedirectUrl(response3)).toBe(null);

    const response4 = middleware(createRequest('/r/en/blog'));
    expect(getRedirectUrl(response4)).toBe(null);
  });

  it('redirects bare /r paths with additional segments', () => {
    const response = middleware(createRequest('/r/blog'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/r/en/blog');
  });

  it('does not redirect internals and static assets', () => {
    const response2 = middleware(createRequest('/chunk.jpg'));
    expect(getRedirectUrl(response2)).toBe(null);
  });

  it('skips public files that match the PUBLIC_FILE regex', () => {
    const publicFiles = [
      '/favicon.ico',
      '/robots.txt',
      '/images/logo.svg',
      '/fonts/open-sans.woff2',
    ];

    for (const path of publicFiles) {
      const response = middleware(createRequest(path));
      expect(getRedirectUrl(response)).toBe(null);
    }
  });
});
