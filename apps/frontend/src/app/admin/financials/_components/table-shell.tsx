'use client';

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
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import { Download, FileJson, FileText, Loader2, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ExportFormat } from './types';
import { formatInteger } from './utils';

export function FinancialTableCard({
  title,
  description,
  total,
  isFetching,
  onRefresh,
  isExporting,
  onExport,
  children,
}: {
  title: string;
  description: string;
  total: number;
  isFetching: boolean;
  onRefresh: () => void;
  isExporting: boolean;
  onExport: (formatType: ExportFormat) => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {description} {formatInteger(total)} matching rows.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isFetching}
            >
              {isFetching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <ExportMenu isExporting={isExporting} onExport={onExport} />
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function GroupByOrderToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-3 flex justify-end">
      <Button
        type="button"
        variant={enabled ? 'default' : 'outline'}
        size="sm"
        onClick={onToggle}
      >
        {enabled ? 'Disable grouping' : 'Group by order'}
      </Button>
    </div>
  );
}

function ExportMenu({
  isExporting,
  onExport,
}: {
  isExporting: boolean;
  onExport: (formatType: ExportFormat) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onExport('csv')}
          disabled={isExporting}
        >
          <FileText className="h-4 w-4 mr-2" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onExport('json')}
          disabled={isExporting}
        >
          <FileJson className="h-4 w-4 mr-2" />
          Download JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
