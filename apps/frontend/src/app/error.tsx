'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { reportAppRouterError } from '@/lib/datadog-react-error';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageShell } from '@/components/page-shell';
import { TRPCClientError } from '@trpc/client';
import Link from 'next/link';

function getStatusCode(error: Error): number {
  if (error instanceof TRPCClientError) {
    const httpStatus = error.data?.httpStatus;
    if (typeof httpStatus === 'number') return httpStatus;
  }
  return 500;
}

function getRequestId(error: Error): string | undefined {
  if (error instanceof TRPCClientError) {
    return error.data?.requestId as string | undefined;
  }
  return undefined;
}

function ErrorContent403({ requestId }: { requestId: string | undefined }) {
  return (
    <>
      <Image
        src="/assets/errors/error-403-v3.svg"
        alt=""
        width={200}
        height={200}
        className="mb-6"
      />
      <h1 className="mb-2 text-5xl font-bold tracking-tight">403</h1>
      <h2 className="mb-2 text-xl font-semibold">Access Denied</h2>
      <p className="mb-8 max-w-sm text-center text-muted-foreground">
        This door is locked. Try your key.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button render={<Link href="/login" />} nativeButton={false}>
          Log In
        </Button>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
        >
          Go to Homepage
        </Button>
      </div>
      {requestId && (
        <p className="mt-8 text-xs text-muted-foreground/60">
          Reference: {requestId}
        </p>
      )}
    </>
  );
}

function ErrorContent404({ requestId }: { requestId: string | undefined }) {
  return (
    <>
      <Image
        src="/assets/errors/error-404-v3.svg"
        alt=""
        width={200}
        height={200}
        className="mb-6"
      />
      <h1 className="mb-2 text-5xl font-bold tracking-tight">404</h1>
      <h2 className="mb-2 text-xl font-semibold">Not Found</h2>
      <p className="mb-8 max-w-sm text-center text-muted-foreground">
        We looked everywhere. Under the couch too.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button render={<Link href="/" />} nativeButton={false}>
          Go to Homepage
        </Button>
        <Button
          render={<Link href="/search" />}
          nativeButton={false}
          variant="outline"
        >
          Search Domains
        </Button>
      </div>
      {requestId && (
        <p className="mt-8 text-xs text-muted-foreground/60">
          Reference: {requestId}
        </p>
      )}
    </>
  );
}

function ErrorContent400({ requestId }: { requestId: string | undefined }) {
  return (
    <>
      <Image
        src="/assets/errors/error-400-v1.svg"
        alt=""
        width={200}
        height={200}
        className="mb-6"
      />
      <h1 className="mb-2 text-5xl font-bold tracking-tight">400</h1>
      <h2 className="mb-2 text-xl font-semibold">Bad Request</h2>
      <p className="mb-8 max-w-sm text-center text-muted-foreground">
        Something got lost in translation.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button render={<Link href="/login" />} nativeButton={false}>
          Log In
        </Button>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
        >
          Go to Homepage
        </Button>
      </div>
      {requestId && (
        <p className="mt-8 text-xs text-muted-foreground/60">
          Reference: {requestId}
        </p>
      )}
    </>
  );
}

function ErrorContent500({
  requestId,
  reset,
}: {
  requestId: string | undefined;
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <>
      <Image
        src="/assets/errors/error-500-v3.svg"
        alt=""
        width={200}
        height={200}
        className="mb-6"
      />
      <h1 className="mb-2 text-5xl font-bold tracking-tight">500</h1>
      <h2 className="mb-2 text-xl font-semibold">Server Error</h2>
      <p className="mb-8 max-w-sm text-center text-muted-foreground">
        Our hamsters need a coffee break.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button onClick={() => router.push('/')} variant="outline">
          Go to Homepage
        </Button>
      </div>
      {requestId && (
        <p className="mt-8 text-xs text-muted-foreground/60">
          Reference: {requestId}
        </p>
      )}
    </>
  );
}

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const statusCode = getStatusCode(error);
  const requestId = getRequestId(error) ?? error.digest;
  const is4xx = statusCode >= 400 && statusCode < 500;
  const is5xx = statusCode >= 500 && statusCode < 600;

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
      className="flex min-h-[50svh] flex-col items-center justify-center"
    >
      {statusCode === 403 && <ErrorContent403 requestId={requestId} />}
      {statusCode === 404 && <ErrorContent404 requestId={requestId} />}
      {is4xx && statusCode !== 403 && statusCode !== 404 && (
        <ErrorContent400 requestId={requestId} />
      )}
      {(is5xx || statusCode < 400 || statusCode >= 600) && (
        <ErrorContent500 requestId={requestId} reset={reset} />
      )}
    </PageShell>
  );
}
