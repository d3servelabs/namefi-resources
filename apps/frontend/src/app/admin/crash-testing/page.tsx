'use client';

import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

function AdminCrashTestingPage() {
  const [shouldCrash, setShouldCrash] = useState<Date | boolean | null>(null);

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
        <CardContent>
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
    </PageShell>
  );
}

export default withAdminGuard(AdminCrashTestingPage);
