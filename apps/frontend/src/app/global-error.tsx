'use client';

import { reportAppRouterError } from '@/lib/datadog-react-error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportAppRouterError('app/global-error.tsx', error, {
      fatalBoundary: 'root',
    });
  }, [error]);

  return (
    <html lang="en" className="dark h-full" suppressHydrationWarning={true}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <h1 className="mb-2 text-5xl font-bold tracking-tight">500</h1>
          <h2 className="mb-2 text-xl font-semibold">Server Error</h2>
          <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
            Our hamsters need a coffee break.
          </p>
          {error.digest && (
            <p className="mb-6 text-xs text-muted-foreground/60">
              Reference: {error.digest}
            </p>
          )}
          <div className="flex gap-3">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={() => reset()}
              type="button"
            >
              Try Again
            </button>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium"
              href="/"
            >
              Go to Homepage
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
