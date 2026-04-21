import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { CheckIcon, PauseIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import type { PoweredByNamefiDomainSelect } from '@namefi-astra/db';
import { toast } from 'sonner';
import { isNotNil } from 'ramda';

const ALLOW_EDIT = false;

export function DomainDetailsCard({
  domain,
  onOpenEdit,
}: {
  domain: PoweredByNamefiDomainSelect;
  onOpenEdit: () => void;
}) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const toggleMutation = useMutation(
    trpc.pbnOwner.updateDomain.mutationOptions({
      onSuccess: async () => {
        await qc.invalidateQueries({
          queryKey: trpc.pbnOwner.listOwnedDomains.queryKey(),
        });
        toast.success('Domain updated');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const onConfirmToggle = () => {
    toggleMutation.mutate({
      normalizedDomainName: domain.normalizedDomainName,
      enabled: !domain.enabled,
    });
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle className="text-lg">
          Domain Details ({domain.normalizedDomainName})
        </CardTitle>
        {ALLOW_EDIT && (
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant={domain.enabled ? 'secondary' : 'default'}
                    size="sm"
                  />
                }
              >
                {domain.enabled ? (
                  <PauseIcon className="h-4 w-4 mr-1" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-1" />
                )}
                {domain.enabled ? 'Disable' : 'Enable'}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm {domain.enabled ? 'Disable' : 'Enable'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to{' '}
                    {domain.enabled ? 'disable' : 'enable'} this
                    Powered-by-Namefi domain?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onConfirmToggle}
                    disabled={toggleMutation.isPending}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" onClick={onOpenEdit}>
              Edit
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Detail label="Enabled" value={domain.enabled ? 'Yes' : 'No'} />
          <Detail
            label="Price (USD)"
            value={((domain.costPerYearInUsdCents ?? 0) / 100).toFixed(2)}
          />
          <Detail
            label="Min Years"
            value={`${domain.durationConstraints?.minDurationInYears ?? 1}`}
          />
          <Detail
            label="Max Years"
            value={`${domain.durationConstraints?.maxDurationInYears ?? 1}`}
          />
          <Detail
            label="Start Rollout"
            value={
              domain.startRolloutAt
                ? new Date(domain.startRolloutAt).toLocaleString()
                : '—'
            }
          />
          <Detail
            label="Updated"
            value={new Date(domain.updatedAt).toLocaleString()}
          />
          <Detail
            label="Created"
            value={new Date(domain.createdAt).toLocaleString()}
          />
          {isNotNil(domain.additionalAllowedHostnames) &&
            domain.additionalAllowedHostnames.length > 0 && (
              <Detail
                label="Additional Hostnames"
                value={
                  (domain.additionalAllowedHostnames ?? []).join(', ') || '—'
                }
              />
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
