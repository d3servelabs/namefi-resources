'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import AdminEmailCampaigns from '../../../components/admin/email-campaigns';

export default withAdminGuard(AdminEmailCampaigns);
