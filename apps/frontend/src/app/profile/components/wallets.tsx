'use client';

import { NamefiButton } from '@/components/namefi-button';
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
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { cn } from '@/lib/utils';
import { shortage } from '@/utils/string';
import {
  type ConnectedWallet,
  type Wallet,
  type WalletListEntry,
  usePrivy,
  useWallets,
} from '@privy-io/react-auth';
import { Copy, ExternalLink, Plus, Trash2, Wallet2 } from 'lucide-react';
import { type HTMLAttributes, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const WALLETS = {
  metamask: 'MetaMask',
  coinbase_wallet: 'Coinbase Wallet',
  rainbow: 'Rainbow',
  phantom: 'Phantom',
  zerion: 'Zerion',
  cryptocom: 'Crypto.com',
  uniswap: 'Uniswap',
  okx_wallet: 'OKX Wallet',
  universal_profile: 'Universal Profile',
};

interface WalletsProps extends HTMLAttributes<HTMLDivElement> {}

export const Wallets = ({ className, ...rest }: WalletsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [selectedWalletType, setSelectedWalletType] =
    useState<string>('metamask');

  const { user, linkWallet, connectWallet, unlinkWallet } = usePrivy();

  const { wallets: connections } = useWallets();

  const wallets = useMemo(() => {
    if (!user?.wallet) {
      return connections;
    }

    if (connections.length === 0) {
      return [user.wallet];
    }

    if (
      connections.some((wallet) => wallet.address === user?.wallet?.address)
    ) {
      return connections;
    }

    return [...connections, user.wallet];
  }, [user?.wallet, connections]);

  const handleLinkWallet = useCallback(() => {
    linkWallet({
      walletList: [selectedWalletType as WalletListEntry],
    });
  }, [linkWallet, selectedWalletType]);

  const handleUnlinkWallet = useCallback(
    async (wallet: Wallet | ConnectedWallet) => {
      await unlinkWallet(wallet.address);
    },
    [unlinkWallet],
  );

  const handleConnectWallet = useCallback(() => {
    connectWallet();
  }, [connectWallet]);

  const handleCopyAddress = useCallback(async (address: string) => {
    await navigator.clipboard.writeText(address);
    toast('Address copied', {
      description: 'Wallet address copied to clipboard',
    });
  }, []);

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

  return (
    <Card className={cn('', className)} {...rest}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Wallet2 className="h-5 w-5 text-primary" />
            <CardTitle>Connected Wallets</CardTitle>
          </div>
          <CardDescription>Manage your wallets</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild={true}>
            <NamefiButton size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Connect
            </NamefiButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Choose how you want to connect your wallet.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="wallet-type">Wallet Type</Label>
                <Select
                  value={selectedWalletType}
                  onValueChange={setSelectedWalletType}
                >
                  <SelectTrigger id="wallet-type">
                    <SelectValue placeholder="Select wallet type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WALLETS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleLinkWallet}>Link Wallet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {wallets.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed">
            <p className="text-muted-foreground">No wallets connected</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleConnectWallet}
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.address}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    {getWalletIcon(wallet.walletClientType)}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {wallet.walletClientType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {shortage(wallet.address, 11)}
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
                        `https://etherscan.io/address/${wallet.address}`,
                        '_blank',
                      )
                    }
                    aria-label="View on Etherscan"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {wallet.address !== user?.wallet?.address && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleUnlinkWallet(wallet)}
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
    </Card>
  );
};
