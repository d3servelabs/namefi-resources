'use client';

import { DnsRecordsEmptyState } from '@/components/DNS/DnsRecordsEmptyState';
import { DnsRecordsTable } from '@/components/DNS/DnsRecordsTable/DnsRecordsTable';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Database, FileText, FileType, Mail, Plus, Server } from 'lucide-react';
import {
  type FC,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import React from 'react';
import { toast } from 'sonner';
import {
  type DialogAction,
  type DialogData,
  useDialogStore,
} from './stores/dialog';

export type DnsRecordsPanelProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DnsRecordsPanel: FC<DnsRecordsPanelProps> = ({
  domain,
  className,
  ...rest
}: DnsRecordsPanelProps) => {
  const trpc = useTRPC();

  const { openAddDialog } = useDialogStore();

  const [hasNameservers, setHasNameservers] = useState(true);

  // State for data

  const dnsRecords = useQuery(
    trpc.dnsRecords.getRecords.queryOptions(
      {
        normalizedDomainName: domain ?? '',
      },
      {
        enabled: !!domain,
      },
    ),
  );

  const onRefetch = useCallback(async () => {
    await dnsRecords.refetch();
  }, [dnsRecords]);

  // Create DNS record mutation
  const createDnsRecord = useMutation(
    trpc.dnsRecords.createDnsRecord.mutationOptions({
      onSuccess: onRefetch,
      onError: (error) => {
        toast('Failed to create DNS record', {
          description: error.message,
        });
      },
    }),
  );

  // Memoize the callback to prevent recreation on each render
  const handleDialogCallback = useCallback(
    async (action: DialogAction, data?: DialogData) => {
      console.log(`Dialog action: "${action}"`, data);

      if (!data) {
        return;
      }

      if (action === 'add' && data.success) {
        const res = await Promise.allSettled(
          data.updatedRecords.map((record) =>
            createDnsRecord.mutateAsync({
              normalizedDomainName: domain as string,
              type: record.type,
              name: record.name,
              rdata: record.rdata,
              ttl: record.ttl,
            }),
          ),
        );

        if (res.every((result) => result.status === 'fulfilled')) {
          toast('Records added', {
            description: data.message,
          });
        }
      }
    },
    [domain, createDnsRecord],
  );

  // Memoize the record type handlers
  const handleAddRecord = useCallback(
    (type?: string) => {
      openAddDialog(
        domain as NamefiNormalizedDomain,
        handleDialogCallback,
        type,
      );
    },
    [domain, openAddDialog, handleDialogCallback],
  );

  // Memoize the nameserver switching handler
  const handleSwitchNameservers = useCallback(() => {
    //TODO
    toast('Switching nameservers', {
      description: 'Please wait while we switch your nameservers to Namefi...',
    });

    // Simulating a successful switch
    setTimeout(() => {
      setHasNameservers(true);
      toast('Nameservers switched', {
        description:
          'Your nameservers have been successfully switched to Namefi.',
      });
    }, 2000);
  }, []);

  return (
    <Card className={cn('bg-zinc-900 border-zinc-800', className)} {...rest}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">DNS Records</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage your domain's DNS records
          </CardDescription>
        </div>

        {hasNameservers && (
          <AddRecordDropdownMenu onAddRecordClicked={handleAddRecord}>
            <Button
              disabled={!domain}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="mr-1 h-4 w-4" /> Add record
            </Button>
          </AddRecordDropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {hasNameservers ? (
          <DnsRecordsTable domain={domain} />
        ) : (
          <DnsRecordsEmptyState onSwitchNameservers={handleSwitchNameservers} />
        )}
      </CardContent>
    </Card>
  );
};

DnsRecordsPanel.displayName = 'DnsRecordsPanel';

const AddRecordDropdownMenu = React.memo(
  ({
    onAddRecordClicked,
    children,
  }: {
    onAddRecordClicked: (type: string) => void;
    children: ReactNode;
  }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Record Types</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAddRecordClicked('A')}>
            <Database className="mr-2 h-4 w-4" />
            <span>A Record</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddRecordClicked('AAAA')}>
            <Database className="mr-2 h-4 w-4" />
            <span>AAAA Record</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAddRecordClicked('CNAME')}>
            <FileType className="mr-2 h-4 w-4" />
            <span>CNAME Record</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddRecordClicked('MX')}>
            <Mail className="mr-2 h-4 w-4" />
            <span>MX Record</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddRecordClicked('TXT')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>TXT Record</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAddRecordClicked('NS')}>
            <Server className="mr-2 h-4 w-4" />
            <span>NS Record</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddRecordClicked('SRV')}>
            <Server className="mr-2 h-4 w-4" />
            <span>SRV Record</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
