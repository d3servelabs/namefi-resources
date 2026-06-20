'use client';

import type { AppRouterOutput } from '@/lib/trpc';

import {
  type MouseEventHandler,
  type ReactElement,
  useState,
  cloneElement,
} from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { addDays, format } from 'date-fns';
import { useTranslations } from 'next-intl';

/** Number of days after import during which export is not allowed (ICANN rule) */
// const TRANSFER_LOCK_DAYS = process.env.ENVIRONMENT === 'production' ? 60 : 0;
const TRANSFER_LOCK_DAYS = 60;

export function TransferLockGuard({
  domainExportDetails,
  children,
}: {
  domainExportDetails: AppRouterOutput['domainConfig']['getDomainExportDetails'];
  children: ReactElement;
}) {
  const t = useTranslations('dnsManagement');
  const [showTransferLockDialog, setShowTransferLockDialog] = useState(false);

  // Calculate the export available date for display in the dialog
  const exportAvailableDate = domainExportDetails?.dateTokenized
    ? addDays(new Date(domainExportDetails.dateTokenized), TRANSFER_LOCK_DAYS)
    : null;
  const preventAction = exportAvailableDate && new Date() < exportAvailableDate;

  const handleClick: MouseEventHandler<HTMLDivElement> = (e) => {
    setShowTransferLockDialog(true);
  };

  return (
    <>
      {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
      {/** biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      {preventAction
        ? cloneElement(children, { onClick: handleClick } as any)
        : children}
      {/* 60-day ICANN transfer lock dialog */}
      <AlertDialog
        open={showTransferLockDialog}
        onOpenChange={setShowTransferLockDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('overview.transferLock.title', {
                date: exportAvailableDate
                  ? format(exportAvailableDate, 'yyyy-MM-dd')
                  : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('overview.transferLock.description')}
              {domainExportDetails?.dateTokenized &&
                t('overview.transferLock.importedOn', {
                  date: format(
                    new Date(domainExportDetails.dateTokenized),
                    'yyyy-MM-dd',
                  ),
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTransferLockDialog(false)}>
              {t('overview.transferLock.gotIt')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
