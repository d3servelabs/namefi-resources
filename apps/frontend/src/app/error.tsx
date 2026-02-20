'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import { reportAppRouterError } from '@/lib/datadog-react-error';
import { TriangleIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageShell } from '@/components/page-shell';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    reportAppRouterError('app/error.tsx', error, {
      pathname,
      fatalBoundary: 'segment',
    });
  }, [error, pathname]);

  return (
    <PageShell
      padding="none"
      shellClassName="px-4 py-6 sm:px-8 sm:py-8"
      className="flex min-h-[50svh] flex-col items-center justify-center gap-6"
    >
      <Alert variant="destructive" className="w-full max-w-md">
        <TriangleIcon className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Something went wrong!'}
        </AlertDescription>
      </Alert>
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Oops! An error occurred</h2>
        <div className="mb-4 text-muted-foreground">
          Don&#39;t worry, we&#39;re on it. In the meantime, you can try again
          or go back to the homepage.
        </div>
        {error.digest && (
          <div className="text-sm text-muted-foreground">
            Error ID: {error.digest}
          </div>
        )}
      </div>
      <div className="flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        <Button onClick={() => router.push('/')} variant="outline">
          Go to Homepage
        </Button>
      </div>
    </PageShell>
  );
}
