'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTranslations } from 'next-intl';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { NameserversPanelInner } from '../panels/nameservers/nameservers-panel';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';

export function NameserversDialog({
  isOpen,
  onOpenChange,
  domainName,
  nftChainId,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
  nftChainId: number | bigint;
}) {
  const t = useTranslations('dnsManagement');
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'max-w-2xl bg-zinc-950 border-zinc-800',
        )}
      >
        <DialogHeader>
          <DialogTitle>{t('nameservers.manageDialogTitle')}</DialogTitle>
        </DialogHeader>
        <NameserversPanelInner
          domainName={domainName as PunycodeDomainName}
          nftChainId={nftChainId}
        />
      </DialogContent>
    </Dialog>
  );
}
