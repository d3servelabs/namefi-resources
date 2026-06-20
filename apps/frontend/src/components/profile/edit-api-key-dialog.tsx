'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import { useTRPCClient } from '@/lib/trpc';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { useTranslations } from 'next-intl';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';

const UPDATE_API_KEY_RESTRICTIONS_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  UpdateApiKeyRestrictions: [
    { name: 'keyId', type: 'string' },
    { name: 'allowedIps', type: 'string' },
    { name: 'allowedOrigins', type: 'string' },
    { name: 'allowBrowserRequests', type: 'bool' },
    { name: 'allowServerRequests', type: 'bool' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

export interface EditableApiKeyRestrictions {
  id: string;
  name: string;
  type: string;
  allowedIps: string[] | null;
  allowedOrigins: string[] | null;
  allowBrowserRequests: boolean;
  allowServerRequests: boolean;
}

interface EditApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: EditableApiKeyRestrictions | null;
  onSuccess: () => void;
}

function parseMultilineList(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function EditApiKeyDialog({
  isOpen,
  onOpenChange,
  apiKey,
  onSuccess,
}: EditApiKeyDialogProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const trpcClient = useTRPCClient();
  const { signTypedData } = useSignTypedData();
  const { connectedEthereumWallets } = useConnectedWallets();
  const { address: activeWalletAddress } = useAccount();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const pendingWalletConnectionResolve = useRef<(() => void) | null>(null);

  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [allowBrowserRequests, setAllowBrowserRequests] = useState(false);
  const [allowServerRequests, setAllowServerRequests] = useState(false);
  const [allowedIpsText, setAllowedIpsText] = useState('');
  const [allowedOriginsText, setAllowedOriginsText] = useState('');
  const [showAdvancedRestrictions, setShowAdvancedRestrictions] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWalletConnected = useCallback((_walletAddress: string) => {
    if (pendingWalletConnectionResolve.current) {
      pendingWalletConnectionResolve.current();
      pendingWalletConnectionResolve.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    setSelectedWallet(null);
    setAllowBrowserRequests(false);
    setAllowServerRequests(false);
    setAllowedIpsText('');
    setAllowedOriginsText('');
    setShowAdvancedRestrictions(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !apiKey) return;

    const allowedIps = apiKey.allowedIps ?? [];
    const allowedOrigins = apiKey.allowedOrigins ?? [];

    setAllowBrowserRequests(apiKey.allowBrowserRequests);
    setAllowServerRequests(apiKey.allowServerRequests);
    setAllowedIpsText(allowedIps.join('\n'));
    setAllowedOriginsText(allowedOrigins.join('\n'));
    setShowAdvancedRestrictions(
      allowedIps.length > 0 || allowedOrigins.length > 0,
    );
  }, [apiKey, isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetForm();
      }
      onOpenChange(open);
    },
    [onOpenChange, resetForm],
  );

  const handleSubmit = async () => {
    if (!apiKey) return;

    const walletToUse = selectedWallet || activeWalletAddress;
    if (!walletToUse) {
      toast.error(t('editApiKey.selectWalletError'));
      return;
    }

    try {
      setIsSubmitting(true);

      await new Promise<void>((resolve, reject) => {
        const currentRef = walletConnectionRef.current;
        if (!currentRef) {
          reject(new Error('Wallet connection component not ready'));
          return;
        }

        pendingWalletConnectionResolve.current = resolve;
        currentRef.requestWalletConnection(walletToUse);
      });

      const allowedIps = parseMultilineList(allowedIpsText);
      const allowedOrigins = parseMultilineList(allowedOriginsText);
      const timestamp = Math.floor(Date.now() / 1000);

      const payload = {
        keyId: apiKey.id,
        allowedIps,
        allowedOrigins,
        allowBrowserRequests,
        allowServerRequests,
        timestamp,
      };

      const signature = await signTypedData({
        types: UPDATE_API_KEY_RESTRICTIONS_EIP712_TYPES,
        primaryType: 'UpdateApiKeyRestrictions',
        message: {
          ...payload,
          allowedIps: JSON.stringify(payload.allowedIps),
          allowedOrigins: JSON.stringify(payload.allowedOrigins),
        },
        chainId: 1,
        walletAddress: walletToUse,
      });

      await trpcClient.apiKeys.updateApiKeyRestrictions.mutate({
        signature,
        payload,
      });

      toast.success(t('editApiKey.updateSuccess'));
      onSuccess();
      handleOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('rejected')) {
        toast.error(t('editApiKey.signatureRejected'));
      } else {
        toast.error(t('editApiKey.updateFailure', { error: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const showOriginsField =
    allowBrowserRequests || allowedOriginsText.trim().length > 0;

  return (
    <>
      <RequestWalletConnection
        ref={walletConnectionRef}
        onRequestedWalletConnected={handleWalletConnected}
        actionDescription={t('editApiKey.walletActionDescription')}
      />

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            MOBILE_BOTTOM_SHEET_DIALOG,
            'sm:max-w-[550px] max-h-[90vh] overflow-y-auto',
          )}
          data-testid="profile.edit-api-key.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t('editApiKey.title')}</DialogTitle>
            <DialogDescription>
              {t('editApiKey.description', {
                name: apiKey?.name ?? t('editApiKey.thisApiKey'),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3 rounded-lg border border-zinc-700 p-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t('editApiKey.requestTypes')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('editApiKey.requestTypesHelp')}
                </p>
              </div>

              <div className="flex items-start gap-x-3">
                <Checkbox
                  id="editAllowBrowserRequests"
                  checked={allowBrowserRequests}
                  onCheckedChange={(checked) =>
                    setAllowBrowserRequests(checked === true)
                  }
                  data-testid="profile.edit-api-key.allow-browser"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="editAllowBrowserRequests"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    {t('editApiKey.allowBrowserRequests')}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {t('editApiKey.allowBrowserRequestsHelp')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-x-3">
                <Checkbox
                  id="editAllowServerRequests"
                  checked={allowServerRequests}
                  onCheckedChange={(checked) =>
                    setAllowServerRequests(checked === true)
                  }
                  data-testid="profile.edit-api-key.allow-server"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="editAllowServerRequests"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <Server className="h-4 w-4" />
                    {t('editApiKey.allowServerRequests')}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {t('editApiKey.allowServerRequestsHelp')}
                  </p>
                </div>
              </div>

              {!allowBrowserRequests && !allowServerRequests && (
                <div className="flex items-center gap-2 text-yellow-500 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{t('editApiKey.noRequestTypesWarning')}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  setShowAdvancedRestrictions(!showAdvancedRestrictions)
                }
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="profile.edit-api-key.advanced-toggle"
              >
                {showAdvancedRestrictions ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {t('editApiKey.advancedRestrictions')}
              </button>

              {showAdvancedRestrictions && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="editAllowedIps">
                      {t('editApiKey.allowedIps')}
                    </Label>
                    <Textarea
                      id="editAllowedIps"
                      value={allowedIpsText}
                      onChange={(e) => setAllowedIpsText(e.target.value)}
                      placeholder="192.168.1.1&#10;10.0.0.0/8&#10;2001:db8::/32"
                      className="font-mono text-xs"
                      rows={3}
                      data-testid="profile.edit-api-key.allowed-ips"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('editApiKey.allowedIpsHelp')}
                    </p>
                  </div>

                  {showOriginsField && (
                    <div className="space-y-2">
                      <Label htmlFor="editAllowedOrigins">
                        {t('editApiKey.allowedOrigins')}
                      </Label>
                      <Textarea
                        id="editAllowedOrigins"
                        value={allowedOriginsText}
                        onChange={(e) => setAllowedOriginsText(e.target.value)}
                        placeholder="https://example.com&#10;https://*.example.com"
                        className="font-mono text-xs"
                        rows={3}
                        data-testid="profile.edit-api-key.allowed-origins"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('editApiKey.allowedOriginsHelp')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('editApiKey.signingWallet')}</Label>
              <div className="grid gap-2">
                {connectedEthereumWallets.map((wallet) => (
                  <button
                    key={wallet.address}
                    type="button"
                    onClick={() => setSelectedWallet(wallet.address)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      (selectedWallet || activeWalletAddress) === wallet.address
                        ? 'border-primary bg-primary/10'
                        : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                    data-testid={`profile.edit-api-key.wallet.${wallet.address}`}
                  >
                    <span className="font-mono text-sm">
                      {wallet.address.slice(0, 6)}...
                      {wallet.address.slice(-4)}
                    </span>
                    {activeWalletAddress === wallet.address && (
                      <span className="ms-auto text-xs text-muted-foreground">
                        {t('editApiKey.active')}
                      </span>
                    )}
                  </button>
                ))}
                {connectedEthereumWallets.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t('editApiKey.noWalletsConnected')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              data-testid="profile.edit-api-key.cancel"
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || connectedEthereumWallets.length === 0}
              data-testid="profile.edit-api-key.submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('editApiKey.saving')}
                </>
              ) : (
                t('editApiKey.saveChanges')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
