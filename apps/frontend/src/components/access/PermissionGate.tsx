'use client';

import { useMemo, type ReactNode } from 'react';
import { Permission } from '@namefi-astra/utils/permissions';
import { useMyPermissions } from '@/hooks/use-auth';

type PermissionGateMode = 'normal' | 'inverted';
type PermissionsMode = 'some' | 'every';

interface PermissionGateProps {
  permissions: Permission[];
  /**
   * If the gate is inverted, the children will be shown if the user does not have the permission.
   */
  gateMode?: PermissionGateMode;
  loadingFallback?: ReactNode;
  children: ReactNode;
  /**
   * If the permissions mode is 'some', the gate will be shown if the user has any of the permissions.
   * If the permissions mode is 'every', the gate will be shown if the user has all of the permissions.
   */
  permissionsMode?: PermissionsMode;
}

export function useHasPermissions(
  permissions: Permission[],
  mode: PermissionsMode = 'every',
) {
  const { data, isLoading, isError } = useMyPermissions();
  const userPermissions = useMemo(() => new Set(data ?? []), [data]);
  const hasPermissions = useMemo(() => {
    if (userPermissions.has(Permission.SUPER_ADMIN)) return true;

    switch (mode) {
      case 'some':
        return permissions.some((p) => userPermissions.has(p));
      case 'every':
        return permissions.every((p) => userPermissions.has(p));
    }
  }, [permissions, userPermissions, mode]);
  return { hasPermissions, isLoading, isError, userPermissions };
}

export function PermissionGate({
  permissions,
  gateMode = 'normal',
  loadingFallback = null,
  children,
  permissionsMode = 'every',
}: PermissionGateProps) {
  const { hasPermissions, isLoading, isError } = useHasPermissions(
    permissions,
    permissionsMode,
  );

  if (isLoading) return <>{loadingFallback}</>;
  if (isError) return null;

  const show = gateMode === 'inverted' ? !hasPermissions : hasPermissions;
  return show ? children : null;
}

export function withPermissionGate<P extends object>(
  Component: (props: P) => ReactNode,
  options: {
    permissions: Permission[];
    gateMode?: PermissionGateMode;
    loadingFallback?: ReactNode;
    permissionsMode?: PermissionsMode;
  },
) {
  return function Wrapped(props: P) {
    return (
      <PermissionGate
        permissions={options.permissions}
        gateMode={options.gateMode}
        permissionsMode={options.permissionsMode}
        loadingFallback={options.loadingFallback}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}
