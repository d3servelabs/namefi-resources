'use client';

import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';
import { getShortAddress, shortage } from '@/lib/string';
import { type WalletWithMetadata, usePrivy } from '@privy-io/react-auth';
import {
  Copy,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  Wallet2,
} from 'lucide-react';
import { type HTMLAttributes, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/use-auth';

const getWalletIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'metamask':
      return '🦊';
    case 'coinbase_wallet':
      return '💰';
    case 'walletconnect':
      return '🔗';
    case 'embedded':
      return '🔒';
    default:
      return '👛';
  }
};

interface WalletsProps extends HTMLAttributes<HTMLDivElement> {}

export const Wallets = ({ className, ...rest }: WalletsProps) => {
  const t = useTranslations('profile');
  const {
    isUnlinkWalletDialogOpen,
    setIsUnlinkWalletDialogOpen,
    walletToUnlink,
    handleConfirmUnlinkWalletClicked,
    handleLinkWalletClicked,
    handleUnlinkWalletClicked,
    isUnlinkWalletPending,
    canUsePrivyActions,
  } = useControlLinkedWallets();

  const { privyUser: user } = useAuth();
  const { linkedWallets, linkedWalletsReady } = useLinkedWallets();

  const isFirstConnectedWallet = useCallback(
    (wallet: WalletWithMetadata) => {
      if (!user?.wallet) {
        return false;
      }

      return user.wallet.address === wallet.address;
    },
    [user],
  );

  const handleCopyAddress = useCallback(
    async (address: string) => {
      await navigator.clipboard.writeText(address);
      toast(t('wallets.addressCopied'), {
        description: t('wallets.addressCopiedDescription'),
      });
    },
    [t],
  );

  return (
    <Card className={cn('', className)} {...rest}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5 text-primary" />
            <CardTitle>{t('wallets.title')}</CardTitle>
          </div>
          <CardDescription>{t('wallets.description')}</CardDescription>
        </div>

        <NamefiButton
          size="sm"
          className="gap-1"
          onClick={handleLinkWalletClicked}
          disabled={!canUsePrivyActions}
        >
          <Plus className="h-4 w-4" />
          {t('wallets.link')}
        </NamefiButton>
      </CardHeader>
      <CardContent>
        {!linkedWalletsReady ? (
          <LinkedWalletsSkeleton />
        ) : linkedWallets.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">{t('wallets.empty')}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleLinkWalletClicked}
              disabled={!canUsePrivyActions}
            >
              {t('wallets.linkWallet')}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {linkedWallets.map((wallet: WalletWithMetadata) => (
              <div
                key={wallet.address}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {getWalletIcon(wallet.walletClientType ?? '')}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {wallet.walletClientType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {shortage(wallet.address, 11)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {isFirstConnectedWallet(wallet)
                        ? t('wallets.primary')
                        : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyAddress(wallet.address)}
                    aria-label={t('wallets.copyAddressAriaLabel')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      window.open(
                        `https://basescan.org/address/${wallet.address}#nfttransfers`,
                        '_blank',
                      )
                    }
                    aria-label={t('wallets.viewOnExplorerAriaLabel')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {isFirstConnectedWallet(wallet) ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label={t('wallets.removeWalletAriaLabel')}
                            disabled={true}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('wallets.primaryCannotUnlink')}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUnlinkWalletClicked(wallet.address)}
                      aria-label={t('wallets.removeWalletAriaLabel')}
                      disabled={!canUsePrivyActions}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <UnlinkWalletDialog
        isUnlinkWalletDialogOpen={isUnlinkWalletDialogOpen}
        setIsUnlinkWalletDialogOpen={setIsUnlinkWalletDialogOpen}
        walletToUnlink={walletToUnlink}
        handleUnlinkWalletConfirm={handleConfirmUnlinkWalletClicked}
        isUnlinkWalletPending={isUnlinkWalletPending}
      />
    </Card>
  );
};

function LinkedWalletsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const useControlLinkedWallets = () => {
  const t = useTranslations('profile');
  const [isUnlinkWalletDialogOpen, setIsUnlinkWalletDialogOpen] =
    useState(false);
  const {
    isImpersonating,
    privyRuntimeReady,
    privyRuntimeAuthenticated,
    privyUser,
  } = useAuth();
  const canUsePrivyActions =
    privyRuntimeReady && privyRuntimeAuthenticated && Boolean(privyUser);
  const [walletToUnlink, setWalletToUnlink] = useState<string | null>(null);
  const [isUnlinkWalletPending, setIsUnlinkWalletPending] = useState(false);

  const { linkWallet, unlinkWallet } = usePrivy();
  const { linkedWallets } = useLinkedWallets();

  const handleLinkWalletClicked = useCallback(() => {
    if (!canUsePrivyActions) return;
    if (isImpersonating) {
      alert(t('wallets.impersonateLinkAlert'));
      return;
    }
    linkWallet();
  }, [canUsePrivyActions, linkWallet, isImpersonating, t]);

  const handleUnlinkWalletClicked = useCallback(
    (walletAddress: string) => {
      if (!canUsePrivyActions) return;
      if (isImpersonating) {
        alert(t('wallets.impersonateUnlinkAlert'));
        return;
      }
      setWalletToUnlink(walletAddress);
      setIsUnlinkWalletDialogOpen(true);
    },
    [canUsePrivyActions, isImpersonating, t],
  );

  const handleConfirmUnlinkWalletClicked = useCallback(
    async (walletAddress: string) => {
      if (!canUsePrivyActions) return;
      if (!walletAddress) {
        setIsUnlinkWalletDialogOpen(false);
        setIsUnlinkWalletPending(false);
        return;
      }
      setIsUnlinkWalletPending(true);

      try {
        await unlinkWallet(walletAddress);
        setIsUnlinkWalletDialogOpen(false);
        toast.success(t('wallets.unlinkSuccess'), {
          id: `wallet-unlink-success-${walletAddress}`,
          description: t('wallets.unlinkSuccessDescription'),
        });
      } catch (error) {
        toast.error(t('wallets.unlinkFailure'), {
          id: `wallet-unlink-failure-${walletAddress}`,
          description: `${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setIsUnlinkWalletDialogOpen(false);
        setIsUnlinkWalletPending(false);
      }
    },
    [canUsePrivyActions, unlinkWallet, t],
  );
  return {
    isUnlinkWalletDialogOpen,
    setIsUnlinkWalletDialogOpen,
    walletToUnlink,
    setWalletToUnlink,
    handleUnlinkWalletClicked,
    handleLinkWalletClicked,
    linkedWallets,
    handleConfirmUnlinkWalletClicked,
    isUnlinkWalletPending,
    canUsePrivyActions,
  };
};

type UnlinkWalletDialogProps = {
  isUnlinkWalletDialogOpen: boolean;
  setIsUnlinkWalletDialogOpen: (open: boolean) => void;
  walletToUnlink: string | null;
  handleUnlinkWalletConfirm: (walletAddress: string) => void;
  isUnlinkWalletPending: boolean;
};

export const UnlinkWalletDialog = ({
  isUnlinkWalletDialogOpen,
  setIsUnlinkWalletDialogOpen,
  walletToUnlink,
  handleUnlinkWalletConfirm,
  isUnlinkWalletPending,
}: UnlinkWalletDialogProps) => {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const isMobile = useIsMobile();
  return (
    <Dialog
      open={isUnlinkWalletDialogOpen}
      onOpenChange={setIsUnlinkWalletDialogOpen}
    >
      <DialogContent className={MOBILE_BOTTOM_SHEET_DIALOG}>
        <DialogHeader>
          <DialogTitle>{t('wallets.unlinkDialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('wallets.unlinkDialogDescription', {
              address: isMobile
                ? getShortAddress(walletToUnlink ?? '')
                : (walletToUnlink ?? ''),
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsUnlinkWalletDialogOpen(false)}
            disabled={isUnlinkWalletPending}
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            onClick={() => handleUnlinkWalletConfirm(walletToUnlink ?? '')}
            disabled={isUnlinkWalletPending}
          >
            {isUnlinkWalletPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('wallets.unlinking')}
              </>
            ) : (
              t('wallets.unlink')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
