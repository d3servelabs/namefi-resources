'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import { Info, Loader2, Send, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { NotificationBody } from '@/components/notifications/notification-item';

const MarkdownEditor = dynamic(
  () => import('@/components/admin/markdown-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 border rounded-lg animate-pulse bg-muted/30" />
    ),
  },
);

const RECIPIENT_LOOKUP_DEBOUNCE_MS = 200;
/** Matches the contract cap on `adminCreateBulk.userIds`. */
const MAX_SPECIFIC_RECIPIENTS = 500;

type SendMode = 'specific' | 'everyone';
type NotificationBodyType = 'plain' | 'markdown';

type RecipientResolutionMap = Record<
  string,
  {
    userId: string | null;
    privyUserId: string | null;
    displayName: string | null;
  } | null
> | null;

type BulkResult = {
  userId: string;
  status: 'created' | 'failed';
  error: string | null;
};

export function NotificationComposer() {
  const trpc = useTRPC();

  const [mode, setMode] = useState<SendMode>('specific');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState<NotificationBodyType>('markdown');
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);

  const trimmedTitle = title.trim();
  const trimmedSubtitle = subtitle.trim();
  const trimmedBody = body.trim();

  // Resolve recipient emails to user ids — only resolved users can be
  // notified, and unresolved emails get an amber `<Info/>` indicator.
  const [debouncedRecipients] = useDebounceValue(
    recipients,
    RECIPIENT_LOOKUP_DEBOUNCE_MS,
  );
  const recipientLookupQuery = useQuery({
    ...trpc.admin.notifications.lookupUsersByEmail.queryOptions(
      { emails: debouncedRecipients },
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: mode === 'specific' && debouncedRecipients.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  const resolutions: RecipientResolutionMap =
    recipientLookupQuery.data?.results ?? null;

  const audienceQuery = useQuery({
    ...trpc.admin.notifications.getBroadcastAudienceSize.queryOptions(
      undefined,
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: mode === 'everyone',
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  // Emails the lookup resolved to a real user id — the only ones we can
  // actually deliver to. `userIdToEmail` lets us label the failed-result
  // rows by the email the admin typed.
  const { resolvedUserIds, userIdToEmail } = useMemo(() => {
    const ids: string[] = [];
    const idToEmail = new Map<string, string>();
    if (!resolutions) return { resolvedUserIds: ids, userIdToEmail: idToEmail };
    for (const email of recipients) {
      const userId = resolutions[email]?.userId ?? null;
      if (userId && !idToEmail.has(userId)) {
        ids.push(userId);
        idToEmail.set(userId, email);
      }
    }
    return { resolvedUserIds: ids, userIdToEmail: idToEmail };
  }, [recipients, resolutions]);

  const createBulkMutation = useMutation(
    trpc.admin.notifications.adminCreateBulk.mutationOptions({
      onSuccess: (data) => {
        setBulkResults(data.results);
        const { created, failed } = data.summary;
        if (failed === 0) {
          toast.success(
            `Notified ${created} ${created === 1 ? 'user' : 'users'}`,
          );
        } else {
          toast.warning(
            `${created} notified, ${failed} failed — see results panel`,
          );
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to send notifications');
      },
      onSettled: () => {
        setConfirmingSend(false);
      },
    }),
  );

  const broadcastMutation = useMutation(
    trpc.admin.notifications.adminBroadcast.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Broadcast started for ~${data.audienceSize} ${
            data.audienceSize === 1 ? 'user' : 'users'
          }`,
          { description: `Workflow: ${data.workflowId}` },
        );
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to start broadcast');
      },
      onSettled: () => {
        setConfirmingSend(false);
      },
    }),
  );

  const isPending = createBulkMutation.isPending || broadcastMutation.isPending;
  const composeIncomplete = !trimmedTitle || !trimmedBody;
  const tooManyRecipients = resolvedUserIds.length > MAX_SPECIFIC_RECIPIENTS;
  // Block send while the email→userId lookup is still in flight in
  // specific mode. Without this guard, an admin who clicks send within
  // the 200ms debounce window after adding a new recipient would silently
  // ship a `userIds` array that omits the just-typed addresses.
  const isResolvingRecipients =
    mode === 'specific' && recipientLookupQuery.isFetching;
  const sendDisabled =
    isPending ||
    isResolvingRecipients ||
    composeIncomplete ||
    (mode === 'specific' &&
      (resolvedUserIds.length === 0 || tooManyRecipients));

  const handleAddRecipients = (raw: string) => {
    const candidates = raw
      .split(/[,;\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    let added = 0;
    let skipped = 0;
    const next = new Set(recipients);
    for (const candidate of candidates) {
      const parsed = z.string().email().safeParse(candidate);
      if (parsed.success && !next.has(parsed.data)) {
        next.add(parsed.data);
        added += 1;
      } else if (!parsed.success) {
        skipped += 1;
      }
    }
    if (added > 0) setRecipients(Array.from(next));
    if (skipped > 0) {
      toast.error(
        `Skipped ${skipped} invalid email${skipped === 1 ? '' : 's'}`,
      );
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((value) => value !== email));
  };

  const handleSend = () => {
    if (sendDisabled) return;
    setBulkResults(null);
    const composeFields = {
      title: trimmedTitle,
      subtitle: trimmedSubtitle || undefined,
      body: trimmedBody,
      bodyType,
    };
    if (mode === 'specific') {
      createBulkMutation.mutate({
        ...composeFields,
        userIds: resolvedUserIds,
      });
    } else {
      broadcastMutation.mutate(composeFields);
    }
  };

  const audienceSize = audienceQuery.data?.count ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Audience
          </Label>
          <Tabs
            value={mode}
            onValueChange={(value) => {
              setMode(value as SendMode);
              setConfirmingSend(false);
              setBulkResults(null);
            }}
          >
            <TabsList>
              <TabsTrigger value="specific">Specific users</TabsTrigger>
              <TabsTrigger value="everyone">Everyone</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {mode === 'specific' ? (
          <RecipientsPanel
            recipients={recipients}
            resolutions={resolutions}
            isResolutionLoading={recipientLookupQuery.isFetching}
            resolvedCount={resolvedUserIds.length}
            onAdd={handleAddRecipients}
            onRemove={handleRemoveRecipient}
            onClearAll={() => setRecipients([])}
          />
        ) : (
          <EveryonePanel
            audienceSize={audienceSize}
            isLoading={audienceQuery.isLoading}
            isError={audienceQuery.isError}
          />
        )}

        <div className="space-y-1.5">
          <Label htmlFor="notification-title">Title</Label>
          <Input
            id="notification-title"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short, front-loaded headline"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notification-subtitle">
            Subtitle{' '}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="notification-subtitle"
            value={subtitle}
            maxLength={400}
            onChange={(event) => setSubtitle(event.target.value)}
            placeholder="Supporting context"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Body</Label>
            <label
              htmlFor="notification-body-markdown"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Checkbox
                id="notification-body-markdown"
                checked={bodyType === 'markdown'}
                onCheckedChange={(value) =>
                  setBodyType(value === true ? 'markdown' : 'plain')
                }
              />
              Render as Markdown
            </label>
          </div>
          <MarkdownEditor
            markdown={body}
            onChange={setBody}
            placeholder="What do you want users to know?"
          />
        </div>

        <SendPanel
          mode={mode}
          confirming={confirmingSend}
          setConfirming={setConfirmingSend}
          onConfirm={handleSend}
          isPending={isPending}
          sendDisabled={sendDisabled}
          recipientCount={resolvedUserIds.length}
          audienceSize={audienceSize}
          tooManyRecipients={tooManyRecipients}
          results={bulkResults}
          userIdToEmail={userIdToEmail}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Preview
        </Label>
        <PreviewCard
          title={trimmedTitle}
          subtitle={trimmedSubtitle}
          body={body}
          bodyType={bodyType}
        />
      </div>
    </div>
  );
}

function RecipientsPanel({
  recipients,
  resolutions,
  isResolutionLoading,
  resolvedCount,
  onAdd,
  onRemove,
  onClearAll,
}: {
  recipients: string[];
  resolutions: RecipientResolutionMap;
  isResolutionLoading: boolean;
  resolvedCount: number;
  onAdd: (raw: string) => void;
  onRemove: (email: string) => void;
  onClearAll: () => void;
}) {
  const [entry, setEntry] = useState('');

  const commit = () => {
    const raw = entry.trim();
    if (!raw) return;
    onAdd(raw);
    setEntry('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Recipients ({recipients.length}
          {recipients.length > 0 ? `, ${resolvedCount} matched` : ''})
        </Label>
        {recipients.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            className="h-7 px-2"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear all
          </Button>
        )}
      </div>

      {recipients.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto rounded-md border p-2">
          {recipients.map((email) => {
            const resolution = resolutions ? resolutions[email] : undefined;
            // `undefined` = lookup hasn't returned yet. `null` or a row
            // without a `userId` = no matching user — can't be notified.
            const isUnresolved =
              resolution === null ||
              (resolution !== undefined && !resolution.userId);
            return (
              <span
                key={email}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                title={email}
              >
                <span className="max-w-[22ch] truncate">{email}</span>
                {isUnresolved ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={(triggerProps) => (
                          <span
                            {...triggerProps}
                            role="img"
                            aria-label="No matching user record"
                            className={cn(
                              'inline-flex items-center',
                              triggerProps.className,
                            )}
                          >
                            <Info className="h-3 w-3 text-amber-500" />
                          </span>
                        )}
                      />
                      <TooltipContent>
                        <p className="max-w-[260px]">
                          No matching user — this recipient will be skipped.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null}
                <button
                  type="button"
                  onClick={() => onRemove(email)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={entry}
          onChange={(event) => setEntry(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit();
            }
          }}
          placeholder="Add by email — comma-separated for bulk paste"
          className="h-8 text-xs"
          aria-label="Add recipient by email"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={commit}
          disabled={!entry.trim()}
          className="h-8"
        >
          Add
        </Button>
        {isResolutionLoading && recipients.length > 0 ? (
          <Loader2
            className="h-3 w-3 animate-spin text-muted-foreground"
            aria-label="Resolving users"
          />
        ) : null}
      </div>
    </div>
  );
}

function EveryonePanel({
  audienceSize,
  isLoading,
  isError,
}: {
  audienceSize: number;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      {isLoading ? (
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Counting users…
        </span>
      ) : isError ? (
        <span className="text-destructive">
          Couldn't load the audience size. Try refreshing.
        </span>
      ) : (
        <>
          This notification will be sent to <strong>{audienceSize}</strong>{' '}
          {audienceSize === 1 ? 'user' : 'users'}. Delivery runs in the
          background and may take a moment to reach everyone.
        </>
      )}
    </div>
  );
}

function SendPanel({
  mode,
  confirming,
  setConfirming,
  onConfirm,
  isPending,
  sendDisabled,
  recipientCount,
  audienceSize,
  tooManyRecipients,
  results,
  userIdToEmail,
}: {
  mode: SendMode;
  confirming: boolean;
  setConfirming: (value: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  sendDisabled: boolean;
  recipientCount: number;
  audienceSize: number;
  tooManyRecipients: boolean;
  results: BulkResult[] | null;
  userIdToEmail: Map<string, string>;
}) {
  const created = results?.filter((r) => r.status === 'created').length ?? 0;
  const failed = results?.filter((r) => r.status === 'failed') ?? [];

  const targetLabel =
    mode === 'specific'
      ? `${recipientCount} ${recipientCount === 1 ? 'user' : 'users'}`
      : `all ${audienceSize} ${audienceSize === 1 ? 'user' : 'users'}`;

  return (
    <div className="space-y-3 border-t pt-3">
      {results && (
        <div className="space-y-2">
          <p className="text-sm">
            <strong>{created}</strong> notified,{' '}
            <strong>{failed.length}</strong> failed.
          </p>
          {failed.length > 0 && (
            <ul className="text-xs space-y-1 max-h-40 overflow-auto">
              {failed.map((r) => (
                <li key={r.userId} className="text-destructive">
                  {userIdToEmail.get(r.userId) ?? r.userId}
                  {r.error ? ` — ${r.error}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tooManyRecipients && (
        <p className="text-xs text-destructive">
          Too many recipients — the specific-user path is capped at{' '}
          {MAX_SPECIFIC_RECIPIENTS}. Use "Everyone" or send in batches.
        </p>
      )}

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
          <span>
            Send this notification to <strong>{targetLabel}</strong>?
          </span>
          <Button
            size="sm"
            variant="default"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" /> Confirm send
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          onClick={() => setConfirming(true)}
          disabled={sendDisabled}
        >
          <Send className="h-4 w-4 mr-1.5" />
          Send to {targetLabel}
        </Button>
      )}
    </div>
  );
}

function PreviewCard({
  title,
  subtitle,
  body,
  bodyType,
}: {
  title: string;
  subtitle: string;
  body: string;
  bodyType: NotificationBodyType;
}) {
  const hasContent = Boolean(title || body);
  return (
    <div className="dark rounded-xl border bg-[#0a0a0a] p-4">
      {hasContent ? (
        <div className="flex gap-3 rounded-lg border border-l-2 border-white/5 border-l-brand-primary bg-white/[0.04] p-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {title || 'Notification title'}
            </h3>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
            <NotificationBody body={body} bodyType={bodyType} />
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Fill in a title and body to see a preview.
        </p>
      )}
    </div>
  );
}
