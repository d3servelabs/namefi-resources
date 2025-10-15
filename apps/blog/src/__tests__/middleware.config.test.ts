import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server.js';
import {
  unstable_doesMiddlewareMatch,
  getRedirectUrl,
} from 'next/experimental/testing/server';

import { i18n } from '@/i18n-config';
import { config, middleware } from '@/middleware';

const nextConfig = {
  i18n: {
    locales: i18n.locales,
    defaultLocale: i18n.defaultLocale,
  },
} as const;

function matches(url: string) {
  return unstable_doesMiddlewareMatch({
    config,
    nextConfig,
    url,
  });
}

describe('middleware config matcher (experimental utilities)', () => {
  it('executes for root and standard routes', () => {
    expect(matches('http://localhost:3000/')).toBe(true);
    expect(matches('http://localhost:3000/about')).toBe(true);
    expect(matches('http://localhost:3000/blog/post')).toBe(true);
  });

  it('skips locale-prefixed routes', () => {
    for (const locale of i18n.locales) {
      expect(matches(`/${locale}`)).toBe(false);
      expect(matches(`/${locale}/page`)).toBe(false);
    }
  });

  it('skips Next internals and static assets', () => {
    expect(matches('http://localhost:3000/api/hello')).toBe(false);
    expect(matches('http://localhost:3000/_next/static/chunk.js')).toBe(false);
    expect(matches('http://localhost:3000/_next/image')).toBe(false);
    expect(matches('http://localhost:3000/_next/data/build-id/page.json')).toBe(
      false,
    );
    expect(matches('http://localhost:3000/_vercel/status')).toBe(false);
    expect(matches('http://localhost:3000/styles/site.css')).toBe(false);
    expect(matches('http://localhost:3000/favicon.ico')).toBe(false);
  });

  it('matches nested application routes', () => {
    expect(matches('http://localhost:3000/products/featured')).toBe(true);
    expect(matches('http://localhost:3000/docs/guides/getting-started')).toBe(
      true,
    );
    expect(matches('http://localhost:3000/blog/2024/launch')).toBe(true);
  });

  it('skips additional public-file extensions', () => {
    expect(matches('http://localhost:3000/image.png')).toBe(false);
    expect(matches('http://localhost:3000/assets/app.css')).toBe(false);
    expect(matches('http://localhost:3000/scripts/app.mjs')).toBe(false);
    expect(matches('http://localhost:3000/documents/whitepaper.pdf')).toBe(
      false,
    );
  });
});

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
    const response = middleware(createRequest('/api/hello'));
    expect(getRedirectUrl(response)).toBe(null);

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
