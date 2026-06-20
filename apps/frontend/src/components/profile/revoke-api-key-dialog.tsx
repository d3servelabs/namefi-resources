'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useTRPCClient } from '@/lib/trpc';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { useAccount } from 'wagmi';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { useTranslations } from 'next-intl';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';

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
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
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
        if (!walletToUse) {
          toast.error(t('revokeApiKey.selectWalletError'));
          return;
        }

        // Request wallet connection
        await new Promise<void>((resolve, reject) => {
          const currentRef = walletConnectionRef.current;
          if (!currentRef) {
            reject(new Error('Wallet connection component not ready'));
            return;
          }

          pendingWalletConnectionResolve.current = resolve;
          currentRef.requestWalletConnection(walletToUse);
        });

        // Sign the payload
        signature = await signTypedData({
          types: REVOKE_API_KEY_EIP712_TYPES,
          primaryType: 'RevokeApiKey',
          message: payload,
          chainId: 1,
          walletAddress: walletToUse,
        });
      }

      // Revoke the API key
      await trpcClient.apiKeys.revoke.mutate({
        ...(signature ? { signature } : {}),
        payload,
      });

      toast.success(t('revokeApiKey.revokeSuccess'));
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('rejected')) {
        toast.error(t('revokeApiKey.signatureRejected'));
      } else {
        toast.error(t('revokeApiKey.revokeFailure', { error: errorMessage }));
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
        actionDescription={t('revokeApiKey.walletActionDescription')}
      />

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-[450px]')}
          data-testid="profile.revoke-api-key.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('revokeApiKey.title')}
            </DialogTitle>
            <DialogDescription>
              {t('revokeApiKey.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {keyToRevoke && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <p className="font-medium">{t('revokeApiKey.keyToRevoke')}</p>
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
                  data-testid="profile.revoke-api-key.sign-with-wallet"
                />
                <Label
                  htmlFor="sign-with-wallet-revoke"
                  className="flex items-center gap-2 cursor-pointer font-normal"
                >
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {t('revokeApiKey.attestWithSignature')}{' '}
                    <span className="text-muted-foreground">
                      {t('revokeApiKey.optional')}
                    </span>
                  </span>
                </Label>
              </div>

              {signWithWallet && (
                <div className="space-y-2 ms-7">
                  <Label>{t('revokeApiKey.signingWallet')}</Label>
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
                        data-testid={`profile.revoke-api-key.wallet.${wallet.address}`}
                      >
                        <span className="font-mono text-sm">
                          {wallet.address.slice(0, 6)}...
                          {wallet.address.slice(-4)}
                        </span>
                        {activeWalletAddress === wallet.address && (
                          <span className="ms-auto text-xs text-muted-foreground">
                            {t('revokeApiKey.active')}
                          </span>
                        )}
                      </button>
                    ))}
                    {connectedEthereumWallets.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        {t('revokeApiKey.noWalletsConnected')}
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
              data-testid="profile.revoke-api-key.cancel"
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                (signWithWallet && connectedEthereumWallets.length === 0)
              }
              data-testid="profile.revoke-api-key.confirm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('revokeApiKey.revoking')}
                </>
              ) : (
                t('revokeApiKey.revokeKey')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
