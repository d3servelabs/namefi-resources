'use client';
import { NetworkLogo } from '@/components/network-logo';
import { CartCard } from '@/components/cart-card';
import { WalletEditableSelect } from '@/components/wallet-editable-select';
import {
  useLinkedWalletAddresses,
  useUserWalletAddresses,
} from '@/hooks/use-user-wallet-addresses';
import { useAllowedChains } from '@/hooks/use-allowed-chains';
import { useTRPC } from '@/lib/trpc';
import { getShortAddress } from '@/lib/string';
import { cn } from '@/lib/cn';
import { CHAINS, checksumWalletAddressSchema } from '@namefi-astra/utils';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { Loader2, CheckCircle2, Info, Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Button } from '@/components/ui/shadcn/button';
import { toast } from 'sonner';

type EnsCandidate = {
  original: string;
  normalized: string;
};

type EnsResolutionState =
  | { status: 'idle' }
  | { status: 'address'; address: string }
  | { status: 'resolving'; ensName: string }
  | { status: 'resolved'; ensName: string; address: string }
  | { status: 'not_found'; ensName: string }
  | { status: 'error'; ensName: string };

const isLikelyEnsName = (value: string) =>
  /^[^\s@]+\.[^\s@]+$/.test(value) &&
  !value.startsWith('.') &&
  !value.endsWith('.');

export interface NftWalletCardProps {
  onWalletAddressChange: (walletAddress: string | null) => void;
  selectedWalletAddress: string | null;
  disabled?: boolean;
}

