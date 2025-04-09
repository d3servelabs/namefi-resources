'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn, getShortAddress } from '@/lib/utils';
import { CHAINS } from '@namefi-astra/utils';
import { useWallets } from '@privy-io/react-auth';
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface NftWalletCardProps {
  onWalletAddressChange: (walletAddress: string | null) => void;
  selectedWalletAddress: string | null;
}

enum WalletSelectionType {
  CONNECTED = 'CONNECTED',
  CUSTOM = 'CUSTOM',
}

export function NftWalletCard({
  onWalletAddressChange,
  selectedWalletAddress,
}: NftWalletCardProps) {
  const [selectionType, setSelectionType] = useState<WalletSelectionType>(
    WalletSelectionType.CONNECTED,
  );
  const [selectedConnectedWallet, setSelectedConnectedWallet] = useState<
    string | undefined
  >(undefined);
  const [customWalletAddress, setCustomWalletAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { ready: ethereumWalletsReady, wallets: ethereumWallets } =
    useWallets();
  const isMobile = useIsMobile();

  const connectedWalletAddresses = useMemo(() => {
    if (!ethereumWalletsReady) {
      return [];
    }

    return [...ethereumWallets].map((wallet) => wallet.address);
  }, [ethereumWallets, ethereumWalletsReady]);

  // Set default selection type based on available wallets
  useEffect(() => {
    if (connectedWalletAddresses.length > 0) {
      setSelectionType(WalletSelectionType.CONNECTED);
      // Set first wallet as default if none is selected yet
      if (!selectedConnectedWallet) {
        setSelectedConnectedWallet(connectedWalletAddresses[0]);
        onWalletAddressChange(connectedWalletAddresses[0]);
      }
    } else {
      setSelectionType(WalletSelectionType.CUSTOM);
    }
  }, [
    connectedWalletAddresses,
    onWalletAddressChange,
    selectedConnectedWallet,
  ]);

  // Set initial state if a wallet is already selected
  useEffect(() => {
    if (selectedWalletAddress) {
      if (connectedWalletAddresses.includes(selectedWalletAddress)) {
        setSelectionType(WalletSelectionType.CONNECTED);
        setSelectedConnectedWallet(selectedWalletAddress);
      } else {
        setSelectionType(WalletSelectionType.CUSTOM);
        setCustomWalletAddress(selectedWalletAddress);
      }
    }
  }, [selectedWalletAddress, connectedWalletAddresses]);

  // Update selected wallet when connected wallet is selected
  useEffect(() => {
    if (
      selectionType === WalletSelectionType.CONNECTED &&
      selectedConnectedWallet
    ) {
      onWalletAddressChange(selectedConnectedWallet);
      setError(null);
    }
  }, [selectionType, selectedConnectedWallet, onWalletAddressChange]);

  // Update selected wallet when custom address changes and is valid
  useEffect(() => {
    if (selectionType === WalletSelectionType.CUSTOM && customWalletAddress) {
      if (/^0x[a-fA-F0-9]{40}$/.test(customWalletAddress)) {
        onWalletAddressChange(customWalletAddress);
        setError(null);
      } else if (customWalletAddress.length > 0) {
        setError('Please enter a valid Ethereum address');
        onWalletAddressChange(null);
      }
    }
  }, [selectionType, customWalletAddress, onWalletAddressChange]);

  const handleSelectionTypeChange = useCallback(
    (value: string) => {
      setSelectionType(value as WalletSelectionType);
      setError(null);

      // Clear the selected wallet if changing selection type
      if (value === WalletSelectionType.CONNECTED) {
        if (connectedWalletAddresses.length > 0) {
          // If switching to CONNECTED and there are wallets, select the first one
          const walletToSelect =
            selectedConnectedWallet || connectedWalletAddresses[0];
          setSelectedConnectedWallet(walletToSelect);
          onWalletAddressChange(walletToSelect);
        } else {
          onWalletAddressChange(null);
        }
      } else if (
        !(
          customWalletAddress && /^0x[a-fA-F0-9]{40}$/.test(customWalletAddress)
        )
      ) {
        onWalletAddressChange(null);
      }
    },
    [
      connectedWalletAddresses,
      customWalletAddress,
      onWalletAddressChange,
      selectedConnectedWallet,
    ],
  );

  const handleConnectedWalletSelect = useCallback((value: string) => {
    setSelectedConnectedWallet(value);
    setError(null);
  }, []);

  const handleCustomWalletAddressChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCustomWalletAddress(e.target.value);
      if (e.target.value.length === 0) {
        onWalletAddressChange(null);
        setError(null);
      }
    },
    [onWalletAddressChange],
  );

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>NFT Wallet</CardTitle>
        <CardDescription>
          Details of wallet which will receive the minted NFT.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <RadioGroup
          value={selectionType}
          onValueChange={handleSelectionTypeChange}
          className="space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={WalletSelectionType.CONNECTED}
                id="nft-connected-wallet"
              />
              <Label htmlFor="nft-connected-wallet" className="font-medium">
                Use connected wallet
              </Label>
            </div>
            <div
              className={cn(
                'pl-6',
                selectionType === WalletSelectionType.CONNECTED
                  ? ''
                  : 'opacity-50',
              )}
            >
              {connectedWalletAddresses.length > 0 ? (
                <Select
                  disabled={selectionType !== WalletSelectionType.CONNECTED}
                  value={selectedConnectedWallet}
                  onValueChange={handleConnectedWalletSelect}
                >
                  <SelectTrigger className="w-full max-w-xl">
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedWalletAddresses.map((wallet) => (
                      <SelectItem key={wallet} value={wallet}>
                        {isMobile ? getShortAddress(wallet) : wallet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No wallets connected
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={WalletSelectionType.CUSTOM}
                id="nft-custom-wallet"
              />
              <Label htmlFor="nft-custom-wallet" className="font-medium">
                Enter custom address
              </Label>
            </div>
            <div
              className={cn(
                'pl-6',
                selectionType === WalletSelectionType.CUSTOM
                  ? ''
                  : 'opacity-50',
              )}
            >
              <Input
                placeholder="0x..."
                value={customWalletAddress}
                onChange={handleCustomWalletAddressChange}
                disabled={selectionType !== WalletSelectionType.CUSTOM}
                className="max-w-xl"
              />
            </div>
          </div>
        </RadioGroup>

        <div className="pt-2">
          <div className="flex items-center justify-between max-w-xl">
            <Label className="font-medium">Chain</Label>
            <span className="text-sm text-muted-foreground">
              {CHAINS.base.name} (Default)
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive max-w-xl">{error}</p>}
      </CardContent>
    </Card>
  );
}
