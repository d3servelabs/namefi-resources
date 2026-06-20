'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';

import { CustomDelegationSignerForm } from './custom-delegation-signer-form';
import {
  type ActiveSigner,
  DelegationSignersTable,
} from './delegation-signers-table';

type DnssecStatusDetails =
  AppRouterOutput['domainConfig']['dnssec']['getDomainDnssecDetails'];

export type CustomDelegationSignerPanelProps = {
  domainName: PunycodeDomainName;
  dnssecDetails: DnssecStatusDetails;
  disableAllButtons: boolean;
};

export function CustomDelegationSignerPanel({
  domainName,
  dnssecDetails,
  disableAllButtons,
}: CustomDelegationSignerPanelProps) {
  const t = useTranslations('dnsManagement');
  const trpc = useTRPC();
  const [dialogOpen, setDialogOpen] = useState(false);

  const customSigners = (dnssecDetails.delegationSigners ??
    []) as ActiveSigner[];

  const { data: pendingResult } = useQuery(
    trpc.domainConfig.dnssec.getPendingDeferredDelegationSigners.queryOptions(
      { domainName },
      { refetchInterval: 15_000 },
    ),
  );
  const pending = pendingResult?.pending ?? [];

  return (
    <div className="flex flex-col gap-3 w-full pt-4 border-t border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">
            {t('dnssecPanel.advancedPanel.title')}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {t('dnssecPanel.advancedPanel.description')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="default" disabled={disableAllButtons}>
                <PlusIcon className="w-4 h-4" />
                {t('dnssecPanel.advancedPanel.addSigner')}
              </Button>
            }
          />
          <DialogContent
            className={cn(
              MOBILE_BOTTOM_SHEET_DIALOG,
              'sm:max-w-2xl max-h-[90vh] overflow-y-auto',
            )}
          >
            <DialogHeader>
              <DialogTitle>
                {t('dnssecPanel.advancedPanel.dialogTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('dnssecPanel.advancedPanel.dialogDescription')}
              </DialogDescription>
            </DialogHeader>
            <CustomDelegationSignerForm
              domainName={domainName}
              onSuccess={() => setDialogOpen(false)}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <DelegationSignersTable
        domainName={domainName}
        activeSigners={customSigners}
        pendingSigners={pending}
        disableAllButtons={disableAllButtons}
      />
    </div>
  );
}
