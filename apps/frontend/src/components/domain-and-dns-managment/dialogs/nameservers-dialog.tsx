'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { NameserversPanelInner } from '../panels/nameservers/nameservers-panel';
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';

export function NameserversDialog({
  isOpen,
  onOpenChange,
  domainName,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: string;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Manage Nameservers</DialogTitle>
        </DialogHeader>
        <NameserversPanelInner domainName={domainName as PunycodeDomainName} />
      </DialogContent>
    </Dialog>
  );
}
