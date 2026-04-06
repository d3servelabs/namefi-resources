'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
  type ComponentProps,
  type MouseEventHandler,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  Gift,
  Globe,
  KeyRound,
  Mail,
  ShoppingCart,
  UserRound,
  VenetianMask,
  Wallet,
} from 'lucide-react';
import { useTRPC, type AppRouterOutput } from '@/lib/trpc';
import { cn } from '@/lib/cn';
import { formatAmountInUSD } from '@/lib/number';
import { getShortAddress } from '@/lib/string';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { NetworkLogo } from '@/components/network-logo';
import { UserWalletAvatar } from '@/components/user-avatar';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/shadcn/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { getChain } from '@namefi-astra/utils/chains';
import { getNftExplorerUrl } from '@namefi-astra/utils/nft-hash';
import { Permission } from '@namefi-astra/utils/permissions';
import { AsyncButton } from '@/components/buttons/async-button';
import { PermissionGate } from '@/components/access/PermissionGate';

type AdminUserDetails = AppRouterOutput['admin']['getUserDetails'];
type AdminWalletDetails = AppRouterOutput['admin']['getWalletDetails'];

export type AdminUserLookupReference =
  | {
      userId: string;
      privyUserId?: never;
      walletAddress?: never;
    }
  | {
      userId?: never;
      privyUserId: string;
      walletAddress?: never;
    }
  | {
      userId?: never;
      privyUserId?: never;
      walletAddress: string;
    };

const dialogLoadingCardKeys = [
  'dialog-loading-1',
  'dialog-loading-2',
  'dialog-loading-3',
  'dialog-loading-4',
] as const;

const pageLoadingCardKeys = [
  'page-loading-1',
  'page-loading-2',
  'page-loading-3',
  'page-loading-4',
  'page-loading-5',
] as const;

const ADMIN_USER_DETAILS_CLOSE_EVENT = 'admin-user-details:close-all';

const dispatchAdminUserDetailsCloseEvent = () => {
  window.dispatchEvent(new CustomEvent(ADMIN_USER_DETAILS_CLOSE_EVENT));
};

const formatDateOnly = (value: Date | string | null | undefined) => {
  if (!value) {
    return '-';
  }

  return format(new Date(value), 'yyyy-MM-dd');
};

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) {
    return '-';
  }

  return format(new Date(value), "yyyy-MM-dd'T'HH:mm:ss");
};

const formatUsdCents = (amountInUsdCents: number) => {
  return `${formatAmountInUSD(amountInUsdCents, true)} USD`;
};

const getUserLabel = (data: AdminUserDetails['user']) => {
  return data.displayName ?? data.primaryEmail ?? data.id;
};

const getWalletLabel = (wallet: AdminWalletDetails['wallet']) => {
  return (
    wallet.linkedDisplayName ?? wallet.linkedPrimaryEmail ?? wallet.address
  );
};

