'use client';

import { use } from 'react';
import { OrderDetailsContent } from '@/components/orders/order-details-content';

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <OrderDetailsContent id={id} />;
}
