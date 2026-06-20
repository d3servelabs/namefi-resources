import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { useTranslations } from 'next-intl';

export const TablePageSelector = ({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}) => {
  const t = useTranslations('shared');
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500">
        {t('table.pagination.rowsPerPage')}
      </span>
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
          <SelectItem value="5">5</SelectItem>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
