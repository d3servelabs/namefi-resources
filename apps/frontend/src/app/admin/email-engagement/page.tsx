'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { EmailEngagementDashboard } from '@/components/admin/email-engagement';

export default withAdminGuard(EmailEngagementDashboard);
