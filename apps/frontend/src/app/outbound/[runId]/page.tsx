import { LeadgenApp } from '@/components/leadgen/leadgen-app';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ runId: string }>;
};

export default async function OutboundRunPage({ params }: Props) {
  const { runId } = await params;
  return (
    <Suspense fallback={null}>
      <LeadgenApp initialRunId={runId} />
    </Suspense>
  );
}
