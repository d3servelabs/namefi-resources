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
        <main className="flex min-h-screen items-center justify-center px-4">
          <section className="w-full max-w-md rounded-lg border border-destructive/20 bg-card p-6 shadow-sm">
            <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
            <p className="mb-4 text-sm text-muted-foreground">
              A fatal error occurred and we captured diagnostics.
            </p>
            {error.digest && (
              <p className="mb-6 text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-3">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                onClick={() => reset()}
                type="button"
              >
                Try again
              </button>
              <a
                className="inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium"
                href="/"
              >
                Go to Homepage
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
