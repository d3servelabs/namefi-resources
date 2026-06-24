import { NextResponse } from 'next/server';

export function GET(request: Request) {
  return NextResponse.redirect(new URL('/r/en/brand-kit', request.url), 307);
}
