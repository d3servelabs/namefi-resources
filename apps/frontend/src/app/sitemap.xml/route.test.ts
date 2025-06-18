import type { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { DOMParser } from 'xmldom';
import { GET } from './route';

vi.mock('@/lib/blog-utils', () => ({
  getAllBlogPosts: () => [
    { lang: 'en', slug: 'foo-bar', lastmod: '2024-06-01' },
    { lang: 'zh', slug: 'foo-bar', lastmod: '2024-06-01' },
  ],
}));

// 可根据需要 mock getAllBlogPosts 或 fs

describe('sitemap.xml route', () => {
  it('should return valid sitemap xml with blog urls', async () => {
    // mock request with host header
    const request = {
      headers: {
        get: (key: string) => (key === 'host' ? 'test.com' : undefined),
      },
    } as unknown as NextRequest;

    const response = await GET(request);
    const text = await response.text();

    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(text).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(text).toContain('<urlset');
    expect(text).toContain('<loc>https://test.com/</loc>');
    expect(text).toContain('<loc>https://test.com/en/blog/foo-bar</loc>');
    expect(text).toContain('<loc>https://test.com/zh/blog/foo-bar</loc>');
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    const parseError = doc.getElementsByTagName('parsererror');
    expect(parseError.length).toBe(0);
  });
});
