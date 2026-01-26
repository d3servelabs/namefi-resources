'use client';

import { NamefiButton } from '@/components/buttons/namefi-button';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLinkedWallets } from '@/hooks/use-user-wallet-addresses';
import { cn } from '@/lib/cn';
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
  const {
    isUnlinkWalletDialogOpen,
    setIsUnlinkWalletDialogOpen,
    walletToUnlink,
    handleConfirmUnlinkWalletClicked,
    handleLinkWalletClicked,
    handleUnlinkWalletClicked,
    isUnlinkWalletPending,
  } = useControlLinkedWallets();

  const { privyUser: user } = useAuth();
  const { linkedWallets } = useLinkedWallets();

  const isFirstConnectedWallet = useCallback(
    (wallet: WalletWithMetadata) => {
      if (!user?.wallet) {
        return false;
      }

      return user.wallet.address === wallet.address;
    },
    [user],
  );

  const handleCopyAddress = useCallback(async (address: string) => {
    await navigator.clipboard.writeText(address);
    toast('Address copied', {
      description: 'Wallet address copied to clipboard',
    });
  }, []);

  return (
    <Card className={cn('', className)} {...rest}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5 text-primary" />
            <CardTitle>Linked Wallets</CardTitle>
          </div>
          <CardDescription>Manage your wallets</CardDescription>
        </div>

        <NamefiButton
          size="sm"
          className="gap-1"
          onClick={handleLinkWalletClicked}
        >
          <Plus className="h-4 w-4" />
          Link
        </NamefiButton>
      </CardHeader>
      <CardContent>
        {linkedWallets.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No linked wallets</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleLinkWalletClicked}
            >
              Link Wallet
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
                      {isFirstConnectedWallet(wallet) ? '(Primary)' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyAddress(wallet.address)}
                    aria-label="Copy wallet address"
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
                    aria-label="View on Etherscan"
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
                            aria-label="Remove wallet"
                            disabled={true}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Primary wallet cannot be unlinked
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUnlinkWalletClicked(wallet.address)}
                      aria-label="Remove wallet"
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

export const useControlLinkedWallets = () => {
  const [isUnlinkWalletDialogOpen, setIsUnlinkWalletDialogOpen] =
    useState(false);
  const { isImpersonating } = useAuth();
  const [walletToUnlink, setWalletToUnlink] = useState<string | null>(null);
  const [isUnlinkWalletPending, setIsUnlinkWalletPending] = useState(false);

  const { linkWallet, unlinkWallet } = usePrivy();
  const { linkedWallets } = useLinkedWallets();

  const handleLinkWalletClicked = useCallback(() => {
    if (isImpersonating) {
      alert('You are impersonating a user, so you cannot link a wallet');
      return;
    }
    linkWallet();
  }, [linkWallet, isImpersonating]);

  const handleUnlinkWalletClicked = useCallback(
    (walletAddress: string) => {
      if (isImpersonating) {
        alert('You are impersonating a user, so you cannot unlink a wallet');
        return;
      }
      setWalletToUnlink(walletAddress);
      setIsUnlinkWalletDialogOpen(true);
    },
    [isImpersonating],
  );

  const handleConfirmUnlinkWalletClicked = useCallback(
    async (walletAddress: string) => {
      if (!walletAddress) {
        setIsUnlinkWalletDialogOpen(false);
        setIsUnlinkWalletPending(false);
        return;
      }
      setIsUnlinkWalletPending(true);

      try {
        await unlinkWallet(walletAddress);
        setIsUnlinkWalletDialogOpen(false);
        toast.success('Wallet unlinked', {
          id: `wallet-unlink-success-${walletAddress}`,
          description: 'Wallet has been successfully unlinked.',
        });
      } catch (error) {
        toast.error('Failed to unlink wallet', {
          id: `wallet-unlink-failure-${walletAddress}`,
          description: `${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      } finally {
        setIsUnlinkWalletDialogOpen(false);
        setIsUnlinkWalletPending(false);
      }
    },
    [unlinkWallet],
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
  const isMobile = useIsMobile();
  return (
    <Dialog
      open={isUnlinkWalletDialogOpen}
      onOpenChange={setIsUnlinkWalletDialogOpen}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlink Wallet</DialogTitle>
          <DialogDescription>
            {`Are you sure you want to continue unlinking wallet with address ${isMobile ? getShortAddress(walletToUnlink ?? '') : walletToUnlink}?`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsUnlinkWalletDialogOpen(false)}
            disabled={isUnlinkWalletPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUnlinkWalletConfirm(walletToUnlink ?? '')}
            disabled={isUnlinkWalletPending}
          >
            {isUnlinkWalletPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Unlinking...
              </>
            ) : (
              'Unlink'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
