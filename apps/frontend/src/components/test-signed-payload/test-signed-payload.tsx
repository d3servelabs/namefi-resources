'use client';

import { useState, useRef } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { useTRPCClient } from '@/lib/trpc';
import { useSignTypedData } from '@/hooks/use-sign-typed-data';
import {
  RequestWalletConnection,
  type RequestWalletConnectionRef,
} from '@/components/dialogs/request-wallet-connection';
import { useAuth } from '@/hooks/use-auth';
import { useConnectedWallets } from '@/hooks/use-user-wallet-addresses';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { PageShell } from '@/components/page-shell';

/**
 * EIP-712 types for the test payload.
 * Must match the backend TEST_SIGNED_PAYLOAD_EIP712_TYPES.
 */
const TEST_SIGNED_PAYLOAD_EIP712_TYPES: Record<
  string,
  Array<{ name: string; type: string }>
> = {
  TestPayload: [
    { name: 'message', type: 'string' },
    { name: 'timestamp', type: 'uint256' },
  ],
};

export function TestSignedPayload() {
  const trpcClient = useTRPCClient();
  const { signTypedData } = useSignTypedData();
  const { isAuthenticated, ready } = useAuth();
  const { connectedEthereumWallets } = useConnectedWallets();
  const { address: activeWalletAddress } = useAccount();
  const walletConnectionRef = useRef<RequestWalletConnectionRef>(null);
  const pendingWalletConnectionResolve = useRef<(() => void) | null>(null);

  const [message, setMessage] = useState('Hello, this is a test message!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleWalletConnected = (_walletAddress: string) => {
    if (pendingWalletConnectionResolve.current) {
      pendingWalletConnectionResolve.current();
      pendingWalletConnectionResolve.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const walletToUse = selectedWallet || activeWalletAddress;
    if (!walletToUse) {
      toast.error('Please select a wallet');
      return;
    }

    try {
      setIsSubmitting(true);
      setResult(null);

      // Request connection to the selected wallet
      await new Promise<void>((resolve, reject) => {
        const currentRef = walletConnectionRef.current;
        if (!currentRef) {
          reject(new Error('Wallet connection component not ready'));
          return;
        }

        pendingWalletConnectionResolve.current = resolve;
        currentRef.requestWalletConnection(walletToUse);
      });

      // Create the payload
      const payload = {
        message: message.trim(),
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Sign the payload with EIP-712
      const signature = await signTypedData({
        types: TEST_SIGNED_PAYLOAD_EIP712_TYPES,
        primaryType: 'TestPayload',
        message: payload,
        chainId: 1,
      });

      // Send to backend
      const response =
        await trpcClient.testSignedPayload.testSignedEndpoint.mutate({
          signature,
          payload,
        });

      setResult({ success: true, data: response });
      toast.success('Payload verified successfully!');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });

      if (errorMessage.includes('rejected')) {
        toast.error('Signature request was rejected');
      } else {
        toast.error(`Failed: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageShell
        padding="none"
        shellClassName="max-w-2xl mx-auto p-8"
        gutter={false}
      >
        <Card>
          <CardHeader>
            <CardTitle>Test Signed Payload</CardTitle>
            <CardDescription>
              Please log in to test the signed payload functionality.
            </CardDescription>
          </CardHeader>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      padding="none"
      shellClassName="max-w-2xl mx-auto p-8"
      gutter={false}
    >
      <RequestWalletConnection
        ref={walletConnectionRef}
        onRequestedWalletConnected={handleWalletConnected}
        actionDescription="to sign the test payload"
      />

      <Card>
        <CardHeader>
          <CardTitle>Test Signed Payload</CardTitle>
          <CardDescription>
            Test the EIP-712 signed payload functionality. This will sign a
            message with your wallet and verify it on the backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Selection */}
          <div className="space-y-2">
            <Label>Select Wallet to Sign With</Label>
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
                >
                  <Wallet className="h-5 w-5" />
                  <span className="font-mono text-sm">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
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

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to Sign</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a test message..."
            />
            <p className="text-xs text-muted-foreground">
              This message will be included in the EIP-712 typed data and
              displayed in your wallet for confirmation.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !message.trim() ||
              connectedEthereumWallets.length === 0
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing & Verifying...
              </>
            ) : (
              'Sign & Submit Payload'
            )}
          </Button>

          {/* Result Display */}
          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success
                  ? 'border-green-600 bg-green-950/50'
                  : 'border-red-600 bg-red-950/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-500">
                      Verification Successful
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-500">
                      Verification Failed
                    </span>
                  </>
                )}
              </div>
              <pre className="text-xs overflow-auto p-2 bg-black/50 rounded">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          )}

          {/* Info Section */}
          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900/50">
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Select a wallet from your connected wallets</li>
              <li>Enter a message to include in the payload</li>
              <li>Click "Sign & Submit" to sign with EIP-712</li>
              <li>Your wallet will show the typed data for confirmation</li>
              <li>
                Backend verifies the signature matches your authenticated
                account
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
