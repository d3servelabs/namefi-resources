import { Button } from '@/components/ui/shadcn/button';
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { FC } from 'react';

type TablePageSelectorProps = {
  pageIndex: number;
  setPageIndex: (index: number) => void;
  pageCount: number;
};

export const TablePageSelector: FC<TablePageSelectorProps> = ({
  pageIndex,
  setPageIndex,
  pageCount,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500">
        Page {pageIndex + 1} of {pageCount || 1}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setPageIndex(0)}
        disabled={pageIndex === 0}
      >
        <ChevronFirst className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
        disabled={pageIndex === 0}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPageIndex(Math.min(pageCount - 1, pageIndex + 1))}
        disabled={pageIndex >= pageCount - 1}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPageIndex(pageCount - 1)}
        disabled={pageIndex >= pageCount - 1}
      >
        <ChevronLast className="h-4 w-4" />
      </Button>
    </div>
  );
};
