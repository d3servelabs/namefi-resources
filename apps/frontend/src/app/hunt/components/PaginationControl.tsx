import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/shadcn/pagination';

interface PaginationControlsProps {
  page: number;
  hasMore: boolean;
  onPageChange: (page: number) => void;
}

export const PaginationControls = ({
  page,
  hasMore,
  onPageChange,
}: PaginationControlsProps) => {
  if (page === 1 && !hasMore) {
    return null;
  }
  return (
    <Pagination className="mt-4">
      <PaginationContent>
        {page > 1 && (
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              className="cursor-pointer"
            />
          </PaginationItem>
        )}
        {page > 1 && (
          <PaginationItem>
            <PaginationLink
              onClick={() => onPageChange(1)}
              className="cursor-pointer"
            >
              1
            </PaginationLink>
          </PaginationItem>
        )}
        {page > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationLink isActive={true} aria-current="page">
            {page}
          </PaginationLink>
        </PaginationItem>
        {hasMore && (
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              className="cursor-pointer"
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
};
