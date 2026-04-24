'use client';

import {
  Server,
  Globe,
  Mail,
  Hexagon,
  Link as LinkIcon,
  Unlink,
  Ellipsis,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useMemo, useState } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { NameserversDialog } from '../dialogs/nameservers-dialog';
import { ForwardingDialog } from '../dialogs/forwarding-dialog';
import { EditDnsRecordsWrapper } from '../dialogs/edit-dns-records-wrapper';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDnsEmailGate } from '@/hooks/use-dns-email-gate';
import { useTRPC } from '@/lib/trpc';
import { normalizeDomainName } from '@namefi-astra/zod-dns';

export interface DnsStatus {
  nameservers: string[];
  isUsingNamefiNameservers: boolean;
  isParkingEnabled: boolean;
  forwardTo: string | null;
  hasWebRecords: boolean;
  hasMxRecords: boolean;
}

interface DnsStatusCellProps {
  domainName: NamefiNormalizedDomain;
  status: DnsStatus;
  autoEnsEnabled: boolean;
  disabled?: boolean;
  nftChainId: number | bigint;
}

const NAMEFI_ASTRA_NAMESERVERS_PROD = [
  'ns3.namefi.io',
  'ns4.namefi.io',
] as const;
const NAMEFI_ASTRA_NAMESERVERS_DEV = [
  'ns3.namefi.dev',
  'ns4.namefi.dev',
] as const;

function normalizeNameserverForComparison(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  try {
    // Use the repo's canonical normalizer (ASCII, lowercase, strip trailing dots,
    // and validate against Namefi DNS name rules).
    return normalizeDomainName(trimmed);
  } catch {
    // If a registrar returns an "odd" but still useful hostname, fall back to a
    // best-effort comparison key instead of treating it as missing.
    return trimmed.replace(/\.+$/, '');
  }
}

function formatNameserverForDisplay(value: string): string {
  return value.trim().replace(/\.$/, '');
}

function areNameserverSetsEqual(a: string[], b: string[]): boolean {
  const aNorm = a
    .map(normalizeNameserverForComparison)
    .filter((v): v is string => typeof v === 'string');
  const bNorm = b
    .map(normalizeNameserverForComparison)
    .filter((v): v is string => typeof v === 'string');

  if (aNorm.length === 0 || bNorm.length === 0) return false;
  const aSet = new Set(aNorm);
  const bSet = new Set(bNorm);
  if (aSet.size !== bSet.size) return false;
  for (const v of aSet) {
    if (!bSet.has(v)) return false;
  }
  return true;
}

function getStatusColors(
  status: DnsStatus,
  effectiveIsUsingNamefiNameservers: boolean,
  autoEnsEnabled: boolean,
) {
  const nsColor = effectiveIsUsingNamefiNameservers
    ? 'text-emerald-500'
    : status.nameservers.length > 0
      ? 'text-sky-500'
      : 'text-zinc-600';

  const webColor = status.isParkingEnabled
    ? 'text-emerald-500'
    : status.hasWebRecords
      ? 'text-sky-500'
      : 'text-zinc-600';

  const mxColor = status.hasMxRecords ? 'text-sky-500' : 'text-zinc-600';
  const ensColor = autoEnsEnabled ? 'text-sky-500' : 'text-zinc-600';
  const forwardColor = status.forwardTo ? 'text-sky-500' : 'text-zinc-600';

  return { nsColor, webColor, mxColor, ensColor, forwardColor };
}

type DialogType = 'ns' | 'web' | 'mx' | 'ens' | 'forward' | null;

interface DnsDialogsProps {
  activeDialog: DialogType;
  setActiveDialog: (dialog: DialogType) => void;
  domainName: NamefiNormalizedDomain;
  currentForwardUrl: string | null;
  readOnly?: boolean;
  warningMessage?: string;
  nftChainId: number | bigint;
}

