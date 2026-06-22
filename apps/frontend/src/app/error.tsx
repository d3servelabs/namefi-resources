'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useTranslations } from 'next-intl';
import { reportAppRouterError } from '@/lib/datadog-react-error';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageShell } from '@/components/page-shell';
import { TRPCClientError } from '@trpc/client';
import Link from 'next/link';
import { ErrorHelpLinks } from '@/components/error-help-links';
import { useLogin } from '@/hooks/use-login';
import { toast } from 'sonner';

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

function ErrorReference({ requestId }: { requestId: string | undefined }) {
  const t = useTranslations('error');
  if (!requestId) return null;
  return (
    <p className="mt-8 text-xs text-muted-foreground/60">
      {t('reference', { requestId })}
    </p>
  );
}

function ErrorContent403({ requestId }: { requestId: string | undefined }) {
  const t = useTranslations('error');
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
      <h2
        className="mb-2 text-xl font-semibold"
        data-testid="error.status403.title"
      >
        {t('status403.title')}
      </h2>
      <p
        className="mb-8 max-w-sm text-center text-muted-foreground"
        data-testid="error.status403.message"
      >
        {t('status403.description')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <LoginButton />
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          data-testid="error.status403.go-home-button"
        >
          {t('actions.goHome')}
        </Button>
      </div>
      <ErrorReference requestId={requestId} />
    </>
  );
}

function ErrorContent404({ requestId }: { requestId: string | undefined }) {
  const t = useTranslations('error');
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
      <h2
        className="mb-2 text-xl font-semibold"
        data-testid="error.status404.title"
      >
        {t('status404.title')}
      </h2>
      <p
        className="mb-8 max-w-sm text-center text-muted-foreground"
        data-testid="error.status404.message"
      >
        {t('status404.description')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          data-testid="error.status404.go-home-button"
        >
          {t('actions.goHome')}
        </Button>
        <Button
          render={<Link href="/#domain-search" />}
          nativeButton={false}
          variant="outline"
          data-testid="error.status404.search-domains-button"
        >
          {t('actions.searchDomains')}
        </Button>
      </div>
      <ErrorReference requestId={requestId} />
    </>
  );
}

function ErrorContent400({ requestId }: { requestId: string | undefined }) {
  const t = useTranslations('error');
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
      <h2
        className="mb-2 text-xl font-semibold"
        data-testid="error.status400.title"
      >
        {t('status400.title')}
      </h2>
      <p
        className="mb-8 max-w-sm text-center text-muted-foreground"
        data-testid="error.status400.message"
      >
        {t('status400.description')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <LoginButton />
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          data-testid="error.status400.go-home-button"
        >
          {t('actions.goHome')}
        </Button>
      </div>
      <ErrorReference requestId={requestId} />
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
  const t = useTranslations('error');
  const tCommon = useTranslations('common');
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
      <h2
        className="mb-2 text-xl font-semibold"
        data-testid="error.status500.title"
      >
        {t('status500.title')}
      </h2>
      <p
        className="mb-8 max-w-sm text-center text-muted-foreground"
        data-testid="error.status500.message"
      >
        {t('status500.description')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          onClick={() => reset()}
          data-testid="error.status500.retry-button"
        >
          {tCommon('actions.tryAgain')}
        </Button>
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          data-testid="error.status500.go-home-button"
        >
          {t('actions.goHome')}
        </Button>
      </div>
      <ErrorReference requestId={requestId} />
    </>
  );
}

function LoginButton() {
  const t = useTranslations('error');
  const { login } = useLogin();

  return (
    <Button
      onClick={() => {
        void login().catch((error) => {
          toast.error(t('login.failedTitle'), {
            description:
              error instanceof Error
                ? error.message
                : t('login.failedDescription'),
          });
        });
      }}
      data-testid="error.login-button"
    >
      {t('actions.logIn')}
    </Button>
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

  useEffect(() => {
    reportAppRouterError('app/error.tsx', error, {
      pathname,
      fatalBoundary: 'segment',
    });
  }, [error, pathname]);

  const renderContent = () => {
    if (statusCode === 403) return <ErrorContent403 requestId={requestId} />;
    if (statusCode === 404) return <ErrorContent404 requestId={requestId} />;
    if (statusCode >= 400 && statusCode < 500)
      return <ErrorContent400 requestId={requestId} />;
    return <ErrorContent500 requestId={requestId} reset={reset} />;
  };

  return (
    <PageShell
      padding="none"
      shellClassName="px-4 py-6 sm:px-8 sm:py-8"
      className="flex min-h-[50svh] flex-col items-center justify-center"
    >
      {renderContent()}
      <ErrorHelpLinks />
    </PageShell>
  );
}
