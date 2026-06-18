'use client';

import dynamic from 'next/dynamic';
import { AuthRequired } from '@/components/auth-required';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useFreeMints } from '@/hooks/use-free-mints';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PageShell } from '@/components/page-shell';

// Dynamically import the heavy content (table with @tanstack/react-table, FreeMintCard)
const FreeMintsContent = dynamic(
  () => import('./free-mints-content').then((mod) => mod.FreeMintsContent),
  { ssr: false },
);

function FreeMintsLoadingSkeleton() {
  const t = useTranslations('freeMints');
  return (
    <div className="space-y-8">
      {/* Loading state for active claims section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...new Array(2)].map((_, index) => (
          <div key={index} className="rounded-2xl border p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        ))}
      </div>

      {/* Loading state for table section */}
      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold">
          {t('historyHeading')}
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table.item')}</TableHead>
                <TableHead>{t('table.issuedOn')}</TableHead>
                <TableHead>{t('table.validUntil')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead>{t('table.claimedDomain')}</TableHead>
                <TableHead>{t('table.claimedOn')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...new Array(3)].map((_, index) => (
                <TableRow key={index}>
                  {[...new Array(6)].map((__, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="h-5 w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default function FreeClaimsPage() {
  const t = useTranslations('freeMints');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isFreeMintsLoading } = useFreeMints();

  const isLoading = useMemo(
    () => isAuthLoading || isFreeMintsLoading,
    [isAuthLoading, isFreeMintsLoading],
  );

  if (!(isAuthenticated || isLoading)) {
    return <AuthRequired />;
  }

  return (
    <PageShell>
      {/* Page Header */}
      <h1 className="mb-10 text-3xl md:text-4xl font-bold tracking-tight">
        {t('title')}
      </h1>

      {isLoading ? <FreeMintsLoadingSkeleton /> : <FreeMintsContent />}
    </PageShell>
  );
}
