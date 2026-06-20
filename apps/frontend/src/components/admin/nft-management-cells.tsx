'use client';

import { format } from 'date-fns';
import { AlertTriangle, Copy, Flame, RefreshCw, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { getChain } from '@namefi-astra/utils/chains';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { AdminUserLookupButton } from '@/components/admin/user-details';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';
import type { AppRouterOutput } from '@/lib/trpc';

// Shared types + cell logic so the desktop table columns and the mobile card
// render identical values from the same source (switch layout, reuse logic).

export type NftManagementRow =
  AppRouterOutput['admin']['nft']['getNftsWithExpirationStatus']['data'][number];

export const formatDateOnly = (value: Date | string | null | undefined) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return format(date, 'yyyy-MM-dd');
};

export const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

export const getDomainStatusLabel = (
  domainStatus: NftManagementRow['domainStatus'],
) => {
  switch (domainStatus) {
    case 'expired':
      return 'Expired';
    case 'not-found':
      return 'Not Found';
    default:
      return 'Active';
  }
};

export const getNftStatusLabel = (nftStatus: NftManagementRow['nftStatus']) => {
  switch (nftStatus) {
    case 'expired':
      return 'Expired';
    case 'not-available':
      return 'N/A';
    default:
      return 'Active';
  }
};

export const getDateStateLabel = (dateState: NftManagementRow['dateState']) => {
  switch (dateState) {
    case 'missing-data':
      return 'Missing Data';
    case 'date-mismatch':
      return 'Date Mismatch';
    default:
      return 'Match';
  }
};

export const getAutoRenewLabel = (
  autoRenewEnabled: NftManagementRow['autoRenewEnabled'],
) => {
  if (autoRenewEnabled === null) {
    return 'Not set';
  }

  return autoRenewEnabled ? 'Enabled' : 'Disabled';
};

/** Chain logo + name. */
export function ChainCell({ chainId }: { chainId: number }) {
  const chain = getChain(chainId);

  return (
    <div className="flex items-center gap-2">
      <NetworkLogo network={chainId} className="size-5 bg-transparent" />
      <span className="text-xs text-muted-foreground">
        {chain?.name ?? `Chain ${chainId}`}
      </span>
    </div>
  );
}

/** Domain name with an optional "Powered by Namefi" badge. */
export function DomainNameCell({ row }: { row: NftManagementRow }) {
  return (
    <div className="flex flex-col gap-1">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={32}
        minCharactersToDisplay={16}
        className="font-medium"
      >
        {row.normalizedDomainName}
      </AutoTruncateTextV2>
      {row.isPoweredByNamefiDomain ? (
        <Badge variant="secondary" className="w-fit text-[10px]">
          Powered by Namefi
        </Badge>
      ) : null}
    </div>
  );
}

/** Checksummed owner address with avatar + copy-to-clipboard button. */
export function OwnerAddressCell({ row }: { row: NftManagementRow }) {
  const ownerAddress = attemptGetChecksummedAddress(row.ownerAddress);

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(ownerAddress);
      toast.success('Copied address successfully');
    } catch {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted px-2 py-1.5 max-w-full">
      <UserWalletAvatar
        address={ownerAddress}
        userId={row.userId ?? undefined}
        className="size-6"
      />
      <div className="min-w-0 flex-1">
        <AutoTruncateTextV2
          initialCharactersCountToDisplay={16}
          minCharactersToDisplay={10}
          className="font-mono text-xs"
        >
          {ownerAddress}
        </AutoTruncateTextV2>
      </div>
      <button
        type="button"
        onClick={handleCopyWallet}
        className="rounded p-1 transition-colors hover:bg-background"
        title="Copy address"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Auto-renew pill: green when enabled, secondary when disabled, outline when unset. */
export function AutoRenewBadge({
  autoRenewEnabled,
}: {
  autoRenewEnabled: NftManagementRow['autoRenewEnabled'];
}) {
  if (autoRenewEnabled === null) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        {getAutoRenewLabel(autoRenewEnabled)}
      </Badge>
    );
  }

  return autoRenewEnabled ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
      {getAutoRenewLabel(autoRenewEnabled)}
    </Badge>
  ) : (
    <Badge variant="secondary">{getAutoRenewLabel(autoRenewEnabled)}</Badge>
  );
}

/** Domain status pill. */
export function DomainStatusBadge({
  domainStatus,
}: {
  domainStatus: NftManagementRow['domainStatus'];
}) {
  if (domainStatus === 'not-found') {
    return <Badge variant="destructive">Not Found</Badge>;
  }

  return domainStatus === 'expired' ? (
    <Badge variant="destructive">Expired</Badge>
  ) : (
    <Badge>{getDomainStatusLabel(domainStatus)}</Badge>
  );
}

/** NFT status pill. */
export function NftStatusBadge({
  nftStatus,
}: {
  nftStatus: NftManagementRow['nftStatus'];
}) {
  if (nftStatus === 'not-available') {
    return <Badge variant="secondary">N/A</Badge>;
  }

  return nftStatus === 'expired' ? (
    <Badge variant="destructive">Expired</Badge>
  ) : (
    <Badge>{getNftStatusLabel(nftStatus)}</Badge>
  );
}

/** Date-state pill (match / missing-data / date-mismatch). */
export function DateStateBadge({
  dateState,
}: {
  dateState: NftManagementRow['dateState'];
}) {
  if (dateState === 'missing-data') {
    return <Badge variant="destructive">Missing Data</Badge>;
  }

  if (dateState === 'date-mismatch') {
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
        Date Mismatch
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
      {getDateStateLabel(dateState)}
    </Badge>
  );
}

