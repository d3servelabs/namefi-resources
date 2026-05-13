'use client';

import { use } from 'react';
import { OrderDetailsContent } from '@/components/orders/order-details-content';
import { PageShell } from '@/components/page-shell';

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <PageShell>
      <OrderDetailsContent id={id} />
    </PageShell>
  );
}
