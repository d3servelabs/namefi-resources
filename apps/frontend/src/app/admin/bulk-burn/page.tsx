'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import BulkBurnManagement from '../../../components/admin/bulk-burn-management';

export default withAdminGuard(BulkBurnManagement);
