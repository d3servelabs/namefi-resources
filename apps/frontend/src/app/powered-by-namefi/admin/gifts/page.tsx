'use client';

import { useState } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Gift, Plus, X, Mail, Calendar, Users } from 'lucide-react';
import { withPbnOwnerGuard } from '@/components/admin/pbn-owner-guard';
import { CreateGiftDialog } from '@/components/gifts/create-gift-dialog';
import { MultiGiftDialog } from '@/components/gifts/multi-gift-dialog';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { range } from 'ramda';
import { PageShell } from '@/components/page-shell';

type UiStatus = 'SENT' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';

const sanitizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.includes('validation')
      ? 'Please check your input and try again'
      : 'An error occurred. Please try again later';
  }
  return 'An unexpected error occurred';
};

export function GiftsManagementPage({
  forcedPbnDomain,
}: {
  forcedPbnDomain?: string;
}) {
  const [selectedStatus, setSelectedStatus] = useState<UiStatus | 'ALL'>('ALL');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(
    null,
  );
  const [multiDialogOpen, setMultiDialogOpen] = useState(false);
  // const [selectedReservation, setSelectedReservation] = useState<any | null>(null);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch reservations for the current creator (PBN owner)
  const backendStatus: 'CREATED' | 'CANCELLED' | undefined =
    selectedStatus === 'CANCELLED'
      ? 'CANCELLED'
      : selectedStatus === 'SENT'
        ? 'CREATED'
        : undefined;
  const reservationsQuery = useQuery(
    trpc.pbnReservations.listByCreator.queryOptions({
      status: backendStatus,
      pbnDomain: forcedPbnDomain,
    }),
  );

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation(
    trpc.pbnReservations.cancel.mutationOptions({
      onSuccess: () => {
        queryClient.refetchQueries({
          queryKey: trpc.pbnReservations.listByCreator.queryKey(),
        });
        toast.success('Reservation cancelled successfully');
      },
      onError: (error) => {
        toast.error(sanitizeErrorMessage(error));
      },
    }),
  );

  const handleCancelReservation = (reservationId: string) => {
    setReservationToCancel(reservationId);
    setCancelDialogOpen(true);
  };

  const getStatusBadge = (status: UiStatus) => {
    const variant: Record<
      UiStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      SENT: 'default',
      CLAIMED: 'secondary',
      EXPIRED: 'destructive',
      CANCELLED: 'outline',
    };
    const label = status === 'CLAIMED' ? 'Recieved' : status;
    return <Badge variant={variant[status]}>{label}</Badge>;
  };

  const rawReservations = (reservationsQuery.data || []) as unknown[];
  const reservations = rawReservations.map((r: any) => ({
    ...r,
    uiStatus: (r.uiStatus as UiStatus) ?? 'SENT',
  }));
  const stats = {
    total: reservations.length,
    reserved: reservations.filter((r) => r.uiStatus === 'SENT').length,
    claimed: reservations.filter((r) => r.uiStatus === 'CLAIMED').length,
    expired: reservations.filter((r) => r.uiStatus === 'EXPIRED').length,
  };

  return (
    <PageShell padding="admin" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Gift className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Gift And Reservations</h1>
            <p className="text-muted-foreground">
              Manage domain reservations and gifts for your Powered by Namefi
              domains
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Gift/Reservation
          </Button>
          <Button variant="outline" onClick={() => setMultiDialogOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Gifts/Reservations
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Gifts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.claimed}
            </div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.expired}
            </div>
            <p className="text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Gifts</CardTitle>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                if (!value) return;
                setSelectedStatus(value as UiStatus | 'ALL');
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="CLAIMED">Claimed</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reservationsQuery.isLoading ? (
            <div className="py-4">
              <div className="space-y-2">
                {range(0, 5).map((k) => (
                  <div
                    key={`reservations-skeleton-${k}`}
                    className="grid grid-cols-6 gap-4 items-center"
                  >
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reservations found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Free-claim Exp.</TableHead>
                  <TableHead>Reservation Exp.</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <div>
                        {r.exactDomainName || (
                          <span className="text-muted-foreground">
                            *.{r.parentDomain}
                          </span>
                        )}
                      </div>
                      {!forcedPbnDomain && (
                        <div className="text-xs text-muted-foreground">
                          on {r.pbnDomain}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span className="text-sm">
                          {r.recipientEmail ?? '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(r.uiStatus)}</TableCell>
                    <TableCell>
                      <Badge variant={r.isActiveHold ? 'secondary' : 'outline'}>
                        {r.isActiveHold ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {r.freeClaimExpirationDate
                            ? format(
                                new Date(r.freeClaimExpirationDate),
                                'MMM dd, yyyy',
                              )
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span className="text-sm">
                          {r.reservationExpirationDate
                            ? format(
                                new Date(r.reservationExpirationDate),
                                'MMM dd, yyyy',
                              )
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(r.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {r.uiStatus === 'SENT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelReservation(r.id)}
                            disabled={cancelReservationMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateGiftDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        pbnDomain={forcedPbnDomain}
        onSuccess={async () => {
          await queryClient.refetchQueries({
            queryKey: trpc.pbnReservations.listByCreator.queryKey(),
          });
        }}
      />

      <MultiGiftDialog
        open={multiDialogOpen}
        onOpenChange={setMultiDialogOpen}
        pbnDomain={forcedPbnDomain}
        // domain is forced inside the dialog via table logic
        onSuccess={async () => {
          await queryClient.refetchQueries({
            queryKey: trpc.pbnReservations.listByCreator.queryKey(),
          });
        }}
      />

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel reservation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will release the hold and mark the reservation as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!reservationToCancel) return;
                try {
                  await cancelReservationMutation.mutateAsync({
                    reservationId: reservationToCancel,
                  });
                } catch (error: any) {
                  toast.error(`Failed to cancel reservation: ${error.message}`);
                }
                setCancelDialogOpen(false);
              }}
            >
              Cancel Reservation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

export default withPbnOwnerGuard(GiftsManagementPage);
