'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { useParams, useSearchParams } from 'next/navigation';
import AutoRenewalManagement from '../../../../components/admin/auto-renewal-management';

export default withAdminGuard(function AutoRenewalWorkflowDetails() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workflowId = decodeURIComponent(params.workflowId as string);
  const runId = searchParams.get('runId') ?? undefined;

  return <AutoRenewalManagement workflowId={workflowId} runId={runId} />;
});
