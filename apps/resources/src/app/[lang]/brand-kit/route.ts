// biome-ignore lint/correctness/noNodejsModules: route serves the static brand kit from the resources content submodule.
import fs from 'node:fs/promises';
// biome-ignore lint/correctness/noNodejsModules: route serves the static brand kit from the resources content submodule.
import path from 'node:path';
import { NextResponse } from 'next/server';
import { i18n, type Locale } from '../../../i18n-config';

const BRAND_KIT_HTML = path.join(
  process.cwd(),
  'data',
  'static',
  'brand-kit',
  'index.html',
);

function isLocale(value: string): value is Locale {
  return i18n.locales.includes(value as Locale);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  if (!isLocale(lang)) {
    return NextResponse.redirect(new URL('/r/en/brand-kit', _request.url), 307);
  }

  const html = await fs.readFile(BRAND_KIT_HTML, 'utf8');
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
