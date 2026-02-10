/**
 * Permission system - TypeScript-only enum and helpers
 *
 * Notes:
 * - Backend persists granted permissions as plain text strings in Postgres
 * - This enum is the single source of truth in code; avoid duplicating elsewhere
 */

export enum Permission {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HIGH_RISK = 'HIGH_RISK', // This permission is added on need-to basis, in order to take quick and urgent actions on behalf of the user

  WRITE_PERMISSIONS = 'PERMISSIONS;;WRITE',
  READ_PERMISSIONS = 'PERMISSIONS;;READ',

  WRITE_FREE_CLAIMS = 'FREE_CLAIMS;;WRITE',
  READ_FREE_CLAIMS = 'FREE_CLAIMS;;READ',

  READ_PBN = 'PBN;;READ',
  WRITE_PBN = 'PBN;;WRITE',

  READ_ANALYTICS = 'ANALYTICS;;READ',

  READ_SCHEDULES = 'SCHEDULES;;READ',
  WRITE_SCHEDULES = 'SCHEDULES;;WRITE',

  READ_NFT = 'NFT;;READ',
  WRITE_NFT = 'NFT;;WRITE',

  READ_DOMAIN_PREFERENCES = 'DOMAIN_PREFERENCES;;READ',
  WRITE_DOMAIN_PREFERENCES = 'DOMAIN_PREFERENCES;;WRITE',

  READ_USERS = 'USERS;;READ',
  WRITE_USERS = 'USERS;;WRITE',
  IMPERSONATE_USERS = 'USERS;;IMPERSONATE',

  READ_AUDIT_LOGS = 'AUDIT_LOGS;;READ',

  MINT_NFSC = 'NFSC;;MINT',
  BURN_NFSC = 'NFSC;;BURN',

  READ_ORDERS = 'ORDERS;;READ',

  /**
   * Permission to use EPP testing tools (CentralNic OTE2 admin dashboard)
   */
  EPP_TESTING = 'EPP_TESTING;;WRITE',

  /**
   * Permission to flush DNS caches across configured DNS servers
   */
  FLUSH_DNS_CACHE = 'DNS_CACHE;;FLUSH',

  /**
   * Hidden permission - not shown in UI lists, auto-added to ensure at least one row exists for an admin user
   */
  VIEW_ADMIN_DASHBOARD = 'ADMIN_DASHBOARD;;READ',
}

export type UserPermissions = readonly Permission[];

export function getAllPermissions(): readonly Permission[] {
  return Object.values(Permission);
}

/**
 * Hidden permissions that should not be shown in UI lists
 */
export const hiddenPermissions = new Set<Permission>([
  Permission.VIEW_ADMIN_DASHBOARD,
]);

export function getVisiblePermissions(): readonly Permission[] {
  return (Object.values(Permission) as Permission[]).filter(
    (p) => !hiddenPermissions.has(p),
  );
}

export function toPermission(value: string): Permission | null {
  return (Object.values(Permission) as string[]).includes(value)
    ? (value as Permission)
    : null;
}

export function hasPermission(
  permissions: Iterable<Permission> | null | undefined,
  permission: Permission,
): boolean {
  if (!permissions) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  return set.has(permission);
}

export function hasEveryPermission(
  permissions: Iterable<Permission> | null | undefined,
  required: Iterable<Permission>,
): boolean {
  if (!permissions) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  for (const p of required) {
    if (!set.has(p)) return false;
  }
  return true;
}

export function hasSomePermission(
  permissions: Iterable<Permission> | null | undefined,
  required: Iterable<Permission>,
): boolean {
  if (!permissions) return false;
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  for (const p of required) {
    if (set.has(p)) return true;
  }
  return false;
}

export function requirePermission(
  permissions: Iterable<Permission> | null | undefined,
  permission: Permission,
): void {
  if (!hasPermission(permissions, permission)) {
    const err = new Error('Missing required permission');
    // Attach helpful metadata for callers/loggers
    (err as any).missingPermission = permission;
    throw err;
  }
}