function DnsDialogs({
  activeDialog,
  setActiveDialog,
  domainName,
  currentForwardUrl,
  readOnly,
  warningMessage,
  nftChainId,
}: DnsDialogsProps) {
  if (!activeDialog) return null;

  return (
    <>
      {activeDialog === 'ns' && (
        <NameserversDialog
          isOpen={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          domainName={domainName}
          nftChainId={nftChainId}
        />
      )}

      {activeDialog === 'web' && (
        <EditDnsRecordsWrapper
          isOpen={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          domainName={domainName}
          types={['A', 'AAAA', 'CNAME']}
          preselectedType="A"
          readOnly={readOnly}
          warningMessage={warningMessage}
        />
      )}

      {activeDialog === 'mx' && (
        <EditDnsRecordsWrapper
          isOpen={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          domainName={domainName}
          types={['MX']}
          preselectedType="MX"
          readOnly={readOnly}
          warningMessage={warningMessage}
        />
      )}

      {activeDialog === 'ens' && (
        <EditDnsRecordsWrapper
          isOpen={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          domainName={domainName}
          types={['TXT']}
          preselectedType="TXT"
          filterPredicate={(r) => r.rdata.startsWith('ENS1') && r.name === '@'}
          readOnly={readOnly}
          warningMessage={warningMessage}
        />
      )}

      {activeDialog === 'forward' && (
        <ForwardingDialog
          isOpen={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          domainName={domainName}
          currentForwardUrl={currentForwardUrl}
          readOnly={readOnly}
          warningMessage={warningMessage}
        />
      )}
    </>
  );
}

export function DnsStatusCell({
  domainName,
  status,
  autoEnsEnabled,
  disabled,
  nftChainId,
}: DnsStatusCellProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();
  const { gate: gateDnsEmail, modal: dnsEmailModal } = useDnsEmailGate();

  const shouldLazyFetchNameservers =
    status.nameservers.length === 0 && hasInteracted;
  const domainDetailsQuery = useQuery(
    trpc.domainConfig.getDomainDetails.queryOptions(
      { domainName },
      {
        enabled: shouldLazyFetchNameservers,
        staleTime: 5 * 60 * 1000,
      },
    ),
  );

  const effectiveNameservers = useMemo(() => {
    if (status.nameservers.length > 0) return status.nameservers;
    const fetched = domainDetailsQuery.data?.nameservers ?? [];
    return fetched;
  }, [status.nameservers, domainDetailsQuery.data?.nameservers]);

  const effectiveIsUsingNamefiNameservers = useMemo(() => {
    // If we have nameservers, derive truth from normalized comparison.
    if (effectiveNameservers.length > 0) {
      return (
        status.isUsingNamefiNameservers ||
        areNameserverSetsEqual(effectiveNameservers, [
          ...NAMEFI_ASTRA_NAMESERVERS_PROD,
        ]) ||
        areNameserverSetsEqual(effectiveNameservers, [
          ...NAMEFI_ASTRA_NAMESERVERS_DEV,
        ])
      );
    }
    // Otherwise fall back to backend-provided boolean.
    return status.isUsingNamefiNameservers;
  }, [effectiveNameservers, status.isUsingNamefiNameservers]);

  const { nsColor, webColor, mxColor, ensColor, forwardColor } =
    getStatusColors(
      {
        ...status,
        // Use effectiveNameservers for NS coloring only.
        nameservers: effectiveNameservers,
      },
      effectiveIsUsingNamefiNameservers,
      autoEnsEnabled,
    );

  // Read-only if not using Namefi NS (except NS settings itself, usually)
  // But wait, if we are not using Namefi NS, can we set NS? Yes, we can change NS back to Namefi.
  // So NS dialog should probably remain editable or handle its own state.
  // The requirement says: "For DNS Records other than NS, they are uneditable when NS were not using Namefi's NS"
  const isReadOnly = !effectiveIsUsingNamefiNameservers;
  const warningMessage = isReadOnly
    ? 'Not editable when using external nameservers'
    : undefined;

  // Forwarding is enabled only if parking is enabled (A record points to Namefi Parking)
  const isForwardingEnabled = status.isParkingEnabled;

  return (
    <div
      className="flex items-center gap-3"
      role="toolbar"
      aria-label="DNS Actions"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => {
        // Avoid N+1 on initial table load; only fetch live nameservers on user interaction
        // (hover) and only when the cached nameservers list is empty.
        if (!hasInteracted) setHasInteracted(true);
      }}
      onKeyDown={(e) => {
        if (['Enter', ' ', 'Spacebar', 'Escape'].includes(e.key)) {
          e.stopPropagation();
        }
      }}
    >
      {/* NS */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'transition-colors hover:opacity-80',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            />
          }
          onClick={() => !disabled && gateDnsEmail(() => setActiveDialog('ns'))}
          disabled={disabled}
        >
          <Server className={cn('w-4 h-4', nsColor)} />
        </TooltipTrigger>
        <TooltipContent>
          Nameservers:{' '}
          {effectiveNameservers.length > 0
            ? effectiveNameservers.map(formatNameserverForDisplay).join(', ')
            : 'None'}
        </TooltipContent>
      </Tooltip>

      {/* Web */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'transition-colors hover:opacity-80 cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            />
          }
          onClick={() =>
            !disabled && gateDnsEmail(() => setActiveDialog('web'))
          }
          disabled={disabled}
        >
          <Globe className={cn('w-4 h-4', webColor)} />
        </TooltipTrigger>
        <TooltipContent>
          {status.isParkingEnabled
            ? 'Parked on Namefi'
            : status.hasWebRecords
              ? 'Web Records Configured'
              : 'No Web Records'}
        </TooltipContent>
      </Tooltip>

      {/* Forward */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'transition-colors hover:opacity-80 cursor-pointer',
                (disabled || !isForwardingEnabled) &&
                  'cursor-not-allowed opacity-50',
              )}
            />
          }
          onClick={() =>
            !disabled &&
            isForwardingEnabled &&
            gateDnsEmail(() => setActiveDialog('forward'))
          }
          disabled={disabled || !isForwardingEnabled}
        >
          {status.forwardTo ? (
            <LinkIcon className={cn('w-4 h-4', forwardColor)} />
          ) : (
            <Unlink className={cn('w-4 h-4', forwardColor)} />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {!isForwardingEnabled
            ? 'Enable Parking to use Forwarding'
            : status.forwardTo
              ? `Forwards to: ${status.forwardTo}`
              : 'No URL Forwarding'}
        </TooltipContent>
      </Tooltip>

      {/* MX */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'transition-colors hover:opacity-80 cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            />
          }
          onClick={() => !disabled && gateDnsEmail(() => setActiveDialog('mx'))}
          disabled={disabled}
        >
          <Mail className={cn('w-4 h-4', mxColor)} />
        </TooltipTrigger>
        <TooltipContent>
          {status.hasMxRecords ? 'MX Records Configured' : 'No MX Records'}
        </TooltipContent>
      </Tooltip>

      {/* ENS */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                'transition-colors hover:opacity-80 cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            />
          }
          onClick={() =>
            !disabled && gateDnsEmail(() => setActiveDialog('ens'))
          }
          disabled={disabled}
        >
          <Hexagon className={cn('w-4 h-4', ensColor)} />
        </TooltipTrigger>
        <TooltipContent>
          {autoEnsEnabled ? 'Auto-ENS enabled' : 'No ENS Record'}
        </TooltipContent>
      </Tooltip>

      {/* Manage Domain */}
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="transition-colors hover:opacity-80 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
            />
          }
          onClick={() =>
            gateDnsEmail(() => router.push(`/domains/${domainName}`))
          }
        >
          <Ellipsis className="w-4 h-4" />
        </TooltipTrigger>
        <TooltipContent>Manage more DNS records</TooltipContent>
      </Tooltip>

      <DnsDialogs
        activeDialog={activeDialog}
        setActiveDialog={setActiveDialog}
        domainName={domainName}
        currentForwardUrl={status.forwardTo}
        readOnly={isReadOnly}
        warningMessage={warningMessage}
        nftChainId={nftChainId}
      />
      {dnsEmailModal}
    </div>
  );
}
