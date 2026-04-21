'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils/permissions';
import { PermissionGate } from '@/components/access/PermissionGate';
import { useTRPC } from '@/lib/trpc';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { AsyncButton } from '@/components/buttons/async-button';
import { toast } from 'sonner';
import { useDebounceValue } from 'usehooks-ts';
import { useEnsName } from 'wagmi';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';

export default function PermissionsAdminPage() {
  return (
    <AdminGuard accessDeniedMessage="You are not an admin.">
      <PermissionGate
        permissions={[Permission.WRITE_PERMISSIONS]}
        loadingFallback={null}
      >
        <PermissionsManager />
      </PermissionGate>
      <PermissionGate
        gateMode="inverted"
        permissions={[Permission.WRITE_PERMISSIONS]}
        loadingFallback={null}
      >
        <div>You do not have permission to access this page.</div>
      </PermissionGate>
    </AdminGuard>
  );
}

function PermissionsManager() {
  const [openUserId, setOpenUserId] = useState<string | undefined>(undefined);

  return (
    <div className="p-6 space-y-6">
      <AddUser
        onAdded={(userId) => {
          setOpenUserId(userId);
        }}
      />

      <ExistingUsers openUserId={openUserId} setOpenUserId={setOpenUserId} />
    </div>
  );
}

