'use client';

/**
 * Shared cell components + row shape for the admin NS & DNSSEC table.
 *
 * Extracted out of `page.tsx` so the desktop columns AND the mobile card
 * (`ns-and-dnssec-card.tsx`) render off the SAME formatting/behavior helpers —
 * one source, no forked logic — without a circular import through the page's
 * default export.
 */

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AutoTruncateTextV2 } from '@/components/auto-truncate-text-v2';
import { UserWalletAvatar } from '@/components/user-avatar';
import { AdminDomainDetailsButton } from '@/components/admin/domain-details';
import {
  AdminEditNameserversDialog,
  AdminToggleDnssecDialog,
  WorkflowLink,
  operationLabel,
  type ActiveWorkflow,
  type DomainWorkflows,
  type NsDnssecDialogRow,
  type TemporalConfig,
} from '@/components/admin/ns-dnssec-dialogs';

/**
 * Page-level row shape. Extends the dialog row with everything the
 * table cells display (`userId`, `ownerAddress`, `chainId`,
 * `dnssecLastUpdatedAt`).
 */
export type NsAndDnssecRow = NsDnssecDialogRow & {
  userId: string | null;
  ownerAddress: string | null;
  chainId: number;
  dnssecLastUpdatedAt: Date | null;
};

/**
 * Domain name + admin-details button. Extracted so the desktop column and the
 * mobile card render the identical name cell.
 */
export function DomainNameCell({ domainName }: { domainName: string }) {
  return (
    <div className="flex items-center gap-1">
      <AutoTruncateTextV2
        initialCharactersCountToDisplay={32}
        minCharactersToDisplay={16}
        className="font-medium"
      >
        {domainName}
      </AutoTruncateTextV2>
      <AdminDomainDetailsButton domainName={domainName} size="icon-xs" />
    </div>
  );
}

export function UserCell({ row }: { row: NsAndDnssecRow }) {
  const userId = row.userId;
  const ownerAddress = row.ownerAddress;
  const tail = ownerAddress
    ? `${ownerAddress.slice(0, 6)}…${ownerAddress.slice(-4)}`
    : null;
  return (
    <div className="flex items-center gap-2">
      <UserWalletAvatar
        address={ownerAddress ?? undefined}
        userId={userId ?? undefined}
        className="size-6 rounded-md"
      />
      <div className="flex flex-col leading-tight">
        {userId ? (
          <AutoTruncateTextV2
            initialCharactersCountToDisplay={14}
            minCharactersToDisplay={10}
            className="text-xs"
          >
            {userId}
          </AutoTruncateTextV2>
        ) : (
          <span className="text-xs text-amber-600">No user</span>
        )}
        {tail ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {tail}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function PendingWorkflowsCell({
  workflows,
  temporal,
  isLoading,
}: {
  workflows: DomainWorkflows | undefined;
  temporal: TemporalConfig | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !workflows) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking…
      </span>
    );
  }
  const list = [workflows.dnssec, workflows.ns].filter(
    (w): w is ActiveWorkflow => !!w,
  );
  if (list.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {list.map((w) => (
        <div key={w.workflowId} className="flex items-center gap-2 text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{operationLabel(w.operation)}</span>
          <WorkflowLink workflow={w} temporal={temporal} />
        </div>
      ))}
    </div>
  );
}

export function RowActions({
  row,
  workflows,
  canWrite,
  isWorkflowsLoading,
}: {
  row: NsAndDnssecRow;
  workflows: DomainWorkflows | undefined;
  canWrite: boolean;
  isWorkflowsLoading: boolean;
}) {
  const [nsOpen, setNsOpen] = useState(false);
  const [dnssecOpen, setDnssecOpen] = useState(false);
  // Disable while we don't yet know whether a workflow is running for
  // this domain — otherwise an admin could fire a mutation on top of a
  // pending workflow during the load window.
  const blocked = !canWrite || isWorkflowsLoading || !workflows;
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={blocked}
        onClick={() => setNsOpen(true)}
        data-testid={`admin.ns-and-dnssec.row.edit-nameservers.${row.normalizedDomainName}`}
      >
        Edit Nameservers
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={blocked}
        onClick={() => setDnssecOpen(true)}
        data-testid={`admin.ns-and-dnssec.row.toggle-dnssec.${row.normalizedDomainName}`}
      >
        Toggle DNSSEC
      </Button>
      <AdminEditNameserversDialog
        open={nsOpen}
        onOpenChange={setNsOpen}
        row={row}
        activeWorkflow={workflows?.ns ?? null}
      />
      <AdminToggleDnssecDialog
        open={dnssecOpen}
        onOpenChange={setDnssecOpen}
        row={row}
        activeWorkflow={workflows?.dnssec ?? null}
      />
    </div>
  );
}
