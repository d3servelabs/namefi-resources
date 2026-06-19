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
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { useTRPCClient } from '@/lib/trpc';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { toast } from 'sonner';
import {
  Loader2,
  Copy,
  AlertTriangle,
  Key,
  Shield,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Globe,
  Server,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { useAccount } from 'wagmi';
import { getPublicKey, utils as secp256k1Utils } from '@noble/secp256k1';
import { useTranslations } from 'next-intl';

/**
 * Convert Uint8Array to hex string
 */
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * EIP-712 types for creating an API key
 * Must match the backend CREATE_API_KEY_EIP712_TYPES
 */
const CREATE_API_KEY_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  CreateApiKey: [
    { name: 'keyName', type: 'string' },
    { name: 'keyType', type: 'string' },
    { name: 'publicKey', type: 'string' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'allowedIps', type: 'string' },
    { name: 'allowedOrigins', type: 'string' },
    { name: 'allowBrowserRequests', type: 'bool' },
    { name: 'allowServerRequests', type: 'bool' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

interface CreateApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type KeyType = 'PLAIN' | 'PUBLIC_PRIVATE';

const EXPIRATION_OPTIONS = [
  { labelKey: 'expirationNever', value: '0' },
  { labelKey: 'expiration30Days', value: String(30 * 24 * 60 * 60) },
  { labelKey: 'expiration90Days', value: String(90 * 24 * 60 * 60) },
  { labelKey: 'expiration1Year', value: String(365 * 24 * 60 * 60) },
] as const;

/**
 * Feature flag for enabling Public/Private key pair API keys.
 * When disabled (default), only PLAIN API keys are available.
 * Enable via query param: ?ffp_profile_api_key_public_private=true
 */
export const PUBLIC_PRIVATE_KEY_FLAG: FeatureFlagDefinition = {
  key: 'api_key_public_private',
  label: 'Public/Private API Keys',
  description: 'Enable public/private key pair authentication for API keys',
  scope: 'page',
  pageKey: 'profile',
  defaultValue: false,
};

/**
 * Feature flag for enabling API key request restrictions.
 * Enable via query param: ?ffp_profile_api_key_restrictions=true
 */
export const API_KEY_RESTRICTIONS_FLAG: FeatureFlagDefinition = {
  key: 'api_key_restrictions',
  label: 'API Key Restrictions',
  description: 'Enable request type, IP, and origin restrictions for API keys',
  scope: 'page',
  pageKey: 'profile',
  defaultValue: false,
};

export function CreateApiKeyDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: CreateApiKeyDialogProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const trpcClient = useTRPCClient();
  const { signTypedData } = useSignTypedData();
  const { connectedEthereumWallets } = useConnectedWallets();
  const { address: activeWalletAddress } = useAccount();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const pendingWalletConnectionResolve = useRef<(() => void) | null>(null);

  const [keyName, setKeyName] = useState('');
  const [keyType, setKeyType] = useState<KeyType>('PLAIN');
  const [publicKey, setPublicKey] = useState('');
  const [generatedPrivateKey, setGeneratedPrivateKey] = useState<string | null>(
    null,
  );
  const [expiresIn, setExpiresIn] = useState('0');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [signWithWallet, setSignWithWallet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingKeypair, setIsGeneratingKeypair] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Restriction state (for PLAIN keys only)
  const [allowBrowserRequests, setAllowBrowserRequests] = useState(false);
  const [allowServerRequests, setAllowServerRequests] = useState(false);
  const [allowedIpsText, setAllowedIpsText] = useState('');
  const [allowedOriginsText, setAllowedOriginsText] = useState('');
  const [showAdvancedRestrictions, setShowAdvancedRestrictions] =
    useState(false);

  // Feature flag to enable PUBLIC_PRIVATE key type
  const [enablePublicPrivateKeys] = useAdminFeatureFlag(
    PUBLIC_PRIVATE_KEY_FLAG,
  );
  const [enableApiKeyRestrictions] = useAdminFeatureFlag(
    API_KEY_RESTRICTIONS_FLAG,
  );

  const handleWalletConnected = useCallback((_walletAddress: string) => {
    if (pendingWalletConnectionResolve.current) {
      pendingWalletConnectionResolve.current();
      pendingWalletConnectionResolve.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    setKeyName('');
    setKeyType('PLAIN');
    setPublicKey('');
    setGeneratedPrivateKey(null);
    setExpiresIn('0');
    setSelectedWallet(null);
    setSignWithWallet(false);
    setCreatedKey(null);
    setStep('form');
    // Reset restrictions
    setAllowBrowserRequests(false);
    setAllowServerRequests(false);
    setAllowedIpsText('');
    setAllowedOriginsText('');
    setShowAdvancedRestrictions(false);
  }, []);

  /**
   * Generate a new secp256k1 keypair in the browser
   * Uses @noble/secp256k1 for cryptographically secure key generation
   */
  const handleGenerateKeypair = useCallback(async () => {
    try {
      setIsGeneratingKeypair(true);

      // Generate a random private key (32 bytes)
      const privateKeyBytes = secp256k1Utils.randomSecretKey();
      const privateKeyHex = bytesToHex(privateKeyBytes);

      // Derive the uncompressed public key (65 bytes, starts with 04)
      const publicKeyBytes = getPublicKey(privateKeyBytes, false);
      const publicKeyHex = bytesToHex(publicKeyBytes);

      // Set the keys
      setPublicKey(publicKeyHex);
      setGeneratedPrivateKey(privateKeyHex);

      toast.success(t('createApiKey.keypairGenerated'));
    } catch {
      toast.error(t('createApiKey.keypairGenerateFailure'));
    } finally {
      setIsGeneratingKeypair(false);
    }
  }, [t]);

  const handleCopyPrivateKey = useCallback(async () => {
    if (generatedPrivateKey) {
      await navigator.clipboard.writeText(generatedPrivateKey);
      toast.success(t('createApiKey.privateKeyCopied'));
    }
  }, [generatedPrivateKey, t]);

  const handleCopyPublicKey = useCallback(async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      toast.success(t('createApiKey.publicKeyCopied'));
    }
  }, [publicKey, t]);

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
    if (!keyName.trim()) {
      toast.error(t('createApiKey.enterKeyNameError'));
      return;
    }

    if (keyType === 'PUBLIC_PRIVATE' && !publicKey.trim()) {
      toast.error(t('createApiKey.enterPublicKeyError'));
      return;
    }

    if (signWithWallet) {
      const walletToUse = selectedWallet || activeWalletAddress;
      if (!walletToUse) {
        toast.error(t('createApiKey.selectWalletError'));
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Calculate expiration timestamp
      const expiresInSeconds = Number.parseInt(expiresIn, 10);
      const expiresAt =
        expiresInSeconds > 0
          ? Math.floor(Date.now() / 1000) + expiresInSeconds
          : 0;

      const canSetRestrictions =
        enableApiKeyRestrictions && keyType === 'PLAIN';

      // Parse IP and origin lists (one per line, filter empty lines)
      const allowedIps = allowedIpsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const allowedOrigins = allowedOriginsText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // Create the payload for signing (arrays as JSON strings for EIP-712)
      const signPayload = {
        keyName: keyName.trim(),
        keyType,
        publicKey: keyType === 'PUBLIC_PRIVATE' ? publicKey.trim() : '',
        expiresAt,
        allowedIps: JSON.stringify(canSetRestrictions ? allowedIps : []),
        allowedOrigins: JSON.stringify(
          canSetRestrictions ? allowedOrigins : [],
        ),
        allowBrowserRequests: canSetRestrictions ? allowBrowserRequests : true,
        allowServerRequests: canSetRestrictions ? allowServerRequests : true,
        timestamp: Math.floor(Date.now() / 1000),
      };

      let signature: string | undefined;

      if (signWithWallet) {
        const walletToUse = selectedWallet || activeWalletAddress;
        if (!walletToUse) {
          toast.error(t('createApiKey.selectWalletError'));
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
          types: CREATE_API_KEY_EIP712_TYPES,
          primaryType: 'CreateApiKey',
          message: signPayload,
          chainId: 1,
          walletAddress: walletToUse,
        });
      }

      // Create the API payload (arrays as actual arrays for tRPC)
      const payload = {
        keyName: keyName.trim(),
        keyType,
        publicKey: keyType === 'PUBLIC_PRIVATE' ? publicKey.trim() : '',
        expiresAt,
        allowedIps: canSetRestrictions ? allowedIps : [],
        allowedOrigins: canSetRestrictions ? allowedOrigins : [],
        allowBrowserRequests: canSetRestrictions ? allowBrowserRequests : true,
        allowServerRequests: canSetRestrictions ? allowServerRequests : true,
        timestamp: signPayload.timestamp,
      };

      // Create the API key
      const result = await trpcClient.apiKeys.create.mutate({
        ...(signature ? { signature } : {}),
        payload,
      });

      if (result.plainKey) {
        setCreatedKey(result.plainKey);
        setStep('success');
      } else if (keyType === 'PUBLIC_PRIVATE' && generatedPrivateKey) {
        // For PUBLIC_PRIVATE keys with generated keypair, show success with private key reminder
        setStep('success');
      } else {
        toast.success(t('createApiKey.createSuccess'));
        handleOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('rejected')) {
        toast.error(t('createApiKey.signatureRejected'));
      } else {
        toast.error(t('createApiKey.createFailure', { error: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      toast.success(t('createApiKey.apiKeyCopied'));
    }
  };

  const handleDone = () => {
    handleOpenChange(false);
    onSuccess();
  };

  return (
    <>
      <RequestWalletConnection
        ref={walletConnectionRef}
        onRequestedWalletConnected={handleWalletConnected}
        actionDescription={t('createApiKey.walletActionDescription')}
      />

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          {step === 'form' ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('createApiKey.title')}</DialogTitle>
                <DialogDescription>
                  {t('createApiKey.description')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Key Name */}
                <div className="space-y-2">
                  <Label htmlFor="keyName">{t('createApiKey.keyName')}</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder={t('createApiKey.keyNamePlaceholder')}
                  />
                </div>

                {/* Key Type */}
                <div className="space-y-2">
                  <Label htmlFor="keyType">{t('createApiKey.keyType')}</Label>
                  <Select
                    value={keyType}
                    onValueChange={(value) => {
                      if (!value) return;
                      setKeyType(value as KeyType);
                    }}
                  >
                    <SelectTrigger id="keyType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLAIN">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          <span>{t('createApiKey.keyTypePlain')}</span>
                        </div>
                      </SelectItem>
                      {enablePublicPrivateKeys && (
                        <SelectItem value="PUBLIC_PRIVATE">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>
                              {t('createApiKey.keyTypePublicPrivate')}
                            </span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {keyType === 'PLAIN'
                      ? t('createApiKey.keyTypeHelpPlain')
                      : t('createApiKey.keyTypeHelpPublicPrivate')}
                  </p>
                </div>

                {/* Restrictions (for PLAIN keys only) */}
                {enableApiKeyRestrictions && keyType === 'PLAIN' && (
                  <div className="space-y-4 rounded-lg border border-zinc-700 p-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        {t('createApiKey.requestTypes')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('createApiKey.requestTypesHelp')}
                      </p>

                      {/* Allow Browser Requests */}
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="allowBrowserRequests"
                          checked={allowBrowserRequests}
                          onCheckedChange={(checked) =>
                            setAllowBrowserRequests(checked === true)
                          }
                        />
                        <div className="space-y-1">
                          <label
                            htmlFor="allowBrowserRequests"
                            className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4" />
                            {t('createApiKey.allowBrowserRequests')}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {t('createApiKey.allowBrowserRequestsHelp')}
                          </p>
                        </div>
                      </div>

                      {/* Allow Server Requests */}
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="allowServerRequests"
                          checked={allowServerRequests}
                          onCheckedChange={(checked) =>
                            setAllowServerRequests(checked === true)
                          }
                        />
                        <div className="space-y-1">
                          <label
                            htmlFor="allowServerRequests"
                            className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                          >
                            <Server className="h-4 w-4" />
                            {t('createApiKey.allowServerRequests')}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {t('createApiKey.allowServerRequestsHelp')}
                          </p>
                        </div>
                      </div>

                      {/* Warning if neither is selected */}
                      {!allowBrowserRequests && !allowServerRequests && (
                        <div className="flex items-center gap-2 text-yellow-500 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{t('createApiKey.noRequestTypesWarning')}</span>
                        </div>
                      )}
                    </div>

                    {/* Advanced Restrictions Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowAdvancedRestrictions(!showAdvancedRestrictions)
                      }
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAdvancedRestrictions ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {t('createApiKey.advancedRestrictions')}
                    </button>

                    {showAdvancedRestrictions && (
                      <div className="space-y-4 pt-2">
                        {/* Allowed IPs */}
                        <div className="space-y-2">
                          <Label htmlFor="allowedIps">
                            {t('createApiKey.allowedIps')}
                          </Label>
                          <Textarea
                            id="allowedIps"
                            value={allowedIpsText}
                            onChange={(e) => setAllowedIpsText(e.target.value)}
                            placeholder="192.168.1.1&#10;10.0.0.0/8&#10;2001:db8::/32"
                            className="font-mono text-xs"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('createApiKey.allowedIpsHelp')}
                          </p>
                        </div>

                        {/* Allowed Origins (only if browser requests are enabled) */}
                        {allowBrowserRequests && (
                          <div className="space-y-2">
                            <Label htmlFor="allowedOrigins">
                              {t('createApiKey.allowedOrigins')}
                            </Label>
                            <Textarea
                              id="allowedOrigins"
                              value={allowedOriginsText}
                              onChange={(e) =>
                                setAllowedOriginsText(e.target.value)
                              }
                              placeholder="https://example.com&#10;https://*.example.com"
                              className="font-mono text-xs"
                              rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                              {t('createApiKey.allowedOriginsHelp')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Public/Private Key (for PUBLIC_PRIVATE only) */}
                {keyType === 'PUBLIC_PRIVATE' && (
                  <div className="space-y-4">
                    {/* Generate Keypair Button */}
                    <div className="flex items-center justify-between">
                      <Label>{t('createApiKey.keypair')}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateKeypair}
                        disabled={isGeneratingKeypair}
                        className="gap-2"
                      >
                        {isGeneratingKeypair ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {t('createApiKey.generateKeypair')}
                      </Button>
                    </div>

                    {/* Private Key (only shown if generated) */}
                    {generatedPrivateKey && (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-yellow-600 bg-yellow-950/50 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1 flex-1 min-w-0">
                              <p className="font-medium text-yellow-500 text-sm">
                                {t('createApiKey.savePrivateKeyNow')}
                              </p>
                              <p className="text-xs text-yellow-500/80">
                                {t('createApiKey.privateKeyNotStored')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Label htmlFor="privateKey">
                          {t('createApiKey.privateKeyLabel')}
                        </Label>
                        <div className="flex gap-2">
                          <Textarea
                            id="privateKey"
                            value={generatedPrivateKey}
                            readOnly
                            className="font-mono text-xs break-all resize-none"
                            rows={2}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleCopyPrivateKey}
                            className="flex-shrink-0 self-start"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Public Key */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="publicKey">
                          {t('createApiKey.publicKey')}
                        </Label>
                        {publicKey && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyPublicKey}
                            className="h-6 gap-1 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                            {t('createApiKey.copy')}
                          </Button>
                        )}
                      </div>
                      <Textarea
                        id="publicKey"
                        value={publicKey}
                        onChange={(e) => {
                          setPublicKey(e.target.value);
                          // Clear generated private key if user manually edits public key
                          if (generatedPrivateKey) {
                            setGeneratedPrivateKey(null);
                          }
                        }}
                        placeholder={t('createApiKey.publicKeyPlaceholder')}
                        className="font-mono text-xs break-all"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {generatedPrivateKey
                          ? t('createApiKey.publicKeyHelpGenerated')
                          : t('createApiKey.publicKeyHelpManual')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expiration */}
                <div className="space-y-2">
                  <Label htmlFor="expiration">
                    {t('createApiKey.expiration')}
                  </Label>
                  <Select
                    value={expiresIn}
                    onValueChange={(value) => {
                      if (!value) return;
                      setExpiresIn(value);
                    }}
                  >
                    <SelectTrigger id="expiration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`createApiKey.${option.labelKey}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional Wallet Signature */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="sign-with-wallet-create"
                      checked={signWithWallet}
                      onCheckedChange={(checked) =>
                        setSignWithWallet(checked === true)
                      }
                    />
                    <Label
                      htmlFor="sign-with-wallet-create"
                      className="flex items-center gap-2 cursor-pointer font-normal"
                    >
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {t('createApiKey.attestWithSignature')}{' '}
                        <span className="text-muted-foreground">
                          {t('createApiKey.optional')}
                        </span>
                      </span>
                    </Label>
                  </div>

                  {signWithWallet && (
                    <div className="space-y-2 ms-7">
                      <Label>{t('createApiKey.signingWallet')}</Label>
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
                              <span className="ms-auto text-xs text-muted-foreground">
                                {t('createApiKey.active')}
                              </span>
                            )}
                          </button>
                        ))}
                        {connectedEthereumWallets.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            {t('createApiKey.noWalletsConnected')}
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
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  {tCommon('actions.cancel')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting ||
                    !keyName.trim() ||
                    (signWithWallet && connectedEthereumWallets.length === 0) ||
                    (keyType === 'PUBLIC_PRIVATE' && !publicKey.trim())
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t('createApiKey.creating')}
                    </>
                  ) : (
                    t('createApiKey.createKey')
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  {t('createApiKey.createdTitle')}
                </DialogTitle>
                <DialogDescription>
                  {createdKey
                    ? t('createApiKey.createdDescriptionPlain')
                    : t('createApiKey.createdDescriptionKeypair')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-yellow-600 bg-yellow-950/50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-yellow-500">
                        {createdKey
                          ? t('createApiKey.saveApiKey')
                          : t('createApiKey.savePrivateKey')}
                      </p>
                      <p className="text-sm text-yellow-500/80">
                        {createdKey
                          ? t('createApiKey.saveApiKeyHelp')
                          : t('createApiKey.savePrivateKeyHelp')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show PLAIN API Key */}
                {createdKey && (
                  <div className="space-y-2">
                    <Label>{t('createApiKey.yourApiKey')}</Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={createdKey}
                        readOnly
                        className="font-mono text-xs break-all resize-none"
                        rows={2}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyKey}
                        className="flex-shrink-0 self-start"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Show PUBLIC_PRIVATE key details */}
                {!createdKey && generatedPrivateKey && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('createApiKey.yourPrivateKeyLabel')}</Label>
                      <div className="flex gap-2">
                        <Textarea
                          value={generatedPrivateKey}
                          readOnly
                          className="font-mono text-xs break-all resize-none"
                          rows={2}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyPrivateKey}
                          className="flex-shrink-0 self-start"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('createApiKey.yourPublicKeyLabel')}</Label>
                      <div className="flex gap-2">
                        <Textarea
                          value={publicKey}
                          readOnly
                          className="font-mono text-xs break-all resize-none"
                          rows={3}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyPublicKey}
                          className="flex-shrink-0 self-start"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('createApiKey.publicKeyRegisteredHelp')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button onClick={handleDone}>{t('createApiKey.done')}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
