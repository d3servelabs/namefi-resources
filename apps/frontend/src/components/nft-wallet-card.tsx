'use client';
import { NetworkLogo } from '@/components/network-logo';
import { CartCard } from '@/components/cart-card';
import { WalletEditableSelect } from '@/components/wallet-editable-select';
import { UserWalletAvatar } from '@/components/user-avatar';
import {
  useLinkedWalletAddresses,
  useUserWalletAddresses,
} from '@/hooks/use-user-wallet-addresses';
import { getShortAddress } from '@/lib/string';
import { cn } from '@namefi-astra/ui/lib/cn';
import { CHAINS } from '@namefi-astra/utils/chains';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { Loader2, CheckCircle2, Copy, Check, Info } from 'lucide-react';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { useEnsAddress } from 'wagmi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useAllowedChains } from '@/hooks/use-allowed-chains';

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
  onChainIdChange?: (chainId: number) => void;
  selectedChainId?: number;
  parentDomain?: string;
  isLinkedOrUserConfirmed: boolean;
  onIsLinkedOrUserConfirmationChange: (confirmed: boolean) => void;
}

export function NftWalletCard({
  onWalletAddressChange,
  selectedWalletAddress,
  disabled,
  onChainIdChange,
  selectedChainId,
  parentDomain,
  isLinkedOrUserConfirmed: unlinkedWalletConfirmed,
  onIsLinkedOrUserConfirmationChange: onUnlinkedWalletConfirmationChange,
}: NftWalletCardProps) {
  const t = useTranslations('shared');
  const { defaultNftChainId: defaultChainId } = useAllowedChains(parentDomain);
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
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const copyTimeoutRef = useRef<number | null>(null);

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

  const [debouncedEnsCandidate] = useDebounceValue(ensCandidate, 300);
  const ensLookupName = debouncedEnsCandidate?.normalized ?? '';
  const ensDisplayName = debouncedEnsCandidate?.original ?? '';

  const {
    data: resolvedEnsAddress,
    isFetching: isEnsFetching,
    isFetched: isEnsFetched,
    isError: isEnsError,
  } = useEnsAddress({
    chainId: CHAINS.mainnet.id,
    name: ensLookupName || undefined,
    query: {
      enabled: Boolean(ensLookupName),
      retry: 1,
      staleTime: Number.POSITIVE_INFINITY,
    },
  });

  useEffect(() => {
    if (!ensCandidate) {
      return;
    }

    if (!ensLookupName || !ensDisplayName) {
      return;
    }

    if (isEnsFetching) {
      setEnsStatus((prev) => {
        if (prev.status === 'resolving' && prev.ensName === ensDisplayName) {
          return prev;
        }
        return { status: 'resolving', ensName: ensDisplayName };
      });
      setError(null);
      return;
    }

    if (isEnsError) {
      setEnsStatus((prev) => {
        if (prev.status === 'error' && prev.ensName === ensDisplayName) {
          return prev;
        }
        return { status: 'error', ensName: ensDisplayName };
      });
      setError('We had trouble resolving that ENS name. Try again shortly.');
      onWalletAddressChange(null);
      return;
    }

    if (isEnsFetched) {
      if (resolvedEnsAddress) {
        const address = resolvedEnsAddress as string;
        setEnsStatus((prev) => {
          if (
            prev.status === 'resolved' &&
            prev.address === address &&
            prev.ensName === ensDisplayName
          ) {
            return prev;
          }
          return {
            status: 'resolved',
            ensName: ensDisplayName,
            address,
          };
        });
        setError(null);
        onWalletAddressChange(address);
      } else {
        setEnsStatus((prev) => {
          if (prev.status === 'not_found' && prev.ensName === ensDisplayName) {
            return prev;
          }
          return { status: 'not_found', ensName: ensDisplayName };
        });
        setError(`We couldn't find a wallet for ${ensDisplayName}`);
        onWalletAddressChange(null);
      }
    }
  }, [
    ensCandidate,
    ensLookupName,
    ensDisplayName,
    isEnsFetching,
    isEnsFetched,
    isEnsError,
    resolvedEnsAddress,
    onWalletAddressChange,
  ]);

  const handleWalletAddressChange = useCallback(
    (value: string | null) => {
      if (!value) {
        setInputValue('');
        setError(null);
        setEnsCandidate(null);
        setEnsStatus({ status: 'idle' });
        onWalletAddressChange(null);
        return;
      }
      setInputValue(value);
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        setError(null);
        setEnsCandidate(null);
        setEnsStatus({ status: 'idle' });
        onWalletAddressChange(null);
        return;
      }
      const parsedAddress = checksumWalletAddressSchema.safeParse(trimmed);
      if (parsedAddress.success) {
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
      setEnsCandidate(null);
      setEnsStatus({ status: 'idle' });
      setError('Enter a valid wallet address or ENS name');
      onWalletAddressChange(null);
    },
    [onWalletAddressChange],
  );

  const isSelectedWalletLinked = useMemo(() => {
    if (!selectedWalletAddress) {
      return true;
    }
    if (!linkedWalletsReady) {
      return true;
    }
    const normalizedSelected = selectedWalletAddress.toLowerCase();
    return linkedWalletAddresses.some(
      (address) => address.toLowerCase() === normalizedSelected,
    );
  }, [linkedWalletAddresses, linkedWalletsReady, selectedWalletAddress]);

  const showUnlinkedWalletWarning =
    Boolean(selectedWalletAddress) &&
    linkedWalletsReady &&
    !isSelectedWalletLinked;

  useEffect(() => {
    onUnlinkedWalletConfirmationChange(!showUnlinkedWalletWarning);
  }, [onUnlinkedWalletConfirmationChange, showUnlinkedWalletWarning]);

  const baseHelpMessage =
    'Paste a wallet address or ENS name to receive your domains.';

  const statusMeta = useMemo(() => {
    switch (ensStatus.status) {
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
      case 'not_found':
        return {
          message: `No wallet found for ${ensStatus.ensName}`,
          icon: (
            <Info
              className="size-4 text-secondary-foreground/70"
              aria-hidden="true"
            />
          ),
          className: 'text-secondary-foreground/70',
          address: null,
          ensName: ensStatus.ensName,
        };
      case 'error':
        return {
          message: `We couldn't resolve ${ensStatus.ensName}`,
          icon: <Info className="size-4 text-destructive" aria-hidden="true" />,
          className: 'text-destructive',
          address: null,
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
    <TooltipProvider delay={100}>
      <div className="flex flex-col gap-1 text-muted-foreground">
        <span className="flex items-center gap-2 text-sm">
          <Info className="size-4" aria-hidden="true" />
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
              <TooltipTrigger
                render={
                  <Button type="button" variant="link" className="px-0" />
                }
              >
                {statusMeta.message}
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
                        handleCopyAddress(statusMeta.address);
                      }}
                    >
                      {copiedAddress === statusMeta.address ? (
                        <Check className="size-4" aria-hidden="true" />
                      ) : (
                        <Copy className="size-4" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {t('nftWalletCard.copyResolvedAddress')}
                      </span>
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

  const leadingIcon = useMemo(() => {
    if (statusMeta.address) {
      return (
        <UserWalletAvatar
          address={statusMeta.address}
          className="size-5 rounded-full"
        />
      );
    }

    return (
      <NetworkLogo
        network={selectedChainId ?? defaultChainId}
        className="size-4"
      />
    );
  }, [defaultChainId, selectedChainId, statusMeta.address]);

  return (
    <CartCard title={t('nftWalletCard.title')}>
      <div className="flex items-start gap-2">
        <WalletEditableSelect
          onChainIdChange={onChainIdChange}
          selectedChainId={selectedChainId}
          parentDomain={parentDomain}
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
          icon={leadingIcon}
        />
      </div>
      {showUnlinkedWalletWarning && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 text-emerald-500" />
            <p>
              Purchasing for another wallet? This domain won&apos;t appear under{' '}
              <span className="font-semibold text-nowrap whitespace-nowrap">
                "My Domains"
              </span>{' '}
              in this account.
            </p>
          </div>
          <label
            className="flex items-center gap-2 text-sm font-medium"
            htmlFor="unlinked-wallet-confirm-checkbox"
          >
            <Checkbox
              id="unlinked-wallet-confirm-checkbox"
              checked={unlinkedWalletConfirmed}
              onCheckedChange={(checked) => {
                onUnlinkedWalletConfirmationChange(checked === true);
              }}
            />
            <span>
              I&apos;m purchasing for a wallet not linked to this account.
            </span>
          </label>
        </div>
      )}
    </CartCard>
  );
}
