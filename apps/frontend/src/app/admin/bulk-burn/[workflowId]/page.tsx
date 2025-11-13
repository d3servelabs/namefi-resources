'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { useParams } from 'next/navigation';
import BulkBurnManagement from '../../../../components/admin/bulk-burn-management';

/**
 * Wrapper component that extracts workflowId from URL params
 * and passes it to the BulkBurnManagement component
 */
export default withAdminGuard(function BulkBurnWorkflowDetails() {
  const params = useParams();
  const workflowId = params.workflowId as string;

  return <BulkBurnManagement workflowId={workflowId} />;
});
