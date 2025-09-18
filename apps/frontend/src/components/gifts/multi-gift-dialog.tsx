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
import { addDays, format } from 'date-fns';
import { NaturalLanguageDatePicker } from '@/components/date-picker/natural-language-date-picker';
import { Switch } from '@/components/ui/shadcn/switch';
import { Label } from '@/components/ui/shadcn/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';

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
  const [skipBadRows, setSkipBadRows] = useState<boolean>(true);
  const [reason, setReason] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState<string>('');

  const domainsQuery = useQuery(
    trpc.pbnOwner.listOwnedDomains.queryOptions(void 0, {
      enabled: open,
    }),
  );

  const rows = useMemo(() => {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (mode === 'parent') {
      const tmp = lines.map((line) => {
        const [emailRaw, countRaw] = line.split(',');
        const email = (emailRaw ?? '').trim();
        const count = Number.parseInt((countRaw ?? '1').trim(), 10);
        return {
          email,
          count: Number.isFinite(count) && count > 0 ? count : 1,
        };
      });
      // aggregate by email to combine multiple entries
      const map = new Map<string, number>();
      for (const r of tmp) {
        const key = r.email.toLowerCase();
        map.set(key, (map.get(key) ?? 0) + r.count);
      }
      return Array.from(map.entries()).map(([email, count]) => ({
        email,
        count,
        exact: '',
      }));
    }
    // exact mode
    return lines.map((line) => {
      const [email, exact] = line.split(',').map((s) => (s ?? '').trim());
      return { email, exact };
    });
  }, [csv, mode]);

  const createMutation = useMutation(
    trpc.pbnReservations.create.mutationOptions({
      onSuccess: () => {
        onSuccess?.();
      },
    }),
  );

  const { annotatedRows, duplicateCount, invalidCount } = useMemo(() => {
    const seen = new Set<string>();
    let dup = 0;
    let bad = 0;
    const out = rows.map((r) => {
      const key = (mode === 'parent' ? r.email : `${r.email}|${r.exact}`)
        .toLowerCase()
        .trim();
      // For parent mode, duplicates are aggregated already; don't flag as dup
      const isDup = mode === 'parent' ? false : seen.has(key);
      if (!isDup) seen.add(key);
      else dup++;
      const emailOk = emailRegex.test(r.email);
      const countOk =
        mode === 'parent'
          ? Number.isFinite((r as any).count) && (r as any).count > 0
          : true;
      const exactOk = mode === 'parent' ? true : (r.exact ?? '').length > 0;
      const isInvalid = !emailOk || !exactOk || !countOk;
      if (isInvalid) bad++;
      return { ...r, isDup, isInvalid };
    });
    return { annotatedRows: out, duplicateCount: dup, invalidCount: bad };
  }, [rows, mode]);

  const disabled =
    !pbnDomain ||
    !expiration ||
    rows.length === 0 ||
    (!skipBadRows && (invalidCount > 0 || duplicateCount > 0));

  const handleSubmit = async () => {
    if (disabled) return;
    const expDate = new Date(expiration);
    const toCreate = annotatedRows.filter((r) =>
      skipBadRows ? !r.isInvalid && !r.isDup : true,
    );
    for (const r of toCreate as any[]) {
      const repeat = mode === 'parent' ? Math.max(1, Number(r.count ?? 1)) : 1;
      for (let i = 0; i < repeat; i++) {
        await createMutation.mutateAsync({
          pbnDomain: pbnDomain as any,
          recipientEmail: r.email,
          exactDomainName: mode === 'exact' ? (r.exact as any) : undefined,
          parentDomain: mode === 'parent' ? (pbnDomain as any) : undefined,
          issueFreeClaim: true,
          reserveHold: mode === 'exact' ? reserveHold : false,
          freeClaimExpirationDate: expDate,
          reservationExpirationDate:
            mode === 'exact' && reserveHold ? expDate : null,
          sendEmail,
          reason: reason || undefined,
          personalMessage: personalMessage || undefined,
        } as any);
      }
    }
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
            <div className="flex items-center justify-between border rounded p-3">
              <div>
                <Label htmlFor="bulk-skip">Skip invalid/duplicate rows</Label>
                <div className="text-xs text-muted-foreground">
                  Ignore bad rows during creation.
                </div>
              </div>
              <Switch
                id="bulk-skip"
                checked={skipBadRows}
                onCheckedChange={setSkipBadRows}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium" htmlFor="bulk-csv">
                CSV Input
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
            <div className="text-xs text-muted-foreground">
              {mode === 'parent'
                ? 'One email per line.'
                : 'Each line: email,exactName'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bulk-reason">Reason (optional)</Label>
              <Input
                id="bulk-reason"
                value={reason}
                onChange={(e) => setReason(e.currentTarget.value)}
                placeholder="Welcome gift, Campaign, etc."
              />
            </div>
            <div>
              <Label htmlFor="bulk-message">Personal message (optional)</Label>
              <Textarea
                id="bulk-message"
                rows={3}
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.currentTarget.value)}
                placeholder="Short message included in the email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Preview ({rows.length})</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {mode === 'parent' ? 'Parent' : 'Exact'}
                </Badge>
                {duplicateCount > 0 && (
                  <Badge variant="destructive">
                    {duplicateCount} duplicate{duplicateCount === 1 ? '' : 's'}
                  </Badge>
                )}
                {invalidCount > 0 && (
                  <Badge variant="destructive">{invalidCount} invalid</Badge>
                )}
              </div>
            </div>
            <div className="border rounded">
              <div className="grid grid-cols-2 gap-2 p-2 text-xs font-medium bg-muted">
                <div>Email</div>
                <div>{mode === 'parent' ? 'Count' : 'Exact Name'}</div>
              </div>
              <div className="max-h-60 overflow-auto divide-y">
                {annotatedRows.slice(0, 200).map((r: any, idx) => (
                  <div
                    key={idx}
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
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={disabled || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create{' '}
              {mode === 'parent'
                ? annotatedRows.reduce(
                    (n: number, r: any) => n + (r.count ?? 1),
                    0,
                  )
                : rows.length}{' '}
              Gift
              {(mode === 'parent'
                ? annotatedRows.reduce(
                    (n: number, r: any) => n + (r.count ?? 1),
                    0,
                  )
                : rows.length) === 1
                ? ''
                : 's'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