function ExistingUsers({
  openUserId,
  setOpenUserId,
}: {
  openUserId: string | undefined;
  setOpenUserId: (userId: string) => void;
}) {
  const trpc = useTRPC();
  const { data: existingUsers, refetch } = useQuery(
    trpc.admin.permissions.listUsersWithPermissions.queryOptions(),
  );
  const [confirmUserId, setConfirmUserId] = useState<string | null>(null);
  const deleteMutation = useMutation(
    trpc.admin.permissions.deleteUserPermissions.mutationOptions({
      onSuccess: async () => {
        toast('User permissions deleted');
        setConfirmUserId(null);
        await refetch();
        if (openUserId && confirmUserId === openUserId) {
          setOpenUserId('');
        }
      },
      onError: (error) => {
        toast('Failed to delete user permissions', {
          description: error.message,
        });
      },
    }),
  );

  return (
    <Card className="border border-muted/60">
      <CardHeader>
        <CardTitle className="text-xl">Existing Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion
          className="w-full"
          value={openUserId ? [openUserId] : []}
          onValueChange={(val) => setOpenUserId(val[0] ?? '')}
        >
          <AnimatePresence initial={false}>
            {(existingUsers ?? []).map((u: any) => (
              <motion.div
                key={u.userId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <AccordionItem value={u.userId}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center justify-between transition-colors">
                      <UserIdentityRow
                        primaryEmail={u.primaryEmail}
                        privyUserId={u.privyUserId}
                        userId={u.userId}
                        primaryWalletAddress={u.primaryWalletAddress}
                      />
                      <Badge
                        variant="secondary"
                        className="transition-transform data-[state=open]:scale-95"
                      >
                        Edit
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="animate-in fade-in-50 slide-in-from-top-2">
                      <div className="flex items-center justify-end mb-3">
                        <AlertDialog
                          open={confirmUserId === u.userId}
                          onOpenChange={(open) =>
                            setConfirmUserId(open ? u.userId : null)
                          }
                        >
                          <AlertDialogTrigger
                            render={
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setConfirmUserId(u.userId)}
                              />
                            }
                          >
                            Revoke All Permissions
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Revoke all permissions?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will revoke all permission rows for this
                                user, including hidden baseline. This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                render={
                                  <AsyncButton
                                    onClick={async () => {
                                      await deleteMutation.mutateAsync({
                                        userId: u.userId,
                                      });
                                    }}
                                  />
                                }
                              >
                                Confirm Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <PermissionEditor
                        userId={u.userId}
                        onApplied={async () => {
                          await refetch();
                          setOpenUserId(u.userId);
                        }}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function AddUser({
  onAdded: onApplied,
}: {
  onAdded?: (userId: string) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const searchUsers = useQuery({
    ...trpc.admin.users.searchUsers.queryOptions({
      searchTerm: debouncedSearchTerm,
      limit: 10,
    }),
    enabled: debouncedSearchTerm.trim().length > 1,
  });
  return (
    <Card className="border border-muted/60">
      <CardHeader>
        <CardTitle className="text-xl">Add User</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="text-sm font-medium" htmlFor="userSearch">
          Search user to add
        </label>
        <Input
          id="userSearch"
          placeholder="Enter email, wallet, Privy ID, UUID, or ENS"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchUsers.data && searchUsers.data.length > 0 && (
          <ul className="rounded border divide-y">
            {searchUsers.data.map((u: any) => (
              <li key={u.id}>
                <button
                  type="button"
                  className={`w-full text-left p-3 hover:bg-accent/40 transition ${selectedUserId === u.id ? 'bg-accent/30' : ''}`}
                  onClick={() => {
                    setSelectedUserId(u.id);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {u.displayName ?? u.primaryEmail ?? u.privyUserId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.id}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(u.walletAddresses ?? []).slice(0, 2).join(', ')}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selectedUserId && (
          <div className="mt-4 animate-in fade-in-50 slide-in-from-top-2">
            <PermissionEditor
              userId={selectedUserId}
              onApplied={async (uid) => {
                setSearchTerm('');
                setSelectedUserId('');
                await queryClient.invalidateQueries({
                  queryKey:
                    trpc.admin.permissions.listUsersWithPermissions.queryKey(),
                });
                onApplied?.(uid);
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermissionEditor({
  userId,
  onApplied,
}: {
  userId: string;
  onApplied?: (userId: string) => void | Promise<void>;
}) {
  const trpc = useTRPC();

  const { data: allPerms } = useQuery(
    trpc.admin.permissions.listAvailablePermissions.queryOptions(),
  );
  const { data: myPerms } = useQuery(
    trpc.users.getMyPermissions.queryOptions(),
  );
  const isSuperAdmin = useMemo(
    () => (myPerms ?? []).includes(Permission.SUPER_ADMIN),
    [myPerms],
  );

  const { data: userPerms, refetch } = useQuery({
    ...trpc.admin.permissions.getUserPermissions.queryOptions({ userId }),
    enabled: !!userId,
  });

  const grantMutation = useMutation({
    ...trpc.admin.permissions.grantPermissions.mutationOptions(),
    onSuccess: () => refetch(),
  });
  const revokeMutation = useMutation({
    ...trpc.admin.permissions.revokePermissions.mutationOptions(),
    onSuccess: () => refetch(),
  });

  const [staged, setStaged] = useState<Record<Permission, boolean>>({} as any);
  const baseMap = useMemo(() => {
    const set = new Set(userPerms ?? []);
    const entries = (allPerms ?? []).map((p) => [p as Permission, set.has(p)]);
    return Object.fromEntries(entries) as Record<Permission, boolean>;
  }, [allPerms, userPerms]);

  const [initialized, setInitialized] = useState(false);
  if (!initialized && allPerms && userPerms) {
    setStaged(baseMap);
    setInitialized(true);
  }

  const onToggle = useCallback((perm: Permission, checked: boolean) => {
    setStaged((prev) => ({ ...prev, [perm]: checked }));
  }, []);

  const toGrant = useMemo(() => {
    const results: Permission[] = [];
    for (const p of (allPerms ?? []) as Permission[]) {
      if ((staged as any)[p] && !baseMap[p]) results.push(p);
    }
    return results;
  }, [allPerms, staged, baseMap]);
  const toRevoke = useMemo(() => {
    const results: Permission[] = [];
    for (const p of (allPerms ?? []) as Permission[]) {
      if (!(staged as any)[p] && baseMap[p]) results.push(p);
    }
    return results;
  }, [allPerms, staged, baseMap]);
  const hasChanges = toGrant.length + toRevoke.length > 0;

  const applyChanges = async () => {
    if (toGrant.includes(Permission.SUPER_ADMIN) && !isSuperAdmin) {
      toast('Insufficient permissions', {
        description: 'Only SUPER_ADMIN can grant SUPER_ADMIN',
      });
      return;
    }
    try {
      if (toGrant.length) {
        await grantMutation.mutateAsync({
          userId,
          permissions: [toGrant[0], ...toGrant.slice(1)],
        });
      }
      if (toRevoke.length) {
        await revokeMutation.mutateAsync({
          userId,
          permissions: [toRevoke[0], ...toRevoke.slice(1)],
        });
      }
      toast('Permissions updated', {
        description: 'Changes were applied successfully',
      });
      setInitialized(false);
      await onApplied?.(userId);
    } catch (error: any) {
      toast('Failed to update permissions', {
        description: error?.message ?? 'Unknown error',
      });
      throw error;
    }
  };

  const isLoadingGrid = !allPerms || !userPerms;

  return (
    <Card className="border border-muted/60 mt-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Permissions</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="uppercase tracking-wide">
            {isSuperAdmin ? 'You are SUPER_ADMIN' : 'Standard Admin'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingGrid ? (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2 mb-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-28" />
            </div>
            <div className="space-y-4">
              {[0, 1, 2].map((section) => (
                <div key={section} className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-9 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!allPerms) return;
                  setStaged((prev) => {
                    const next = { ...prev } as Record<Permission, boolean>;
                    for (const p of allPerms as Permission[]) {
                      if (p === Permission.SUPER_ADMIN && !isSuperAdmin)
                        continue;
                      next[p] = true;
                    }
                    return next;
                  });
                }}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!allPerms) return;
                  setStaged((prev) => {
                    const next = { ...prev } as Record<Permission, boolean>;
                    for (const p of allPerms as Permission[]) {
                      if (p === Permission.SUPER_ADMIN && !isSuperAdmin)
                        continue;
                      next[p] = false;
                    }
                    return next;
                  });
                }}
              >
                Deselect All
              </Button>
            </div>
            <GroupedPermissionsGrid
              allPerms={allPerms as Permission[] | undefined}
              staged={staged}
              isSuperAdmin={isSuperAdmin}
              userId={userId}
              onToggle={onToggle}
              setStaged={setStaged}
            />
          </>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-3">
        <Button
          variant="outline"
          disabled={
            !hasChanges || grantMutation.isPending || revokeMutation.isPending
          }
          onClick={() => setStaged(baseMap)}
        >
          Reset
        </Button>
        <AsyncButton
          disabled={
            !hasChanges || grantMutation.isPending || revokeMutation.isPending
          }
          onClick={applyChanges}
        >
          {grantMutation.isPending || revokeMutation.isPending
            ? 'Applying...'
            : 'Apply Changes'}
        </AsyncButton>
      </CardFooter>
    </Card>
  );
}

function UserIdentityRow({
  primaryEmail,
  privyUserId,
  userId,
  primaryWalletAddress,
}: {
  primaryEmail?: string | null;
  privyUserId?: string | null;
  userId: string;
  primaryWalletAddress?: string | null;
}) {
  // Placeholder for future wallet lookup; for now we try ENS name only if a wallet is known.
  // If later we add wallet address to listUsersWithPermissions, we can feed it here.
  const ens = useEnsName({
    // No address available from backend payload yet; disabled for now
    address: primaryWalletAddress as unknown as `0x${string}`,
    chainId: 1,
    query: { enabled: !!primaryWalletAddress },
  });

  const title = ens.data || primaryEmail || privyUserId || userId;
  return (
    <div className="text-left">
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{userId}</div>
    </div>
  );
}

const toTitle = (_permissionKey: string) => {
  const permissionKey = _permissionKey
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return permissionKey;
};
const parsePermissionKey = (permissionKey: string) => {
  if (permissionKey.includes(';;')) {
    const [resource, ...rest] = permissionKey.split(';;');
    return { resource, action: rest.join(';;') };
  }
  return { resource: 'General', action: permissionKey };
};

function GroupedPermissionsGrid({
  allPerms,
  staged,
  isSuperAdmin,
  userId,
  onToggle,
  setStaged,
}: {
  allPerms: Permission[] | undefined;
  staged: Record<Permission, boolean>;
  isSuperAdmin: boolean;
  userId: string;
  onToggle: (perm: Permission, checked: boolean) => void;
  setStaged: React.Dispatch<React.SetStateAction<Record<Permission, boolean>>>;
}) {
  const permissionsGroups = useMemo(() => {
    const _permissionGroupsMap = new Map<string, Permission[]>();
    for (const permission of (allPerms ?? []) as Permission[]) {
      const permissionKey = permission as unknown as string;
      const resource = permissionKey.includes(';;')
        ? permissionKey.split(';;')[0]
        : 'General';
      const key = resource || 'General';

      if (!_permissionGroupsMap.has(key)) {
        _permissionGroupsMap.set(key, []);
      }
      const permissionGroup = _permissionGroupsMap.get(key);
      permissionGroup?.push(permission);
    }

    return Array.from(_permissionGroupsMap.entries());
  }, [allPerms]);

  return (
    <>
      {permissionsGroups.map(([groupKey, perms]) => (
        <PermissionGroupSection
          key={groupKey}
          groupKey={groupKey}
          perms={perms}
          staged={staged}
          userId={userId}
          isSuperAdmin={isSuperAdmin}
          onToggle={onToggle}
          setStaged={setStaged}
        />
      ))}
    </>
  );
}

function PermissionGroupSection({
  groupKey,
  perms,
  staged,
  userId,
  isSuperAdmin,
  onToggle,
  setStaged,
}: {
  groupKey: string;
  perms: Permission[];
  staged: Record<Permission, boolean>;
  userId: string;
  isSuperAdmin: boolean;
  onToggle: (perm: Permission, checked: boolean) => void;
  setStaged: React.Dispatch<React.SetStateAction<Record<Permission, boolean>>>;
}) {
  const resourceLabel = toTitle(groupKey);
  const manageablePerms = perms.filter(
    (perm) => !(perm === Permission.SUPER_ADMIN && !isSuperAdmin),
  );
  const manageAllChecked =
    manageablePerms.length > 0 &&
    manageablePerms.every((perm) => staged[perm as Permission]);
  const onManageToggle = (value: boolean) => {
    setStaged((prev) => {
      const next = { ...prev } as Record<Permission, boolean>;
      for (const perm of manageablePerms) {
        next[perm] = value;
      }
      return next;
    });
  };

  const groupIsSuperAdminOnly = perms.every(
    (perm) => perm === Permission.SUPER_ADMIN,
  );

  if (groupIsSuperAdminOnly) {
    const perm = Permission.SUPER_ADMIN as Permission;
    const str = perm as unknown as string;
    const checked = staged[perm as Permission] ?? false;
    const disabled = !isSuperAdmin;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium">Super Admin</div>
        </div>
        <fieldset className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <legend className="sr-only">Super Admin</legend>
          <PermissionItem
            id={`perm-${userId}-${str}`}
            labelText="Super Admin"
            checked={checked}
            disabled={disabled}
            onChange={(v) => onToggle(perm as Permission, v)}
          />
        </fieldset>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{resourceLabel}</div>
      </div>
      <fieldset className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <legend className="sr-only">{resourceLabel}</legend>
        <PermissionItem
          id={`perm-${userId}-${groupKey}-manage`}
          labelText="Manage"
          checked={manageAllChecked}
          onChange={(v) => onManageToggle(Boolean(v))}
        />
        {perms.map((perm) => {
          const str = perm as unknown as string;
          const { action } = parsePermissionKey(str);
          const label = action ? toTitle(action) : str;
          const checked = staged[perm as Permission] ?? false;
          const disabled = perm === Permission.SUPER_ADMIN && !isSuperAdmin;
          return (
            <PermissionItem
              key={str}
              id={`perm-${userId}-${str}`}
              labelText={label}
              checked={checked}
              disabled={disabled}
              onChange={(v) => onToggle(perm as Permission, v)}
            />
          );
        })}
      </fieldset>
    </div>
  );
}

function PermissionItem({
  id,
  labelText,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  labelText: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded px-3 py-2 border ${
        checked ? 'bg-accent/20 border-accent' : 'border-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onChange(Boolean(value))}
      />
      <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
        {labelText}
      </Label>
    </div>
  );
}
