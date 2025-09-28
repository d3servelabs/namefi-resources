'use client';

import { AdminGuard } from '@/components/admin/admin-guard';
import { Permission } from '@namefi-astra/utils';
import { PermissionGate } from '@/components/access/PermissionGate';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Table, Td, Th, Thead, Tr } from '@/components/table';
import { TableBody } from '@/components/ui/shadcn/table';
import { toast } from 'sonner';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AsyncButton } from '@/components/buttons/async-button';
import { Input } from '@/components/ui/shadcn/input';
import { useDebounceValue } from 'usehooks-ts';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Loading } from '@/components/loading';

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <PermissionGate permissions={[Permission.READ_USERS]}>
        <UsersTable />
      </PermissionGate>
    </AdminGuard>
  );
}

function UsersTable() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounceValue(searchTerm, 300);
  const users = useQuery(
    trpc.admin.listUsers.queryOptions(
      {
        page,
        pageSize,
        searchTerm: debouncedSearch || undefined,
      },
      {
        placeholderData: (prev) => prev,
      },
    ),
  );
  const impersonate = useMutation(trpc.users.impersonateUser.mutationOptions());

  const router = useRouter();
  const handleImpersonate = useCallback(
    async (userId: string) => {
      try {
        await impersonate.mutateAsync({ targetUserId: userId });
        await queryClient.invalidateQueries();

        await router.replace('/');
        toast('Impersonation enabled', {
          description: `Now impersonating ${userId}`,
        });
      } catch (error: any) {
        toast('Failed to impersonate', {
          description: error?.message ?? 'Unknown error',
        });
      }
    },
    [impersonate.mutateAsync, queryClient, router],
  );

  const rows = useMemo(() => {
    return (users.data?.items ?? []).map((u) => ({
      id: u.id,
      displayName: u.displayName,
      primaryEmail: u.primaryEmail,
      privyUserId: u.privyUserId,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      isAdmin: u.isAdmin,
    }));
  }, [users.data?.items]);

  const showSkeleton = users.isLoading;

  return (
    <Card className="border border-muted/60 m-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">All Users</CardTitle>
          {users.isFetching && !users.isLoading && (
            <Loading loading text="Refreshing..." size="sm" color="muted" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email, name, wallet, id, or ENS..."
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Display</Th>
                <Th>Email</Th>
                <Th>Privy ID</Th>
                <Th>Created</Th>
                <Th>Updated</Th>
                <Th>Admin</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <TableBody>
              {showSkeleton
                ? Array.from({ length: pageSize }).map((_, i) => (
                    <Tr key={`sk-${i}`}>
                      <Td className="font-mono text-xs">
                        <Skeleton className="h-4 w-40" />
                      </Td>
                      <Td>
                        <Skeleton className="h-4 w-24" />
                      </Td>
                      <Td>
                        <Skeleton className="h-4 w-40" />
                      </Td>
                      <Td className="font-mono text-xs">
                        <Skeleton className="h-4 w-48" />
                      </Td>
                      <Td>
                        <Skeleton className="h-4 w-32" />
                      </Td>
                      <Td>
                        <Skeleton className="h-4 w-32" />
                      </Td>
                      <Td>
                        <Skeleton className="h-4 w-10" />
                      </Td>
                      <Td>
                        <Skeleton className="h-8 w-24" />
                      </Td>
                    </Tr>
                  ))
                : rows.map((u: any) => (
                    <Tr key={u.id}>
                      <Td className="font-mono text-xs">{u.id}</Td>
                      <Td>{u.displayName ?? '-'}</Td>
                      <Td>{u.primaryEmail ?? '-'}</Td>
                      <Td className="font-mono text-xs">{u.privyUserId}</Td>
                      <Td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleString()
                          : '-'}
                      </Td>
                      <Td>
                        {u.updatedAt
                          ? new Date(u.updatedAt).toLocaleString()
                          : '-'}
                      </Td>
                      <Td>{u.isAdmin ? 'Yes' : 'No'}</Td>
                      <Td>
                        <PermissionGate
                          permissions={[Permission.IMPERSONATE_USERS]}
                        >
                          <AsyncButton
                            size="sm"
                            variant="secondary"
                            disabled={u.isAdmin === true}
                            onClick={() => handleImpersonate(u.id)}
                            loadingText="Impersonating..."
                          >
                            Impersonate
                          </AsyncButton>
                        </PermissionGate>
                      </Td>
                    </Tr>
                  ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground flex items-center gap-3">
            {users.isFetching && !users.isLoading && (
              <Loading loading text="Refreshing..." size="sm" color="muted" />
            )}
            <span>{`Page ${page} of ${users.data?.totalPages ?? 1} — Total ${users.data?.total ?? 0}`}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!users.data || page >= (users.data.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
