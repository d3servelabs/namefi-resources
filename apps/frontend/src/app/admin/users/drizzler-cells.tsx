'use client';

import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from 'date-fns';
import { Copy, Mail, VenetianMask } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { checksumWalletAddressSchema } from '@namefi-astra/utils/namefi-flavor';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { AdminUserLookupButton } from '@/components/admin/user-details';
import { AddToEmailBatchButton } from '@/components/admin/email-batch/add-to-email-batch-button';
import { AsyncButton } from '@/components/buttons/async-button';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { UserWalletAvatar } from '@/components/user-avatar';

// Shared types + cell logic so the desktop table columns and the mobile card
// render identical values from the same source (switch layout, reuse logic).

export type UserRow = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  privyUserId: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date | null;
  twitterUsername: string | null;
  twitterDetails: {
    username?: string;
    name?: string;
    subject?: string;
    profilePictureUrl?: string;
  } | null;
  isAdmin: boolean;
  wallets: string[];
  nfts: Array<{
    chainId: number;
    normalizedDomainName: string;
    tokenId: string;
    expirationTime: Date | string;
    ownerAddress: string;
  }>;
  nftCount: number;
};

export const attemptGetChecksummedAddress = (address: string): string => {
  const parsed = checksumWalletAddressSchema.safeParse(address);
  return parsed.success ? parsed.data : address;
};

async function copyAddressToClipboard(address: string) {
  try {
    await navigator.clipboard.writeText(address);
    toast.success('Copied address successfully');
  } catch (_error) {
    toast.error('Failed to copy address');
  }
}

/** Small ghost copy button with a tooltip; reused by the email cell. */
export function CopyIconButton({
  text,
  classNames,
}: {
  text: string;
  classNames?: { button?: string; icon?: string; tooltipContent?: string };
}) {
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }, [text]);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button
              {...props}
              className={cn(
                'rounded-full',
                classNames?.button,
                props.className,
              )}
              size="icon"
              variant="ghost"
              aria-label="Copy to clipboard"
              onClick={(event) => {
                props.onClick?.(event);
                if (event.defaultPrevented) return;
                handleCopy();
              }}
            >
              {props.children}
            </Button>
          )}
        >
          <Copy className={cn('h-4 w-4', classNames?.icon)} />
        </TooltipTrigger>
        <TooltipContent className={cn(classNames?.tooltipContent)}>
          <p>Copy To Clipboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** User id (monospace, truncated) + the admin "open user details" lookup button. */
export function UserIdCell({ id }: { id: string }) {
  return (
    <div className="flex items-center gap-2">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={16}
        minCharactersToDisplay={16}
        className="font-mono text-xs"
      >
        {id}
      </AutoTruncateTextV2>
      <AdminUserLookupButton
        reference={{ userId: id }}
        title="Open user details by user ID"
      />
    </div>
  );
}

/** Display name, truncated, or "-" when absent. */
export function DisplayNameCell({
  displayName,
}: {
  displayName: string | null;
}) {
  return (
    <AutoTruncateTextV2
      initialCharactersCountToDisplay={15}
      minCharactersToDisplay={15}
    >
      {displayName ?? '-'}
    </AutoTruncateTextV2>
  );
}

/**
 * Email pill with inline mailto link, add-to-batch, and copy actions, or "-"
 * when the user has no email.
 */
export function EmailCell({ row }: { row: UserRow }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full px-3 py-1 rounded-2xl',
        row.primaryEmail ? 'bg-muted' : '',
      )}
    >
      <AutoTruncateTextV2
        className="w-full"
        initialCharactersCountToDisplay={20}
        minCharactersToDisplay={5}
      >
        {row.primaryEmail ?? '-'}
      </AutoTruncateTextV2>
      {!!row.primaryEmail && (
        <div className="ms-1 flex items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={(props) => (
                  <a
                    {...props}
                    href={`mailto:${row.primaryEmail}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Send email to ${row.primaryEmail}`}
                    className={cn(props.className)}
                  >
                    {props.children}
                  </a>
                )}
              >
                <Mail className="h-[14px] w-[14px]" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Send email to {row.primaryEmail}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AddToEmailBatchButton
            email={row.primaryEmail}
            userId={row.id}
            privyUserId={row.privyUserId ?? undefined}
            displayLabel={row.displayName ?? undefined}
            className="!h-6 !w-6"
          />
          <CopyIconButton
            text={row.primaryEmail}
            classNames={{
              icon: '!h-[14px] !w-[14px]',
              button: '!p-[1px]',
            }}
          />
        </div>
      )}
    </div>
  );
}

