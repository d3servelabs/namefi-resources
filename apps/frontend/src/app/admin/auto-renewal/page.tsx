'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import AutoRenewalWorkflowsList from '../../../components/admin/auto-renewal-workflows-list';

export default withAdminGuard(AutoRenewalWorkflowsList);
