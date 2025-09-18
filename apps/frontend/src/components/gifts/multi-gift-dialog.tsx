'use client';

import { useState, useMemo } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery } from '@tanstack/react-query';
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
import { Loader2 } from 'lucide-react';
import { Plus, Trash2 } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { NaturalLanguageDatePicker } from '@/components/date-picker/natural-language-date-picker';
import { Switch } from '@/components/ui/shadcn/switch';
import { Label } from '@/components/ui/shadcn/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess?: () => void;
};
const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
type Mode = 'parent' | 'exact';

export function MultiGiftDialog({ open, onOpenChange, onSuccess }: Props) {
  const trpc = useTRPC();
  const [mode, setMode] = useState<Mode>('parent');
  const [csv, setCsv] = useState('');
  const [expiration, setExpiration] = useState(
    format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  );
  const [expirationDisplay, setExpirationDisplay] = useState<string>('');
  const [pbnDomain, setPbnDomain] = useState<string>('');
  const [reserveHold, setReserveHold] = useState<boolean>(true);
  const [sendEmail, setSendEmail] = useState<boolean>(true);
  const [skipBadRows, setSkipBadRows] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tableRows, setTableRows] = useState<
    Array<{ email: string; exact?: string; count?: number }>
  >([{ email: '', exact: '', count: 1 }]);

  const domainsQuery = useQuery(
    trpc.pbnOwner.listOwnedDomains.queryOptions(void 0, {
      enabled: open,
    }),
  );

  const appendCsvToTable = () => {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    if (mode === 'parent') {
      const aggregate = new Map<string, number>();
      for (const line of lines) {
        const [emailRaw, countRaw] = line.split(',');
        const email = (emailRaw ?? '').trim();
        const count = Number.parseInt((countRaw ?? '1').trim(), 10);
        if (!email) continue;
        const key = email.toLowerCase();
        aggregate.set(
          key,
          (aggregate.get(key) ?? 0) +
            (Number.isFinite(count) && count > 0 ? count : 1),
        );
      }
      setTableRows((prev) => {
        const map = new Map<string, number>();
        for (const r of prev) {
          const key = r.email.toLowerCase();
          map.set(key, (map.get(key) ?? 0) + (r.count ?? 1));
        }
        for (const [emailKey, addCount] of aggregate.entries()) {
          map.set(emailKey, (map.get(emailKey) ?? 0) + addCount);
        }
        return Array.from(map.entries()).map(([emailKey, count]) => ({
          email: emailKey,
          count,
        }));
      });
    } else {
      const newRows: Array<{ email: string; exact: string }> = [];
      for (const line of lines) {
        const [emailRaw, exactRaw] = line.split(',');
        const email = (emailRaw ?? '').trim();
        const exact = (exactRaw ?? '').trim();
        if (!email || !exact) continue;
        newRows.push({ email, exact });
      }
      if (newRows.length > 0) setTableRows((prev) => [...prev, ...newRows]);
    }
    setCsv('');
  };

  const addEmptyRow = () =>
    setTableRows((prev) => [...prev, { email: '', exact: '', count: 1 }]);
  const updateRowField = (
    idx: number,
    field: 'email' | 'exact' | 'count',
    value: string,
  ) => {
    setTableRows((prev) => {
      const next = [...prev];
      const row = { ...next[idx] } as any;
      row[field] = field === 'count' ? Number(value || '0') : value;
      next[idx] = row;
      return next;
    });
  };
  const removeRow = (idx: number) =>
    setTableRows((prev) => prev.filter((_, i) => i !== idx));

  const bulkMutation = useMutation(
    trpc.pbnReservations.createBulk.mutationOptions({
      onSuccess: () => {
        onSuccess?.();
      },
    }),
  );

  const { annotatedRows, duplicateCount, invalidCount } = useMemo(() => {
    const seen = new Set<string>();
    let dup = 0;
    let bad = 0;
    const out = tableRows.map((r) => {
      const emailTrim = (r.email ?? '').trim();
      const exactTrim = (r.exact ?? '').trim();
      const key = (mode === 'parent' ? emailTrim : `${emailTrim}|${exactTrim}`)
        .toLowerCase()
        .trim();
      // For parent mode, duplicates are aggregated already; don't flag as dup
      let isDup = false;
      if (mode !== 'parent') {
        // exclude empty email rows from duplicate count
        if (emailTrim.length > 0) {
          isDup = seen.has(key);
          if (!isDup) seen.add(key);
          else dup++;
        }
      }
      const emailOk = emailRegex.test(emailTrim);
      const countOk =
        mode === 'parent'
          ? Number.isFinite((r as any).count) && (r as any).count > 0
          : true;
      let exactOk = true;
      if (mode !== 'parent') {
        const pbnLower = (pbnDomain ?? '').toLowerCase();
        const exactLower = exactTrim.toLowerCase();
        const hasSuffix =
          pbnLower.length > 0 && exactLower.endsWith('.' + pbnLower);
        if (!hasSuffix) {
          exactOk = false;
        } else {
          const prefix = exactLower.slice(
            0,
            exactLower.length - (pbnLower.length + 1),
          );
          // must be a single label (no additional dots) and non-empty
          exactOk = prefix.length > 0 && !prefix.includes('.');
        }
      }
      const isInvalid = !emailOk || !exactOk || !countOk;
      if (isInvalid) bad++;
      return { ...r, isDup, isInvalid };
    });
    return { annotatedRows: out, duplicateCount: dup, invalidCount: bad };
  }, [tableRows, mode, pbnDomain]);

  const dupCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of tableRows) {
      const emailTrim = (r.email ?? '').trim();
      if (emailTrim.length === 0) continue; // ignore empties
      const exactTrim = (r.exact ?? '').trim();
      const key = (mode === 'parent' ? emailTrim : `${emailTrim}|${exactTrim}`)
        .toLowerCase()
        .trim();
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [tableRows, mode]);

  const anyValid = useMemo(
    () => annotatedRows.some((r: any) => !r.isInvalid && !r.isDup),
    [annotatedRows],
  );
  const allValid = useMemo(
    () => annotatedRows.every((r: any) => !r.isInvalid && !r.isDup),
    [annotatedRows],
  );
  const disabled =
    !pbnDomain ||
    !expiration ||
    tableRows.length === 0 ||
    (skipBadRows ? !anyValid : !allValid);

  const handleSubmit = async () => {
    if (disabled) return;
    const expDate = new Date(expiration);
    const toCreate = annotatedRows.filter((r) =>
      skipBadRows ? !r.isInvalid && !r.isDup : true,
    );
    const items: any[] = [];
    for (const r of toCreate as any[]) {
      if (mode === 'parent') {
        const repeat = Math.max(1, Number(r.count ?? 1));
        for (let i = 0; i < repeat; i++) {
          items.push({
            recipientEmail: r.email,
            parentDomain: pbnDomain as any,
            issueFreeClaim: true,
            reserveHold: false,
            freeClaimExpirationDate: expDate,
            reservationExpirationDate: null,
            reason: reason || undefined,
            personalMessage: personalMessage || undefined,
          });
        }
      } else {
        items.push({
          recipientEmail: r.email,
          exactDomainName: r.exact as any,
          issueFreeClaim: true,
          reserveHold,
          freeClaimExpirationDate: expDate,
          reservationExpirationDate: reserveHold ? expDate : null,
          reason: reason || undefined,
          personalMessage: personalMessage || undefined,
        });
      }
    }
    await bulkMutation.mutateAsync({
      pbnDomain: pbnDomain as any,
      items,
      sendEmail,
    } as any);
    setConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[900px] !w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Gift Reservations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-medium" htmlFor="bulk-domain">
                Your Domain
              </Label>
              <Select value={pbnDomain} onValueChange={setPbnDomain}>
                <SelectTrigger id="bulk-domain">
                  <SelectValue placeholder="Select a domain you own" />
                </SelectTrigger>
                <SelectContent>
                  {(domainsQuery.data || []).map((d: any) => (
                    <SelectItem
                      key={d.normalizedDomainName}
                      value={d.normalizedDomainName}
                    >
                      {d.normalizedDomainName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium" htmlFor="bulk-mode">
                Mode
              </Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger id="bulk-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Any Subdomain</SelectItem>
                  <SelectItem value="exact">Specific Subdomain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium" htmlFor="bulk-expiration">
                Expiration
              </Label>
              <NaturalLanguageDatePicker
                value={{
                  display: expirationDisplay,
                  date: expiration ? new Date(expiration) : undefined,
                }}
                onChange={(v) => {
                  setExpirationDisplay(v.display ?? '');
                  if (v.date) {
                    setExpiration(format(v.date, 'yyyy-MM-dd'));
                  }
                }}
                hideLabel
                hideTagline
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {mode === 'exact' && (
              <div className="flex items-center justify-between border rounded p-3">
                <div>
                  <Label htmlFor="bulk-reserve">Reserve while pending</Label>
                  <div className="text-xs text-muted-foreground">
                    Hold each exact name until it’s received or expires.
                  </div>
                </div>
                <Switch
                  id="bulk-reserve"
                  checked={reserveHold}
                  onCheckedChange={setReserveHold}
                />
              </div>
            )}
            <div className="flex items-center justify-between border rounded p-3">
              <div>
                <Label htmlFor="bulk-send-email">Send email</Label>
                <div className="text-xs text-muted-foreground">
                  Notify recipients by email.
                </div>
              </div>
              <Switch
                id="bulk-send-email"
                checked={sendEmail}
                onCheckedChange={setSendEmail}
              />
            </div>
            {/* <div className="flex items-center justify-between border rounded p-3">
              <div>
                <Label htmlFor="bulk-skip">Skip invalid/duplicate rows</Label>
                <div className="text-xs text-muted-foreground">Ignore bad rows during creation.</div>
              </div>
              <Switch id="bulk-skip" checked={skipBadRows} onCheckedChange={setSkipBadRows} />
            </div> */}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium" htmlFor="bulk-csv">
                Bulk Text Input
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted cursor-default">
                    ?
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {mode === 'parent' ? (
                    <div>
                      Enter one per line:
                      <br />
                      <code>email,count(optional)</code>
                      <br />
                      <br />
                      Example:
                      <br />
                      <code>alice@example.com,2</code> <br />
                      <code>bob@example.com</code>
                    </div>
                  ) : (
                    <div>
                      Enter one per line:
                      <br />
                      <code>email, subdomain</code>
                      <br />
                      <br />
                      Example:
                      <br />
                      <code>alice@example.com, alice.{pbnDomain}</code> <br />
                      <code>bob@example.com, bob.{pbnDomain}</code>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="bulk-csv"
              rows={8}
              placeholder={
                mode === 'parent'
                  ? 'email@example.com\nuser2@example.com\n...'
                  : 'email@example.com,alice.domain.com\nuser2@example.com,bob.domain.com\n...'
              }
              value={csv}
              onChange={(e) => setCsv(e.currentTarget.value)}
            />
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={appendCsvToTable}>
                Append Values to table
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {mode === 'parent'
                ? 'One email per line.'
                : 'Each line: email,exactName'}
            </div>
          </div>

          {/* Editable table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Entries ({tableRows.length})
              </div>
              <Button variant="secondary" size="sm" onClick={addEmptyRow}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Row
              </Button>
            </div>
            <div className="border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>
                      {mode === 'parent' ? 'Count' : 'Subdomain'}
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((r, idx) => {
                    const emailTrim = (r.email ?? '').trim();
                    const exactTrim = (r.exact ?? '').trim();
                    const emailOk = emailRegex.test(emailTrim);
                    const countOk =
                      mode === 'parent'
                        ? Number.isFinite((r as any).count) &&
                          (r as any).count > 0
                        : true;
                    const exactOk =
                      mode === 'parent' ? true : exactTrim.length > 0;
                    const dupKey = (
                      mode === 'parent'
                        ? emailTrim
                        : `${emailTrim}|${exactTrim}`
                    )
                      .toLowerCase()
                      .trim();
                    const isDupRow =
                      emailTrim.length > 0 && (dupCounts.get(dupKey) ?? 0) > 1;
                    return (
                      <TableRow key={`${r.email}-${r.exact}-${r.count}`}>
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <Input
                              value={r.email}
                              onChange={(e) =>
                                updateRowField(
                                  idx,
                                  'email',
                                  e.currentTarget.value,
                                )
                              }
                              placeholder="user@example.com"
                            />
                            {!emailOk && (
                              <div className="text-xs text-red-600">
                                Enter a valid email
                              </div>
                            )}
                            {isDupRow && (
                              <div className="text-xs text-red-600">
                                Duplicate row
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          {mode === 'parent' ? (
                            <div className="space-y-1">
                              <Input
                                type="number"
                                min={1}
                                value={String(r.count ?? 1)}
                                onChange={(e) =>
                                  updateRowField(
                                    idx,
                                    'count',
                                    e.currentTarget.value,
                                  )
                                }
                              />
                              {!countOk && (
                                <div className="text-xs text-red-600">
                                  Count must be at least 1
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Input
                                value={r.exact ?? ''}
                                onChange={(e) =>
                                  updateRowField(
                                    idx,
                                    'exact',
                                    e.currentTarget.value,
                                  )
                                }
                                placeholder={`alice.${pbnDomain}`}
                              />
                              {!exactOk && (
                                <div className="text-xs text-red-600">
                                  Must be a single-label subdomain of{' '}
                                  {pbnDomain}
                                </div>
                              )}
                            </div>
                          )}
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
            <Badge variant="outline">
              {mode === 'parent' ? 'Parent' : 'Exact'}
            </Badge>
            <span>Entries: {tableRows.length}</span>
            {duplicateCount > 0 && (
              <Badge variant="destructive">
                {duplicateCount} duplicate{duplicateCount === 1 ? '' : 's'}
              </Badge>
            )}
            {invalidCount > 0 && (
              <Badge variant="destructive">{invalidCount} invalid</Badge>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={disabled || bulkMutation.isPending}
            >
              {bulkMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create{' '}
              {mode === 'parent'
                ? annotatedRows.reduce(
                    (n: number, r: any) => n + (r.count ?? 1),
                    0,
                  )
                : tableRows.length}{' '}
              Gift
              {(mode === 'parent'
                ? annotatedRows.reduce(
                    (n: number, r: any) => n + (r.count ?? 1),
                    0,
                  )
                : tableRows.length) === 1
                ? ''
                : 's'}
            </Button>
          </div>
        </div>
      </DialogContent>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Gifts</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to create{' '}
              <strong>
                {mode === 'parent'
                  ? annotatedRows.reduce(
                      (n: number, r: any) => n + (r.count ?? 1),
                      0,
                    )
                  : tableRows.length}
              </strong>{' '}
              gift
              {(mode === 'parent'
                ? annotatedRows.reduce(
                    (n: number, r: any) => n + (r.count ?? 1),
                    0,
                  )
                : tableRows.length) === 1
                ? ''
                : 's'}
              . Review the entries below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border rounded max-h-72 overflow-auto">
            <div className="grid grid-cols-2 gap-2 p-2 text-xs font-medium bg-muted">
              <div>Email</div>
              <div>{mode === 'parent' ? 'Count' : 'Subdomain'}</div>
            </div>
            <div className="divide-y">
              {annotatedRows.slice(0, 300).map((r: any, idx) => (
                <div
                  key={`${r.email}-${r.exact}-${r.count}`}
                  className="grid grid-cols-2 gap-2 p-2 text-sm items-center"
                >
                  <div className="truncate flex items-center gap-2">
                    {r.isDup && <Badge variant="outline">Duplicate</Badge>}
                    {!emailRegex.test(r.email) && (
                      <Badge variant="outline">Invalid</Badge>
                    )}
                    {r.email}
                  </div>
                  <div className="truncate flex items-center gap-2">
                    {mode === 'parent' ? (r.count ?? 1) : r.exact || '—'}
                    {mode === 'exact' && !r.exact && (
                      <Badge variant="outline">Missing</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Confirm & Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
