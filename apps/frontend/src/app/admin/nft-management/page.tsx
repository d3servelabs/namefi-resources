'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import AdminNftManagement from '../../../components/admin/nft-management';

export default withAdminGuard(AdminNftManagement);
