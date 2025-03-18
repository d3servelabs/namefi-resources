'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import { TriangleIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Alert variant="destructive" className="mb-6 w-full max-w-md">
        <TriangleIcon className="size-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Something went wrong!'}
        </AlertDescription>
      </Alert>
      <div className="mb-6 text-center">
        <h2 className="mb-2 text-2xl font-bold">Oops! An error occurred</h2>
        <div className="mb-4 text-gray-600">
          Don&#39;t worry, we&#39;re on it. In the meantime, you can try again
          or go back to the homepage.
        </div>
        {error.digest && (
          <div className="text-sm text-gray-500">Error ID: {error.digest}</div>
        )}
      </div>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        <Button onClick={() => router.push('/')} variant="outline">
          Go to Homepage
        </Button>
      </div>
    </div>
  );
}
