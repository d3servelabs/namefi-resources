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
  { label: 'Never', value: '0' },
  { label: '30 days', value: String(30 * 24 * 60 * 60) },
  { label: '90 days', value: String(90 * 24 * 60 * 60) },
  { label: '1 year', value: String(365 * 24 * 60 * 60) },
];

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

      toast.success('Keypair generated! Make sure to save your private key.');
    } catch {
      toast.error('Failed to generate keypair');
    } finally {
      setIsGeneratingKeypair(false);
    }
  }, []);

  const handleCopyPrivateKey = useCallback(async () => {
    if (generatedPrivateKey) {
      await navigator.clipboard.writeText(generatedPrivateKey);
      toast.success('Private key copied to clipboard');
    }
  }, [generatedPrivateKey]);

  const handleCopyPublicKey = useCallback(async () => {
    if (publicKey) {
      await navigator.clipboard.writeText(publicKey);
      toast.success('Public key copied to clipboard');
    }
  }, [publicKey]);

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
      toast.error('Please enter a name for the API key');
      return;
    }

    if (keyType === 'PUBLIC_PRIVATE' && !publicKey.trim()) {
      toast.error('Please enter a public key');
      return;
    }

    if (signWithWallet) {
      const walletToUse = selectedWallet || activeWalletAddress;
      if (!walletToUse) {
        toast.error('Please select a wallet to sign with');
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
          toast.error('Please select a wallet to sign with');
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
        toast.success('API key created successfully');
        handleOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error(`Failed to create API key: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      toast.success('API key copied to clipboard');
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
        actionDescription="to create the API key"
      />

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          {step === 'form' ? (
            <>
              <DialogHeader>
                <DialogTitle>Create API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key for programmatic access to your account.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Key Name */}
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                  />
                </div>

                {/* Key Type */}
                <div className="space-y-2">
                  <Label htmlFor="keyType">Key Type</Label>
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
                          <span>Plain API Key</span>
                        </div>
                      </SelectItem>
                      {enablePublicPrivateKeys && (
                        <SelectItem value="PUBLIC_PRIVATE">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <span>Public/Private Key Pair</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {keyType === 'PLAIN'
                      ? 'A random API key will be generated. You must save it securely.'
                      : 'Provide your public key. Sign requests with your private key.'}
                  </p>
                </div>

                {/* Restrictions (for PLAIN keys only) */}
                {enableApiKeyRestrictions && keyType === 'PLAIN' && (
                  <div className="space-y-4 rounded-lg border border-zinc-700 p-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Request Types
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Select which types of requests this API key can make. At
                        least one must be enabled.
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
                            Allow browser requests
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Requests with an Origin header (e.g., from web
                            browsers)
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
                            Allow server requests
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Requests without an Origin header (e.g., from
                            backend servers)
                          </p>
                        </div>
                      </div>

                      {/* Warning if neither is selected */}
                      {!allowBrowserRequests && !allowServerRequests && (
                        <div className="flex items-center gap-2 text-yellow-500 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>
                            No request types enabled. The key will reject all
                            requests.
                          </span>
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
                      Advanced restrictions (IP & Origin)
                    </button>

                    {showAdvancedRestrictions && (
                      <div className="space-y-4 pt-2">
                        {/* Allowed IPs */}
                        <div className="space-y-2">
                          <Label htmlFor="allowedIps">
                            Allowed IP Addresses / CIDR Ranges
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
                            One IP or CIDR per line. Supports IPv4 and IPv6.
                            Leave empty to allow all IPs.
                          </p>
                        </div>

                        {/* Allowed Origins (only if browser requests are enabled) */}
                        {allowBrowserRequests && (
                          <div className="space-y-2">
                            <Label htmlFor="allowedOrigins">
                              Allowed Origins
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
                              One origin per line. Supports wildcards (e.g.,
                              https://*.example.com). Leave empty to allow all
                              origins.
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
                      <Label>Keypair</Label>
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
                        Generate New Keypair
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
                                Save your Private Key now!
                              </p>
                              <p className="text-xs text-yellow-500/80">
                                This private key will not be stored. Copy and
                                save it securely.
                              </p>
                            </div>
                          </div>
                        </div>
                        <Label htmlFor="privateKey">
                          Private Key (save this!)
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
                        <Label htmlFor="publicKey">Public Key</Label>
                        {publicKey && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyPublicKey}
                            className="h-6 gap-1 text-xs"
                          >
                            <Copy className="h-3 w-3" />
                            Copy
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
                        placeholder="04abc123... (uncompressed secp256k1 public key)"
                        className="font-mono text-xs break-all"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        {generatedPrivateKey
                          ? 'This public key was generated from your private key above.'
                          : 'Enter your uncompressed secp256k1 public key (65 bytes, 130 hex characters starting with 04), or click "Generate New Keypair" to create one.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Expiration */}
                <div className="space-y-2">
                  <Label htmlFor="expiration">Expiration</Label>
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
                          {option.label}
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
                        Attest with wallet signature{' '}
                        <span className="text-muted-foreground">
                          (optional)
                        </span>
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
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Key'
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  API Key Created
                </DialogTitle>
                <DialogDescription>
                  {createdKey
                    ? "Your API key has been created. Copy it now - you won't be able to see it again!"
                    : 'Your API key has been created. Make sure you have saved your private key!'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="rounded-lg border border-yellow-600 bg-yellow-950/50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-yellow-500">
                        {createdKey
                          ? 'Save your API key'
                          : 'Save your Private Key'}
                      </p>
                      <p className="text-sm text-yellow-500/80">
                        {createdKey
                          ? 'This is the only time you will see your API key. Please copy it and store it securely.'
                          : 'Make sure you have copied and saved your private key. You will need it to sign API requests.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show PLAIN API Key */}
                {createdKey && (
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
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
                      <Label>Your Private Key (save this!)</Label>
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
                      <Label>Your Public Key (registered)</Label>
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
                        This public key has been registered. Use the private key
                        above to sign your API requests.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <Button onClick={handleDone}>Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
