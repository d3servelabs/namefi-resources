'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Image
        src="/assets/errors/error-404-v3.svg"
        alt=""
        width={220}
        height={220}
        priority
        className="mb-6"
      />
      <h1 className="mb-2 text-5xl font-bold tracking-tight">404</h1>
      <h2 className="mb-2 text-xl font-semibold">Page Not Found</h2>
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
    </div>
  );
}
