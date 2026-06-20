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
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';

interface ForwardingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: NamefiNormalizedDomain;
  currentForwardUrl: string | null;
  readOnly?: boolean;
  warningMessage?: string;
}

export function ForwardingDialog({
  isOpen,
  onOpenChange,
  domainName,
  currentForwardUrl,
  readOnly,
  warningMessage,
}: ForwardingDialogProps) {
  const t = useTranslations('dnsManagement');
  const tCommon = useTranslations('common');
  const [forwardUrl, setForwardUrl] = useState(currentForwardUrl || '');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  useEffect(() => {
    setForwardUrl(currentForwardUrl || '');
  }, [currentForwardUrl]);

  const updateConfig = useMutation(
    trpc.domainConfig.updateDomainPreferencesAndConfig.mutationOptions(),
  );

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        domainName,
        domainPreferencesAndConfig: {
          forwardTo: forwardUrl,
        },
      });

      toast.success(t('dialogs.forwarding.updated'));

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.dnsRecords.getRecords.queryKey({
            zoneName: domainName,
          }),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.users.getCurrentUserDomains.queryKey(),
        }),
      ]);

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('dialogs.forwarding.updateFailed'),
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={MOBILE_BOTTOM_SHEET_DIALOG}>
        <DialogHeader>
          <DialogTitle>{t('dialogs.forwarding.title')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.forwarding.description', { domain: domainName })}
          </DialogDescription>
        </DialogHeader>

        {warningMessage && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-md text-sm mb-4">
            {warningMessage}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="forward-url">
              {t('dialogs.forwarding.fieldLabel')}
            </Label>
            <Input
              id="forward-url"
              placeholder={t('dialogs.forwarding.placeholder')}
              value={forwardUrl}
              onChange={(e) => setForwardUrl(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? tCommon('actions.close') : tCommon('actions.cancel')}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending && (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              )}
              {tCommon('actions.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