/** Registrar key as an outline badge, or "N/A". */
export function RegistrarValue({
  registrarKey,
}: {
  registrarKey: NftManagementRow['registrarKey'];
}) {
  return registrarKey ? (
    <Badge variant="outline">{registrarKey}</Badge>
  ) : (
    <span className="text-muted-foreground">N/A</span>
  );
}

/** Inline user-id with the admin lookup button, or "-". */
export function UserIdValue({ userId }: { userId: string | null }) {
  if (!userId) return <>-</>;

  return (
    <div className="flex items-center gap-2">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={16}
        minCharactersToDisplay={12}
        className="font-mono text-xs"
      >
        {userId}
      </AutoTruncateTextV2>
      <AdminUserLookupButton reference={{ userId }} title="Open user details" />
    </div>
  );
}

/** Inline privy-user-id with the admin lookup button, or "-". */
export function PrivyUserIdValue({
  privyUserId,
}: {
  privyUserId: string | null;
}) {
  if (!privyUserId) return <>-</>;

  return (
    <div className="flex items-center gap-2">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={16}
        minCharactersToDisplay={12}
        className="font-mono text-xs"
      >
        {privyUserId}
      </AutoTruncateTextV2>
      <AdminUserLookupButton
        reference={{ privyUserId }}
        title="Open user details by Privy ID"
      />
    </div>
  );
}

/** "Yes"/"No" text for a boolean flag. */
export function YesNo({ value }: { value: boolean }) {
  return <>{value ? 'Yes' : 'No'}</>;
}

/** Truncated primary-email value, mirroring the desktop column, or "-". */
export function PrimaryEmailValue({
  primaryEmail,
}: {
  primaryEmail: string | null;
}) {
  return (
    <AutoTruncateTextV2
      initialCharactersCountToDisplay={20}
      minCharactersToDisplay={10}
    >
      {primaryEmail ?? '-'}
    </AutoTruncateTextV2>
  );
}

/**
 * Whether the actions cell would render any button for this row. The action
 * buttons each gate on the same flags; keep this predicate in sync with them so
 * callers (e.g. the mobile card) can omit an empty actions footer.
 */
export function rowHasActions(row: NftManagementRow): boolean {
  const showBurn = row.canBurn;
  const showFix = row.needsExpirationReview;
  const showRenew = !row.canBurn && !row.hasMissingData;
  return showBurn || showFix || showRenew;
}

// --- Action buttons -------------------------------------------------------
// Handlers are async (they call tRPC mutateAsync); their props keep the exact
// `=> Promise<...>` return type so the desktop columns and the card can both
// call them without narrowing to `void`.

export function BurnActionButton(props: {
  row: NftManagementRow;
  isBurning: boolean;
  isBurnWorkflowActive: boolean;
  onBurn: (normalizedDomainName: string, chainId: number) => Promise<void>;
}) {
  const { row, isBurning, isBurnWorkflowActive, onBurn } = props;

  if (!row.canBurn) {
    return null;
  }

  if (isBurnWorkflowActive) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-red-200 text-red-400"
            />
          }
        >
          <Flame className="h-3 w-3" />
          Burn
        </TooltipTrigger>
        <TooltipContent>
          A burn workflow is already in progress for this domain.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant="secondary"
            size="sm"
            disabled={isBurning}
            className="border border-red-200 bg-red-900/10 text-red-600 hover:bg-red-900/20"
          />
        }
      >
        <Flame className="h-3 w-3" />
        {isBurning ? 'Burning...' : 'Burn'}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Burn NFT</AlertDialogTitle>
          <AlertDialogDescription>
            Burn the NFT for <strong>{row.normalizedDomainName}</strong>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onBurn(row.normalizedDomainName, row.chainId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Burn NFT
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function FixExpirationActionButton(props: {
  row: NftManagementRow;
  isPending: boolean;
  onFix: (normalizedDomainName: string, chainId: number) => Promise<void>;
}) {
  const { row, isPending, onFix } = props;

  if (!row.needsExpirationReview) {
    return null;
  }

  const isDateMismatchFixable =
    row.hasDateMismatch && !row.hasMissingData && !row.isPoweredByNamefiDomain;

  if (!isDateMismatchFixable) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="outline" size="sm" disabled />}
        >
          <AlertTriangle className="h-3 w-3" />
          Cannot Fix
        </TooltipTrigger>
        <TooltipContent>
          Cannot fix when expiration data is missing.
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onFix(row.normalizedDomainName, row.chainId)}
      disabled={isPending}
    >
      <Wrench className="h-3 w-3" />
      {isPending ? 'Fixing...' : 'Fix'}
    </Button>
  );
}

export function RenewActionButton(props: { row: NftManagementRow }) {
  const { row } = props;

  if (row.canBurn || row.hasMissingData) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" size="sm" disabled />}>
        <RefreshCw className="h-3 w-3" />
        Renew
      </TooltipTrigger>
      <TooltipContent>
        Domain renewal is not yet implemented here.
      </TooltipContent>
    </Tooltip>
  );
}

export function NftActionsCell(props: {
  row: NftManagementRow;
  isBurning: boolean;
  isBurnWorkflowActive: boolean;
  isFixPending: boolean;
  onBurn: (normalizedDomainName: string, chainId: number) => Promise<void>;
  onFix: (normalizedDomainName: string, chainId: number) => Promise<void>;
}) {
  const { row, isBurning, isBurnWorkflowActive, isFixPending, onBurn, onFix } =
    props;

  return (
    <div className="flex flex-wrap gap-1">
      <BurnActionButton
        row={row}
        isBurning={isBurning}
        isBurnWorkflowActive={isBurnWorkflowActive}
        onBurn={onBurn}
      />
      <FixExpirationActionButton
        row={row}
        isPending={isFixPending}
        onFix={onFix}
      />
      <RenewActionButton row={row} />
    </div>
  );
}
