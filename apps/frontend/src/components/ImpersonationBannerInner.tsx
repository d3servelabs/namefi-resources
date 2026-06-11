'use client';

import { AsyncButton } from '@/components/buttons/async-button';
import { UserWalletAvatar } from '@/components/user-avatar';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEnsName } from 'wagmi';

type ImpersonationStatus = AppRouterOutput['users']['getImpersonationStatus'];
type ImpersonationTarget = NonNullable<
  NonNullable<ImpersonationStatus>['target']
>;
type ImpersonationParticipant =
  | NonNullable<ImpersonationStatus>['actor']
  | ImpersonationTarget;

export type ImpersonationBannerInnerProps = {
  refetchStatus: () => Promise<unknown>;
  status: ImpersonationStatus | null | undefined;
};

export default function ImpersonationBannerInner({
  refetchStatus,
  status,
}: ImpersonationBannerInnerProps) {
  const isImpersonating = Boolean(status?.impersonating);
  const targetUser = status?.impersonating ? status.target : null;

  if (!isImpersonating || !targetUser) return null;

  return (
    <ActiveImpersonationBannerInner
      actorUser={status?.actor}
      refetchStatus={refetchStatus}
      targetUser={targetUser}
    />
  );
}

function ActiveImpersonationBannerInner({
  actorUser,
  refetchStatus,
  targetUser,
}: {
  actorUser: ImpersonationParticipant | null | undefined;
  refetchStatus: () => Promise<unknown>;
  targetUser: ImpersonationTarget;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const stopMutation = useMutation(
    trpc.users.stopImpersonating.mutationOptions(),
  );

  const actorWalletAddress = parseWalletAddress(actorUser?.mainWalletAddress);
  const targetWalletAddress = parseWalletAddress(targetUser?.mainWalletAddress);

  const actorEns = useEnsName({
    address: actorWalletAddress,
    chainId: 1,
    query: { enabled: Boolean(actorWalletAddress) },
  });
  const targetEns = useEnsName({
    address: targetWalletAddress,
    chainId: 1,
    query: { enabled: Boolean(targetWalletAddress) },
  });

  const handleStopImpersonating = async () => {
    await stopMutation.mutateAsync();
    toast.success('Stopped impersonating');

    toast.info('Refreshing user data');
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: trpc.users.getUser.queryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: trpc.users.getMyPermissions.queryKey(),
      }),
      refetchStatus(),
    ]);

    toast.success('User data refreshed');
  };

  const labelFor = (
    u: ImpersonationParticipant | null | undefined,
    ens?: string | null,
  ) =>
    u?.displayName || u?.primaryEmail || ens || u?.mainWalletAddress || u?.id;

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

function parseWalletAddress(address: string | null | undefined) {
  return address?.startsWith('0x') ? (address as `0x${string}`) : undefined;
}
