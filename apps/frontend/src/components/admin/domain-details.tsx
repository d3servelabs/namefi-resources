'use client';

/**
 * Admin domain-details modal — single per-domain drill-in that mirrors
 * `AdminUserDetailsDialog` from `user-details.tsx`.
 *
 * Renders three cards in one dialog:
 *   1. Registration / NFT details (chain, tokenId, owner, expiration,
 *      dateTokenized, registrarKey).
 *   2. NS & DNSSEC summary + action buttons that open the lifted
 *      `AdminEditNameserversDialog` / `AdminToggleDnssecDialog`.
 *   3. Domain preferences with the same Reset / Save semantics as the
 *      `/admin/domain-preferences` page, but for a single domain.
 *
 * Backend data flow:
 *   - `admin.domainDetails.getDomainAdminDetails` for the cached/single-
 *     query payload (registration + user + preferences + cached NS/DNSSEC).
 *   - `admin.nsAndDnssec.getActiveWorkflowsForPage` for the workflow
 *     banner / button gating, refetched every 10s.
 *   - Mutations stay on the existing `admin.nsAndDnssec.*` and
 *     `admin.domainPreferences.updateDomainPreferences` procedures.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps, MouseEventHandler, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, Globe, Loader2 } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { useTRPC } from '@/lib/trpc';
import { AsyncButton } from '@/components/buttons/async-button';
import { useHasPermissions } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import {
  AdminEditNameserversDialog,
  AdminToggleDnssecDialog,
  ActiveWorkflowBanner,
  DnssecCell,
  NameserversCell,
  type ActiveWorkflow,
  type NsDnssecDialogRow,
} from '@/components/admin/ns-dnssec-dialogs';
import {
  ForwardToField,
  NOT_SET_DEFAULTS,
  PreferenceToggle,
} from '@/components/admin/preference-fields';
import {
  ChainCell,
  CopyableBadge,
  DomainLabel,
  InfoGrid,
  SummaryCard,
  TokenExplorerCell,
  WalletAddressCell,
  formatDateOnly,
} from '@/components/admin/user-details';

/**
 * Window event the dialog listens for to force-close itself.
 * Mirror of `ADMIN_USER_DETAILS_CLOSE_EVENT` in `user-details.tsx`.
 * Dispatched by "Open page" affordances inside the dialog so the user
 * doesn't end up stuck behind a modal after navigating away.
 */
export const ADMIN_DOMAIN_DETAILS_CLOSE_EVENT =
  'admin-domain-details:close-all';

export const dispatchAdminDomainDetailsCloseEvent = () => {
  window.dispatchEvent(new CustomEvent(ADMIN_DOMAIN_DETAILS_CLOSE_EVENT));
};

export function AdminDomainDetailsButton({
  domainName,
  className,
  title = 'Open domain details',
  variant = 'ghost',
  size = 'icon-sm',
  children,
  onClick,
  onMouseDown,
  onMouseUp,
  onPointerDown,
  onPointerUp,
}: {
  domainName: string;
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
        {children ?? <Settings className="h-4 w-4" />}
      </Button>
      {open ? (
        <AdminDomainDetailsDialog
          open={open}
          onOpenChange={setOpen}
          domainName={domainName}
        />
      ) : null}
    </>
  );
}

