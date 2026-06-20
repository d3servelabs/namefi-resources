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
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { NameserversDialog } from '../dialogs/nameservers-dialog';
import { ForwardingDialog } from '../dialogs/forwarding-dialog';
import { EditDnsRecordsWrapper } from '../dialogs/edit-dns-records-wrapper';
import { useRouter } from 'next/navigation';
import { useDnsEmailGate } from '@/hooks/use-dns-email-gate';

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

function formatNameserverForDisplay(value: string): string {
  return value.trim().replace(/\.$/, '');
}

function getStatusColors(status: DnsStatus, autoEnsEnabled: boolean) {
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
  const t = useTranslations('dnsManagement');
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const router = useRouter();
  const { gate: gateDnsEmail, modal: dnsEmailModal } = useDnsEmailGate();

  const { nsColor, webColor, mxColor, ensColor, forwardColor } =
    getStatusColors(status, autoEnsEnabled);

  // Non-NS DNS records are read-only when the domain isn't on Namefi
  // nameservers — the backend derives this flag on getCurrentUserDomains so
  // the cell just reads it.
  const isReadOnly = !status.isUsingNamefiNameservers;
  const warningMessage = isReadOnly
    ? t('statusCell.notEditableExternal')
    : undefined;

  // Forwarding is allowed only if parking is enabled (A record points to Namefi Parking)
  const isForwardingAllowed = status.isParkingEnabled;

  return (
    <div
      className="flex items-center gap-3"
      role="toolbar"
      aria-label={t('statusCell.ariaLabel')}
      onClick={(e) => e.stopPropagation()}
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
          {t('statusCell.nameservers', {
            value:
              status.nameservers.length > 0
                ? status.nameservers.map(formatNameserverForDisplay).join(', ')
                : t('statusCell.nameserversNone'),
          })}
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
            ? t('statusCell.parkedOnNamefi')
            : status.hasWebRecords
              ? t('statusCell.webRecordsConfigured')
              : t('statusCell.noWebRecords')}
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
                (disabled || !isForwardingAllowed) &&
                  'cursor-not-allowed opacity-50',
              )}
            />
          }
          onClick={() =>
            !disabled &&
            isForwardingAllowed &&
            gateDnsEmail(() => setActiveDialog('forward'))
          }
          disabled={disabled || !isForwardingAllowed}
        >
          {status.forwardTo ? (
            <LinkIcon className={cn('w-4 h-4', forwardColor)} />
          ) : (
            <Unlink className={cn('w-4 h-4', forwardColor)} />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {!isForwardingAllowed
            ? t('statusCell.enableParkingForForwarding')
            : status.forwardTo
              ? t('statusCell.forwardsTo', { url: status.forwardTo })
              : t('statusCell.noForwarding')}
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
          {status.hasMxRecords
            ? t('statusCell.mxConfigured')
            : t('statusCell.noMxRecords')}
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
          {autoEnsEnabled
            ? t('statusCell.autoEnsEnabled')
            : t('statusCell.noEnsRecord')}
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
        <TooltipContent>{t('statusCell.manageMore')}</TooltipContent>
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
