'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { AsyncButton } from '@/components/buttons/async-button';
import { HostnamesChipInput } from './hostnames-chip-input';

export interface EditHostnamesDialogProps {
  /** When null the dialog is closed. */
  domain: {
    normalizedDomainName: string;
    additionalAllowedHostnames: string[] | null;
  } | null;
  onClose: () => void;
  onSubmit: (input: {
    normalizedDomainName: string;
    additionalAllowedHostnames: string[];
  }) => Promise<unknown>;
  isSubmitting?: boolean;
}

/**
 * Modal for editing the `additionalAllowedHostnames` list on an existing
 * Powered-by-Namefi domain. Keeps the state local so cancel / close
 * discards edits without touching the parent row. Delegates the mutation
 * to the caller via `onSubmit` (typically
 * `admin.poweredByNamefi.updatePoweredByNamefiDomain`).
 */
export function EditHostnamesDialog({
  domain,
  onClose,
  onSubmit,
  isSubmitting,
}: EditHostnamesDialogProps) {
  const [hostnames, setHostnames] = useState<string[]>(
    domain?.additionalAllowedHostnames ?? [],
  );
  const [initialized, setInitialized] = useState<string | null>(null);

  // Re-sync when the dialog is opened for a different domain.
  if (domain && initialized !== domain.normalizedDomainName) {
    setHostnames(domain.additionalAllowedHostnames ?? []);
    setInitialized(domain.normalizedDomainName);
  }

  const handleSubmit = async () => {
    if (!domain) return;
    await onSubmit({
      normalizedDomainName: domain.normalizedDomainName,
      additionalAllowedHostnames: hostnames,
    });
  };

  return (
    <Dialog
      open={domain !== null}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'sm:max-w-xl w-full max-h-[min(90vh,720px)] overflow-hidden grid-rows-[auto_1fr_auto]',
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-baseline gap-x-2 pe-8 break-words">
            <span>Additional Hostnames</span>
            {domain ? (
              <span className="font-mono text-sm text-muted-foreground break-all">
                {domain.normalizedDomainName}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 space-y-3 overflow-y-auto pe-1">
          <p className="text-sm text-muted-foreground">
            Hostnames that are accepted as aliases for this Powered-by-Namefi
            parent — for example the <code>*.astra.namefi.io</code> and{' '}
            <code>*.poweredby.namefi.io</code> mirrors. Press Enter or comma to
            add an entry; click the × to remove.
          </p>
          <HostnamesChipInput
            value={hostnames}
            onChange={setHostnames}
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </Button>
          <AsyncButton
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Save
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
