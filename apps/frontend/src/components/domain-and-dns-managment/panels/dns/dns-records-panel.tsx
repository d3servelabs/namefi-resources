import { DnsRecordsTable } from '@/components/domain-and-dns-managment/panels/dns/dns-records-table/dns-records-table';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { RecordType } from '@namefi-astra/zod-dns';
import { Database, FileText, FileType, Mail, Plus, Server } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type FC,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useState,
} from 'react';
import React from 'react';
import { AddEditRecordsDialog } from '../../dialogs/add-edit-records-dialog';
import { DNS_RECORD_TYPES } from '../../schemas';

export type DnsRecordsPanelProps = HTMLAttributes<HTMLDivElement> & {
  domain: string;
};

export const DnsRecordsPanel: FC<DnsRecordsPanelProps> = ({
  domain,
  className,
  ...rest
}: DnsRecordsPanelProps) => {
  const t = useTranslations('dnsManagement');
  const [preselectedType, setPreselectedType] = useState<string | undefined>(
    undefined,
  );
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);

  const handleAddRecord = useCallback((type?: string) => {
    setPreselectedType(type);
    setIsAddEditDialogOpen(true);
  }, []);

  return (
    <Card
      className={cn(
        'relative overflow-hidden border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5',
        className,
      )}
      {...rest}
    >
      <AddEditRecordsDialog
        zoneName={domain as NamefiNormalizedDomain}
        isOpen={isAddEditDialogOpen}
        onOpenChange={setIsAddEditDialogOpen}
        preselectedType={preselectedType as RecordType}
        mode={'add'}
      />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">
            {t('records.panel.title')}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {t('records.panel.description')}
          </CardDescription>
        </div>

        <AddRecordDropdownMenu onAddRecordClicked={handleAddRecord}>
          <Button
            disabled={!domain}
            className="bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
          >
            <Plus className="me-1 h-4 w-4" /> {t('records.panel.addRecord')}
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
  }: {
    onAddRecordClicked: (type: string) => void;
    children: ReactNode;
  }) => {
    const t = useTranslations('dnsManagement');
    return (
      <DropdownMenu>
        <DropdownMenuTrigger render={children as React.ReactElement} />
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {t('records.panel.recordTypes')}
            </DropdownMenuLabel>
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
                    <Icon className="me-2 h-4 w-4" />
                    <span>{t('records.panel.recordTypeOption', { type })}</span>
                  </DropdownMenuItem>

                  {index !== DNS_RECORD_TYPES.length - 1 && (
                    <DropdownMenuSeparator key={`${type}-separator`} />
                  )}
                </>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);
