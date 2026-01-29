'use client';

import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { AsyncButton } from '@/components/buttons/async-button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/shadcn/avatar';
import { UserWalletAvatar } from '@/components/user-avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { useEnsName } from 'wagmi';
import { Button } from './ui/shadcn/button';

type ImpersonationParticipant =
  | NonNullable<AppRouterOutput['users']['getImpersonationStatus']>['actor']
  | NonNullable<AppRouterOutput['users']['getImpersonationStatus']>['target'];

export default function ImpersonationBanner() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const status = useQuery(
    trpc.users.getImpersonationStatus.queryOptions(undefined, {
      refetchInterval: 30_000,
    }),
  );
  const stopMutation = useMutation(
    trpc.users.stopImpersonating.mutationOptions(),
  );

  const isImpersonating = Boolean(status.data?.impersonating);
  const targetUser = status.data?.impersonating ? status.data?.target : null;
  const actorUser = status.data?.actor;

  const actorEns = useEnsName({
    address: (actorUser?.mainWalletAddress || '') as any,
    chainId: 1,
    query: { enabled: Boolean(actorUser?.mainWalletAddress) },
  });
  const targetEns = useEnsName({
    address: (targetUser?.mainWalletAddress || '') as any,
    chainId: 1,
    query: { enabled: Boolean(targetUser?.mainWalletAddress) },
  });

  const handleStopImpersonating = async () => {
    await stopMutation.mutateAsync();
    await queryClient.invalidateQueries();
    toast.success('Stopped impersonating');

    await status.refetch();

    toast.info('Refreshing user data');
    await queryClient.refetchQueries();

    toast.success('User data refreshed');
  };

  const labelFor = (
    u: ImpersonationParticipant | null | undefined,
    ens?: string | null,
  ) =>
    u?.displayName || u?.primaryEmail || ens || u?.mainWalletAddress || u?.id;

  if (!isImpersonating || !targetUser) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="rounded-md bg-foreground text-background shadow-lg border px-3 py-2 flex items-center gap-2">
        <span className="text-xs opacity-90">Impersonating </span>
        <div className="flex items-center gap-2 ring-1 ring-background/20 rounded-md p-1">
          <UserWalletAvatar
            address={targetUser.mainWalletAddress}
            className="size-6"
          />
          <span className="text-sm">
            {labelFor(targetUser, targetEns.data)}
          </span>
        </div>
        <Dialog>
          <DialogTrigger
            render={
              <Button
                size="icon"
                className="h-6 w-6"
                title="More details"
                aria-label="More details"
                type="button"
                variant="secondary"
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Impersonation Details</DialogTitle>
              <DialogDescription>
                You are currently impersonating another user.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {[
                { title: 'Impersonator', u: actorUser, ens: actorEns.data },
                { title: 'Impersonated', u: targetUser, ens: targetEns.data },
              ].map((entry) => (
                <div
                  key={entry.title}
                  className="rounded border p-3 bg-background flex items-center gap-3"
                >
                  <UserWalletAvatar
                    address={entry.u?.mainWalletAddress}
                    className="size-10"
                  />
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">{entry.title}</div>
                    <div className="text-sm break-words">
                      {labelFor(entry.u, entry.ens)}
                    </div>
                    <div className="text-xs text-muted-foreground break-words">
                      {entry.u?.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2">
              <AsyncButton
                variant="secondary"
                onClick={handleStopImpersonating}
              >
                Stop Impersonation
              </AsyncButton>
            </div>
          </DialogContent>
        </Dialog>
        <AsyncButton
          size="icon"
          variant="secondary"
          className="h-6 w-6"
          onClick={handleStopImpersonating}
          title="Stop impersonating"
          aria-label="Stop impersonating"
          loadingText=""
        >
          <X className="h-4 w-4" />
        </AsyncButton>
      </div>
    </div>
  );
}
