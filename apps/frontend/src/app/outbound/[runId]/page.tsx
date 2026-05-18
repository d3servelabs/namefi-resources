import { LeadgenApp } from '@/components/leadgen/leadgen-app';

type Props = {
  params: Promise<{ runId: string }>;
};

export default async function OutboundRunPage({ params }: Props) {
  const { runId } = await params;
  return <LeadgenApp initialRunId={runId} />;
}