export function NftWalletCard({
  onWalletAddressChange,
  selectedWalletAddress,
  disabled,
}: NftWalletCardProps) {
  const { chainIds } = useAllowedChains();

  const DefaultReceivingWalletChainId = chainIds.includes(CHAINS.base.id)
    ? CHAINS.base.id
    : CHAINS.sepolia.id;

  const trpc = useTRPC();
  const [inputValue, setInputValue] = useState<string>(
    selectedWalletAddress ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [ensCandidate, setEnsCandidate] = useState<EnsCandidate | null>(null);
  const [ensStatus, setEnsStatus] = useState<EnsResolutionState>(
    selectedWalletAddress
      ? { status: 'address', address: selectedWalletAddress }
      : { status: 'idle' },
  );
  const latestEnsRequestRef = useRef(0);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

  const { mutateAsync: resolveEnsMutation } = useMutation(
    trpc.users.resolveEnsName.mutationOptions(),
  );

  const { userWalletAddresses, userWalletsReady } = useUserWalletAddresses();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const hasAutoSelectedDefault = useRef(false);

  const { options, optionsReady } = useMemo(() => {
    if (!(linkedWalletsReady && userWalletsReady)) {
      return { options: [], optionsReady: false };
    }

    const options: { walletAddress: string; isLinkedWallet: boolean }[] =
      userWalletAddresses.map((walletAddress) => {
        if (linkedWalletAddresses.includes(walletAddress)) {
          return { walletAddress, isLinkedWallet: true };
        }

        return { walletAddress, isLinkedWallet: false };
      });

    return { options, optionsReady: true };
  }, [
    linkedWalletAddresses,
    linkedWalletsReady,
    userWalletAddresses,
    userWalletsReady,
  ]);

  // Pre-select the first connected wallet the first time options become ready.
  useEffect(() => {
    if (selectedWalletAddress) {
      hasAutoSelectedDefault.current = true;
      return;
    }

    if (
      !hasAutoSelectedDefault.current &&
      optionsReady &&
      userWalletAddresses.length > 0
    ) {
      const defaultWallet = userWalletAddresses[0];
      if (defaultWallet) {
        hasAutoSelectedDefault.current = true;
        latestEnsRequestRef.current += 1;
        setInputValue(defaultWallet);
        setEnsCandidate(null);
        setEnsStatus({ status: 'address', address: defaultWallet });
        setError(null);
        onWalletAddressChange(defaultWallet);
      }
    }
  }, [
    selectedWalletAddress,
    optionsReady,
    userWalletAddresses,
    onWalletAddressChange,
  ]);

  useEffect(() => {
    if (
      selectedWalletAddress &&
      ensStatus.status !== 'resolved' &&
      selectedWalletAddress !== inputValue
    ) {
      setInputValue(selectedWalletAddress);
      setEnsStatus({ status: 'address', address: selectedWalletAddress });
      setError(null);
    }
  }, [selectedWalletAddress, ensStatus.status, inputValue]);

  const [debouncedEnsCandidate] = useDebounceValue(ensCandidate, 350);

  useEffect(() => {
    if (!debouncedEnsCandidate) {
      return;
    }

    const { original, normalized } = debouncedEnsCandidate;
    const requestId = latestEnsRequestRef.current + 1;
    latestEnsRequestRef.current = requestId;
    let isActive = true;

    const resolveEns = async () => {
      setEnsStatus({ status: 'resolving', ensName: original });
      try {
        const result = await resolveEnsMutation({
          ensName: normalized,
        });

        if (!isActive || latestEnsRequestRef.current !== requestId) {
          return;
        }

        if (result.address) {
          setEnsStatus({
            status: 'resolved',
            ensName: original,
            address: result.address,
          });
          setError(null);
          onWalletAddressChange(result.address);
        } else {
          setEnsStatus({ status: 'not_found', ensName: original });
          setError(`We couldn't find a wallet for ${original}`);
          onWalletAddressChange(null);
        }
      } catch (mutationError) {
        if (!isActive || latestEnsRequestRef.current !== requestId) {
          return;
        }

        setEnsStatus({ status: 'error', ensName: original });
        console.error('Failed to resolve ENS name', mutationError);
        setError('We had trouble resolving that ENS name. Try again shortly.');
        onWalletAddressChange(null);
      } finally {
        if (isActive && latestEnsRequestRef.current === requestId) {
          setEnsCandidate(null);
        }
      }
    };

    void resolveEns();

    return () => {
      isActive = false;
    };
  }, [debouncedEnsCandidate, resolveEnsMutation, onWalletAddressChange]);

  const handleWalletAddressChange = useCallback(
    (value: string) => {
      setInputValue(value);
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        latestEnsRequestRef.current += 1;
        setError(null);
        setEnsCandidate(null);
        setEnsStatus({ status: 'idle' });
        onWalletAddressChange(null);
        return;
      }
      const parsedAddress = checksumWalletAddressSchema.safeParse(trimmed);
      if (parsedAddress.success) {
        latestEnsRequestRef.current += 1;
        setError(null);
        setEnsCandidate(null);
        setEnsStatus({ status: 'address', address: parsedAddress.data });
        onWalletAddressChange(parsedAddress.data);
        return;
      }
      if (isLikelyEnsName(trimmed)) {
        setEnsCandidate({
          original: trimmed,
          normalized: trimmed.toLowerCase(),
        });
        setEnsStatus({ status: 'resolving', ensName: trimmed });
        setError(null);
        onWalletAddressChange(null);
        return;
      }
      latestEnsRequestRef.current += 1;
      setEnsCandidate(null);
      setEnsStatus({ status: 'idle' });
      setError('Enter a valid wallet address or ENS name');
      onWalletAddressChange(null);
    },
    [onWalletAddressChange],
  );

  const baseHelpMessage =
    'Paste a wallet address or ENS name to receive your domains.';

  const statusMeta = useMemo(() => {
    switch (ensStatus.status) {
      case 'address':
        return {
          message: `Ready to send to ${getShortAddress(ensStatus.address)}`,
          icon: (
            <CheckCircle2
              className="size-4 text-emerald-500"
              aria-hidden="true"
            />
          ),
          className: 'text-emerald-500 dark:text-emerald-400',
          address: ensStatus.address,
          ensName: null,
        };
      case 'resolving':
        return {
          message: `Resolving ${ensStatus.ensName}…`,
          icon: (
            <Loader2
              className="size-4 animate-spin text-secondary-foreground/60"
              aria-hidden="true"
            />
          ),
          className: 'text-secondary-foreground/60',
          address: null,
          ensName: ensStatus.ensName,
        };
      case 'resolved':
        return {
          message: `Resolved ${ensStatus.ensName} to ${getShortAddress(
            ensStatus.address,
          )}`,
          icon: (
            <CheckCircle2
              className="size-4 text-emerald-500"
              aria-hidden="true"
            />
          ),
          className: 'text-emerald-500 dark:text-emerald-400',
          address: ensStatus.address,
          ensName: ensStatus.ensName,
        };
      default:
        return {
          message: '',
          icon: null,
          className: 'text-secondary-foreground/60',
          address: null,
          ensName: null,
        };
    }
  }, [ensStatus]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyAddress = useCallback((address: string) => {
    if (!address || typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API is not available');
      return;
    }
    void navigator.clipboard
      .writeText(address)
      .then(() => {
        if (copyTimeoutRef.current) {
          window.clearTimeout(copyTimeoutRef.current);
        }
        setCopiedAddress(address);
        toast('Address copied', {
          description: 'Resolved wallet address copied to clipboard',
        });
        copyTimeoutRef.current = window.setTimeout(() => {
          setCopiedAddress((current) => (current === address ? null : current));
        }, 2000);
      })
      .catch((error) => {
        console.error('Failed to copy wallet address', error);
        toast.error('Copy failed', {
          description: 'We could not copy that address. Please try again.',
        });
      });
  }, []);

  useEffect(() => {
    if (copiedAddress && copiedAddress !== statusMeta.address) {
      setCopiedAddress(null);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = null;
      }
    }
  }, [statusMeta.address, copiedAddress]);

  const helpContent = (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col gap-1 text-muted-foreground">
        <span className="flex items-center gap-2 text-sm">
          <span>{baseHelpMessage}</span>
        </span>
        <div
          className={cn(
            'flex items-center gap-2 text-sm min-h-[1.25rem] transition-opacity',
            statusMeta.message ? 'opacity-100' : 'opacity-0',
            statusMeta.className,
          )}
          aria-live="polite"
        >
          {statusMeta.icon}
          {statusMeta.address ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="link" className="px-0">
                  {statusMeta.message}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" sideOffset={8}>
                <div className="flex flex-col gap-2">
                  {statusMeta.ensName ? (
                    <span className="text-xs">
                      Resolved from {statusMeta.ensName}
                    </span>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs">
                      {statusMeta.address}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleCopyAddress(statusMeta.address!);
                      }}
                    >
                      {copiedAddress === statusMeta.address ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">Copy resolved address</span>
                    </Button>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>{statusMeta.message}</span>
          )}
        </div>
      </div>
    </TooltipProvider>
  );

  return (
    <CartCard title="Receiving Wallet or ENS">
      <WalletEditableSelect
        value={inputValue}
        onValueChange={handleWalletAddressChange}
        options={options}
        placeholder={
          userWalletAddresses.length > 0
            ? 'Paste a wallet address or ENS name, or select from connected wallets'
            : 'Paste a wallet address or ENS name to receive domains'
        }
        error={error || undefined}
        disabled={!optionsReady || disabled}
        helpText={helpContent}
        icon={
          <NetworkLogo
            network={DefaultReceivingWalletChainId}
            className="size-4"
          />
        }
      />
    </CartCard>
  );
}
