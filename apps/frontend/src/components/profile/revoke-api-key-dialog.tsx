'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { useTRPCClient } from '@/lib/trpc';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { useAccount } from 'wagmi';
import { Label } from '@/components/ui/shadcn/label';

/**
 * EIP-712 types for revoking an API key
 * Must match the backend REVOKE_API_KEY_EIP712_TYPES
 */
const REVOKE_API_KEY_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  RevokeApiKey: [
    { name: 'keyId', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

interface RevokeApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  keyToRevoke: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function RevokeApiKeyDialog({
  isOpen,
  onOpenChange,
  keyToRevoke,
  onSuccess,
}: RevokeApiKeyDialogProps) {
  const trpcClient = useTRPCClient();
  const { signTypedData } = useSignTypedData();
  const { connectedEthereumWallets } = useConnectedWallets();
  const { address: activeWalletAddress } = useAccount();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const pendingWalletConnectionResolve = useRef<(() => void) | null>(null);

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [signWithWallet, setSignWithWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWalletConnected = useCallback((_walletAddress: string) => {
    if (pendingWalletConnectionResolve.current) {
      pendingWalletConnectionResolve.current();
      pendingWalletConnectionResolve.current = null;
    }
  }, []);

  const handleSubmit = async () => {
    if (!keyToRevoke) return;

    if (signWithWallet) {
      const walletToUse = selectedWallet || activeWalletAddress;
      if (!walletToUse) {
        toast.error('Please select a wallet to sign with');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Create the payload
      const payload = {
        keyId: keyToRevoke.id,
        timestamp: Math.floor(Date.now() / 1000),
      };

      let signature: string | undefined;

      if (signWithWallet) {
        const walletToUse = selectedWallet || activeWalletAddress;

        // Request wallet connection
        await new Promise<void>((resolve, reject) => {
          const currentRef = walletConnectionRef.current;
          if (!currentRef) {
            reject(new Error('Wallet connection component not ready'));
            return;
          }

          pendingWalletConnectionResolve.current = resolve;
          currentRef.requestWalletConnection(walletToUse!);
        });

        // Sign the payload
        signature = await signTypedData({
          types: REVOKE_API_KEY_EIP712_TYPES,
          primaryType: 'RevokeApiKey',
          message: payload,
          chainId: 1,
        });
      }

      // Revoke the API key
      await trpcClient.apiKeys.revoke.mutate({
        ...(signature ? { signature } : {}),
        payload,
      });

      toast.success('API key revoked successfully');
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error(`Failed to revoke API key: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <RequestWalletConnection
        ref={walletConnectionRef}
        onRequestedWalletConnected={handleWalletConnected}
        actionDescription="to revoke the API key"
      />

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke API Key
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this API key? This action cannot
              be undone and any applications using this key will stop working.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {keyToRevoke && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="font-medium">Key to revoke:</p>
                <p className="text-sm text-muted-foreground">
                  {keyToRevoke.name}
                </p>
              </div>
            )}

            {/* Optional Wallet Signature */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="sign-with-wallet-revoke"
                  checked={signWithWallet}
                  onCheckedChange={(checked) =>
                    setSignWithWallet(checked === true)
                  }
                />
                <Label
                  htmlFor="sign-with-wallet-revoke"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Attest with wallet signature{' '}
                    <span className="text-muted-foreground">(optional)</span>
                  </span>
                </Label>
              </div>

              {signWithWallet && (
                <div className="space-y-2 ml-7">
                  <Label>Signing Wallet</Label>
                  <div className="grid gap-2">
                    {connectedEthereumWallets.map((wallet) => (
                      <button
                        key={wallet.address}
                        type="button"
                        onClick={() => setSelectedWallet(wallet.address)}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          (selectedWallet || activeWalletAddress) ===
                          wallet.address
                            ? 'border-primary bg-primary/10'
                            : 'border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        <span className="font-mono text-sm">
                          {wallet.address.slice(0, 6)}...
                          {wallet.address.slice(-4)}
                        </span>
                        {activeWalletAddress === wallet.address && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            (active)
                          </span>
                        )}
                      </button>
                    ))}
                    {connectedEthereumWallets.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No wallets connected. Please connect a wallet first.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (signWithWallet && connectedEthereumWallets.length === 0)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                'Revoke Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
