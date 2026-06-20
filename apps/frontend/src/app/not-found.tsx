'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { ErrorHelpLinks } from '@/components/error-help-links';

export default function NotFoundPage() {
  const t = useTranslations('error');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Image
        src="/assets/errors/error-404-v3.svg"
        alt=""
        width={220}
        height={220}
        preload
        className="mb-6"
      />
      <h1 className="mb-2 text-5xl font-bold tracking-tight">404</h1>
      <h2 className="mb-2 text-xl font-semibold">{t('status404.title')}</h2>
      <p className="mb-8 max-w-sm text-center text-muted-foreground">
        {t('status404.description')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button render={<Link href="/" />} nativeButton={false}>
          {t('actions.goHome')}
        </Button>
        <Button
          render={<Link href="/#domain-search" />}
          nativeButton={false}
          variant="outline"
        >
          {t('actions.searchDomains')}
        </Button>
      </div>
      <ErrorHelpLinks />
    </div>
  );
}
