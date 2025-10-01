'use client';

import { useState, useMemo } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Badge } from '@/components/ui/shadcn/badge';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/shadcn/alert-dialog';
import { Label } from '@/components/ui/shadcn/label';
import { toast } from 'sonner';
import * as chains from 'viem/chains';
import { isAddress } from 'viem';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};

type TableRowData = {
  walletAddress: string;
  amount: number;
  memo?: string;
};

const DEFAULT_AMOUNT = 50;

export function BulkMintNfscDialog({ open, onOpenChange, onSuccess }: Props) {
  const trpc = useTRPC();
  const [csv, setCsv] = useState('');
  const [chainId, setChainId] = useState<number>(chains.base.id);
  const [reason, setReason] = useState('');
  const [defaultAmount, setDefaultAmount] = useState(DEFAULT_AMOUNT);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tableRows, setTableRows] = useState<TableRowData[]>([
    { walletAddress: '', amount: DEFAULT_AMOUNT, memo: '' },
  ]);

  const appendCsvToTable = () => {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const newRows: TableRowData[] = [];
    for (const line of lines) {
      const [walletRaw, amountRaw, ...memoArr] = line.split(',');
      const wallet = (walletRaw ?? '').trim();
      const amount = amountRaw
        ? Number.parseInt(amountRaw.trim(), 10)
        : defaultAmount;
      const memo = memoArr.length > 0 ? memoArr.join(',').trim() : '';

      if (!wallet) continue;

      newRows.push({
        walletAddress: wallet,
        amount: Number.isFinite(amount) && amount > 0 ? amount : defaultAmount,
        memo,
      });
    }

    if (newRows.length > 0) {
      setTableRows((prev) => [...prev, ...newRows]);
    }
    setCsv('');
  };

  const addEmptyRow = () =>
    setTableRows((prev) => [
      ...prev,
      { walletAddress: '', amount: defaultAmount, memo: '' },
    ]);

  const updateRowField = (
    idx: number,
    field: keyof TableRowData,
    value: string | number,
  ) => {
    setTableRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeRow = (idx: number) =>
    setTableRows((prev) => prev.filter((_, i) => i !== idx));

  const bulkMutation = useMutation(
    trpc.admin.nfsc.mintBulk.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Successfully started ${data.summary.successful} mint workflows`,
        );
        if (data.summary.failed > 0) {
          toast.warning(`${data.summary.failed} workflows failed to start`);
        }
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(
          error.message || 'Failed to start bulk NFSC mint operation',
        );
      },
    }),
  );

  const { annotatedRows, invalidCount, duplicateCount } = useMemo(() => {
    const seen = new Set<string>();
    let bad = 0;
    let dup = 0;

    const out = tableRows.map((r) => {
      const walletTrim = r.walletAddress.trim().toLowerCase();
      const amountValid = Number.isFinite(r.amount) && r.amount > 0;
      const walletValid = isAddress(walletTrim);

      let isDup = false;
      if (walletTrim.length > 0) {
        isDup = seen.has(walletTrim);
        if (!isDup) seen.add(walletTrim);
        else dup++;
      }

      const isInvalid = !walletValid || !amountValid;
      if (isInvalid) bad++;

      return { ...r, isDup, isInvalid, walletValid, amountValid };
    });

    return { annotatedRows: out, invalidCount: bad, duplicateCount: dup };
  }, [tableRows]);

  const anyValid = useMemo(
    () => annotatedRows.some((r: any) => !r.isInvalid && !r.isDup),
    [annotatedRows],
  );

  const allValid = useMemo(
    () => annotatedRows.every((r: any) => !r.isInvalid && !r.isDup),
    [annotatedRows],
  );

  const disabled =
    tableRows.length === 0 ||
    !allValid ||
    !reason.trim() ||
    bulkMutation.isPending;

  const handleSubmit = async () => {
    if (disabled) return;

    const validUsers = annotatedRows
      .filter((r: any) => !r.isInvalid && !r.isDup)
      .map((r) => ({
        walletAddress: r.walletAddress.trim() as `0x${string}`,
        amount: r.amount,
        memo: r.memo || undefined,
      }));

    if (validUsers.length === 0) {
      toast.error('No valid users to mint NFSC for');
      return;
    }

    await bulkMutation.mutateAsync({
      users: validUsers,
      chainId,
      reason: reason.trim(),
    });

    setConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[900px] !w-full overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Bulk Mint NFSC</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium" htmlFor="chain">
                  Chain
                </Label>
                <Select
                  value={chainId.toString()}
                  onValueChange={(v) => setChainId(Number.parseInt(v, 10))}
                >
                  <SelectTrigger id="chain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={chains.base.id.toString()}>
                      Base
                    </SelectItem>
                    <SelectItem value={chains.sepolia.id.toString()}>
                      Sepolia
                    </SelectItem>
                    <SelectItem value={chains.mainnet.id.toString()}>
                      Mainnet
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium" htmlFor="default-amount">
                  Default Amount (NFSC)
                </Label>
                <Input
                  id="default-amount"
                  type="number"
                  min={1}
                  max={10000}
                  value={defaultAmount}
                  onChange={(e) => setDefaultAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <Label className="text-sm font-medium" htmlFor="reason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="reason"
                  placeholder="e.g., Campaign rewards"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium" htmlFor="bulk-csv">
                CSV Input
              </Label>
              <div className="text-xs text-muted-foreground">
                Format:{' '}
                <code>walletAddress, amount (optional), memo (optional)</code>
                <br />
                Example: <code>0x1234..., 100, Winner reward</code>
              </div>
              <Textarea
                id="bulk-csv"
                rows={6}
                placeholder={
                  '0x1234...,100,Winner reward\n0x5678...,50\n0xabcd...'
                }
                value={csv}
                onChange={(e) => setCsv(e.currentTarget.value)}
              />
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={appendCsvToTable}>
                  Append to Table
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Recipients ({tableRows.length})
                </div>
                <Button variant="secondary" size="sm" onClick={addEmptyRow}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
                </Button>
              </div>

              <div className="border rounded max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wallet Address</TableHead>
                      <TableHead>Amount (NFSC)</TableHead>
                      <TableHead>Memo</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableRows.map((r, idx) => {
                      const anno = annotatedRows[idx];
                      return (
                        <TableRow key={`${r.walletAddress}-${idx}`}>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <Input
                                value={r.walletAddress}
                                onChange={(e) =>
                                  updateRowField(
                                    idx,
                                    'walletAddress',
                                    e.currentTarget.value,
                                  )
                                }
                                placeholder="0x..."
                                className={
                                  anno?.walletValid === false
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {anno && !anno.walletValid && (
                                <div className="text-xs text-red-600">
                                  Invalid wallet address
                                </div>
                              )}
                              {anno?.isDup && (
                                <div className="text-xs text-red-600">
                                  Duplicate address
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <Input
                                type="number"
                                min={1}
                                max={10000}
                                value={r.amount}
                                onChange={(e) =>
                                  updateRowField(
                                    idx,
                                    'amount',
                                    Number(e.currentTarget.value),
                                  )
                                }
                                className={
                                  anno?.amountValid === false
                                    ? 'border-red-500'
                                    : ''
                                }
                              />
                              {anno && !anno.amountValid && (
                                <div className="text-xs text-red-600">
                                  Amount must be 1-10000
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              value={r.memo || ''}
                              onChange={(e) =>
                                updateRowField(
                                  idx,
                                  'memo',
                                  e.currentTarget.value,
                                )
                              }
                              placeholder="Optional note"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Total: {tableRows.length}</span>
              {duplicateCount > 0 && (
                <Badge variant="destructive">
                  {duplicateCount} duplicate{duplicateCount === 1 ? '' : 's'}
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} invalid</Badge>
              )}
              <span>
                Total NFSC:{' '}
                {annotatedRows.reduce(
                  (sum: number, r: any) =>
                    !r.isInvalid && !r.isDup ? sum + r.amount : sum,
                  0,
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => setConfirmOpen(true)} disabled={disabled}>
                {bulkMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Mint NFSC for{' '}
                {
                  annotatedRows.filter((r: any) => !r.isInvalid && !r.isDup)
                    .length
                }{' '}
                User
                {annotatedRows.filter((r: any) => !r.isInvalid && !r.isDup)
                  .length === 1
                  ? ''
                  : 's'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="!max-w-[700px] !w-full overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk NFSC Mint</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to mint NFSC for{' '}
              <strong>
                {
                  annotatedRows.filter((r: any) => !r.isInvalid && !r.isDup)
                    .length
                }
              </strong>{' '}
              user
              {annotatedRows.filter((r: any) => !r.isInvalid && !r.isDup)
                .length === 1
                ? ''
                : 's'}
              . Review the recipients below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border rounded max-h-72 overflow-auto">
            <div className="grid grid-cols-3 gap-2 p-2 text-xs font-medium bg-muted">
              <div>Wallet Address</div>
              <div>Amount (NFSC)</div>
              <div>Memo</div>
            </div>
            <div className="divide-y">
              {annotatedRows
                .filter((r: any) => !r.isInvalid && !r.isDup)
                .slice(0, 300)
                .map((r: any, idx) => (
                  <div
                    key={`${r.walletAddress}-confirm-${idx}`}
                    className="grid grid-cols-3 gap-2 p-2 text-sm items-center"
                  >
                    <div className="truncate font-mono text-xs">
                      {r.walletAddress}
                    </div>
                    <div>{r.amount}</div>
                    <div className="truncate text-muted-foreground">
                      {r.memo || '—'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={bulkMutation.isPending}
            >
              {bulkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm & Mint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
