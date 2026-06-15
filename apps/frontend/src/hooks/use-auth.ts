import {
  useAuthContext,
  useMyPermissions as useMyPermissionsQuery,
} from '@/components/providers/auth';

export function useAuth() {
  return useAuthContext();
}

export function useMyPermissions() {
  return useMyPermissionsQuery();
}
