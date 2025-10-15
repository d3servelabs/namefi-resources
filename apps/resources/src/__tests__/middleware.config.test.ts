import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server.js';
import { getRedirectUrl } from 'next/experimental/testing/server';
import { middleware } from '@/middleware';

describe('middleware redirect behaviour', () => {
  function createRequest(pathname: string) {
    return new NextRequest(`http://localhost:3000${pathname}`);
  }

  it('redirects non-localized paths to the detected locale', () => {
    const response = middleware(createRequest('/foo'));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/en/foo');
  });

  it('handles root paths', () => {
    const response = middleware(createRequest(''));
    expect(getRedirectUrl(response)).toBe('http://localhost:3000/en');

    const response2 = middleware(createRequest('/en'));
    expect(getRedirectUrl(response2)).toBe(null);
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
