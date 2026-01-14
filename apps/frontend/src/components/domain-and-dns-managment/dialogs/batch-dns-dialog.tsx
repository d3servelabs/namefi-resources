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
        toast.success(`Forwarding updated for ${domains.length} domains`);
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
        toast.success(`Web records updated for ${domains.length} domains`);
      } else if (action === 'ns') {
        // TODO: Implement batch NS update
        // This requires nameserver change workflow which is signed payload.
        // Doing this in batch might require multiple signatures or a new batch endpoint.
        // Given complexity, we might defer or show "Coming soon".
        toast.info('Batch nameserver update coming soon');
      } else {
        toast.info('Batch DNS record update coming soon');
      }

      await queryClient.invalidateQueries({
        queryKey: trpc.users.getCurrentUserDomains.queryKey(),
      });
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update domains');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'ns':
        return 'Set Nameservers';
      case 'forward':
        return 'Set URL Forwarding';
      case 'web':
        return 'Set Web Records';
      case 'mx':
        return 'Set MX Records';
      case 'ens':
        return 'Set ENS Record';
      default:
        return 'Batch Action';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Applying to {domains.length} selected domains.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {action === 'forward' && (
            <div className="grid gap-2">
              <Label htmlFor="batch-forward">Forward URL</Label>
              <Input
                id="batch-forward"
                placeholder="https://example.com"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
          )}
          {action === 'web' && (
            <div className="grid gap-2">
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-md text-xs mb-2">
                This will add the specified record to all selected domains.
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
              Batch editing for {action?.toUpperCase()} is coming soon.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (action !== 'forward' && action !== 'web') ||
              (action === 'web' && !webRecordForm.isValid)
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