export function AdminDomainDetailsDialog({
  open,
  onOpenChange,
  domainName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
}) {
  // Force-close from anywhere via the global close event.
  useEffect(() => {
    const handler = () => onOpenChange(false);
    window.addEventListener(ADMIN_DOMAIN_DETAILS_CLOSE_EVENT, handler);
    return () =>
      window.removeEventListener(ADMIN_DOMAIN_DETAILS_CLOSE_EVENT, handler);
  }, [onOpenChange]);

  const trpc = useTRPC();

  const detailsQuery = useQuery(
    trpc.admin.domainDetails.getDomainAdminDetails.queryOptions(
      { domainName },
      { enabled: open },
    ),
  );

  const workflowsQuery = useQuery(
    trpc.admin.nsAndDnssec.getActiveWorkflowsForPage.queryOptions(
      { domainNames: [domainName] },
      { enabled: open, refetchInterval: 10_000 },
    ),
  );

  const isWorkflowsLoading = open && !workflowsQuery.data;
  const workflowsForDomain = workflowsQuery.data?.workflows[domainName];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[85vw] min-w-[1024px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-zinc-500" />
            <DomainLabel domain={domainName} />
          </DialogTitle>
          <DialogDescription>
            Admin view — registration, NS &amp; DNSSEC, and domain preferences
            for {domainName}.
          </DialogDescription>
        </DialogHeader>

        {detailsQuery.isLoading ? (
          <DialogLoadingBody />
        ) : detailsQuery.isError || !detailsQuery.data ? (
          <DialogErrorBody
            message={detailsQuery.error?.message ?? 'Domain not found'}
          />
        ) : (
          <DomainDetailsContent
            details={detailsQuery.data}
            workflowsForDomain={workflowsForDomain}
            isWorkflowsLoading={isWorkflowsLoading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DialogLoadingBody() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading domain details…
    </div>
  );
}

function DialogErrorBody({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
      {message}
    </div>
  );
}

type DomainDetails = NonNullable<
  ReturnType<
    typeof useTRPC
  >['admin']['domainDetails']['getDomainAdminDetails'] extends never
    ? never
    : never
>;

type WorkflowsByDomain = {
  dnssec: ActiveWorkflow | null;
  ns: ActiveWorkflow | null;
};

function DomainDetailsContent({
  details,
  workflowsForDomain,
  isWorkflowsLoading,
}: {
  // Type-imported via the trpc proxy — kept loose here for brevity.
  // The shape mirrors `getDomainAdminDetailsOutputSchema` in
  // `admin-domain-details-contract.ts`.
  details: {
    registration: {
      chainId: number;
      tokenId: string;
      normalizedDomainName: string;
      ownerAddress: string | null;
      registrarKey: string | null;
      expirationTime: Date | null;
      dateTokenized: Date | null;
      lastUpdatedTimestamp: Date | null;
    };
    user: { id: string; privyUserId: string | null } | null;
    preferences: {
      autoRenewEnabled: boolean | null;
      autoEnsEnabled: boolean | null;
      autoParkEnabled: boolean | null;
      forwardTo: string | null;
    };
    nsCached: {
      nameservers: string[];
      isUsingNamefiNameservers: boolean;
    } | null;
    dnssecCached: {
      supportsDnssec: boolean;
      hasDelegationSigner: boolean;
      isUsingNamefiDelegationSigner: boolean;
      zoneHasActiveDnssec: boolean;
    } | null;
    dnssecLastUpdatedAt: Date | null;
  };
  workflowsForDomain: WorkflowsByDomain | undefined;
  isWorkflowsLoading: boolean;
}) {
  const { registration, user, preferences, nsCached, dnssecCached } = details;

  // Build the row shape both lifted dialogs accept.
  const dialogRow: NsDnssecDialogRow = {
    normalizedDomainName: registration.normalizedDomainName,
    nameservers: nsCached?.nameservers ?? [],
    isUsingNamefiNameservers: nsCached?.isUsingNamefiNameservers ?? false,
    dnssecZoneHasActiveDnssec: dnssecCached?.zoneHasActiveDnssec ?? null,
    dnssecHasDelegationSigner: dnssecCached?.hasDelegationSigner ?? null,
    dnssecIsUsingNamefiDelegationSigner:
      dnssecCached?.isUsingNamefiDelegationSigner ?? null,
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Owner"
          value={
            registration.ownerAddress ? (
              <WalletAddressCell address={registration.ownerAddress} />
            ) : (
              '—'
            )
          }
        />
        <SummaryCard
          label="Chain"
          value={<ChainCell chainId={registration.chainId} />}
        />
        <SummaryCard
          label="Expiration"
          value={formatDateOnly(registration.expirationTime)}
        />
        <SummaryCard
          label="Date Tokenized"
          value={formatDateOnly(registration.dateTokenized)}
        />
      </div>

      <RegistrationCard registration={registration} user={user} />

      <NsAndDnssecCard
        row={dialogRow}
        workflowsForDomain={workflowsForDomain}
        isWorkflowsLoading={isWorkflowsLoading}
      />

      <PreferencesCard
        domainName={registration.normalizedDomainName}
        preferences={preferences}
      />
    </div>
  );
}

function RegistrationCard({
  registration,
  user,
}: {
  registration: {
    chainId: number;
    tokenId: string;
    registrarKey: string | null;
    lastUpdatedTimestamp: Date | null;
  };
  user: { id: string; privyUserId: string | null } | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration</CardTitle>
        <CardDescription>
          NFT and registry details for this domain.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InfoGrid
          items={[
            {
              label: 'Token ID',
              value: (
                <TokenExplorerCell
                  chainId={registration.chainId}
                  tokenId={registration.tokenId}
                />
              ),
            },
            {
              label: 'Registrar',
              value: registration.registrarKey ? (
                <CopyableBadge
                  label={registration.registrarKey}
                  value={registration.registrarKey}
                />
              ) : (
                '—'
              ),
            },
            {
              label: 'User ID',
              value: user ? (
                <CopyableBadge label={user.id} value={user.id} />
              ) : (
                '—'
              ),
            },
            {
              label: 'Last Indexed',
              value: formatDateOnly(registration.lastUpdatedTimestamp),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function NsAndDnssecCard({
  row,
  workflowsForDomain,
  isWorkflowsLoading,
}: {
  row: NsDnssecDialogRow;
  workflowsForDomain: WorkflowsByDomain | undefined;
  isWorkflowsLoading: boolean;
}) {
  const { hasPermissions: canWrite } = useHasPermissions([
    Permission.WRITE_NS_DNSSEC,
  ]);
  const [nsOpen, setNsOpen] = useState(false);
  const [dnssecOpen, setDnssecOpen] = useState(false);

  // Same gating rule as the page: if we don't yet know whether a
  // workflow is running for this domain, lock the buttons rather than
  // assume "no active workflow".
  const blocked = !canWrite || isWorkflowsLoading || !workflowsForDomain;

  return (
    <Card>
      <CardHeader>
        <CardTitle>NS &amp; DNSSEC</CardTitle>
        <CardDescription>
          Cached snapshot from the indexer; the live registrar is hit only when
          you open one of the action dialogs.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ActiveWorkflowBanner
          workflow={workflowsForDomain?.ns ?? null}
          domainName={row.normalizedDomainName}
          scope="nameservers"
        />
        <ActiveWorkflowBanner
          workflow={workflowsForDomain?.dnssec ?? null}
          domainName={row.normalizedDomainName}
          scope="dnssec"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              Nameservers
            </div>
            <NameserversCell row={row} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              DNSSEC
            </div>
            <DnssecCell row={row} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={blocked}
            onClick={() => setNsOpen(true)}
          >
            Edit Nameservers
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={blocked}
            onClick={() => setDnssecOpen(true)}
          >
            Toggle DNSSEC
          </Button>
        </div>

        <AdminEditNameserversDialog
          open={nsOpen}
          onOpenChange={setNsOpen}
          row={row}
          activeWorkflow={workflowsForDomain?.ns ?? null}
        />
        <AdminToggleDnssecDialog
          open={dnssecOpen}
          onOpenChange={setDnssecOpen}
          row={row}
          activeWorkflow={workflowsForDomain?.dnssec ?? null}
        />
      </CardContent>
    </Card>
  );
}

type PreferencesShape = {
  autoRenewEnabled: boolean | null;
  autoEnsEnabled: boolean | null;
  autoParkEnabled: boolean | null;
  forwardTo: string | null;
};

type PreferenceDraft = {
  autoRenewEnabled?: boolean;
  autoEnsEnabled?: boolean;
  autoParkEnabled?: boolean;
  forwardTo?: string;
};

function PreferencesCard({
  domainName,
  preferences,
}: {
  domainName: string;
  preferences: PreferencesShape;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { hasPermissions: canWrite } = useHasPermissions([
    Permission.WRITE_DOMAIN_PREFERENCES,
  ]);
  const [draft, setDraft] = useState<PreferenceDraft>({});

  const setDraftValue = <K extends keyof PreferenceDraft>(
    key: K,
    value: PreferenceDraft[K],
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateMutation = useMutation(
    trpc.admin.domainPreferences.updateDomainPreferences.mutationOptions({
      onSuccess: () => {
        toast('Domain preferences updated');
        setDraft({});
        // Invalidate so the modal re-renders new values without a manual
        // close/reopen, and the parent table is refreshed too.
        queryClient.invalidateQueries({
          queryKey: trpc.admin.domainDetails.getDomainAdminDetails.queryKey({
            domainName,
          }),
        });
        queryClient.invalidateQueries({
          queryKey:
            trpc.admin.domainPreferences.listDomainPreferences.queryKey(),
        });
      },
      onError: (error) => {
        toast('Failed to update domain preferences', {
          description: error.message,
        });
      },
    }),
  );

  const isDirty = useMemo(() => {
    if (
      draft.autoRenewEnabled !== undefined &&
      draft.autoRenewEnabled !== preferences.autoRenewEnabled
    ) {
      return true;
    }
    if (
      draft.autoEnsEnabled !== undefined &&
      draft.autoEnsEnabled !== preferences.autoEnsEnabled
    ) {
      return true;
    }
    if (
      draft.autoParkEnabled !== undefined &&
      draft.autoParkEnabled !== preferences.autoParkEnabled
    ) {
      return true;
    }
    if (
      draft.forwardTo !== undefined &&
      draft.forwardTo !== preferences.forwardTo
    ) {
      return true;
    }
    return false;
  }, [draft, preferences]);

  const applyChanges = async () => {
    const payload: PreferenceDraft = {};
    if (
      draft.autoRenewEnabled !== undefined &&
      draft.autoRenewEnabled !== preferences.autoRenewEnabled
    ) {
      payload.autoRenewEnabled = draft.autoRenewEnabled;
    }
    if (
      draft.autoEnsEnabled !== undefined &&
      draft.autoEnsEnabled !== preferences.autoEnsEnabled
    ) {
      payload.autoEnsEnabled = draft.autoEnsEnabled;
    }
    if (
      draft.autoParkEnabled !== undefined &&
      draft.autoParkEnabled !== preferences.autoParkEnabled
    ) {
      payload.autoParkEnabled = draft.autoParkEnabled;
    }
    if (
      draft.forwardTo !== undefined &&
      draft.forwardTo !== preferences.forwardTo
    ) {
      payload.forwardTo = draft.forwardTo;
    }
    if (Object.keys(payload).length === 0) return;

    await updateMutation.mutateAsync({
      domainName,
      domainPreferencesAndConfig: payload,
    });
  };

  // Cached-value + draft fallback chain mirrors the page.
  const autoRenewIsNotSet =
    preferences.autoRenewEnabled === null &&
    draft.autoRenewEnabled === undefined;
  const autoRenewValue =
    draft.autoRenewEnabled ??
    preferences.autoRenewEnabled ??
    NOT_SET_DEFAULTS.autoRenewEnabled;

  const autoEnsIsNotSet =
    preferences.autoEnsEnabled === null && draft.autoEnsEnabled === undefined;
  const autoEnsValue =
    draft.autoEnsEnabled ??
    preferences.autoEnsEnabled ??
    NOT_SET_DEFAULTS.autoEnsEnabled;

  const autoParkIsNotSet =
    preferences.autoParkEnabled === null && draft.autoParkEnabled === undefined;
  const autoParkValue =
    draft.autoParkEnabled ??
    preferences.autoParkEnabled ??
    NOT_SET_DEFAULTS.autoParkEnabled;

  const forwardToIsNotSet =
    preferences.forwardTo === null && draft.forwardTo === undefined;
  const forwardToValue =
    draft.forwardTo ?? preferences.forwardTo ?? NOT_SET_DEFAULTS.forwardTo;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domain Preferences</CardTitle>
        <CardDescription>
          &quot;Not set&quot; means the value is <code>null</code> in the
          database. Saving sends only the fields you change.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <PreferenceRow label="Auto Renew">
          <PreferenceToggle
            value={autoRenewValue}
            isNotSet={autoRenewIsNotSet}
            disabled={!canWrite}
            onChange={(checked) => setDraftValue('autoRenewEnabled', checked)}
          />
        </PreferenceRow>
        <PreferenceRow label="Auto ENS">
          <PreferenceToggle
            value={autoEnsValue}
            isNotSet={autoEnsIsNotSet}
            disabled={!canWrite}
            onChange={(checked) => setDraftValue('autoEnsEnabled', checked)}
          />
        </PreferenceRow>
        <PreferenceRow label="Auto Park">
          <PreferenceToggle
            value={autoParkValue}
            isNotSet={autoParkIsNotSet}
            disabled={!canWrite}
            onChange={(checked) => setDraftValue('autoParkEnabled', checked)}
          />
        </PreferenceRow>
        <PreferenceRow label="Forward To">
          <ForwardToField
            value={forwardToValue}
            isNotSet={forwardToIsNotSet}
            disabled={!canWrite}
            onChange={(value) => setDraftValue('forwardTo', value)}
          />
        </PreferenceRow>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!isDirty || !canWrite || updateMutation.isPending}
            onClick={() => setDraft({})}
          >
            Reset
          </Button>
          <AsyncButton
            size="sm"
            disabled={!isDirty || !canWrite || updateMutation.isPending}
            onClick={applyChanges}
          >
            Save
          </AsyncButton>
        </div>
      </CardContent>
    </Card>
  );
}

function PreferenceRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
