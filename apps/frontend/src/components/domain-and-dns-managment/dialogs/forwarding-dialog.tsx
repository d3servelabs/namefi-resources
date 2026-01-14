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
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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

      toast.success('Forwarding URL updated');

      await queryClient.invalidateQueries({
        queryKey: trpc.users.getCurrentUserDomains.queryKey(),
      });

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update forwarding URL',
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit URL Forwarding</DialogTitle>
          <DialogDescription>
            Enter the URL you want {domainName} to forward to.
          </DialogDescription>
        </DialogHeader>

        {warningMessage && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-md text-sm mb-4">
            {warningMessage}
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="forward-url">Forward To URL</Label>
            <Input
              id="forward-url"
              placeholder="https://example.com"
              value={forwardUrl}
              onChange={(e) => setForwardUrl(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button onClick={handleSave} disabled={updateConfig.isPending}>
              {updateConfig.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
