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
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import type { RecordType } from '@namefi-astra/zod-dns';
import { Database, FileText, FileType, Mail, Plus, Server } from 'lucide-react';
import {
  type FC,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import React from 'react';
import { AddEditRecordsDialog } from './dialogs/AddEditRecordsDialog';
import { DNS_RECORD_TYPES } from './schemas';

export type DnsRecordsPanelProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DnsRecordsPanel: FC<DnsRecordsPanelProps> = ({
  domain,
  className,
  ...rest
}: DnsRecordsPanelProps) => {
  const [preselectedType, setPreselectedType] = useState<string | undefined>(
    undefined,
  );
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);

  const handleAddRecord = useCallback((type?: string) => {
    setPreselectedType(type);
    setIsAddEditDialogOpen(true);
  }, []);

  return (
    <Card className={cn('bg-zinc-900 border-zinc-800', className)} {...rest}>
      <AddEditRecordsDialog
        zoneName={domain as NamefiNormalizedDomain}
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        preselectedType={preselectedType as RecordType}
        mode={'add'}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">DNS Records</CardTitle>
          <CardDescription className="text-zinc-400">
            Manage your domain's DNS records
          </CardDescription>
        </div>

        <AddRecordDropdownMenu onAddRecordClicked={handleAddRecord}>
          <Button
            disabled={!domain}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white"
          >
            <Plus className="mr-1 h-4 w-4" /> Add record
          </Button>
        </AddRecordDropdownMenu>
      </CardHeader>
      <CardContent>
        <DnsRecordsTable domain={domain} />
      </CardContent>
    </Card>
  );
};

DnsRecordsPanel.displayName = 'DnsRecordsPanel';

const RecordTypeIconMap = {
  A: Database,
  AAAA: Database,
  CNAME: FileType,
  MX: Mail,
  TXT: FileText,
  NS: Server,
  SRV: Server,
};
const AddRecordDropdownMenu = React.memo(
  ({
    onAddRecordClicked,
    children,
  }: { onAddRecordClicked: (type: string) => void; children: ReactNode }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild={true}>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Record Types</DropdownMenuLabel>
          {DNS_RECORD_TYPES.map((type, index) => {
            const Icon =
              RecordTypeIconMap[type as keyof typeof RecordTypeIconMap] ||
              Database;
            return (
              <>
                <DropdownMenuItem
                  key={type}
                  onClick={() => onAddRecordClicked(type)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{type} Record</span>
                </DropdownMenuItem>

                {index !== DNS_RECORD_TYPES.length - 1 && (
                  <DropdownMenuSeparator key={`${type}-separator`} />
                )}
              </>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
