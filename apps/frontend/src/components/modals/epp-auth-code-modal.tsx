'use client';

import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { AlertCircle, Info, Loader2 } from 'lucide-react';
import { type FC, useCallback, useState } from 'react';
import type { DomainAvailabilityInfo } from '@namefi-astra/backend/trpc/types';

export interface EppAuthCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eppAuthCode: string) => void | Promise<void>;
  domainInfo: DomainAvailabilityInfo;
  isSubmitting?: boolean;
}

export const EppAuthCodeModal: FC<EppAuthCodeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  domainInfo,
  isSubmitting = false,
}) => {
  const [eppAuthCode, setEppAuthCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!eppAuthCode.trim()) {
      setError('Please enter an authorization code');
      return;
    }

    setError(null);
    try {
      await onSubmit(eppAuthCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [eppAuthCode, onSubmit]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setEppAuthCode('');
      setError(null);
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Domain</DialogTitle>
          <DialogDescription>
            To import <span className="font-semibold">{domainInfo.domain}</span>
            , you'll need to provide the EPP authorization code from your
            current registrar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/50 p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">How to get your EPP code:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Log in to your current registrar's control panel</li>
                  <li>Find the domain management section</li>
                  <li>Look for "Transfer Out" or "Get Auth/EPP Code"</li>
                  <li>Copy the authorization code</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="epp-code">EPP Authorization Code</Label>
            <Input
              id="epp-code"
              type="text"
              placeholder="Enter your authorization code"
              value={eppAuthCode}
              onChange={(e) => {
                setEppAuthCode(e.target.value);
                setError(null);
              }}
              disabled={isSubmitting}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {domainInfo.currentOwner && (
            <div className="text-sm text-muted-foreground">
              <p>
                Current owner: {domainInfo.currentOwner.substring(0, 6)}...
                {domainInfo.currentOwner.substring(
                  domainInfo.currentOwner.length - 4,
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !eppAuthCode.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
