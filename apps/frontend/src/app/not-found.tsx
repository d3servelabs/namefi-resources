'use client';

import { Button } from '@/components/ui/shadcn/button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <h2 className="mb-4 text-2xl">Page Not Found</h2>
      <p className="mb-8 text-muted-foreground">
        Oops! The page you&#39;re looking for doesn&#39;t exist.
      </p>
      <Button render={<Link href="/" />} nativeButton={false}>
        Go to Home Page
      </Button>
    </div>
  );
}