/** Privy user id (monospace, truncated) + the admin lookup button. */
export function PrivyIdCell({ privyUserId }: { privyUserId: string }) {
  return (
    <div className="flex items-center gap-2">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={16}
        minCharactersToDisplay={16}
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

/** First (primary) wallet with avatar + copy button, or "-" when none. */
export function PrimaryWalletCell({ row }: { row: UserRow }) {
  let primaryWallet = row.wallets?.[0];
  if (!primaryWallet) return <>-</>;
  primaryWallet = attemptGetChecksummedAddress(primaryWallet);

  return (
    <div className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl max-w-full">
      <UserWalletAvatar
        address={primaryWallet}
        userId={row.id}
        className="size-6"
      />
      <div className="flex-1 min-w-0">
        <AutoTruncateTextV2
          initialCharactersCountToDisplay={16}
          minCharactersToDisplay={16}
          className="font-mono text-xs"
        >
          {primaryWallet}
        </AutoTruncateTextV2>
      </div>
      <button
        type="button"
        onClick={() => copyAddressToClipboard(primaryWallet)}
        className="p-1 hover:bg-background rounded transition-colors flex-shrink-0"
        title="Copy address"
      >
        <Copy className="h-3 w-3" />
      </button>
    </div>
  );
}

/** Every linked wallet, each with avatar + copy button, or "-" when none. */
export function AllWalletsCell({ row }: { row: UserRow }) {
  let wallets = row.wallets ?? [];
  if (wallets.length === 0) return <>-</>;

  wallets = wallets
    .map((wallet) => attemptGetChecksummedAddress(wallet))
    .filter((wallet) => wallet !== null);

  return (
    <div className="flex flex-col gap-1">
      {wallets.map((wallet) => (
        <div
          key={wallet}
          className="flex items-center gap-2 px-1 py-1 bg-muted rounded-xl w-fit"
        >
          <UserWalletAvatar
            address={wallet}
            userId={row.id}
            className="size-6"
          />
          <span className="text-xs font-mono">
            <AutoTruncateTextV2
              initialCharactersCountToDisplay={16}
              minCharactersToDisplay={16}
            >
              {wallet}
            </AutoTruncateTextV2>
          </span>
          <button
            type="button"
            onClick={() => copyAddressToClipboard(wallet)}
            className="p-1 hover:bg-background rounded transition-colors"
            title="Copy address"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Localized timestamp string, or "-" when null. */
export function formatTimestamp(value: Date | null | undefined): string {
  return value ? new Date(value).toLocaleString() : '-';
}

/**
 * Relative "last sign in" label with a color tier (green = recent, orange =
 * stale, red = very old) and a tooltip showing the exact timestamp, or "-" when
 * the user has never signed in.
 */
export function LastSignInCell({
  lastSignInAt,
}: {
  lastSignInAt: Date | null;
}) {
  if (!lastSignInAt) return <>-</>;

  const lastSignIn = new Date(lastSignInAt);
  const now = new Date();

  const years = differenceInYears(now, lastSignIn);
  const months = differenceInMonths(now, lastSignIn);
  const days = differenceInDays(now, lastSignIn);

  let relativeTime = '';
  let colorClass = 'text-green-600'; // Recent

  if (years > 0) {
    relativeTime = `${years}y ago`;
    colorClass = 'text-red-600'; // Very old
  } else if (months > 0) {
    relativeTime = `${months}mo ago`;
    colorClass = months > 1 ? 'text-red-600' : 'text-orange-600';
  } else if (days > 0) {
    relativeTime = `${days}d ago`;
    colorClass = days > 7 ? 'text-orange-600' : 'text-green-600';
  } else {
    relativeTime = 'Today';
    colorClass = 'text-green-600';
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <span
              {...props}
              className={cn(
                'font-medium cursor-help',
                colorClass,
                props.className,
              )}
            >
              {props.children}
            </span>
          )}
        >
          {relativeTime}
        </TooltipTrigger>
        <TooltipContent>
          <p>{lastSignIn.toLocaleString()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Twitter @handle linking to x.com, or "-" when none. */
export function TwitterCell({ username }: { username: string | null }) {
  if (!username) return <>-</>;

  return (
    <a
      href={`https://x.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
    >
      <span>@{username}</span>
    </a>
  );
}

/** Asset (NFT) count. */
export function AssetCountCell({ nftCount }: { nftCount: number }) {
  return <span className="font-medium">{nftCount}</span>;
}

/**
 * Row action buttons: impersonate (permission-gated, non-admins only),
 * send-email, and add-to-batch. Shared so the desktop column and the mobile
 * card fire the identical handler.
 */
export function UserActionsCell({
  row,
  onImpersonate,
}: {
  row: UserRow;
  onImpersonate: (userId: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center gap-1">
      {!row.isAdmin && (
        <PermissionGate permissions={[Permission.IMPERSONATE_USERS]}>
          <AsyncButton
            className="group"
            size="sm"
            variant="secondary"
            onClick={() => onImpersonate(row.id)}
            loadingText="Impersonating..."
          >
            <VenetianMask className="h-4 w-4" />
            <span
              className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
              style={{ transition: 'all 0.4s ease-in-out' }}
            >
              Impersonate
            </span>
          </AsyncButton>
        </PermissionGate>
      )}
      {!!row.primaryEmail && (
        <Button
          className="group"
          size="sm"
          variant="secondary"
          render={(props) => (
            <a
              {...props}
              href={`mailto:${row.primaryEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Send email"
              className={cn('flex', props.className)}
            >
              {props.children}
            </a>
          )}
          nativeButton={false}
        >
          <Mail className="h-4 w-4" />{' '}
          <span
            className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
            style={{ transition: 'all 0.8s allow-discrete' }}
          >
            Send Email
          </span>
        </Button>
      )}
      {!!row.primaryEmail && (
        <AddToEmailBatchButton
          email={row.primaryEmail}
          userId={row.id}
          privyUserId={row.privyUserId ?? undefined}
          displayLabel={row.displayName ?? undefined}
        />
      )}
    </div>
  );
}
