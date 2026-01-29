import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import type { FC } from 'react';

export type TablePageSizeSelectorProps = {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  options?: { label: string; value: number }[];
};

export const TablePageSizeSelector: FC<TablePageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  options = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
  ],
}: TablePageSizeSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500">Rows per page:</span>
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => {
          if (!value) return;
          onPageSizeChange(Number.parseInt(value));
        }}
      >
        <SelectTrigger className="h-8 w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
