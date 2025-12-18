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
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/cn';
import { useState } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { NameserversDialog } from '../dialogs/nameservers-dialog';
import { ForwardingDialog } from '../dialogs/forwarding-dialog';
import { EditDnsRecordsWrapper } from '../dialogs/edit-dns-records-wrapper';
import { useRouter } from 'next/navigation';

export interface DnsStatus {
  nameservers: string[];
  isUsingNamefiNameservers: boolean;
  isParkingEnabled: boolean;
  forwardTo: string | null;
  hasWebRecords: boolean;
  hasMxRecords: boolean;
  ensRecord: string | null;
}

interface DnsStatusCellProps {
  domainName: NamefiNormalizedDomain;
  status: DnsStatus;
  disabled?: boolean;
}

function getStatusColors(status: DnsStatus) {
  const nsColor = status.isUsingNamefiNameservers
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
  const ensColor = status.ensRecord ? 'text-sky-500' : 'text-zinc-600';
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
}

function DnsDialogs({
  activeDialog,
  setActiveDialog,
  domainName,
  currentForwardUrl,
  readOnly,
  warningMessage,
}: DnsDialogsProps) {
  if (!activeDialog) return null;

  return (
    <>
      {activeDialog === 'ns' && (
        <NameserversDialog
          isOpen={true}
          onOpenChange={(open) => !open && setActiveDialog(null)}
          domainName={domainName}
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
  disabled,
}: DnsStatusCellProps) {
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const router = useRouter();

  const { nsColor, webColor, mxColor, ensColor, forwardColor } =
    getStatusColors(status);

  // Read-only if not using Namefi NS (except NS settings itself, usually)
  // But wait, if we are not using Namefi NS, can we set NS? Yes, we can change NS back to Namefi.
  // So NS dialog should probably remain editable or handle its own state.
  // The requirement says: "For DNS Records other than NS, they are uneditable when NS were not using Namefi's NS"
  const isReadOnly = !status.isUsingNamefiNameservers;
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
      onKeyDown={(e) => {
        if (['Enter', ' ', 'Spacebar', 'Escape'].includes(e.key)) {
          e.stopPropagation();
        }
      }}
    >
      {/* NS */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => !disabled && setActiveDialog('ns')}
            className={cn(
              'transition-colors hover:opacity-80',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            disabled={disabled}
          >
            <Server className={cn('w-4 h-4', nsColor)} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Nameservers:{' '}
          {status.nameservers.length > 0
            ? status.nameservers.join(', ')
            : 'None'}
        </TooltipContent>
      </Tooltip>

      {/* Web */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => !disabled && setActiveDialog('web')}
            className={cn(
              'transition-colors hover:opacity-80 cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            disabled={disabled}
          >
            <Globe className={cn('w-4 h-4', webColor)} />
          </button>
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
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() =>
              !disabled && isForwardingEnabled && setActiveDialog('forward')
            }
            className={cn(
              'transition-colors hover:opacity-80 cursor-pointer',
              (disabled || !isForwardingEnabled) &&
                'cursor-not-allowed opacity-50',
            )}
            disabled={disabled || !isForwardingEnabled}
          >
            {status.forwardTo ? (
              <LinkIcon className={cn('w-4 h-4', forwardColor)} />
            ) : (
              <Unlink className={cn('w-4 h-4', forwardColor)} />
            )}
          </button>
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
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => !disabled && setActiveDialog('mx')}
            className={cn(
              'transition-colors hover:opacity-80 cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            disabled={disabled}
          >
            <Mail className={cn('w-4 h-4', mxColor)} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {status.hasMxRecords ? 'MX Records Configured' : 'No MX Records'}
        </TooltipContent>
      </Tooltip>

      {/* ENS */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => !disabled && setActiveDialog('ens')}
            className={cn(
              'transition-colors hover:opacity-80 cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50',
            )}
            disabled={disabled}
          >
            <Hexagon className={cn('w-4 h-4', ensColor)} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {status.ensRecord ? status.ensRecord : 'No ENS Record'}
        </TooltipContent>
      </Tooltip>

      {/* Manage Domain */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => router.push(`/domains/${domainName}`)}
            className="transition-colors hover:opacity-80 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer"
          >
            <Ellipsis className="w-4 h-4" />
          </button>
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
      />
    </div>
  );
}
