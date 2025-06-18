import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  const baseUrl = host ? `https://${host}` : 'https://namefi.dev';
  const body = `User-agent: *
  Disallow:
  Sitemap: ${baseUrl}/sitemap.xml
  `;
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
