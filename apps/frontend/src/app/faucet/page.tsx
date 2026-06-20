'use client';

import { useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Droplet, ExternalLink, Loader2, TriangleAlert } from 'lucide-react';
import { CHAINS as chains } from '@namefi-astra/utils/chains';
import { useIsClient } from 'usehooks-ts';
import { useTRPC } from '@/lib/trpc';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { WalletEditableSelect } from '@/components/wallet-editable-select';
import { NetworkLogo } from '@/components/network-logo';
import type {
  AltchaVerifierRef,
  AltchaProps,
} from '@/components/newsletter/altcha-verifier';
import {
  useLinkedWalletAddresses,
  useUserWalletAddresses,
} from '@/hooks/use-user-wallet-addresses';

const AltchaVerifierDynamic = dynamic(
  () => import('@/components/newsletter/altcha-verifier'),
  {
    ssr: false,
    loading: () => <div className="h-12 rounded-md bg-muted animate-pulse" />,
  },
);

const AltchaVerifier = forwardRef<AltchaVerifierRef, AltchaProps>(
  (props, ref) => (
    <AltchaVerifierDynamic {...props} ref={ref as unknown as never} />
  ),
);

const SEPOLIA = {
  id: chains.sepolia.id,
  label: 'Sepolia',
};

type RequestStatus =
  | 'idle'
  | 'started'
  | 'rate_limited'
  | 'completed'
  | 'error';

export default function FaucetPage() {
  const t = useTranslations('faucet');
  const isClient = useIsClient();
  const trpc = useTRPC();
  const altchaRef = useRef<AltchaVerifierRef>(null);
  const hasAutoSelected = useRef(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [nextEligibleAt, setNextEligibleAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { userWalletAddresses, userWalletsReady } = useUserWalletAddresses();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();

  const { options, optionsReady } = useMemo(() => {
    if (!(linkedWalletsReady && userWalletsReady)) {
      return { options: [], optionsReady: false };
    }

    const options = userWalletAddresses.map((address) => ({
      walletAddress: address,
      isLinkedWallet: linkedWalletAddresses.includes(address),
    }));

    return { options, optionsReady: true };
  }, [
    linkedWalletAddresses,
    linkedWalletsReady,
    userWalletAddresses,
    userWalletsReady,
  ]);

  useEffect(() => {
    if (!optionsReady || hasAutoSelected.current || walletAddress) {
      return;
    }
    if (options.length > 0) {
      setWalletAddress(options[0].walletAddress);
      hasAutoSelected.current = true;
    }
  }, [options, optionsReady, walletAddress]);

  const faucetMutation = useMutation(
    trpc.users.requestNfscFaucet.mutationOptions({
      onSuccess: (data) => {
        setErrorMessage(null);
        setTxHash(null);
        setWorkflowId(null);
        setNextEligibleAt(data.nextEligibleAt ?? null);

        if (data.status === 'rate_limited') {
          setStatus('rate_limited');
          return;
        }

        setStatus('started');
        setWorkflowId(data.workflowId);
      },
      onError: (error) => {
        setStatus('error');
        setErrorMessage(error.message);
      },
    }),
  );

  const faucetStatusQuery = useQuery(
    trpc.users.getNfscFaucetStatus.queryOptions(
      { workflowId: workflowId ?? '' },
      {
        enabled: Boolean(workflowId),
        refetchInterval: (query) => {
          const data = query.state.data;
          if (!data) return 4000;
          if (
            data.status === 'COMPLETED' ||
            data.status === 'FAILED' ||
            data.status === 'TERMINATED' ||
            data.status === 'NOT_FOUND'
          ) {
            return false;
          }
          return 4000;
        },
      },
    ),
  );

  useEffect(() => {
    if (!faucetStatusQuery.data) return;

    if (faucetStatusQuery.data.txHash) {
      setTxHash(faucetStatusQuery.data.txHash);
      setStatus('completed');
      return;
    }

    if (faucetStatusQuery.data.status === 'NOT_FOUND') {
      setStatus('error');
      setErrorMessage('Workflow not found. Please retry the request.');
      return;
    }

    if (
      faucetStatusQuery.data.status === 'FAILED' ||
      faucetStatusQuery.data.status === 'TERMINATED'
    ) {
      setStatus('error');
      setErrorMessage('Mint workflow did not complete successfully.');
    }
  }, [faucetStatusQuery.data]);

  const isSubmitting = faucetMutation.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!walletAddress) {
      setStatus('error');
      setErrorMessage('Wallet address is required.');
      return;
    }

    const altcha = altchaRef.current?.value ?? null;
    if (!altcha) {
      setStatus('error');
      setErrorMessage('Altcha verification is required.');
      return;
    }

    setStatus('idle');
    faucetMutation.mutate({
      walletAddress,
      altcha,
    });
  };

  const formattedNextEligibleAt = nextEligibleAt
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(nextEligibleAt)
    : null;

  if (!isClient) return null;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplet className="size-5" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="chain">{t('chainLabel')}</Label>
              <Select value={SEPOLIA.id.toString()} disabled>
                <SelectTrigger id="chain">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEPOLIA.id.toString()}>
                    <div className="flex items-center gap-2">
                      <NetworkLogo network={SEPOLIA.id} className="size-4" />
                      {SEPOLIA.label}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('receivingWalletLabel')}</Label>
              <WalletEditableSelect
                value={walletAddress}
                onValueChange={setWalletAddress}
                options={options}
                placeholder={t('walletPlaceholder')}
                disabled={isSubmitting}
                selectedChainId={SEPOLIA.id}
                helpText={t('walletHelpText')}
              />
            </div>

            <AltchaVerifier ref={altchaRef} expire={120_000} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                <>
                  <Droplet className="me-2 size-4" />
                  {t('requestNfsc')}
                </>
              )}
            </Button>
          </form>

          {(status !== 'idle' || errorMessage) && (
            <div className="mt-6 space-y-3 rounded-md border border-border/60 bg-muted/40 p-4">
              {status === 'rate_limited' && (
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 size-5 text-amber-500" />
                  <div>
                    <p className="font-medium">{t('rateLimitedTitle')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('rateLimitedDescription', {
                        time:
                          formattedNextEligibleAt ?? t('rateLimitedFallback'),
                      })}
                    </p>
                  </div>
                </div>
              )}

              {status === 'started' && (
                <div className="flex items-start gap-3">
                  <Loader2 className="mt-0.5 size-5 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">{t('mintInProgressTitle')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('mintInProgressDescription')}
                    </p>
                  </div>
                </div>
              )}

              {status === 'completed' && txHash && (
                <div className="space-y-2">
                  <p className="font-medium">{t('mintCompleteTitle')}</p>
                  <a
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('viewTransaction')}
                    <ExternalLink className="size-4" />
                  </a>
                  <p className="text-xs text-muted-foreground break-all">
                    {txHash}
                  </p>
                </div>
              )}

              {status === 'error' && errorMessage && (
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 size-5 text-destructive" />
                  <div>
                    <p className="font-medium">{t('requestFailedTitle')}</p>
                    <p className="text-sm text-muted-foreground">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
