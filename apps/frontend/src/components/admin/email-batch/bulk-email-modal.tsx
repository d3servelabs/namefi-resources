'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounceValue } from 'usehooks-ts';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Eraser,
  HelpCircle,
  Info,
  Loader2,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { bulkOneOffFromAddressSchema } from '@namefi-astra/common/contract/admin/admin-email-campaigns-contract';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { HandlebarsHelpModal } from './handlebars-help-modal';
import type { EmailBatchRecipient, EmailBatchTemplateStyle } from './types';
import { useEmailBatch } from './use-email-batch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';

const MarkdownEditor = dynamic(
  () => import('@/components/admin/markdown-editor'),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 border rounded-lg animate-pulse bg-muted/30" />
    ),
  },
);

const PREVIEW_DEBOUNCE_MS = 800;

type BulkEmailModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SendResult = {
  email: string;
  status: 'sent' | 'failed';
  error: string | null;
};

export function BulkEmailModal({ open, onOpenChange }: BulkEmailModalProps) {
  const {
    recipients,
    addRecipient,
    removeRecipient,
    clearRecipients,
    draft,
    setDraft,
    clearDraft,
  } = useEmailBatch();

  const [isCcBccOpen, setIsCcBccOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmingSend, setConfirmingSend] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [sampleRecipientEmail, setSampleRecipientEmail] = useState<
    string | null
  >(null);

  const sampleRecipient = useMemo(() => {
    if (recipients.length === 0) return null;
    if (sampleRecipientEmail) {
      const match = recipients.find(
        (r) => r.email.toLowerCase() === sampleRecipientEmail.toLowerCase(),
      );
      if (match) return match;
    }
    return recipients[0];
  }, [recipients, sampleRecipientEmail]);

  const trimmedSubject = draft.subject.trim();
  const trimmedMarkdown = draft.markdown.trim();
  const trimmedCampaignKey = draft.campaignKey.trim();

  const [debouncedPreviewInput] = useDebounceValue(
    {
      subject: trimmedSubject,
      markdown: trimmedMarkdown,
      campaignKey: trimmedCampaignKey,
      useContainer: draft.templateStyle.useContainer,
      useHeader: draft.templateStyle.useHeader,
      useFooter: draft.templateStyle.useFooter,
      sampleRecipientEmail: sampleRecipient?.email ?? null,
      sampleRecipientUserId: sampleRecipient?.userId ?? null,
      sampleRecipientPrivyUserId: sampleRecipient?.privyUserId ?? null,
    },
    PREVIEW_DEBOUNCE_MS,
  );

  const previewEnabled = Boolean(
    open &&
      debouncedPreviewInput.subject &&
      debouncedPreviewInput.markdown &&
      debouncedPreviewInput.sampleRecipientEmail,
  );

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const previewQuery = useQuery({
    ...trpc.admin.emailCampaigns.previewBulkOneOffEmail.queryOptions(
      {
        subject: debouncedPreviewInput.subject || 'Preview',
        markdown: debouncedPreviewInput.markdown || ' ',
        campaignKey: debouncedPreviewInput.campaignKey || undefined,
        sampleRecipient: {
          email: debouncedPreviewInput.sampleRecipientEmail ?? '',
          userId: debouncedPreviewInput.sampleRecipientUserId ?? undefined,
          privyUserId:
            debouncedPreviewInput.sampleRecipientPrivyUserId ?? undefined,
        },
        templateStyle: {
          useContainer: debouncedPreviewInput.useContainer,
          useHeader: debouncedPreviewInput.useHeader,
          useFooter: debouncedPreviewInput.useFooter,
        },
      },
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: previewEnabled,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
  });

  const knownCampaignKeysQuery = useQuery({
    ...trpc.admin.emailCampaigns.listKnownCampaignKeys.queryOptions(undefined, {
      trpc: { context: { skipBatch: true } },
    }),
    enabled: open,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  // Resolve which recipient emails map to known users so we can surface
  // an amber `<Info/>` on chips that won't have `{{user.*}}` available.
  const recipientEmailsForLookup = useMemo(
    () => recipients.map((r) => r.email),
    [recipients],
  );
  const [debouncedRecipientEmails] = useDebounceValue(
    recipientEmailsForLookup,
    200,
  );
  const recipientLookupQuery = useQuery({
    ...trpc.admin.emailCampaigns.lookupUsersByEmail.queryOptions(
      { emails: debouncedRecipientEmails },
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: open && debouncedRecipientEmails.length > 0,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  const recipientResolutions = recipientLookupQuery.data?.results ?? null;

  const sendMutation = useMutation(
    trpc.admin.emailCampaigns.sendBulkOneOffEmail.mutationOptions({
      onSuccess: (data) => {
        setSendResults(data.results);
        const sent = data.summary.sent;
        const failed = data.summary.failed;
        if (failed === 0) {
          toast.success(`Sent ${sent} ${sent === 1 ? 'email' : 'emails'}`);
        } else {
          toast.warning(`${sent} sent, ${failed} failed — see results panel`);
        }
        // The backend seeds an `email_campaign_opens` row on send so the
        // new campaign key is immediately discoverable. Invalidate the
        // autocomplete cache so the next compose sees it.
        if (data.summary.campaignKey) {
          queryClient.invalidateQueries({
            queryKey:
              trpc.admin.emailCampaigns.listKnownCampaignKeys.queryKey(),
          });
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to send batch');
      },
      onSettled: () => {
        setConfirmingSend(false);
      },
    }),
  );

  const sampleContextJson = useMemo(() => {
    if (!previewQuery.data?.sampleContext) return null;
    return JSON.stringify(previewQuery.data.sampleContext, null, 2);
  }, [previewQuery.data?.sampleContext]);

  const trimmedFromAddress = draft.fromAddress.trim();
  const fromAddressValidation = useMemo(() => {
    if (!trimmedFromAddress) return null;
    const result = bulkOneOffFromAddressSchema.safeParse(trimmedFromAddress);
    return result.success
      ? null
      : (result.error.issues[0]?.message ?? 'Invalid From address');
  }, [trimmedFromAddress]);

  const sendDisabled =
    recipients.length === 0 ||
    !trimmedSubject ||
    !trimmedMarkdown ||
    fromAddressValidation !== null ||
    sendMutation.isPending;

  const handleSendConfirm = () => {
    if (sendDisabled) return;
    setSendResults(null);
    sendMutation.mutate({
      subject: trimmedSubject,
      markdown: trimmedMarkdown,
      campaignKey: trimmedCampaignKey || undefined,
      recipients: recipients.map((r) => ({
        email: r.email,
        userId: r.userId,
        privyUserId: r.privyUserId,
      })),
      templateStyle: draft.templateStyle,
      from: trimmedFromAddress || undefined,
      cc: draft.cc.length ? draft.cc : undefined,
      bcc: draft.bcc.length ? draft.bcc : undefined,
    });
  };

  const handleClearAll = () => {
    clearRecipients();
    clearDraft();
    setSendResults(null);
    setConfirmingSend(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] w-[95vw] !p-0 max-h-[95vh] h-[95vh] flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="p-4 pr-14 border-b flex-row items-center justify-between gap-3 space-y-0">
            <div>
              <DialogTitle>Bulk one-off email</DialogTitle>
              <DialogDescription>
                Compose and send a Handlebars-templated email to{' '}
                {recipients.length}{' '}
                {recipients.length === 1 ? 'recipient' : 'recipients'} from your
                batch.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setHelpOpen(true)}
              >
                <HelpCircle className="h-4 w-4 mr-1.5" />
                Help
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={
                  !draft.subject && !draft.markdown && !draft.campaignKey
                }
                onClick={() => {
                  clearDraft();
                  setSendResults(null);
                  setConfirmingSend(false);
                  toast('Template cleared');
                }}
              >
                <Eraser className="h-4 w-4 mr-1.5" />
                Clear template
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={recipients.length === 0}
                onClick={() => {
                  clearRecipients();
                  toast('Recipients cleared');
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Clear recipients
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden grid grid-rows-[1fr_1fr] xl:grid-rows-1 xl:grid-cols-2 gap-0">
            <div className="overflow-y-auto p-4 border-b xl:border-b-0 xl:border-r">
              <div className="space-y-4">
                <RecipientsPanel
                  recipients={recipients}
                  onRemove={removeRecipient}
                  onClearAll={clearRecipients}
                  onAddManual={(email) =>
                    addRecipient({
                      email,
                      displayLabel: undefined,
                    })
                  }
                  resolutions={recipientResolutions}
                  isResolutionLoading={recipientLookupQuery.isFetching}
                />

                <Collapsible open={isCcBccOpen} onOpenChange={setIsCcBccOpen}>
                  <div className="flex flex-row items-center gap-2 w-full">
                    <FromAddressPanel
                      value={draft.fromAddress}
                      onChange={(value) => setDraft({ fromAddress: value })}
                      error={fromAddressValidation}
                    />
                    <CollapsibleTrigger
                      render={
                        <Button variant="ghost" size="icon" className="size-8">
                          {isCcBccOpen ? <ChevronsUp /> : <ChevronsDown />}
                        </Button>
                      }
                    />
                  </div>
                  <CollapsibleContent className={'mt-4'}>
                    <CcBccPanel
                      cc={draft.cc}
                      bcc={draft.bcc}
                      onChange={(patch) => setDraft(patch)}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-email-subject">Subject</Label>
                    <Input
                      id="bulk-email-subject"
                      value={draft.subject}
                      onChange={(event) =>
                        setDraft({ subject: event.target.value })
                      }
                      placeholder="Subject line"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-email-campaign-key">
                      Campaign key{' '}
                      <span className="text-muted-foreground text-xs">
                        (optional, enables tracking)
                      </span>
                    </Label>
                    <Input
                      id="bulk-email-campaign-key"
                      list="bulk-email-campaign-key-suggestions"
                      autoComplete="off"
                      value={draft.campaignKey}
                      onChange={(event) =>
                        setDraft({ campaignKey: event.target.value })
                      }
                      placeholder="e.g. jan-2026-followup"
                    />
                    <datalist id="bulk-email-campaign-key-suggestions">
                      {(knownCampaignKeysQuery.data?.keys ?? []).map((key) => (
                        <option key={key} value={key} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <TemplateStylePanel
                  style={draft.templateStyle}
                  onChange={(patch) =>
                    setDraft({
                      templateStyle: { ...draft.templateStyle, ...patch },
                    })
                  }
                />

                <div className="space-y-1.5">
                  <Label>Template (Markdown + Handlebars)</Label>
                  <MarkdownEditor
                    markdown={draft.markdown}
                    onChange={(value) => setDraft({ markdown: value })}
                    placeholder="Hi {{user.displayName}},&#10;&#10;…"
                  />
                </div>

                <SendPanel
                  confirming={confirmingSend}
                  setConfirming={setConfirmingSend}
                  onConfirm={handleSendConfirm}
                  onClearAll={handleClearAll}
                  recipientCount={recipients.length}
                  isPending={sendMutation.isPending}
                  sendDisabled={sendDisabled}
                  results={sendResults}
                  fromAddress={trimmedFromAddress}
                  ccCount={draft.cc.length}
                  bccCount={draft.bcc.length}
                />
              </div>
            </div>

            <div className="overflow-hidden flex flex-col p-4">
              <PreviewPanel
                recipients={recipients}
                selectedEmail={sampleRecipient?.email ?? null}
                onSelect={setSampleRecipientEmail}
                html={previewQuery.data?.html ?? ''}
                isFetching={previewQuery.isFetching}
                isError={previewQuery.isError}
                templateError={previewQuery.data?.error ?? null}
                enabled={previewEnabled}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <HandlebarsHelpModal
        open={helpOpen}
        onOpenChange={setHelpOpen}
        sampleContextJson={sampleContextJson}
      />
    </>
  );
}

type RecipientResolutionMap = Record<
  string,
  {
    userId: string | null;
    privyUserId: string | null;
    displayName: string | null;
  } | null
> | null;

function RecipientsPanel({
  recipients,
  onRemove,
  onClearAll,
  onAddManual,
  resolutions,
  isResolutionLoading,
}: {
  recipients: EmailBatchRecipient[];
  onRemove: (email: string) => void;
  onClearAll: () => void;
  onAddManual: (email: string) => void;
  resolutions: RecipientResolutionMap;
  isResolutionLoading: boolean;
}) {
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);

  const [manualEntry, setManualEntry] = useState('');

  const commitManualEntry = () => {
    const raw = manualEntry.trim();
    if (!raw) return;
    const candidates = raw
      .split(/[,;\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    let added = 0;
    let skipped = 0;
    for (const candidate of candidates) {
      const parsed = z.string().email().safeParse(candidate);
      if (parsed.success) {
        onAddManual(parsed.data);
        added += 1;
      } else {
        skipped += 1;
      }
    }
    if (added > 0 && skipped === 0) {
      setManualEntry('');
    } else if (added === 0 && skipped > 0) {
      toast.error(
        `Skipped ${skipped} invalid email${skipped === 1 ? '' : 's'}`,
      );
    } else if (added > 0 && skipped > 0) {
      toast.warning(
        `Added ${added}, skipped ${skipped} invalid email${skipped === 1 ? '' : 's'}`,
      );
      setManualEntry('');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Recipients ({recipients.length})
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
      <Collapsible open={isManualEntryOpen} onOpenChange={setIsManualEntryOpen}>
        <div className="flex flex-row gap-1 w-full">
          {recipients.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Add recipients below, or use the{' '}
              <span className="font-medium">+</span> button next to any mailto
              link in the admin UI.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto rounded-md border p-2 w-full">
              {recipients.map((r) => {
                const resolution = resolutions
                  ? resolutions[r.email]
                  : undefined;
                // `undefined` = lookup hasn't returned for this email yet (still
                // loading or stale). `null` = lookup returned and no user matched.
                const isUnresolved = resolution === null;
                return (
                  <span
                    key={r.email}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                    title={r.displayLabel ?? r.email}
                  >
                    <span className="max-w-[18ch] truncate">{r.email}</span>
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
                              Not associated with a user — Handlebars{' '}
                              <code className="font-mono">{'{{user.*}}'}</code>{' '}
                              and{' '}
                              <code className="font-mono">
                                {'{{privyUser.*}}'}
                              </code>{' '}
                              refs will be empty for this recipient.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onRemove(r.email)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${r.email}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="icon" className="size-8">
                {isManualEntryOpen ? <ChevronsUp /> : <ChevronsDown />}
              </Button>
            }
          />
        </div>
        <CollapsibleContent className={'mt-4'}>
          <div className="flex items-center gap-2">
            <Input
              value={manualEntry}
              onChange={(event) => setManualEntry(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitManualEntry();
                }
              }}
              placeholder="Add by email — comma-separated for bulk paste"
              className="h-8 text-xs"
              aria-label="Add recipient by email"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={commitManualEntry}
              disabled={!manualEntry.trim()}
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PreviewPanel({
  recipients,
  selectedEmail,
  onSelect,
  html,
  isFetching,
  isError,
  templateError,
  enabled,
}: {
  recipients: EmailBatchRecipient[];
  selectedEmail: string | null;
  onSelect: (email: string) => void;
  html: string;
  isFetching: boolean;
  isError: boolean;
  templateError: string | null;
  enabled: boolean;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Preview as
        </Label>
        {recipients.length > 0 ? (
          <Select
            value={selectedEmail ?? ''}
            onValueChange={(value) => {
              if (value) onSelect(value);
            }}
          >
            <SelectTrigger className="h-8 max-w-[260px] text-xs">
              <SelectValue placeholder="Pick a sample recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((r) => (
                <SelectItem key={r.email} value={r.email}>
                  {r.displayLabel ? `${r.displayLabel} — ${r.email}` : r.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs text-muted-foreground">
            Add a recipient first
          </span>
        )}
      </div>

      <div className="relative flex-1 border rounded-md overflow-hidden bg-white">
        {!enabled && (
          <PreviewOverlay text="Fill in subject + template + recipient to see a preview" />
        )}
        {enabled && templateError && (
          <PreviewOverlay text={templateError} tone="error" />
        )}
        {enabled && !templateError && isError && (
          <PreviewOverlay
            text="Preview failed to render. Try editing the template."
            tone="error"
          />
        )}
        {enabled && isFetching && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 text-xs bg-background/80 backdrop-blur px-2 py-1 rounded">
            <Loader2 className="h-3 w-3 animate-spin" /> rendering…
          </div>
        )}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: srcDoc is server-rendered HTML, safe */}
        <iframe
          title="Email preview"
          srcDoc={html}
          // Sandbox the preview: even though the HTML is server-rendered,
          // it carries admin-authored markdown that could embed `<script>`
          // or other active content. No `allow-same-origin` so the frame
          // can't reach back into the admin UI's context. `allow-popups`
          // keeps anchor clicks usable while previewing.
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}

function PreviewOverlay({
  text,
  tone = 'muted',
}: {
  text: string;
  tone?: 'muted' | 'error';
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex items-center justify-center p-4 text-center text-sm',
        tone === 'error'
          ? 'bg-destructive/10 text-destructive'
          : 'bg-background/80 text-muted-foreground',
      )}
    >
      <div className="max-w-md whitespace-pre-wrap">{text}</div>
    </div>
  );
}

function SendPanel({
  confirming,
  setConfirming,
  onConfirm,
  onClearAll,
  recipientCount,
  isPending,
  sendDisabled,
  results,
  fromAddress,
  ccCount,
  bccCount,
}: {
  confirming: boolean;
  setConfirming: (value: boolean) => void;
  onConfirm: () => void;
  onClearAll: () => void;
  recipientCount: number;
  isPending: boolean;
  sendDisabled: boolean;
  results: SendResult[] | null;
  fromAddress: string;
  ccCount: number;
  bccCount: number;
}) {
  const sent = results?.filter((r) => r.status === 'sent').length ?? 0;
  const failed = results?.filter((r) => r.status === 'failed').length ?? 0;
  const envelopeSummary = useMemo(() => {
    const parts: string[] = [];
    if (fromAddress) parts.push(`From: ${fromAddress}`);
    if (ccCount > 0) parts.push(`CC: ${ccCount}`);
    if (bccCount > 0) parts.push(`BCC: ${bccCount}`);
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [fromAddress, ccCount, bccCount]);

  return (
    <div className="space-y-3 border-t pt-3">
      {results && (
        <div className="space-y-2">
          <p className="text-sm">
            <strong>{sent}</strong> sent, <strong>{failed}</strong> failed.
          </p>
          {failed > 0 && (
            <ul className="text-xs space-y-1 max-h-40 overflow-auto">
              {results
                .filter((r) => r.status === 'failed')
                .map((r) => (
                  <li key={r.email} className="text-destructive">
                    {r.email}
                    {r.error ? ` — ${r.error}` : ''}
                  </li>
                ))}
            </ul>
          )}
          <Button size="sm" variant="ghost" onClick={onClearAll}>
            Clear batch & draft
          </Button>
        </div>
      )}

      {confirming ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
          <span>
            Send to <strong>{recipientCount}</strong>{' '}
            {recipientCount === 1 ? 'recipient' : 'recipients'}?
            {envelopeSummary ? (
              <span className="block text-xs text-muted-foreground">
                {envelopeSummary}
              </span>
            ) : null}
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
          Send to {recipientCount}{' '}
          {recipientCount === 1 ? 'recipient' : 'recipients'}
        </Button>
      )}
    </div>
  );
}

function TemplateStylePanel({
  style,
  onChange,
}: {
  style: EmailBatchTemplateStyle;
  onChange: (patch: Partial<EmailBatchTemplateStyle>) => void;
}) {
  const isPlain = !style.useContainer;
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        Template style
      </Label>
      <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/30 p-2.5">
        <StyleCheckbox
          id="bulk-email-style-plain"
          checked={isPlain}
          onCheckedChange={(value) => {
            // Plain ⇒ no container; flipping plain off restores branded
            // defaults (header + footer) so the user doesn't end up with
            // an awkward branded-but-empty shell.
            if (value) {
              onChange({ useContainer: false });
            } else {
              onChange({
                useContainer: true,
                useHeader: true,
                useFooter: true,
              });
            }
          }}
          label="Plain (no branding)"
          hint="Strips the container, header, and footer — sends raw markdown styling only."
        />
        <StyleCheckbox
          id="bulk-email-style-header"
          checked={style.useHeader}
          disabled={isPlain}
          onCheckedChange={(value) => onChange({ useHeader: value })}
          label="Header"
          hint="Namefi logo & subject banner at the top."
        />
        <StyleCheckbox
          id="bulk-email-style-footer"
          checked={style.useFooter}
          disabled={isPlain}
          onCheckedChange={(value) => onChange({ useFooter: value })}
          label="Footer"
          hint="Standard footer with links and legal copy."
        />
      </div>
    </div>
  );
}

function StyleCheckbox({
  id,
  checked,
  onCheckedChange,
  disabled,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
  hint: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-2 text-sm',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <span className="flex flex-col">
        <span>{label}</span>
        <span className="text-muted-foreground text-xs">{hint}</span>
      </span>
    </label>
  );
}

const FROM_ADDRESS_SUGGESTIONS = [
  'support@namefi.io',
  'hello@namefi.io',
  'team@namefi.io',
  'noreply@namefi.io',
  'Namefi <support@namefi.io>',
  'admin@d3serve.xyz',
];

function FromAddressPanel({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-1.5 w-full">
      <Label htmlFor="bulk-email-from">
        From{' '}
        <span className="text-muted-foreground text-xs">
          (optional, must end in @d3serve.xyz or @namefi.io)
        </span>
      </Label>
      <Input
        id="bulk-email-from"
        list="bulk-email-from-suggestions"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Default: Namefi <support@namefi.io>"
        aria-invalid={error ? true : undefined}
        className={cn(error && 'border-destructive')}
      />
      <datalist id="bulk-email-from-suggestions">
        {FROM_ADDRESS_SUGGESTIONS.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CcBccPanel({
  cc,
  bcc,
  onChange,
}: {
  cc: string[];
  bcc: string[];
  onChange: (patch: { cc?: string[]; bcc?: string[] }) => void;
}) {
  // Auto-expand a section when it already has values so refreshes don't
  // hide configured CC/BCC behind a collapsed header.
  const [ccOpen, setCcOpen] = useState(cc.length > 0);
  const [bccOpen, setBccOpen] = useState(bcc.length > 0);
  return (
    <div className="space-y-2">
      <EmailListField
        label="CC"
        open={ccOpen}
        onOpenChange={setCcOpen}
        values={cc}
        onChange={(next) => onChange({ cc: next })}
      />
      <EmailListField
        label="BCC"
        open={bccOpen}
        onOpenChange={setBccOpen}
        values={bcc}
        onChange={(next) => onChange({ bcc: next })}
      />
    </div>
  );
}

function EmailListField({
  label,
  open,
  onOpenChange,
  values,
  onChange,
}: {
  label: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draftEntry, setDraftEntry] = useState('');

  const commit = () => {
    const raw = draftEntry.trim();
    if (!raw) return;
    const candidates = raw
      .split(/[,;\s]+/)
      .map((token) => token.trim())
      .filter(Boolean);
    const valid: string[] = [];
    let skipped = 0;
    for (const candidate of candidates) {
      const parsed = z.string().email().safeParse(candidate);
      if (parsed.success) {
        const normalized = parsed.data.trim();
        if (!values.includes(normalized) && !valid.includes(normalized)) {
          valid.push(normalized);
        }
      } else {
        skipped += 1;
      }
    }
    if (valid.length > 0) {
      onChange([...values, ...valid]);
      setDraftEntry('');
    }
    if (skipped > 0) {
      toast.error(
        `Skipped ${skipped} invalid ${label} email${skipped === 1 ? '' : 's'}`,
      );
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {values.length > 0 ? `${label} (${values.length})` : `Add ${label}`}
      </button>
      {open ? (
        <div className="space-y-2 rounded-md border bg-muted/30 p-2">
          {values.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {values.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 rounded-md bg-background px-2 py-0.5 text-xs"
                >
                  <span className="max-w-[18ch] truncate">{email}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange(values.filter((value) => value !== email))
                    }
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${email}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Input
              value={draftEntry}
              onChange={(event) => setDraftEntry(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commit();
                }
              }}
              onBlur={() => {
                if (draftEntry.trim()) commit();
              }}
              placeholder={`Add ${label} — comma-separated`}
              className="h-8 text-xs"
              aria-label={`Add ${label} recipient`}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={commit}
              disabled={!draftEntry.trim()}
              className="h-8"
            >
              Add
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Applied to every send in the batch.
          </p>
        </div>
      ) : null}
    </div>
  );
}
