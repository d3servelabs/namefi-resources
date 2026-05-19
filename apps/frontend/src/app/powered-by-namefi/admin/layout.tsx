import type { PropsWithChildren } from 'react';
import { NO_INDEX_METADATA } from '@/lib/seo/noindex';
import { FloatingBatchButton } from '@/components/admin/email-batch/floating-batch-button';

export const metadata = NO_INDEX_METADATA;

export default function PoweredByNamefiAdminLayout({
  children,
}: PropsWithChildren) {
  return (
    <>
      {children}
      <FloatingBatchButton />
    </>
  );
}
