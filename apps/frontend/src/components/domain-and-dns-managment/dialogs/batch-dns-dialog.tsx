'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { DnsRecordForm } from './dns-record-form';
import { type DnsRecordFormValues, formValuesToDnsRecord } from '../schemas';
import type { RecordType } from '@namefi-astra/zod-dns';

interface BatchDnsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domains: NamefiNormalizedDomain[];
  action: 'ns' | 'web' | 'mx' | 'ens' | 'forward' | null;
}

export function BatchDnsDialog({
  isOpen,
  onOpenChange,
  domains,
  action,
}: BatchDnsDialogProps) {
  const t = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [webRecordForm, setWebRecordForm] = useState<{
    values: DnsRecordFormValues;
    isValid: boolean;
  }>({
    values: {
      type: 'A' as RecordType,
      name: '',
      domain: domains[0] || '',
      rdata: '',
      ttl: 60,
    },
    isValid: false,
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateConfig = useMutation(
    trpc.domainConfig.updateDomainPreferencesAndConfig.mutationOptions(),
  );

  const createRecords = useMutation(
    trpc.dnsRecords.createRecords.mutationOptions(),
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (action === 'forward') {
        // Update forwarding for all domains
        await Promise.all(
          domains.map((domain) =>
            updateConfig.mutateAsync({
              domainName: domain,
              domainPreferencesAndConfig: {
                forwardTo: value,
              },
            }),
          ),
        );
        await Promise.all(
          domains.map((domain) =>
            queryClient.invalidateQueries({
              queryKey: trpc.dnsRecords.getRecords.queryKey({
                zoneName: domain,
              }),
            }),
          ),
        );
        toast.success(
          t('dialogs.batch.forwardingUpdated', { count: domains.length }),
        );
      } else if (action === 'web') {
        if (!webRecordForm.isValid) return;

        await Promise.all(
          domains.map((domain) => {
            // Create record for each domain
            return createRecords.mutateAsync({
              zoneName: domain,
              records: [
                formValuesToDnsRecord({ ...webRecordForm.values, domain }),
              ],
            });
          }),
        );
        toast.success(
          t('dialogs.batch.webRecordsUpdated', { count: domains.length }),
        );
      } else if (action === 'ns') {
        // TODO: Implement batch NS update
        // This requires nameserver change workflow which is signed payload.
        // Doing this in batch might require multiple signatures or a new batch endpoint.
        // Given complexity, we might defer or show "Coming soon".
        toast.info(t('dialogs.batch.nameserverComingSoon'));
      } else {
        toast.info(t('dialogs.batch.recordComingSoon'));
      }

      await queryClient.invalidateQueries({
        queryKey: trpc.users.getCurrentUserDomains.queryKey(),
      });
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(t('dialogs.batch.updateFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'ns':
        return t('dialogs.batch.setNameservers');
      case 'forward':
        return t('dialogs.batch.setUrlForwarding');
      case 'web':
        return t('dialogs.batch.setWebRecords');
      case 'mx':
        return t('dialogs.batch.setMxRecords');
      case 'ens':
        return t('dialogs.batch.setEnsRecord');
      default:
        return t('dialogs.batch.batchAction');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="dnsManagement.batch.dialog"
        className={MOBILE_BOTTOM_SHEET_DIALOG}
      >
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {t('dialogs.batch.applyingToDomains', { count: domains.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {action === 'forward' && (
            <div className="grid gap-2">
              <Label htmlFor="batch-forward">
                {t('dialogs.batch.forwardUrlLabel')}
              </Label>
              <Input
                data-testid="dnsManagement.batch.forward-url-input"
                id="batch-forward"
                placeholder={t('dialogs.forwarding.placeholder')}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          )}
          {action === 'web' && (
            <div className="grid gap-2">
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-md text-xs mb-2">
                {t('dialogs.batch.webRecordNotice')}
              </div>
              <DnsRecordForm
                index={0}
                onValuesChange={(values, isValid) =>
                  setWebRecordForm({ values, isValid })
                }
                showRemoveButton={false}
                // We pass the first domain just for visual preview of the FQDN
                defaultValues={{ ...webRecordForm.values, domain: domains[0] }}
              />
            </div>
          )}
          {action !== 'forward' && action !== 'web' && (
            <div className="p-4 border rounded bg-muted/50 text-center text-muted-foreground">
              {t('dialogs.batch.comingSoon', {
                action: action?.toUpperCase() ?? '',
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            data-testid="dnsManagement.batch.cancel"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            data-testid="dnsManagement.batch.save"
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (action !== 'forward' && action !== 'web') ||
              (action === 'web' && !webRecordForm.isValid)
            }
          >
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {tCommon('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