function UserActionButtons({
  userId,
  isAdmin,
  primaryEmail,
}: {
  userId: string;
  isAdmin: boolean;
  primaryEmail: string | null;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const impersonate = useMutation(trpc.users.impersonateUser.mutationOptions());

  const handleImpersonate = useCallback(async () => {
    try {
      await impersonate.mutateAsync({ targetUserId: userId });
      await queryClient.invalidateQueries();
      await router.replace('/');
      toast('Impersonation enabled', {
        description: `Now impersonating ${userId}`,
      });
    } catch (error) {
      toast('Failed to impersonate', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [impersonate.mutateAsync, queryClient, router, userId]);

  return (
    <div className="flex items-center gap-2">
      {!isAdmin && (
        <PermissionGate permissions={[Permission.IMPERSONATE_USERS]}>
          <AsyncButton
            size="sm"
            variant="secondary"
            onClick={handleImpersonate}
            loadingText="Impersonating..."
          >
            <VenetianMask className="h-4 w-4" />
            Impersonate
          </AsyncButton>
        </PermissionGate>
      )}
      {!!primaryEmail && (
        <Button
          size="sm"
          variant="secondary"
          render={(props) => (
            <a
              {...props}
              href={`mailto:${primaryEmail}`}
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
          <Mail className="h-4 w-4" />
          Send Email
        </Button>
      )}
    </div>
  );
}

function LoadingDialogBody({ title }: { title: string }) {
  return (
    <DialogContent className="!max-w-6xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>Loading details...</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="grid gap-3 md:grid-cols-4">
          {dialogLoadingCardKeys.map((key) => (
            <Skeleton key={key} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </DialogContent>
  );
}

function ErrorDialogBody({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <DialogContent className="!max-w-xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
    </DialogContent>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{label}</span>
          {icon}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">{value}</div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InfoGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border p-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {item.label}
          </div>
          <div className="mt-1 break-all text-sm">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyTableRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="py-8 text-center text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  );
}

function ExternalPageButton({
  href,
  children,
  closeAdminDetailDialogs = false,
}: {
  href: string;
  children: ReactNode;
  closeAdminDetailDialogs?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      render={(props) => (
        <Link
          {...props}
          href={href}
          className={cn(props.className)}
          onClick={(event) => {
            props.onClick?.(event);
            if (!event.defaultPrevented && closeAdminDetailDialogs) {
              dispatchAdminUserDetailsCloseEvent();
            }
          }}
        >
          {props.children}
        </Link>
      )}
    >
      {children}
    </Button>
  );
}

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Failed to copy ${label.toLowerCase()}`);
  }
}

function CopyableBadge({ label, value }: { label: string; value: string }) {
  return (
    <Badge
      variant="outline"
      render={(props) => (
        <button
          {...props}
          type="button"
          onClick={() => copyToClipboard(value, label)}
        />
      )}
      className="cursor-copy hover:bg-muted"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {label} {value}
    </Badge>
  );
}

function DomainLabel({ domain }: { domain: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <span>{domain}</span>
    </div>
  );
}

function ChainCell({ chainId, label }: { chainId: number; label?: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <NetworkLogo network={chainId} className="h-5 w-5 bg-transparent" />
      <span>{label ?? getChain(chainId)?.name ?? `Chain ${chainId}`}</span>
    </div>
  );
}

function WalletAddressCell({
  address,
  modalTarget = 'wallet',
}: {
  address: string;
  modalTarget?: 'user' | 'wallet';
}) {
  return (
    <div className="flex items-center gap-2">
      <UserWalletAvatar
        address={address}
        adminOpenTarget={modalTarget}
        className="size-7"
        fallback={getShortAddress(address)}
      />
      <span className="font-mono text-xs">{getShortAddress(address)}</span>
    </div>
  );
}

function TokenExplorerCell({
  chainId,
  tokenId,
}: {
  chainId: number;
  tokenId: string;
}) {
  const explorerUrl = getNftExplorerUrl(chainId, tokenId);

  return (
    <div className="inline-flex items-center gap-2">
      <AutoTruncateTextV2
        as="span"
        initialCharactersCountToDisplay={14}
        minCharactersToDisplay={10}
        className="font-mono text-xs max-w-[10rem]"
      >
        {tokenId}
      </AutoTruncateTextV2>
      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
            'text-muted-foreground hover:text-foreground',
          )}
          aria-label={`Open token ${tokenId} in block explorer`}
          title="Open in block explorer"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  );
}

export function AdminUserLookupDialog({
  open,
  onOpenChange,
  reference,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: AdminUserLookupReference;
}) {
  const trpc = useTRPC();

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeDialog = () => onOpenChange(false);
    window.addEventListener(ADMIN_USER_DETAILS_CLOSE_EVENT, closeDialog);

    return () => {
      window.removeEventListener(ADMIN_USER_DETAILS_CLOSE_EVENT, closeDialog);
    };
  }, [open, onOpenChange]);

  const resolverQuery = useQuery(
    trpc.admin.resolveUserReference.queryOptions(reference, {
      enabled: open,
      trpc: { context: { skipBatch: true } },
    }),
  );

  if (!open) {
    return null;
  }

  if (resolverQuery.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <LoadingDialogBody title="Resolving account" />
      </Dialog>
    );
  }

  if (resolverQuery.isError || !resolverQuery.data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <ErrorDialogBody
          title="Unable to resolve account"
          description={
            resolverQuery.error?.message ??
            'The user or wallet could not be resolved.'
          }
        />
      </Dialog>
    );
  }

  if (resolverQuery.data.type === 'wallet') {
    return (
      <AdminWalletDetailsDialog
        open={open}
        onOpenChange={onOpenChange}
        walletAddress={resolverQuery.data.walletAddress}
      />
    );
  }

  return (
    <AdminUserDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      userId={resolverQuery.data.userId}
      matchedWalletAddress={resolverQuery.data.matchedWalletAddress}
    />
  );
}

export function AdminUserLookupButton({
  reference,
  className,
  title = 'Open user details',
  variant = 'ghost',
  size = 'icon-sm',
  children,
  onClick,
  onMouseDown,
  onMouseUp,
  onPointerDown,
  onPointerUp,
}: {
  reference: AdminUserLookupReference;
  className?: string;
  title?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  onMouseUp?: MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: ComponentProps<typeof Button>['onPointerDown'];
  onPointerUp?: ComponentProps<typeof Button>['onPointerUp'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={(event) => {
          onClick?.(event);
          setOpen(true);
        }}
        title={title}
        aria-label={title}
      >
        {children ?? <ExternalLink className="h-4 w-4" />}
      </Button>
      <AdminUserLookupDialog
        open={open}
        onOpenChange={setOpen}
        reference={reference}
      />
    </>
  );
}

export function AdminWalletDetailsButton({
  walletAddress,
  className,
  title = 'Open wallet details',
  variant = 'ghost',
  size = 'icon-sm',
  children,
  onClick,
  onMouseDown,
  onMouseUp,
  onPointerDown,
  onPointerUp,
}: {
  walletAddress: string;
  className?: string;
  title?: string;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  onMouseDown?: MouseEventHandler<HTMLButtonElement>;
  onMouseUp?: MouseEventHandler<HTMLButtonElement>;
  onPointerDown?: ComponentProps<typeof Button>['onPointerDown'];
  onPointerUp?: ComponentProps<typeof Button>['onPointerUp'];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={(event) => {
          onClick?.(event);
          setOpen(true);
        }}
        title={title}
        aria-label={title}
      >
        {children ?? <Wallet className="h-4 w-4" />}
      </Button>
      <AdminWalletDetailsDialog
        open={open}
        onOpenChange={setOpen}
        walletAddress={walletAddress}
      />
    </>
  );
}

function AdminUserDetailsDialog({
  open,
  onOpenChange,
  userId,
  matchedWalletAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  matchedWalletAddress?: string | null;
}) {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.getUserDetails.queryOptions(
      {
        userId,
        matchedWalletAddress: matchedWalletAddress ?? undefined,
      },
      {
        enabled: open,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {query.isLoading ? (
        <LoadingDialogBody title="Loading user details" />
      ) : query.isError || !query.data ? (
        <ErrorDialogBody
          title="Unable to load user details"
          description={
            query.error?.message ?? 'The user details are unavailable.'
          }
        />
      ) : (
        <DialogContent className="!max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getUserLabel(query.data.user)}</DialogTitle>
            <DialogDescription>
              {query.data.user.primaryEmail ?? 'No primary email'}
            </DialogDescription>
          </DialogHeader>
          <AdminUserCompactSummary data={query.data} />
        </DialogContent>
      )}
    </Dialog>
  );
}

export function AdminWalletDetailsDialog({
  open,
  onOpenChange,
  walletAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddress: string;
}) {
  const trpc = useTRPC();

  useEffect(() => {
    if (!open) {
      return;
    }

    const closeDialog = () => onOpenChange(false);
    window.addEventListener(ADMIN_USER_DETAILS_CLOSE_EVENT, closeDialog);

    return () => {
      window.removeEventListener(ADMIN_USER_DETAILS_CLOSE_EVENT, closeDialog);
    };
  }, [open, onOpenChange]);

  const query = useQuery(
    trpc.admin.getWalletDetails.queryOptions(
      {
        walletAddress,
      },
      {
        enabled: open,
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {query.isLoading ? (
        <LoadingDialogBody title="Loading wallet details" />
      ) : query.isError || !query.data ? (
        <ErrorDialogBody
          title="Unable to load wallet details"
          description={
            query.error?.message ?? 'The wallet details are unavailable.'
          }
        />
      ) : (
        <DialogContent className="!max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getWalletLabel(query.data.wallet)}</DialogTitle>
            <DialogDescription>{query.data.wallet.address}</DialogDescription>
          </DialogHeader>
          <AdminWalletDetailsContent data={query.data} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function AdminUserCompactSummary({ data }: { data: AdminUserDetails }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <CopyableBadge label="User ID" value={data.user.id} />
        <CopyableBadge label="Privy ID" value={data.user.privyUserId} />
        {data.user.isAdmin ? <Badge>Admin</Badge> : null}
        {data.user.matchedWalletAddress ? (
          <Badge variant="secondary">
            Resolved from {getShortAddress(data.user.matchedWalletAddress)}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="NFSC Balance"
          value={formatUsdCents(data.totals.totalNfscBalanceInUsdCents)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Domains & NFTs"
          value={String(data.totals.domainCount)}
          description={`${data.totals.walletCount} wallet${data.totals.walletCount === 1 ? '' : 's'}`}
          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Orders"
          value={String(data.totals.orderCount)}
          description={`${data.totals.paymentMethodCount} saved payment method${data.totals.paymentMethodCount === 1 ? '' : 's'}`}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Commerce"
          value={String(
            data.totals.cartItemCount +
              data.totals.wishlistCount +
              data.totals.freeClaimCount,
          )}
          description={`${data.totals.availableFreeClaimCount} claim${data.totals.availableFreeClaimCount === 1 ? '' : 's'} available`}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Account Summary</CardTitle>
            <CardDescription>
              Identity, wallets, balances, and recent activity
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <UserActionButtons
              userId={data.user.id}
              isAdmin={data.user.isAdmin}
              primaryEmail={data.user.primaryEmail}
            />
            <ExternalPageButton
              href={`/admin/users/${data.user.id}`}
              closeAdminDetailDialogs={true}
            >
              Open full page
              <ArrowUpRight className="h-4 w-4" />
            </ExternalPageButton>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoGrid
            items={[
              {
                label: 'Primary Email',
                value: data.contactInfo.primaryEmail ?? '-',
              },
              {
                label: 'Phone',
                value: data.contactInfo.phoneNumber ?? '-',
              },
              {
                label: 'Full Name',
                value: data.contactInfo.fullName ?? '-',
              },
              {
                label: 'Created',
                value: formatDateTime(data.user.createdAt),
              },
              {
                label: 'Last Sign In',
                value: formatDateTime(data.user.lastSignInAt),
              },
              {
                label: 'Stripe Customer',
                value: data.user.stripeCustomerId ?? '-',
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <CompactWalletsCard data={data} />
        <CompactRecentOrdersCard data={data} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CompactDomainsPreviewCard data={data} />
        <CompactCommerceCard data={data} />
      </div>
    </div>
  );
}

function CompactWalletsCard({ data }: { data: AdminUserDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallets</CardTitle>
        <CardDescription>
          Linked wallets and per-wallet NFSC totals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.wallets.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No linked wallets.
          </div>
        ) : (
          data.wallets.slice(0, 4).map((wallet) => (
            <div
              key={wallet.address}
              className="flex flex-col gap-2 rounded-xl border p-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <WalletAddressCell
                  address={wallet.address}
                  modalTarget="wallet"
                />
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {wallet.isPrimary ? (
                    <Badge variant="secondary">Primary</Badge>
                  ) : null}
                  <span>{wallet.domainCount} domains</span>
                  <span>{formatUsdCents(wallet.totalBalanceInUsdCents)}</span>
                </div>
              </div>
              <AdminWalletDetailsButton walletAddress={wallet.address} />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CompactRecentOrdersCard({ data }: { data: AdminUserDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Newest orders for this account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.orders.length === 0 ? (
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No orders found.
          </div>
        ) : (
          data.orders.slice(0, 5).map((order) => (
            <div key={order.id} className="rounded-xl border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-sm">{order.id}</div>
                <Badge variant="outline">{order.status}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>{formatUsdCents(order.amountInUSDCents)}</span>
                <span>{order.itemCount} items</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function CompactDomainsPreviewCard({ data }: { data: AdminUserDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Domains Preview</CardTitle>
        <CardDescription>Earliest expiring domains first</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.domains.length === 0 ? (
              <EmptyTableRow colSpan={3} label="No domains found." />
            ) : (
              data.domains.slice(0, 6).map((domain) => (
                <TableRow key={`${domain.chainId}-${domain.tokenId}`}>
                  <TableCell>
                    <DomainLabel domain={domain.normalizedDomainName} />
                  </TableCell>
                  <TableCell>
                    <WalletAddressCell
                      address={domain.ownerAddress}
                      modalTarget="wallet"
                    />
                  </TableCell>
                  <TableCell>{formatDateOnly(domain.expirationTime)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CompactCommerceCard({ data }: { data: AdminUserDetails }) {
  const latestFreeClaimDomain =
    data.freeClaims[0]?.claimedDomainName ??
    data.freeClaims[0]?.exactDomainName ??
    data.freeClaims[0]?.parentDomain;
  const cartItemCount = data.totals.cartItemCount;
  const wishlistCount = data.totals.wishlistCount;
  const freeClaimCount = data.totals.freeClaimCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cart, Wishlist, and Free Claims</CardTitle>
        <CardDescription>
          Current pipeline counts and latest items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Cart"
            value={`${cartItemCount} cart ${cartItemCount === 1 ? 'item' : 'items'}`}
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            label="Wishlist"
            value={`${wishlistCount} ${wishlistCount === 1 ? 'domain' : 'domains'}`}
            icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          />
          <SummaryCard
            label="Free Claims"
            value={`${freeClaimCount} ${freeClaimCount === 1 ? 'claim' : 'claims'}`}
            description={`${data.totals.availableFreeClaimCount} available`}
            icon={<Gift className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <InfoGrid
          items={[
            {
              label: 'Latest Cart Item',
              value: data.cartItems[0]?.normalizedDomainName ? (
                <DomainLabel domain={data.cartItems[0].normalizedDomainName} />
              ) : (
                '-'
              ),
            },
            {
              label: 'Latest Wishlist Item',
              value: data.wishlistItems[0]?.normalizedDomainName ? (
                <DomainLabel
                  domain={data.wishlistItems[0].normalizedDomainName}
                />
              ) : (
                '-'
              ),
            },
            {
              label: 'Latest Free Claim',
              value: latestFreeClaimDomain ? (
                <DomainLabel domain={latestFreeClaimDomain} />
              ) : (
                '-'
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function AdminWalletDetailsContent({ data }: { data: AdminWalletDetails }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          Wallet {getShortAddress(data.wallet.address)}
        </Badge>
        {data.wallet.isLinked ? (
          <Badge>Linked account</Badge>
        ) : (
          <Badge variant="secondary">Unlinked wallet</Badge>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="NFSC Balance"
          value={formatUsdCents(data.totals.totalNfscBalanceInUsdCents)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Domains & NFTs"
          value={String(data.totals.domainCount)}
          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Linked Accounts"
          value={String(data.linkedAccounts.length)}
          icon={<UserRound className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Linked Account</CardTitle>
            <CardDescription>
              {data.wallet.isLinked
                ? 'This wallet is linked to a Namefi account.'
                : 'This wallet is not linked to a Namefi account.'}
            </CardDescription>
          </div>
          {data.wallet.linkedUserId ? (
            <ExternalPageButton
              href={`/admin/users/${data.wallet.linkedUserId}`}
              closeAdminDetailDialogs={true}
            >
              Open user page
              <ArrowUpRight className="h-4 w-4" />
            </ExternalPageButton>
          ) : null}
        </CardHeader>
        <CardContent>
          <InfoGrid
            items={[
              {
                label: 'Display Name',
                value: data.wallet.linkedDisplayName ?? '-',
              },
              {
                label: 'Primary Email',
                value: data.wallet.linkedPrimaryEmail ?? '-',
              },
              {
                label: 'User ID',
                value: data.wallet.linkedUserId ?? '-',
              },
              {
                label: 'Privy User ID',
                value: data.wallet.linkedPrivyUserId ?? '-',
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NFSC Balances</CardTitle>
          <CardDescription>Per-chain balances for this wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chain</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.balances.length === 0 ? (
                <EmptyTableRow colSpan={3} label="No NFSC balances found." />
              ) : (
                data.balances.map((balance) => (
                  <TableRow key={`${balance.chainId}-${balance.walletAddress}`}>
                    <TableCell>
                      <ChainCell
                        chainId={balance.chainId}
                        label={balance.chainName}
                      />
                    </TableCell>
                    <TableCell>{balance.paymentProvider}</TableCell>
                    <TableCell className="text-right">
                      {formatUsdCents(balance.balanceInUsdCents)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domains & Assets</CardTitle>
          <CardDescription>
            Namefi domains currently held by this wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Expiration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.domains.length === 0 ? (
                <EmptyTableRow
                  colSpan={4}
                  label="No Namefi domains found for this wallet."
                />
              ) : (
                data.domains.map((domain) => (
                  <TableRow key={`${domain.chainId}-${domain.tokenId}`}>
                    <TableCell>
                      <DomainLabel domain={domain.normalizedDomainName} />
                    </TableCell>
                    <TableCell>
                      <ChainCell chainId={domain.chainId} />
                    </TableCell>
                    <TableCell>
                      <TokenExplorerCell
                        chainId={domain.chainId}
                        tokenId={domain.tokenId}
                      />
                    </TableCell>
                    <TableCell>
                      {formatDateOnly(domain.expirationTime)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UserDomainsTable({ data }: { data: AdminUserDetails }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Domain</TableHead>
          <TableHead>Chain</TableHead>
          <TableHead>Holding Wallet</TableHead>
          <TableHead>Token</TableHead>
          <TableHead>Expiration</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.domains.length === 0 ? (
          <EmptyTableRow colSpan={5} label="No domains found." />
        ) : (
          data.domains.map((domain) => (
            <TableRow key={`${domain.chainId}-${domain.tokenId}`}>
              <TableCell>
                <DomainLabel domain={domain.normalizedDomainName} />
              </TableCell>
              <TableCell>
                <ChainCell chainId={domain.chainId} />
              </TableCell>
              <TableCell>
                <WalletAddressCell
                  address={domain.ownerAddress}
                  modalTarget="wallet"
                />
              </TableCell>
              <TableCell>
                <TokenExplorerCell
                  chainId={domain.chainId}
                  tokenId={domain.tokenId}
                />
              </TableCell>
              <TableCell>{formatDateOnly(domain.expirationTime)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function UserBalancesTable({ data }: { data: AdminUserDetails }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="Total NFSC"
          value={formatUsdCents(data.totals.totalNfscBalanceInUsdCents)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Wallets"
          value={String(data.totals.walletCount)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Saved Cards"
          value={String(data.totals.paymentMethodCount)}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Stripe Customer"
          value={data.user.stripeCustomerId ? 'Connected' : 'Not Connected'}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Balances</CardTitle>
          <CardDescription>
            Per-wallet balances across enabled NFSC chains
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead className="text-right">NFSC Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.wallets.length === 0 ? (
                <EmptyTableRow colSpan={4} label="No linked wallets found." />
              ) : (
                data.wallets.map((wallet) => (
                  <TableRow key={wallet.address}>
                    <TableCell>
                      <WalletAddressCell
                        address={wallet.address}
                        modalTarget="wallet"
                      />
                    </TableCell>
                    <TableCell>{wallet.isPrimary ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{wallet.domainCount}</TableCell>
                    <TableCell className="text-right">
                      {formatUsdCents(wallet.totalBalanceInUsdCents)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Payment Methods</CardTitle>
          <CardDescription>
            Saved Stripe payment methods for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment Method</TableHead>
                <TableHead>Last 4</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Fingerprint</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.paymentMethods.length === 0 ? (
                <EmptyTableRow colSpan={4} label="No saved payment methods." />
              ) : (
                data.paymentMethods.map((paymentMethod) => (
                  <TableRow key={paymentMethod.id}>
                    <TableCell>
                      {paymentMethod.cardDetails?.brand ?? paymentMethod.type}
                    </TableCell>
                    <TableCell>
                      {paymentMethod.cardDetails?.last4 ?? '-'}
                    </TableCell>
                    <TableCell>
                      {paymentMethod.cardDetails
                        ? `${paymentMethod.cardDetails.expMonth}/${paymentMethod.cardDetails.expYear}`
                        : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {paymentMethod.fingerprint ?? '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UserOrdersTable({ data }: { data: AdminUserDetails }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Receiving Wallet</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.orders.length === 0 ? (
          <EmptyTableRow colSpan={6} label="No orders found." />
        ) : (
          data.orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Link
                  href={`/orders/${order.id}`}
                  className={cn(
                    buttonVariants({ variant: 'link', size: 'xs' }),
                    'px-0',
                  )}
                >
                  {order.id}
                </Link>
              </TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>{formatUsdCents(order.amountInUSDCents)}</TableCell>
              <TableCell>{order.itemCount}</TableCell>
              <TableCell>
                {order.nftWalletAddress ? (
                  <WalletAddressCell
                    address={order.nftWalletAddress}
                    modalTarget="wallet"
                  />
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{formatDateTime(order.createdAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function UserCommerceTables({ data }: { data: AdminUserDetails }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cart Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Registrar</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cartItems.length === 0 ? (
                <EmptyTableRow colSpan={5} label="No cart items found." />
              ) : (
                data.cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <DomainLabel domain={item.normalizedDomainName} />
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.registrar}</TableCell>
                    <TableCell>
                      {formatUsdCents(item.amountInUSDCents)}
                    </TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wishlist</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.wishlistItems.length === 0 ? (
                <EmptyTableRow colSpan={2} label="No wishlist items found." />
              ) : (
                data.wishlistItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <DomainLabel domain={item.normalizedDomainName} />
                    </TableCell>
                    <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Free Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.freeClaims.length === 0 ? (
                <EmptyTableRow colSpan={5} label="No free claims found." />
              ) : (
                data.freeClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>{claim.groupOrCampaignKey}</TableCell>
                    <TableCell>
                      {(claim.claimedDomainName ??
                      claim.exactDomainName ??
                      claim.parentDomain) ? (
                        <DomainLabel
                          domain={
                            claim.claimedDomainName ??
                            claim.exactDomainName ??
                            claim.parentDomain ??
                            '-'
                          }
                        />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{claim.claimingStatus}</span>
                        {claim.isExpired ? (
                          <Badge variant="secondary">Expired</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateOnly(claim.expirationDate)}
                    </TableCell>
                    <TableCell>{formatDateTime(claim.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UserIdentityTables({ data }: { data: AdminUserDetails }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallets</CardTitle>
          <CardDescription>Every linked wallet on the account</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Wallet</TableHead>
                <TableHead>Primary</TableHead>
                <TableHead>Domains</TableHead>
                <TableHead>NFSC Total</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.wallets.length === 0 ? (
                <EmptyTableRow colSpan={5} label="No linked wallets found." />
              ) : (
                data.wallets.map((wallet) => (
                  <TableRow key={wallet.address}>
                    <TableCell>
                      <WalletAddressCell
                        address={wallet.address}
                        modalTarget="wallet"
                      />
                    </TableCell>
                    <TableCell>{wallet.isPrimary ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{wallet.domainCount}</TableCell>
                    <TableCell>
                      {formatUsdCents(wallet.totalBalanceInUsdCents)}
                    </TableCell>
                    <TableCell>
                      <AdminWalletDetailsButton
                        walletAddress={wallet.address}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>Linked auth accounts and API keys</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <UserRound className="h-4 w-4" />
              Linked Accounts
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Wallet Client</TableHead>
                  <TableHead>Verified At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.credentials.linkedAccounts.length === 0 ? (
                  <EmptyTableRow
                    colSpan={5}
                    label="No linked accounts found."
                  />
                ) : (
                  data.credentials.linkedAccounts.map((account, index) => (
                    <TableRow
                      key={`${account.type}-${account.displayValue}-${index}`}
                    >
                      <TableCell>{account.type}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {account.displayValue ?? '-'}
                      </TableCell>
                      <TableCell>
                        {account.chainType === 'ethereum' ? (
                          <ChainCell chainId={1} label="Ethereum" />
                        ) : (
                          (account.chainType ?? '-')
                        )}
                      </TableCell>
                      <TableCell>{account.walletClientType ?? '-'}</TableCell>
                      <TableCell>{account.verifiedAt ?? '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4" />
              API Keys
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.credentials.apiKeys.length === 0 ? (
                  <EmptyTableRow colSpan={6} label="No API keys found." />
                ) : (
                  data.credentials.apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>{apiKey.name}</TableCell>
                      <TableCell>{apiKey.type}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {apiKey.keyPrefix}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{apiKey.isActive ? 'Active' : 'Inactive'}</span>
                          {apiKey.isExpired ? (
                            <Badge variant="secondary">Expired</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(apiKey.lastUsedAt)}</TableCell>
                      <TableCell>{formatDateTime(apiKey.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoGrid
            items={[
              {
                label: 'Primary Email',
                value: data.contactInfo.primaryEmail ?? '-',
              },
              { label: 'Phone', value: data.contactInfo.phoneNumber ?? '-' },
              { label: 'Full Name', value: data.contactInfo.fullName ?? '-' },
              {
                label: 'Address',
                value: data.contactInfo.address
                  ? [
                      data.contactInfo.address.street,
                      data.contactInfo.address.city,
                      data.contactInfo.address.state,
                      data.contactInfo.address.zipCode,
                      data.contactInfo.address.country,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : '-',
              },
              {
                label: 'Twitter Username',
                value: data.contactInfo.twitterUsername ?? '-',
              },
              {
                label: 'Twitter Name',
                value: data.contactInfo.twitterDetails?.name ?? '-',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function UserDetailsPageContentView({ data }: { data: AdminUserDetails }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-2xl">
              {getUserLabel(data.user)}
            </CardTitle>
            <CardDescription className="mt-1 break-all">
              {data.user.primaryEmail ?? 'No primary email'}
            </CardDescription>
            <div className="mt-3">
              <UserActionButtons
                userId={data.user.id}
                isAdmin={data.user.isAdmin}
                primaryEmail={data.user.primaryEmail}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyableBadge label="User ID" value={data.user.id} />
            <CopyableBadge label="Privy ID" value={data.user.privyUserId} />
            {data.user.isAdmin ? <Badge>Admin</Badge> : null}
            {data.user.matchedWalletAddress ? (
              <Badge variant="secondary">
                Resolved from {getShortAddress(data.user.matchedWalletAddress)}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <SummaryCard
              label="NFSC Balance"
              value={formatUsdCents(data.totals.totalNfscBalanceInUsdCents)}
              icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Domains"
              value={String(data.totals.domainCount)}
              icon={<Globe className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Orders"
              value={String(data.totals.orderCount)}
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Commerce"
              value={String(
                data.totals.cartItemCount + data.totals.wishlistCount,
              )}
              description={`${data.totals.freeClaimCount} free claims`}
              icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
            />
            <SummaryCard
              label="Credentials"
              value={String(
                data.credentials.linkedAccounts.length +
                  data.credentials.apiKeys.length,
              )}
              description={`${data.totals.activeApiKeyCount} active API keys`}
              icon={<KeyRound className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="domains" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl p-1 lg:grid-cols-5">
          <TabsTrigger value="domains">Domains & NFTs</TabsTrigger>
          <TabsTrigger value="balances">NFSC & Payment Methods</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="commerce">
            Cart / Wishlist / Free Claims
          </TabsTrigger>
          <TabsTrigger value="identity">
            Wallets / Credentials / Contact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Domains & NFTs</CardTitle>
              <CardDescription>
                Full Namefi asset inventory for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserDomainsTable data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="mt-6">
          <UserBalancesTable data={data} />
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Order history for this user</CardDescription>
            </CardHeader>
            <CardContent>
              <UserOrdersTable data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commerce" className="mt-6">
          <UserCommerceTables data={data} />
        </TabsContent>

        <TabsContent value="identity" className="mt-6">
          <UserIdentityTables data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AdminUserDetailsPageContent({ userId }: { userId: string }) {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.getUserDetails.queryOptions(
      {
        userId,
      },
      {
        enabled: Boolean(userId),
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          {pageLoadingCardKeys.map((key) => (
            <Skeleton key={key} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-[32rem] rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to load user details</CardTitle>
          <CardDescription>
            {query.error?.message ?? 'The user details are unavailable.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <UserDetailsPageContentView data={query.data} />;
}

export function AdminUserExpandedDetails({ userId }: { userId: string }) {
  const trpc = useTRPC();
  const query = useQuery(
    trpc.admin.getUserDetails.queryOptions(
      {
        userId,
      },
      {
        enabled: Boolean(userId),
        trpc: { context: { skipBatch: true } },
      },
    ),
  );

  if (query.isLoading) {
    return (
      <div className="space-y-3 py-2">
        <div className="grid gap-3 md:grid-cols-4">
          {dialogLoadingCardKeys.map((key) => (
            <Skeleton key={`${key}-summary`} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        {query.error?.message ?? 'Unable to load user details.'}
      </div>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-4 py-2">
      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label="NFSC"
          value={formatUsdCents(data.totals.totalNfscBalanceInUsdCents)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Wallets"
          value={String(data.totals.walletCount)}
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Orders"
          value={String(data.totals.orderCount)}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          label="Claims"
          value={String(data.totals.availableFreeClaimCount)}
          description={`${data.totals.freeClaimCount} total free claims`}
          icon={<Gift className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminUserLookupButton
          reference={{ userId }}
          variant="outline"
          size="sm"
        >
          Quick view
          <ExternalLink className="h-4 w-4" />
        </AdminUserLookupButton>
        <ExternalPageButton
          href={`/admin/users/${userId}`}
          closeAdminDetailDialogs={true}
        >
          Open full page
          <ArrowUpRight className="h-4 w-4" />
        </ExternalPageButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domains & NFTs</CardTitle>
          <CardDescription>
            Balance details plus current asset inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserDomainsTable data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
