import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';

type CacheEntry = {
  found: boolean;
  cache_type: 'success' | 'denial';
  name: string;
  qtype: number;
  qtype_name: string;
  ttl_remaining: number;
  original_ttl: number;
  stored_at: string;
  answer?: string[];
};

type CacheDumpData = {
  entries: CacheEntry[];
  page: number;
  limit: number;
  total_entries: number;
  total_pages: number;
  cache_type: 'all' | 'success' | 'denial';
};

interface CacheEntriesViewerProps {
  data: CacheDumpData | null;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onFilterChange: (filter: 'all' | 'success' | 'denial') => void;
  currentFilter: 'all' | 'success' | 'denial';
}

export function CacheEntriesViewer({
  data,
  isLoading,
  onPageChange,
  onFilterChange,
  currentFilter,
}: CacheEntriesViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries =
    data?.entries.filter((entry) =>
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const handleExport = () => {
    if (!data) return;
    const json = JSON.stringify(filteredEntries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-entries-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div
        data-testid="admin.dns-cache.entries.loading"
        className="text-center py-8 text-muted-foreground"
      >
        Loading cache entries...
      </div>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <div
        data-testid="admin.dns-cache.entries.empty"
        className="text-center py-8 text-muted-foreground"
      >
        No cache entries found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select
          value={currentFilter}
          onValueChange={(value) => {
            if (!value) return;
            onFilterChange(value);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="denial">Denial</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 me-2" />
          Export
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>TTL Remaining</TableHead>
              <TableHead>Original TTL</TableHead>
              <TableHead>Cache Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry, index) => (
              <TableRow key={`${entry.name}-${entry.qtype_name}-${index}`}>
                <TableCell className="font-mono text-sm">
                  {entry.name}
                </TableCell>
                <TableCell>{entry.qtype_name}</TableCell>
                <TableCell>
                  {entry.ttl_remaining < 0 ? (
                    <span className="text-red-300">
                      Expired ({entry.ttl_remaining}s)
                    </span>
                  ) : (
                    `${entry.ttl_remaining}s`
                  )}
                </TableCell>
                <TableCell>{entry.original_ttl}s</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      entry.cache_type === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {entry.cache_type}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredEntries.length} of {data.total_entries} entries (Page{' '}
          {data.page} of {data.total_pages})
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.page - 1)}
            disabled={data.page === 1}
          >
            <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(data.page + 1)}
            disabled={data.page >= data.total_pages}
          >
            Next
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
          </Button>
        </div>
      </div>
    </div>
  );
}
