'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/lib/trpc';
import { AddEditRecordsDialog } from './add-edit-records-dialog';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { RecordType } from '@namefi-astra/zod-dns';
import type { DnsRecordSelect } from '@namefi-astra/db';

interface EditDnsRecordsWrapperProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  domainName: NamefiNormalizedDomain;
  types: RecordType[];
  preselectedType: RecordType;
  filterPredicate?: (record: DnsRecordSelect) => boolean;
  readOnly?: boolean;
  warningMessage?: string;
}

export function EditDnsRecordsWrapper({
  isOpen,
  onOpenChange,
  domainName,
  types,
  preselectedType,
  filterPredicate,
  readOnly,
  warningMessage,
}: EditDnsRecordsWrapperProps) {
  const trpc = useTRPC();
  const {
    data: records,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...trpc.dnsRecords.getRecords.queryOptions({ zoneName: domainName }),
    enabled: isOpen,
  });

  if (isOpen && isLoading) {
    return (
      <AddEditRecordsDialog
        mode="add"
        isOpen={isOpen}
        zoneName={domainName}
        onOpenChange={onOpenChange}
      >
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AddEditRecordsDialog>
    );
  }

  if (isOpen && isError) {
    return (
      <AddEditRecordsDialog
        mode="edit"
        isOpen={isOpen}
        zoneName={domainName}
        onOpenChange={onOpenChange}
        readOnly={true}
      >
        <div className="flex flex-col items-center justify-center p-8 text-center gap-4">
          <p className="text-destructive">
            {error instanceof Error
              ? error.message
              : 'Failed to load DNS records'}
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </AddEditRecordsDialog>
    );
  }

  const filteredRecords =
    records?.filter(
      (r) => types.includes(r.type) && (!filterPredicate || filterPredicate(r)),
    ) || [];

  const mode = filteredRecords.length > 0 ? 'edit' : 'add';

  return (
    <AddEditRecordsDialog
      records={filteredRecords}
      mode={mode}
      isOpen={isOpen}
      zoneName={domainName}
      onOpenChange={onOpenChange}
      preselectedType={preselectedType}
      readOnly={readOnly}
      warningMessage={warningMessage}
    />
  );
}
