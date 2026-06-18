'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { useTRPC } from '@/lib/trpc';
import { NotificationBody } from '@/components/notifications/notification-item';
import {
  UserSelectComboBox,
  type UserOption,
} from '@/components/admin/user-select-combobox';

const MarkdownEditor = dynamic(
  () => import('@/components/admin/markdown-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 border rounded-lg animate-pulse bg-muted/30" />
    ),
  },
);

/** Matches the contract cap on `adminCreateBulk.userIds`. */
const MAX_SPECIFIC_RECIPIENTS = 500;

type SendMode = 'specific' | 'everyone';
type NotificationBodyType = 'plain' | 'markdown';
type NotificationPriority = 'silent' | 'low' | 'normal' | 'high' | 'critical';

/**
 * Priority labels surfaced in the dropdown. Order mirrors the audibility
 * threshold — anything `normal` or above plays the bell sound on rise.
 */
const PRIORITY_OPTIONS: Array<{
  value: NotificationPriority;
  label: string;
  hint: string;
}> = [
  { value: 'silent', label: 'Silent', hint: 'No sound, no banner emphasis.' },
  { value: 'low', label: 'Low', hint: 'No sound. Informational.' },
  { value: 'normal', label: 'Normal', hint: 'Plays the bell sound. Default.' },
  {
    value: 'high',
    label: 'High',
    hint: 'Plays the bell sound. Use for action-required.',
  },
  {
    value: 'critical',
    label: 'Critical',
    hint: 'Plays the bell sound. Reserve for emergencies.',
  },
];

type BulkResult = {
  userId: string;
  status: 'created' | 'failed';
  error: string | null;
};

export function NotificationComposer() {
  const trpc = useTRPC();

  const [mode, setMode] = useState<SendMode>('specific');
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState<NotificationBodyType>('markdown');
  const [priority, setPriority] = useState<NotificationPriority>('normal');
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);
  // Frozen `userIdToLabel` for the in-flight / just-completed send. The
  // live `userIdToLabel` tracks the combobox's current selection, but the
  // results panel must render labels for the *sent* set — otherwise an
  // admin who deselects a user mid-flight would see that user's failed
  // row fall back to a raw UUID. Set in `handleSend`, read in `SendPanel`.
  const [sentLabelSnapshot, setSentLabelSnapshot] = useState<
    Map<string, string>
  >(() => new Map());

  const trimmedTitle = title.trim();
  const trimmedSubtitle = subtitle.trim();
  const trimmedBody = body.trim();

  const audienceQuery = useQuery({
    ...trpc.admin.notifications.getBroadcastAudienceSize.queryOptions(
      undefined,
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: mode === 'everyone',
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  // Each chip in the combobox is already a resolved user — no email
  // round-trip needed. `userIdToLabel` is used to label per-row failures
  // in the send results panel with the same string the admin saw selected.
  const { resolvedUserIds, userIdToLabel } = useMemo(() => {
    const ids: string[] = [];
    const idToLabel = new Map<string, string>();
    for (const user of selectedUsers) {
      ids.push(user.id);
      idToLabel.set(user.id, user.primaryEmail ?? user.displayName ?? user.id);
    }
    return { resolvedUserIds: ids, userIdToLabel: idToLabel };
  }, [selectedUsers]);

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
  const sendDisabled =
    isPending ||
    composeIncomplete ||
    (mode === 'specific' &&
      (resolvedUserIds.length === 0 || tooManyRecipients));

  const handleSend = () => {
    if (sendDisabled) return;
    setBulkResults(null);
    const composeFields = {
      title: trimmedTitle,
      subtitle: trimmedSubtitle || undefined,
      body: trimmedBody,
      bodyType,
      priority,
    };
    if (mode === 'specific') {
      // Snapshot labels for the user ids we're sending to — see
      // `sentLabelSnapshot` declaration. Clone so future selection
      // edits don't mutate this map.
      setSentLabelSnapshot(new Map(userIdToLabel));
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
            selectedUsers={selectedUsers}
            onChange={setSelectedUsers}
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
          <Label htmlFor="notification-priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) =>
              setPriority(value as NotificationPriority)
            }
          >
            <SelectTrigger id="notification-priority" className="w-full">
              <SelectValue>
                {(value) =>
                  PRIORITY_OPTIONS.find((option) => option.value === value)
                    ?.label ?? 'Normal'
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {option.hint}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          userIdToLabel={sentLabelSnapshot}
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
  selectedUsers,
  onChange,
}: {
  selectedUsers: UserOption[];
  onChange: (next: UserOption[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Recipients ({selectedUsers.length} of {MAX_SPECIFIC_RECIPIENTS})
      </Label>
      <UserSelectComboBox
        mode="multiple"
        value={selectedUsers}
        onChange={onChange}
        maxSelected={MAX_SPECIFIC_RECIPIENTS}
        placeholder="Search by email, name, wallet, or domain…"
        ariaLabel="Recipients"
      />
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
  userIdToLabel,
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
  userIdToLabel: Map<string, string>;
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
                  {userIdToLabel.get(r.userId) ?? r.userId}
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
                <Loader2 className="h-4 w-4 animate-spin me-1.5" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 me-1.5" /> Confirm send
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
          <Send className="h-4 w-4 me-1.5" />
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
        <div className="flex gap-3 rounded-lg border border-s-2 border-white/5 border-s-brand-primary bg-white/[0.04] p-3">
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
