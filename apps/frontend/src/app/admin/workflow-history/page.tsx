'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import AdminWorkflowHistory from '../../../components/admin/workflow-history';

export default withAdminGuard(AdminWorkflowHistory);
