'use client';

import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { config } from '@/lib/env';
import { useTRPC } from '@/lib/trpc';
import { getAccessToken } from '@privy-io/react-auth';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { AlertTriangle, ServerCrash, Webhook } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// Keep in sync with the skip-auth storage key used by the tRPC client
// (apps/frontend/src/components/providers/trpc.tsx) and use-skip-auth.ts.
const SKIP_AUTH_STORAGE_KEY = 'namefi-skip-auth';

function isSkipAuthActive(): boolean {
  if (typeof window === 'undefined') return false;
  const environment = config.TYPE;
  const isDevEnvironment =
    environment === 'local' ||
    environment === 'development' ||
    environment === 'preview';
  if (!isDevEnvironment) return false;
  try {
    return window.localStorage.getItem(SKIP_AUTH_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Build auth headers for a raw request to the backend Hono routes, mirroring
 * the tRPC client: send `X-Skip-Auth` in dev when skip-auth is active,
 * otherwise attach the Privy bearer token.
 */
async function buildHonoHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (isSkipAuthActive()) {
    headers['X-Skip-Auth'] = '1';
    return headers;
  }

  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function AdminCrashTestingPage() {
  const trpc = useTRPC();
  const [shouldCrash, setShouldCrash] = useState<Date | boolean | null>(null);
  const [honoPending, setHonoPending] = useState<number | null>(null);

  const testFailureMutation = useMutation(
    trpc.admin.testFailure.mutationOptions({
      onError: (error) => {
        toast.error(`tRPC error received: ${error.message}`);
      },
      onSuccess: () => {
        // Should never happen — the endpoint always throws.
        toast.message('tRPC endpoint unexpectedly succeeded');
      },
    }),
  );

  async function triggerHonoFailure(errorType: number) {
    setHonoPending(errorType);
    try {
      const response = await fetch(
        `${config.BACKEND_URL}/test-failure?errorType=${errorType}`,
        {
          method: 'GET',
          headers: await buildHonoHeaders(),
          credentials: 'include',
        },
      );
      toast.error(
        `Hono responded with ${response.status} ${response.statusText}`,
      );
    } catch (error) {
      toast.error(
        `Hono request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setHonoPending(null);
    }
  }

  if (shouldCrash) {
    throw new Error(
      `${shouldCrash instanceof Date ? `[${shouldCrash}]` : ''}Admin crash test: intentional fatal client crash for observability verification.`,
    );
  }

  return (
    <PageShell padding="admin" className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Crash Testing</h1>
        <p className="text-muted-foreground">
          Trigger an intentional fatal crash to verify error reporting, stack
          traces, and sourcemap symbolication end to end.
        </p>
      </div>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Fatal Crash Trigger
          </CardTitle>
          <CardDescription>
            This action intentionally throws during render and should route to
            the app error boundary.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShouldCrash(true)}
          >
            Trigger Fatal Crash
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShouldCrash(new Date())}
          >
            Trigger Fatal Crash With Timestamp in Title
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerCrash className="h-5 w-5 text-destructive" />
            tRPC Server Error Trigger
          </CardTitle>
          <CardDescription>
            Calls <code className="text-xs">admin.testFailure</code> which
            throws a tRPC error. Verifies the tRPC errorFormatter →
            Slack/Datadog HTTP alert pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="destructive"
            disabled={testFailureMutation.isPending}
            onClick={() => testFailureMutation.mutate({ code: 'BAD_REQUEST' })}
          >
            Trigger tRPC 400 (BAD_REQUEST)
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={testFailureMutation.isPending}
            onClick={() =>
              testFailureMutation.mutate({ code: 'INTERNAL_SERVER_ERROR' })
            }
          >
            Trigger tRPC 500 (INTERNAL_SERVER_ERROR)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-destructive" />
            Hono Server Error Trigger
          </CardTitle>
          <CardDescription>
            Calls the backend <code className="text-xs">/test-failure</code>{' '}
            Hono route which throws an{' '}
            <code className="text-xs">HTTPException</code>. Verifies the Hono
            onError → Slack/Datadog HTTP alert pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="destructive"
            disabled={honoPending !== null}
            onClick={() => triggerHonoFailure(400)}
          >
            Trigger Hono 400
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={honoPending !== null}
            onClick={() => triggerHonoFailure(500)}
          >
            Trigger Hono 500
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export default withAdminGuard(AdminCrashTestingPage);
