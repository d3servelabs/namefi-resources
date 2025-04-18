import { useCallback, useEffect, useState } from 'react';

export function usePagination({
  maxPageSize = Number.POSITIVE_INFINITY,
  defaultPageSize = 10,
  defaultPageIndex = 0,
}: {
  maxPageSize?: number;
  defaultPageSize?: number;
  defaultPageIndex?: number;
} = {}) {
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(defaultPageIndex);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    if (pageCount > 0 && pageIndex >= pageCount) {
      setPageIndex(pageCount - 1);
    }
  }, [pageCount, pageIndex]);

  const goToPage = useCallback(
    (pageIndex: number) => {
      setPageIndex(Math.min(pageIndex, pageCount - 1));
    },
    [pageCount],
  );

  const nextPage = useCallback(() => {
    setPageIndex((prev) => Math.min(prev + 1, pageCount - 1));
  }, [pageCount]);

  const previousPage = useCallback(() => {
    setPageIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handlePageSizeChange = useCallback(
    (value: string | number) => {
      setPageSize(Math.min(Number(value), maxPageSize));
      setPageIndex(0); // Reset to first page when changing page size
    },
    [maxPageSize],
  );

  return {
    pageSize,
    setPageSize,
    pageIndex,
    setPageIndex,
    handlePageSizeChange,
    goToPage,
    nextPage,
    previousPage,
    pageCount,
    setPageCount,
  };
}
