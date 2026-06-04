'use client';

import { useState } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Permission } from '@namefi-astra/utils/permissions';
import { toast } from 'sonner';
import { AsyncButton } from '@/components/buttons/async-button';
import { PageShell } from '@/components/page-shell';
import { PermissionGate } from '@/components/access/PermissionGate';
import { withAdminGuard } from '@/components/admin/admin-guard';

/** The test-harness fail-signals wired into the DNSSEC workflows. */
const TEST_HARNESS_SIGNALS = [
  'test-harness:enable-dnssec:ds-association',
  'test-harness:disable-dnssec:ds-removal-status',
  'test-harness:disable-dnssec:ds-removal-propagation',
] as const;

export default withAdminGuard(function SendSignalPage() {
  const trpc = useTRPC();

  const [workflowId, setWorkflowId] = useState('');
  const [signalName, setSignalName] = useState('');
  const [reason, setReason] = useState('');

  const sendSignal = useMutation({
    ...trpc.admin.workflowSignal.sendSignal.mutationOptions(),
    onSuccess: (_data, variables) => {
      toast.success(`Sent ${variables.signalName} to ${variables.workflowId}`);
    },
    onError: (error) => {
      toast.error(`Failed to send signal: ${error.message}`);
    },
  });

  const submit = async () => {
    const id = workflowId.trim();
    const name = signalName.trim();
    if (!id || !name) {
      toast.error('Workflow id and signal name are required');
      return;
    }
    const trimmedReason = reason.trim();
    await sendSignal
      .mutateAsync({
        workflowId: id,
        signalName: name,
        payload: trimmedReason ? { reason: trimmedReason } : undefined,
      })
      .catch(() => undefined);
  };

  return (
    <PageShell padding="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Send Workflow Signal</h1>
        <p className="text-muted-foreground">
          Send a signal to a running workflow by id and name. Use a test-harness
          signal to force a DNSSEC poll to fail and exercise its decision gate.
          Available in local/development only.
        </p>
      </div>

      <PermissionGate permissions={[Permission.WRITE_WORKFLOWS]}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Signal</CardTitle>
            <CardDescription>
              The signal is delivered immediately if the workflow is running.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="workflowId">
                Workflow id
              </label>
              <Input
                id="workflowId"
                placeholder="enable-dnssec-[example.com]"
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="signalName">
                Signal name
              </label>
              <Input
                id="signalName"
                placeholder="test-harness:enable-dnssec:ds-association"
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {TEST_HARNESS_SIGNALS.map((s) => (
                  <Button
                    key={s}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setSignalName(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reason">
                Reason (optional)
              </label>
              <Input
                id="reason"
                placeholder="Sent as { reason } — for the audit log"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <AsyncButton onClick={submit}>Send Signal</AsyncButton>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </PageShell>
  );
});
