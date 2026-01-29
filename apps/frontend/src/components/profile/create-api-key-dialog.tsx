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
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Textarea } from '@/components/ui/shadcn/textarea';
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
  Hash,
  CheckCircle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import * as secp256k1 from '@noble/secp256k1';

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
    { name: 'timestamp', type: 'uint256' },
  ],
};

interface CreateApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type KeyType = 'PLAIN' | 'PUBLIC_PRIVATE' | 'HMAC';

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
const PUBLIC_PRIVATE_KEY_FLAG: FeatureFlagDefinition = {
  key: 'api_key_public_private',
  label: 'Public/Private API Keys',
  description: 'Enable public/private key pair authentication for API keys',
  scope: 'page',
  pageKey: 'profile',
  defaultValue: false,
};

/**
 * Feature flag for enabling HMAC API keys.
 * When disabled (default), HMAC keys are not available.
 * Enable via query param: ?ffp_profile_api_key_hmac=true
 */
const HMAC_KEY_FLAG: FeatureFlagDefinition = {
  key: 'api_key_hmac',
  label: 'HMAC API Keys',
  description: 'Enable HMAC-SHA256 signed authentication for API keys',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingKeypair, setIsGeneratingKeypair] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  // Feature flags to enable different key types
  const [enablePublicPrivateKeys] = useAdminFeatureFlag(
    PUBLIC_PRIVATE_KEY_FLAG,
  );
  const [enableHmacKeys] = useAdminFeatureFlag(HMAC_KEY_FLAG);

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
    setCreatedKey(null);
    setStep('form');
    setIsKeyVisible(false);
  }, []);

  /**
   * Generate a new secp256k1 keypair in the browser
   * Uses @noble/secp256k1 for cryptographically secure key generation
   */
  const handleGenerateKeypair = useCallback(async () => {
    try {
      setIsGeneratingKeypair(true);

      // Generate a random private key (32 bytes)
      const privateKeyBytes = secp256k1.utils.randomSecretKey();
      const privateKeyHex = bytesToHex(privateKeyBytes);

      // Derive the uncompressed public key (65 bytes, starts with 04)
      const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes, false);
      const publicKeyHex = bytesToHex(publicKeyBytes);

      // Set the keys
      setPublicKey(publicKeyHex);
      setGeneratedPrivateKey(privateKeyHex);

      toast.success('Keypair generated! Make sure to save your private key.');
    } catch (error) {
      console.error('Failed to generate keypair:', error);
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
    if (keyType === 'HMAC') {
      toast.error('HMAC is not implemented yet');
      return;
    }
    if (!keyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    if (keyType === 'PUBLIC_PRIVATE' && !publicKey.trim()) {
      toast.error('Please enter a public key');
      return;
    }

    const walletToUse = selectedWallet || activeWalletAddress;
    if (!walletToUse) {
      toast.error('Please select a wallet to sign with');
      return;
    }

    try {
      setIsSubmitting(true);

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

      // Calculate expiration timestamp
      const expiresInSeconds = Number.parseInt(expiresIn, 10);
      const expiresAt =
        expiresInSeconds > 0
          ? Math.floor(Date.now() / 1000) + expiresInSeconds
          : 0;

      // Create the payload for signing (arrays as JSON strings for EIP-712)
      const signPayload = {
        keyName: keyName.trim(),
        keyType,
        publicKey: keyType === 'PUBLIC_PRIVATE' ? publicKey.trim() : '',
        expiresAt,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Sign the payload
      const signature = await signTypedData({
        types: CREATE_API_KEY_EIP712_TYPES,
        primaryType: 'CreateApiKey',
        message: signPayload,
        chainId: 1,
      });

      // Create the API payload (arrays as actual arrays for tRPC)
      const payload = {
        keyName: keyName.trim(),
        keyType,
        publicKey: keyType === 'PUBLIC_PRIVATE' ? publicKey.trim() : '',
        expiresAt,
        timestamp: signPayload.timestamp,
      };

      // Create the API key
      const result = await trpcClient.apiKeys.create.mutate({
        signature,
        payload,
      });

      if (result.plainKey) {
        // For PLAIN and HMAC keys, the secret is returned in plainKey
        setCreatedKey(result.plainKey);
        setIsKeyVisible(false);
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
                  This action requires a wallet signature for security.
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
                    onValueChange={(value) => setKeyType(value as KeyType)}
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
                      {enableHmacKeys && (
                        <SelectItem value="HMAC">
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            <span>HMAC Signed Key</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {keyType === 'PLAIN'
                      ? 'A random API key will be generated. You must save it securely.'
                      : keyType === 'PUBLIC_PRIVATE'
                        ? 'Provide your public key. Sign requests with your private key.'
                        : 'A secret key will be generated. Use it to sign each request with HMAC-SHA256.'}
                  </p>
                </div>

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
                  <Select value={expiresIn} onValueChange={setExpiresIn}>
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

                {/* Wallet Selection */}
                <div className="space-y-2">
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
                    connectedEthereumWallets.length === 0 ||
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
                    ? keyType === 'HMAC'
                      ? "Your HMAC secret key has been created. Copy it now - you won't be able to see it again!"
                      : "Your API key has been created. Copy it now - you won't be able to see it again!"
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
                          ? keyType === 'HMAC'
                            ? 'Save your HMAC secret key'
                            : 'Save your API key'
                          : 'Save your Private Key'}
                      </p>
                      <p className="text-sm text-yellow-500/80">
                        {createdKey
                          ? keyType === 'HMAC'
                            ? 'This is the only time you will see your HMAC secret key. Use it to sign each API request with HMAC-SHA256.'
                            : 'This is the only time you will see your API key. Please copy it and store it securely.'
                          : 'Make sure you have copied and saved your private key. You will need it to sign API requests.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show PLAIN or HMAC API Key */}
                {createdKey && (
                  <div className="space-y-2">
                    <Label>
                      {keyType === 'HMAC'
                        ? 'Your HMAC Secret Key'
                        : 'Your API Key'}
                    </Label>
                    <div className="flex gap-2">
                      <Textarea
                        value={createdKey}
                        readOnly
                        className={`font-mono text-xs break-all resize-none ${
                          isKeyVisible ? '' : 'blur-xl select-none'
                        }`}
                        rows={2}
                      />
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleCopyKey}
                          className="flex-shrink-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsKeyVisible((prev) => !prev)}
                          className="flex-shrink-0"
                          aria-label={
                            isKeyVisible ? 'Hide API key' : 'View API key'
                          }
                        >
                          {isKeyVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {keyType === 'HMAC' && (
                      <p className="text-xs text-muted-foreground">
                        Use this secret key to sign requests with HMAC-SHA256.
                        Include headers: X-Namefi-Key-Id, X-Namefi-Timestamp,
                        X-Namefi-Signature
                      </p>
                    )}
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
