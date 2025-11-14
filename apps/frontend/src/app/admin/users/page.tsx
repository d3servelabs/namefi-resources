'use client';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';
import { useAdminFeatureFlag } from '@/components/admin/feature-flags/use-flag';
import AdminUsersPage from './legacy';
import DrizzlerUsersPage from './drizzler';

const USERS_FLAG_DEFINITION: FeatureFlagDefinition[] = [
  {
    key: 'new_table_component',
    label: 'New Table Component',
    description: 'use the new table component but with the existing filters',
    scope: 'page',
    pageKey: 'users',
    defaultValue: false,
  },
  {
    key: 'new_filters_component',
    label: 'New Combinable Filters',
    description:
      'use the new table component but with the new combinable filters',
    scope: 'page',
    pageKey: 'users',
    defaultValue: false,
  },
];
export default withAdminGuard(function UsersPage() {
  useRegisterAdminFlags(USERS_FLAG_DEFINITION);

  const [newTableComponent] = useAdminFeatureFlag(USERS_FLAG_DEFINITION[0]);
  const [newFiltersComponent] = useAdminFeatureFlag(USERS_FLAG_DEFINITION[1]);

  if (newFiltersComponent) {
    return <DrizzlerUsersPage />;
  }
  return <AdminUsersPage useNewTableComponent={newTableComponent} />;
});
