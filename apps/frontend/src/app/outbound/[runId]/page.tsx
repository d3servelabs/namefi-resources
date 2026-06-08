import { LeadgenApp } from '@/components/leadgen/leadgen-app';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ lead?: string | string[] }>;
};

export default async function OutboundRunPage({ params, searchParams }: Props) {
  const [{ runId }, query] = await Promise.all([params, searchParams]);
  const initialLeadId = Array.isArray(query.lead) ? query.lead[0] : query.lead;

  return (
    <Suspense fallback={null}>
      <LeadgenApp initialRunId={runId} initialLeadId={initialLeadId} />
    </Suspense>
  );
}
