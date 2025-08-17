'use client';
import { withAdminGuard } from '@/components/admin/admin-guard';
import AdminFreeClaims from '../../../components/admin/free-claims';

export default withAdminGuard(AdminFreeClaims);
