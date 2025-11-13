'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import BulkBurnWorkflowsList from '../../../components/admin/bulk-burn-workflows-list';

export default withAdminGuard(BulkBurnWorkflowsList);
