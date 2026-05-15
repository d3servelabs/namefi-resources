'use client';

import { AuthRequired } from '@/components/auth-required';
import { GenerationUsage } from '@/components/ai-generation/generation-usage';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/hooks/use-auth';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import {
  getLeadgenOutreachCreditEstimate,
  getLeadgenRunCreditEstimate,
} from '@namefi-astra/common/ai-generation-credits';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  RadioGroup,
  RadioGroupItem,
} from '@namefi-astra/ui/components/shadcn/radio-group';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Play,
  Search,
  Sparkles,
  Target,
  UserRoundSearch,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { buildMailtoHref } from './leadgen-mailto';

type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
type LeadgenRunSummary = AppRouterOutput['leadgen']['listRuns'][number];
type LeadgenLead = LeadgenSnapshot['leads'][number];
type LeadgenEvent = LeadgenSnapshot['events'][number];
type DisplayableLeadgenEvent = LeadgenEvent & { message: string };
type LeadgenContact = LeadgenLead['contacts'][number];
type ReasoningEffort = LeadgenSnapshot['reasoningEffort'];
type OutreachRecipient = {
  email: string;
  name: string | null;
  title: string | null;
  context: string | null;
  sourceUrl: string | null;
};

type EmailDraftContent = {
  subject: string;
  fullEmail: string;
};

const reasoningOptions: Array<{
  value: ReasoningEffort;
  label: string;
  helper: string;
}> = [
  { value: 'low', label: 'Fast', helper: 'quick scan' },
  { value: 'medium', label: 'Balanced', helper: 'best default' },
  { value: 'high', label: 'Deep', helper: 'more research' },
];
const DOMAIN_INPUT_ID = 'leadgen-domain-input';
const DOMAIN_LIKE_RE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const PROTOCOL_RE = /^https?:\/\//;
const TRAILING_DOT_RE = /\.$/;
const WHITESPACE_RE = /\s+/g;
const getLeadgenRunHref = (runId: string) => `/leadgen/${runId}` as Route;
const leadgenStatusLabels = {
  QUEUED: 'Queued',
  RUNNING: 'Searching',
  SUCCEEDED: 'Success',
  FAILED: 'Failed',
  CANCELED: 'Canceled',
} satisfies Record<LeadgenSnapshot['status'], string>;
const leadBucketLabels = {
  general: 'Category match',
  substring: 'Name match',
} satisfies Record<LeadgenLead['bucket'], string>;
const negativeTimelineMessageRe =
  /\b(?:no|not|failed|failure|error|without|couldn['\u2019]?t|could not|didn['\u2019]?t|did not|unable|invalid|canceled|cancelled)\b/i;
const skeletonRows = ['first', 'second', 'third'];

export function LeadgenApp({ initialRunId }: { initialRunId?: string }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState('');
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>('medium');
  const [activeRunId, setActiveRunId] = useState<string | null>(
    initialRunId ?? null,
  );
  const [liveRun, setLiveRun] = useState<LeadgenSnapshot | null>(null);

  useEffect(() => {
    setActiveRunId(initialRunId ?? null);
  }, [initialRunId]);

  const runsQuery = useQuery({
    ...trpc.leadgen.listRuns.queryOptions({ limit: 12 }),
    enabled: isAuthenticated,
  });
  const usageQuery = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
    enabled: isAuthenticated,
  });

  const activeRunQuery = useQuery({
    ...trpc.leadgen.getRun.queryOptions({ runId: activeRunId ?? '' }),
    enabled: isAuthenticated && Boolean(activeRunId),
  });

  useEffect(() => {
    if (activeRunQuery.data) {
      setLiveRun(activeRunQuery.data);
      setDomain(activeRunQuery.data.domain);
      setReasoningEffort(activeRunQuery.data.reasoningEffort);
    }
  }, [activeRunQuery.data]);

  useSubscription({
    ...trpc.leadgen.watchRun.subscriptionOptions(
      { runId: activeRunId ?? '' },
      {
        enabled: isAuthenticated && Boolean(activeRunId),
        onData(snapshot) {
          setLiveRun(snapshot);
          if (
            snapshot.status === 'SUCCEEDED' ||
            snapshot.status === 'FAILED' ||
            snapshot.status === 'CANCELED'
          ) {
            void queryClient.invalidateQueries({
              queryKey: trpc.leadgen.listRuns.queryKey({ limit: 12 }),
            });
          }
        },
      },
    ),
  });

  const startRun = useMutation(
    trpc.leadgen.startRun.mutationOptions({
      onSuccess(snapshot) {
        setActiveRunId(snapshot.id);
        setLiveRun(snapshot);
        router.push(getLeadgenRunHref(snapshot.id));
        void queryClient.invalidateQueries({
          queryKey: trpc.leadgen.listRuns.queryKey({ limit: 12 }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });
      },
      onError(error) {
        toast.error('Could not start buyer search', {
          description: error.message,
        });
      },
    }),
  );

  if (isAuthLoading) {
    return <LeadgenSkeleton />;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  const run = liveRun ?? activeRunQuery.data ?? null;
  const isRunning = run?.status === 'QUEUED' || run?.status === 'RUNNING';
  const isRunLoading = Boolean(activeRunId) && activeRunQuery.isLoading && !run;
  const estimatedRunCredits = usageQuery.data
    ? getLeadgenRunCreditEstimate({
        creditCosts: usageQuery.data.creditCosts,
        reasoningEffort,
      })
    : undefined;
  const hasInsufficientRunCredits =
    usageQuery.data && estimatedRunCredits !== undefined
      ? estimatedRunCredits > usageQuery.data.remainingCredits
      : false;
  const canSubmit =
    isLikelyDomain(domain) &&
    !startRun.isPending &&
    !usageQuery.isLoading &&
    !hasInsufficientRunCredits;

  const handleSubmit = () => {
    const normalized = normalizeDomainInput(domain);
    if (!isLikelyDomain(normalized)) {
      toast.error('Enter a domain', {
        description: 'Use a domain you own or represent, like example.com.',
      });
      return;
    }

    setDomain(normalized);
    startRun.mutate({ domain: normalized, reasoningEffort });
  };

  return (
    <PageShell
      size="full"
      padding="none"
      shellClassName="px-5 py-6 lg:px-8"
      className="min-h-[calc(100vh-7rem)]"
    >
      <div className="grid min-h-[calc(100vh-8rem)] gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Find buyers for your domains
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Enter a domain and get buyer angles, public contacts, and
                  ready-to-send first drafts.
                </p>
              </div>
              <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-300">
                <UserRoundSearch className="size-5" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor={DOMAIN_INPUT_ID}
                  className="mb-1.5 block text-sm font-medium"
                >
                  Domain to sell
                </label>
                <Input
                  id={DOMAIN_INPUT_ID}
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && canSubmit) {
                      handleSubmit();
                    }
                  }}
                  placeholder="example.com"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium">Search depth</p>
                <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/40 p-1">
                  {reasoningOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReasoningEffort(option.value)}
                      className={cn(
                        'rounded-sm px-2 py-2 text-left transition-colors',
                        reasoningEffort === option.value
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="block text-[11px]">{option.helper}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {startRun.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Play />
                )}
                Find buyers
              </Button>

              <LeadgenCreditEstimate
                isLoading={usageQuery.isLoading}
                isError={usageQuery.isError}
                requestedCredits={estimatedRunCredits}
                remainingCredits={usageQuery.data?.remainingCredits}
                noun="buyer search"
              />
            </div>
          </section>

          <GenerationUsage />

          <PastRuns
            runs={runsQuery.data ?? []}
            activeRunId={activeRunId}
            isLoading={runsQuery.isLoading}
          />
        </aside>

        <main className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm backdrop-blur">
          <LeadgenWorkspacePanel
            isRunLoading={isRunLoading}
            isRunning={isRunning}
            run={run}
            onRunUpdated={setLiveRun}
          />
        </main>
      </div>
    </PageShell>
  );
}

function LeadgenWorkspacePanel({
  isRunLoading,
  isRunning,
  run,
  onRunUpdated,
}: {
  isRunLoading: boolean;
  isRunning: boolean;
  run: LeadgenSnapshot | null;
  onRunUpdated: (run: LeadgenSnapshot) => void;
}) {
  if (isRunLoading) {
    return <RunWorkspaceSkeleton />;
  }

  if (run) {
    return (
      <RunWorkspace
        run={run}
        isRunning={isRunning}
        onRunUpdated={onRunUpdated}
      />
    );
  }

  return <EmptyWorkspace />;
}

function RunWorkspace({
  run,
  isRunning,
  onRunUpdated,
}: {
  run: LeadgenSnapshot;
  isRunning: boolean;
  onRunUpdated: (run: LeadgenSnapshot) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const usageQuery = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
  });
  const [pendingOutreachLeadId, setPendingOutreachLeadId] = useState<
    string | null
  >(null);
  const [reviewOutreachLeadId, setReviewOutreachLeadId] = useState<
    string | null
  >(null);
  const buckets = useMemo(() => {
    const grouped: Record<'general' | 'substring', LeadgenLead[]> = {
      general: [],
      substring: [],
    };
    for (const lead of run.leads) {
      grouped[lead.bucket].push(lead);
    }
    return grouped;
  }, [run.leads]);

  const generateLeadOutreach = useMutation(
    trpc.leadgen.generateLeadOutreach.mutationOptions({
      onSuccess(snapshot, variables) {
        onRunUpdated(snapshot);
        queryClient.setQueryData(
          trpc.leadgen.getRun.queryKey({ runId: snapshot.id }),
          snapshot,
        );
        void queryClient.invalidateQueries({
          queryKey: trpc.leadgen.listRuns.queryKey({ limit: 12 }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });
        const updatedLead = snapshot.leads.find(
          (lead) => lead.id === variables.leadId,
        );
        if (!updatedLead || updatedLead.contacts.length === 0) {
          toast('No public contacts found');
        } else if (updatedLead.drafts.length === 0) {
          toast.success('Contacts saved', {
            action: {
              label: 'Review outreach',
              onClick: () => setReviewOutreachLeadId(updatedLead.id),
            },
          });
        } else {
          toast.success('Outreach prepared', {
            action: {
              label: 'Review outreach',
              onClick: () => setReviewOutreachLeadId(updatedLead.id),
            },
          });
        }
      },
      onError(error) {
        toast.error('Outreach prep failed', {
          description: error.message,
        });
      },
      onSettled() {
        setPendingOutreachLeadId(null);
      },
    }),
  );

  const estimatedOutreachCredits = usageQuery.data
    ? getLeadgenOutreachCreditEstimate({
        creditCosts: usageQuery.data.creditCosts,
        reasoningEffort: run.reasoningEffort,
      })
    : undefined;
  const hasInsufficientOutreachCredits =
    usageQuery.data && estimatedOutreachCredits !== undefined
      ? estimatedOutreachCredits > usageQuery.data.remainingCredits
      : false;

  const handleGenerateLeadOutreach = (leadId: string) => {
    if (pendingOutreachLeadId) return;
    if (
      usageQuery.data &&
      estimatedOutreachCredits !== undefined &&
      estimatedOutreachCredits > usageQuery.data.remainingCredits
    ) {
      toast.error('Not enough AI credits', {
        description: `Preparing outreach needs ${formatAiCredits(estimatedOutreachCredits)}.`,
      });
      return;
    }

    setPendingOutreachLeadId(leadId);
    generateLeadOutreach.mutate({ runId: run.id, leadId });
  };

  const headerSubtitle = getRunHeaderSubtitle(run);

  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col">
      <div className="relative overflow-hidden border-b border-border/70 p-5">
        {isRunning && <WorkingBackdrop />}
        <div className="relative z-10 flex min-h-[7rem] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {run.domain}
              </h2>
              <RunStatusBadge status={run.status} />
            </div>
            <p className="mt-2 min-h-10 max-w-2xl text-sm leading-5 text-muted-foreground line-clamp-2">
              {headerSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
            <Metric label="Leads" value={run.leadCount} />
            <Metric label="Contacts" value={run.contactCount} />
            <Metric label="Drafts" value={run.draftCount} />
          </div>
        </div>

        <div className="relative z-10 mt-4 h-1 overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn(
              'h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300',
              isRunning ? 'w-2/3 opacity-100' : 'w-full opacity-0',
            )}
          />
        </div>
      </div>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-auto p-5">
          {run.intentQueries.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Buyer angles
              </p>
              <div className="flex flex-wrap gap-2">
                {run.intentQueries.map((query) => (
                  <span
                    key={query}
                    className="rounded-md border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {query}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">
                Likely buyers ({buckets.general.length})
              </TabsTrigger>
              <TabsTrigger value="substring">
                Name matches ({buckets.substring.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-4">
              <LeadList
                leads={buckets.general}
                sourceDomain={run.domain}
                pendingOutreachLeadId={pendingOutreachLeadId}
                reviewOutreachLeadId={reviewOutreachLeadId}
                estimatedOutreachCredits={estimatedOutreachCredits}
                remainingCredits={usageQuery.data?.remainingCredits}
                isOutreachCreditLoading={usageQuery.isLoading}
                isOutreachCreditError={usageQuery.isError}
                isOutreachCreditBlocked={hasInsufficientOutreachCredits}
                onGenerateLeadOutreach={handleGenerateLeadOutreach}
                onReviewOutreachLead={setReviewOutreachLeadId}
              />
            </TabsContent>
            <TabsContent value="substring" className="mt-4">
              <LeadList
                leads={buckets.substring}
                sourceDomain={run.domain}
                pendingOutreachLeadId={pendingOutreachLeadId}
                reviewOutreachLeadId={reviewOutreachLeadId}
                estimatedOutreachCredits={estimatedOutreachCredits}
                remainingCredits={usageQuery.data?.remainingCredits}
                isOutreachCreditLoading={usageQuery.isLoading}
                isOutreachCreditError={usageQuery.isError}
                isOutreachCreditBlocked={hasInsufficientOutreachCredits}
                onGenerateLeadOutreach={handleGenerateLeadOutreach}
                onReviewOutreachLead={setReviewOutreachLeadId}
              />
            </TabsContent>
          </Tabs>
        </section>

        <aside className="min-h-0 border-t border-border/70 p-5 lg:border-l lg:border-t-0">
          <Timeline
            run={run}
            isRunning={isRunning}
            pendingOutreachLeadId={pendingOutreachLeadId}
          />
        </aside>
      </div>
    </div>
  );
}

function LeadList({
  leads,
  sourceDomain,
  pendingOutreachLeadId,
  reviewOutreachLeadId,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  onGenerateLeadOutreach,
  onReviewOutreachLead,
}: {
  leads: LeadgenLead[];
  sourceDomain: string;
  pendingOutreachLeadId: string | null;
  reviewOutreachLeadId: string | null;
  estimatedOutreachCredits?: number;
  remainingCredits?: number;
  isOutreachCreditLoading: boolean;
  isOutreachCreditError: boolean;
  isOutreachCreditBlocked: boolean;
  onGenerateLeadOutreach: (leadId: string) => void;
  onReviewOutreachLead: (leadId: string | null) => void;
}) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
        Buyer matches will appear here as they are found.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {leads.map((lead) => (
        <LeadCard
          key={`${lead.bucket}-${lead.businessDomain}`}
          lead={lead}
          sourceDomain={sourceDomain}
          isPreparingOutreach={pendingOutreachLeadId === lead.id}
          isReviewingOutreach={reviewOutreachLeadId === lead.id}
          estimatedOutreachCredits={estimatedOutreachCredits}
          remainingCredits={remainingCredits}
          isOutreachCreditLoading={isOutreachCreditLoading}
          isOutreachCreditError={isOutreachCreditError}
          isOutreachCreditBlocked={isOutreachCreditBlocked}
          onGenerateLeadOutreach={onGenerateLeadOutreach}
          onReviewOutreachChange={(open) =>
            onReviewOutreachLead(open ? lead.id : null)
          }
        />
      ))}
    </div>
  );
}

function LeadCard({
  lead,
  sourceDomain,
  isPreparingOutreach,
  isReviewingOutreach,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  onGenerateLeadOutreach,
  onReviewOutreachChange,
}: {
  lead: LeadgenLead;
  sourceDomain: string;
  isPreparingOutreach: boolean;
  isReviewingOutreach: boolean;
  estimatedOutreachCredits?: number;
  remainingCredits?: number;
  isOutreachCreditLoading: boolean;
  isOutreachCreditError: boolean;
  isOutreachCreditBlocked: boolean;
  onGenerateLeadOutreach: (leadId: string) => void;
  onReviewOutreachChange: (open: boolean) => void;
}) {
  const recipients = useMemo(() => getOutreachRecipients(lead), [lead]);
  const descriptionLines = getLeadDescription(lead);
  const hasEmailCta = recipients.length > 0 && lead.drafts.length > 0;
  const shouldPrepareOutreach =
    lead.contacts.length === 0 || lead.drafts.length < lead.contacts.length;
  const showOutreachPanel = hasEmailCta || shouldPrepareOutreach;

  return (
    <article className="rounded-lg border border-border/70 bg-background/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://${lead.businessDomain}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-lg font-semibold hover:text-primary"
            >
              {lead.businessDomain}
              <ExternalLink className="size-3.5" />
            </a>
            <Badge variant="secondary">{leadBucketLabels[lead.bucket]}</Badge>
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            {descriptionLines.map((line) => (
              <p key={line} className="text-sm leading-6 text-muted-foreground">
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TinyStat
            icon={Mail}
            label={`${lead.contacts.length} contacts`}
            tone="contacts"
          />
          <TinyStat
            icon={Sparkles}
            label={`${lead.drafts.length} drafts`}
            tone="drafts"
          />
        </div>
      </div>

      {showOutreachPanel && (
        <LeadOutreachPanel
          lead={lead}
          hasEmailCta={hasEmailCta}
          shouldPrepareOutreach={shouldPrepareOutreach}
          isPreparingOutreach={isPreparingOutreach}
          estimatedOutreachCredits={estimatedOutreachCredits}
          remainingCredits={remainingCredits}
          isOutreachCreditLoading={isOutreachCreditLoading}
          isOutreachCreditError={isOutreachCreditError}
          isOutreachCreditBlocked={isOutreachCreditBlocked}
          onGenerateLeadOutreach={onGenerateLeadOutreach}
          onOpenEmailDialog={() => onReviewOutreachChange(true)}
        />
      )}
      <LeadEmailDialog
        lead={lead}
        open={isReviewingOutreach}
        recipients={recipients}
        sourceDomain={sourceDomain}
        onOpenChange={onReviewOutreachChange}
      />
    </article>
  );
}

function LeadOutreachPanel({
  lead,
  hasEmailCta,
  shouldPrepareOutreach,
  isPreparingOutreach,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  onGenerateLeadOutreach,
  onOpenEmailDialog,
}: {
  lead: LeadgenLead;
  hasEmailCta: boolean;
  shouldPrepareOutreach: boolean;
  isPreparingOutreach: boolean;
  estimatedOutreachCredits?: number;
  remainingCredits?: number;
  isOutreachCreditLoading: boolean;
  isOutreachCreditError: boolean;
  isOutreachCreditBlocked: boolean;
  onGenerateLeadOutreach: (leadId: string) => void;
  onOpenEmailDialog: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
      {shouldPrepareOutreach ? (
        <LeadgenCreditEstimate
          isLoading={isOutreachCreditLoading}
          isError={isOutreachCreditError}
          requestedCredits={estimatedOutreachCredits}
          remainingCredits={remainingCredits}
          noun="outreach prep"
          className="sm:max-w-sm"
        />
      ) : (
        <span aria-hidden="true" />
      )}
      <LeadOutreachActions
        lead={lead}
        hasEmailCta={hasEmailCta}
        shouldPrepareOutreach={shouldPrepareOutreach}
        isPreparingOutreach={isPreparingOutreach}
        isOutreachCreditLoading={isOutreachCreditLoading}
        isOutreachCreditBlocked={isOutreachCreditBlocked}
        onGenerateLeadOutreach={onGenerateLeadOutreach}
        onOpenEmailDialog={onOpenEmailDialog}
      />
    </div>
  );
}

function LeadOutreachActions({
  lead,
  hasEmailCta,
  shouldPrepareOutreach,
  isPreparingOutreach,
  isOutreachCreditLoading,
  isOutreachCreditBlocked,
  onGenerateLeadOutreach,
  onOpenEmailDialog,
}: {
  lead: LeadgenLead;
  hasEmailCta: boolean;
  shouldPrepareOutreach: boolean;
  isPreparingOutreach: boolean;
  isOutreachCreditLoading: boolean;
  isOutreachCreditBlocked: boolean;
  onGenerateLeadOutreach: (leadId: string) => void;
  onOpenEmailDialog: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      {shouldPrepareOutreach && (
        <Button
          size="sm"
          variant={hasEmailCta ? 'outline' : 'default'}
          disabled={
            isPreparingOutreach ||
            isOutreachCreditLoading ||
            isOutreachCreditBlocked
          }
          onClick={() => onGenerateLeadOutreach(lead.id)}
          className="w-full sm:w-auto"
        >
          {isPreparingOutreach ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Sparkles data-icon="inline-start" />
          )}
          Prepare outreach
        </Button>
      )}
      {hasEmailCta && (
        <Button
          size="sm"
          onClick={onOpenEmailDialog}
          className="w-full sm:w-auto"
        >
          <Mail data-icon="inline-start" />
          Review outreach
        </Button>
      )}
    </div>
  );
}

function LeadEmailDialog({
  lead,
  open,
  recipients,
  sourceDomain,
  onOpenChange,
}: {
  lead: LeadgenLead;
  open: boolean;
  recipients: OutreachRecipient[];
  sourceDomain: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedEmail, setSelectedEmail] = useState(
    recipients[0]?.email ?? '',
  );

  useEffect(() => {
    if (!open) return;
    if (recipients.length === 0) {
      setSelectedEmail('');
      return;
    }
    const selectedEmailKey = normalizeEmailKey(selectedEmail);
    if (
      !recipients.some(
        (recipient) => normalizeEmailKey(recipient.email) === selectedEmailKey,
      )
    ) {
      setSelectedEmail(recipients[0]?.email ?? '');
    }
  }, [open, recipients, selectedEmail]);

  const selectedEmailKey = normalizeEmailKey(selectedEmail);
  const selectedRecipient =
    recipients.find(
      (recipient) => normalizeEmailKey(recipient.email) === selectedEmailKey,
    ) ??
    recipients[0] ??
    null;
  const selectedDraft = selectedRecipient
    ? getEmailDraftForRecipient({
        lead,
        recipient: selectedRecipient,
        sourceDomain,
      })
    : null;
  const mailtoHref =
    selectedRecipient && selectedDraft
      ? buildMailtoHref({
          to: selectedRecipient.email,
          subject: selectedDraft.subject,
          body: selectedDraft.fullEmail,
        })
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,860px)] w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Email {lead.businessDomain}</DialogTitle>
          <DialogDescription>
            Choose a recipient and open the draft in your email client.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 overflow-y-auto pr-1">
          {recipients.length > 0 && selectedRecipient && selectedDraft ? (
            <div className="flex min-w-0 flex-col gap-4">
              <RadioGroup
                aria-label="Recipients"
                value={selectedRecipient.email}
                onValueChange={setSelectedEmail}
                className="flex min-w-0 flex-col gap-2"
              >
                {recipients.map((recipient) => (
                  <label
                    key={recipient.email}
                    htmlFor={`leadgen-recipient-${lead.id}-${recipient.email}`}
                    className="flex min-w-0 cursor-pointer items-start gap-3 rounded-md border border-border/70 p-3 hover:bg-muted/30"
                  >
                    <RadioGroupItem
                      id={`leadgen-recipient-${lead.id}-${recipient.email}`}
                      value={recipient.email}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {recipient.name || recipient.email}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {recipient.title
                          ? `${recipient.title} / ${recipient.email}`
                          : recipient.email}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>

              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Subject
                  </p>
                  <p className="mt-1 break-words text-sm font-medium">
                    {selectedDraft.subject}
                  </p>
                </div>
                <Textarea
                  aria-label="Draft preview"
                  readOnly
                  value={selectedDraft.fullEmail}
                  wrap="soft"
                  className="min-h-44 max-w-full resize-none overflow-y-auto field-sizing-fixed text-sm leading-6"
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a lead with a saved email address to compose outreach.
            </p>
          )}
        </div>

        <DialogFooter>
          {selectedDraft && (
            <Button
              variant="outline"
              onClick={() => copyDraft(selectedDraft.fullEmail)}
            >
              <Copy data-icon="inline-start" />
              Copy draft
            </Button>
          )}
          {mailtoHref && (
            <Button onClick={() => openMailto(mailtoHref)}>
              <Mail data-icon="inline-start" />
              Open email
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type TimelinePhaseStatus = 'pending' | 'active' | 'complete' | 'error';
type TimelineSubtaskTone = 'name' | 'category' | 'contacts' | 'drafts';

type TimelineSubtask = {
  id: string;
  label: string;
  value: string;
  tone: TimelineSubtaskTone;
  icon: LucideIcon;
  status: TimelinePhaseStatus;
};

type TimelinePhase = {
  id: string;
  title: string;
  status: TimelinePhaseStatus;
  icon: LucideIcon;
  timestamp?: string;
  badge?: string;
  domain?: string;
  subtasks?: TimelineSubtask[];
};

function Timeline({
  run,
  isRunning,
  pendingOutreachLeadId,
}: {
  run: LeadgenSnapshot;
  isRunning: boolean;
  pendingOutreachLeadId: string | null;
}) {
  const pendingOutreachLead =
    run.leads.find((lead) => lead.id === pendingOutreachLeadId) ?? null;
  const phases = getCompactTimelinePhases({
    run,
    isRunning,
    pendingOutreachLead,
  });
  const activePhase = phases.findLast((phase) => phase.status === 'active');

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Updates
        </p>
        {activePhase && <WorkingStatus />}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col">
          {phases.map((phase, index) => (
            <TimelinePhaseRow
              key={phase.id}
              phase={phase}
              isLast={index === phases.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelinePhaseRow({
  phase,
  isLast,
}: {
  phase: TimelinePhase;
  isLast: boolean;
}) {
  const Icon = phase.icon;

  return (
    <div className="relative flex gap-2.5 pb-3 last:pb-0">
      {!isLast && (
        <span className="absolute left-[13px] top-7 bottom-0 w-px bg-border/60" />
      )}
      <div
        className={cn(
          'relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-background',
          getTimelinePhaseIconClassName(phase.status),
        )}
      >
        <Icon className="size-3.5" />
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 rounded-md border px-3 py-2.5',
          phase.status === 'active'
            ? 'border-cyan-400/25 bg-cyan-400/[0.06]'
            : 'border-border/60 bg-background/45',
          phase.status === 'pending' && 'opacity-70',
          phase.status === 'error' && 'border-destructive/25 bg-destructive/5',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5">
              {phase.title}
            </p>
            <span className="sr-only">
              Status: {getTimelineStatusLabel(phase.status)}
            </span>
            {phase.domain && (
              <span className="mt-1 inline-flex max-w-full rounded-sm border border-border/60 bg-muted/35 px-1.5 py-0.5 text-[11px] leading-4 text-muted-foreground">
                <span className="truncate">{phase.domain}</span>
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {phase.badge && (
              <span className="rounded-sm border border-border/60 bg-muted/35 px-1.5 py-0.5 text-[11px] font-medium leading-4 tabular-nums text-muted-foreground">
                {phase.badge}
              </span>
            )}
            {phase.timestamp && (
              <span className="text-[10px] leading-4 text-muted-foreground/80">
                {phase.timestamp}
              </span>
            )}
          </div>
        </div>

        {phase.subtasks && phase.subtasks.length > 0 && (
          <div className="mt-2 grid gap-1.5">
            {phase.subtasks.map((subtask) => (
              <TimelineSubtaskCard key={subtask.id} subtask={subtask} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineSubtaskCard({ subtask }: { subtask: TimelineSubtask }) {
  const Icon = subtask.icon;

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2 rounded-md border px-2 py-1.5',
        getTimelineSubtaskClassName(subtask.tone, subtask.status),
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-background/50">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] leading-4 text-muted-foreground">
          {subtask.label}
        </p>
        <p className="truncate text-xs font-semibold leading-4 tabular-nums text-foreground">
          {subtask.value}
        </p>
      </div>
      <span className="sr-only">
        Status: {getTimelineStatusLabel(subtask.status)}
      </span>
      <TimelineStatusMark status={subtask.status} />
    </div>
  );
}

function TimelineStatusMark({ status }: { status: TimelinePhaseStatus }) {
  if (status === 'active') {
    return <ActivityDots />;
  }
  if (status === 'complete') {
    return <CheckCircle2 className="size-3.5 shrink-0 text-emerald-300" />;
  }
  if (status === 'error') {
    return <XCircle className="size-3.5 shrink-0 text-destructive" />;
  }
  return <Clock3 className="size-3.5 shrink-0 text-muted-foreground/70" />;
}

function getTimelineStatusLabel(status: TimelinePhaseStatus) {
  switch (status) {
    case 'active':
      return 'In progress';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
    case 'pending':
      return 'Pending';
  }
}

function ActivityDots() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <motion.span
          key={dot}
          className="size-1 rounded-full bg-cyan-200"
          animate={
            prefersReducedMotion
              ? undefined
              : { opacity: [0.35, 1, 0.35], y: [0, -1, 0] }
          }
          transition={
            prefersReducedMotion
              ? undefined
              : {
                  duration: 0.9,
                  ease: 'easeInOut',
                  repeat: Number.POSITIVE_INFINITY,
                  delay: dot * 0.12,
                }
          }
        />
      ))}
    </span>
  );
}

function PastRuns({
  runs,
  activeRunId,
  isLoading,
}: {
  runs: LeadgenRunSummary[];
  activeRunId: string | null;
  isLoading: boolean;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recent searches</h2>
        <Clock3 className="size-4 text-muted-foreground" />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {skeletonRows.map((row) => (
            <div
              key={`past-run-${row}`}
              className="rounded-md border border-border/70 bg-background/40 p-3"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-3 w-20" />
            </div>
          ))}
        </div>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your buyer searches will stay here.
        </p>
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={getLeadgenRunHref(run.id)}
              className={cn(
                'block rounded-md border p-3 transition-colors hover:bg-muted/40',
                run.id === activeRunId
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-border/70 bg-background/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {run.domain}
                </span>
                <RunStatusIcon status={run.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {run.leadCount} leads · {run.draftCount} drafts
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyWorkspace() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
          <Search className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Start with the domain, not a spreadsheet.
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Namefi Leadgen AI will infer buyer angles, search for company
          websites, find public emails for the first leads, and draft outreach
          as results land.
        </p>
      </div>
    </div>
  );
}

function LeadgenSkeleton() {
  return (
    <PageShell size="full" padding="none" shellClassName="px-5 py-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-8rem)] gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4">
          <section className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
              <Skeleton className="size-9 rounded-md" />
            </div>
            <div className="space-y-3">
              <div>
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div>
                <Skeleton className="mb-2 h-4 w-24" />
                <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/30 p-1">
                  {skeletonRows.map((row) => (
                    <Skeleton
                      key={`depth-${row}`}
                      className="h-12 rounded-sm"
                    />
                  ))}
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </section>
          <section className="rounded-lg border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <div className="space-y-2">
              {skeletonRows.map((row) => (
                <div
                  key={`history-${row}`}
                  className="rounded-md border border-border/70 bg-background/40 p-3"
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </div>
              ))}
            </div>
          </section>
        </aside>
        <main className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm backdrop-blur">
          <RunWorkspaceSkeleton />
        </main>
      </div>
    </PageShell>
  );
}

function formatAiCredits(credits: number) {
  return `${credits} AI ${credits === 1 ? 'credit' : 'credits'}`;
}

function LeadgenCreditEstimate({
  isLoading,
  isError,
  requestedCredits,
  remainingCredits,
  noun,
  className,
}: {
  isLoading: boolean;
  isError: boolean;
  requestedCredits?: number;
  remainingCredits?: number;
  noun: string;
  className?: string;
}) {
  if (isLoading) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        Checking AI credit balance...
      </p>
    );
  }

  if (
    isError ||
    requestedCredits === undefined ||
    remainingCredits === undefined
  ) {
    return (
      <p className={cn('text-xs text-muted-foreground', className)}>
        We will check your AI credit balance before starting.
      </p>
    );
  }

  const remainingAfterGeneration = remainingCredits - requestedCredits;
  if (remainingAfterGeneration < 0) {
    return (
      <p className={cn('text-xs text-destructive', className)}>
        This {noun} is estimated at {formatAiCredits(requestedCredits)}. You
        have {formatAiCredits(remainingCredits)} left this month.
      </p>
    );
  }

  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Estimated {noun} cost: {formatAiCredits(requestedCredits)}. You will have{' '}
      {formatAiCredits(remainingAfterGeneration)} left this month.
    </p>
  );
}

function RunWorkspaceSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col">
      <div className="relative overflow-hidden border-b border-border/70 p-5">
        <WorkingBackdrop />
        <div className="relative z-10 flex min-h-[7rem] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-5 w-20 rounded-4xl" />
            </div>
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
            {skeletonRows.map((row) => (
              <div
                key={`metric-${row}`}
                className="min-h-[72px] rounded-md border border-border/70 bg-background/60 p-3"
              >
                <Skeleton className="h-3 w-14" />
                <Skeleton className="mt-3 h-6 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 p-5">
          <div className="mb-5">
            <Skeleton className="mb-2 h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              {skeletonRows.map((row) => (
                <Skeleton
                  key={`intent-${row}`}
                  className="h-7 w-28 rounded-md"
                />
              ))}
            </div>
          </div>
          <div className="mb-4 flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="grid gap-3">
            {skeletonRows.map((row) => (
              <div
                key={`lead-${row}`}
                className="rounded-lg border border-border/70 bg-background/60 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16 rounded-4xl" />
                    </div>
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-4/5" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-4xl" />
                    <Skeleton className="h-5 w-20 rounded-4xl" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end border-t border-border/70 pt-3">
                  <Skeleton className="h-8 w-32 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="border-t border-border/70 p-5 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            {skeletonRows.map((row) => (
              <div key={`timeline-${row}`} className="flex gap-3">
                <Skeleton className="mt-0.5 size-7 rounded-md" />
                <div className="flex-1 rounded-md border border-border/50 bg-background/45 px-3 py-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function WorkingBackdrop() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(103, 232, 249, 0.18) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
        animate={
          prefersReducedMotion
            ? undefined
            : { backgroundPosition: ['0px 0px', '18px 18px'] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 1.8,
                ease: 'linear',
                repeat: Number.POSITIVE_INFINITY,
              }
        }
      />
      {!prefersReducedMotion && (
        <motion.div
          className="absolute -inset-y-16 left-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-cyan-200/15 to-transparent blur-xl"
          animate={{ x: ['-150%', '360%'] }}
          transition={{
            duration: 2.2,
            ease: [0.22, 1, 0.36, 1],
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0.35,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-card/85 via-card/60 to-card/85" />
    </div>
  );
}

function WorkingStatus({ label = 'Working' }: { label?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className="inline-flex h-5 max-w-40 items-center gap-1.5 rounded-4xl border border-cyan-400/20 bg-cyan-400/10 px-2 text-[11px] font-medium text-cyan-200">
      <motion.span
        className="size-1.5 rounded-full bg-cyan-200"
        animate={
          prefersReducedMotion ? undefined : { opacity: [0.35, 1, 0.35] }
        }
        transition={
          prefersReducedMotion
            ? undefined
            : {
                duration: 1.2,
                ease: 'easeInOut',
                repeat: Number.POSITIVE_INFINITY,
              }
        }
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

function getCompactTimelinePhases({
  run,
  isRunning,
  pendingOutreachLead,
}: {
  run: LeadgenSnapshot;
  isRunning: boolean;
  pendingOutreachLead: LeadgenLead | null;
}): TimelinePhase[] {
  const orderedEvents = getOrderedLeadgenEvents(run.events);
  const terminal = isTerminalLeadgenStatus(run.status);
  const intentEvent =
    findLastLeadgenEvent(
      orderedEvents,
      (event) => event.eventType === 'intent-queries',
    ) ??
    findLastLeadgenEvent(orderedEvents, (event) => event.stage === 'intent');
  const searchEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.stage === 'search' || event.eventType === 'lead',
  );
  const completeEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.stage === 'complete',
  );
  const manualOutreach = getManualOutreachSummary(orderedEvents);
  const leadSearch = getLeadSearchTimelineCounts(run);
  const queryCount = Math.max(
    run.intentQueries.length,
    getIntentQueryCount(orderedEvents),
  );
  const searchStarted = Boolean(searchEvent);
  const initialOutreach = getInitialOutreachTimelineState({
    run,
    orderedEvents,
    manualOutreach,
    terminal,
    isRunning,
  });
  const searchStatus = getPhaseStatus({
    complete: terminal && (searchStarted || queryCount > 0),
    active: isRunning && (searchStarted || queryCount > 0),
  });
  const intentStatus = getPhaseStatus({
    complete: queryCount > 0 || searchStarted,
    active: isRunning,
  });
  const completion = getCompletionTimelineState(run);
  const phases: TimelinePhase[] = [
    {
      id: 'buyer-angles',
      title: 'Buyer angles',
      status: intentStatus,
      icon: Target,
      timestamp: getTimelineTimestamp(intentEvent, intentStatus),
      badge: queryCount > 0 ? `${queryCount} angles` : undefined,
    },
    {
      id: 'searching-buyers',
      title: 'Searching buyers',
      status: searchStatus,
      icon: Search,
      timestamp: getTimelineTimestamp(searchEvent, searchStatus),
      subtasks: [
        {
          id: 'name-matches',
          label: 'Name matches',
          value: `${leadSearch.nameLeadCount} found`,
          tone: 'name',
          icon: Target,
          status: getSubtaskStatus(searchStatus, leadSearch.nameLeadCount),
        },
        {
          id: 'category-matches',
          label: 'Category matches',
          value: `${leadSearch.categoryLeadCount} found`,
          tone: 'category',
          icon: Building2,
          status: getSubtaskStatus(searchStatus, leadSearch.categoryLeadCount),
        },
      ],
    },
    {
      id: 'initial-outreach',
      title: 'Initial outreach',
      status: initialOutreach.status,
      icon: Mail,
      timestamp: getTimelineTimestamp(
        initialOutreach.event,
        initialOutreach.status,
      ),
      subtasks: [
        {
          id: 'initial-contacts',
          label: 'Contacts',
          value: `${initialOutreach.contactCount} found`,
          tone: 'contacts',
          icon: Mail,
          status: getSubtaskStatus(
            initialOutreach.status,
            initialOutreach.contactCount,
          ),
        },
        {
          id: 'initial-drafts',
          label: 'Drafts',
          value: `${initialOutreach.draftCount} ready`,
          tone: 'drafts',
          icon: FileText,
          status: getSubtaskStatus(
            initialOutreach.status,
            initialOutreach.draftCount,
          ),
        },
      ],
    },
    {
      id: 'search-complete',
      title: completion.title,
      status: completion.status,
      icon: CheckCircle2,
      timestamp: completeEvent
        ? formatTime(completeEvent.createdAt)
        : undefined,
      badge: completion.badge,
    },
  ];

  const additionalOutreachPhase = getAdditionalOutreachPhase({
    manualOutreach,
    pendingOutreachLead,
  });
  if (additionalOutreachPhase) {
    phases.push(additionalOutreachPhase);
  }

  return phases;
}

function getLeadSearchTimelineCounts(run: LeadgenSnapshot) {
  return {
    nameLeadCount: run.leads.filter((lead) => lead.bucket === 'substring')
      .length,
    categoryLeadCount: run.leads.filter((lead) => lead.bucket === 'general')
      .length,
  };
}

function getInitialOutreachTimelineState({
  run,
  orderedEvents,
  manualOutreach,
  terminal,
  isRunning,
}: {
  run: LeadgenSnapshot;
  orderedEvents: LeadgenSnapshot['events'];
  manualOutreach: ReturnType<typeof getManualOutreachSummary>;
  terminal: boolean;
  isRunning: boolean;
}) {
  const contactEventCount = countUniqueLeadgenEvents(
    orderedEvents,
    isInitialContactEvent,
    (event) =>
      getPayloadString(event.payload, 'contactId') ??
      getPayloadString(event.payload, 'email') ??
      event.id,
  );
  const draftEventCount = countUniqueLeadgenEvents(
    orderedEvents,
    isInitialDraftEvent,
    (event) =>
      getPayloadString(event.payload, 'draftId') ??
      getPayloadString(event.payload, 'contactEmail') ??
      event.id,
  );
  const contactCount = Math.max(
    contactEventCount,
    Math.max(0, run.contactCount - manualOutreach.contactCount),
  );
  const draftCount = Math.max(
    draftEventCount,
    Math.max(0, run.draftCount - manualOutreach.draftCount),
  );
  const event = findLastLeadgenEvent(
    orderedEvents,
    (candidate) =>
      (candidate.stage === 'contacts' || candidate.stage === 'drafts') &&
      !isManualOutreachEvent(candidate),
  );
  const status = getPhaseStatus({
    complete: terminal && Boolean(event),
    active: isRunning && Boolean(event),
  });

  return { contactCount, draftCount, event, status };
}

function getCompletionTimelineState(run: LeadgenSnapshot) {
  if (run.status === 'FAILED') {
    return {
      title: 'Search failed',
      status: 'error' as const,
      badge: undefined,
    };
  }
  if (run.status === 'CANCELED') {
    return {
      title: 'Search canceled',
      status: 'error' as const,
      badge: undefined,
    };
  }

  return {
    title: 'Search complete',
    status:
      run.status === 'SUCCEEDED' ? ('complete' as const) : ('pending' as const),
    badge: run.status === 'SUCCEEDED' ? `${run.leadCount} leads` : undefined,
  };
}

function getAdditionalOutreachPhase({
  manualOutreach,
  pendingOutreachLead,
}: {
  manualOutreach: ReturnType<typeof getManualOutreachSummary>;
  pendingOutreachLead: LeadgenLead | null;
}): TimelinePhase | null {
  if (!manualOutreach.hasEvents && !pendingOutreachLead) return null;

  const active = Boolean(pendingOutreachLead);
  const cardDomain =
    pendingOutreachLead?.businessDomain ?? manualOutreach.domain;
  const domainSummary = cardDomain
    ? manualOutreach.domainSummaries.get(cardDomain)
    : null;
  const lastEventWasError =
    domainSummary?.lastEventWasError ?? manualOutreach.lastEventWasError;
  const status = getAdditionalOutreachStatus(active, lastEventWasError);
  const contactCount = Math.max(
    domainSummary?.contactCount ?? 0,
    pendingOutreachLead?.contacts.length ?? 0,
  );
  const draftCount = Math.max(
    domainSummary?.draftCount ?? 0,
    pendingOutreachLead?.drafts.length ?? 0,
  );
  const lastEvent = domainSummary?.lastEvent ?? manualOutreach.lastEvent;

  return {
    id: 'additional-outreach',
    title: 'Additional outreach',
    status,
    icon: Sparkles,
    timestamp: getAdditionalOutreachTimestamp(active, lastEvent),
    domain: cardDomain,
    subtasks: [
      {
        id: 'additional-contacts',
        label: 'Contacts',
        value: `${contactCount} found`,
        tone: 'contacts',
        icon: Mail,
        status,
      },
      {
        id: 'additional-drafts',
        label: 'Drafts',
        value: `${draftCount} ready`,
        tone: 'drafts',
        icon: FileText,
        status,
      },
    ],
  };
}

function getAdditionalOutreachStatus(
  active: boolean,
  lastEventWasError: boolean,
): TimelinePhaseStatus {
  if (active) return 'active';
  return lastEventWasError ? 'error' : 'complete';
}

function getAdditionalOutreachTimestamp(
  active: boolean,
  lastEvent: LeadgenEvent | null,
) {
  if (active) return 'now';
  return lastEvent ? formatTime(lastEvent.createdAt) : undefined;
}

function getManualOutreachSummary(events: LeadgenSnapshot['events']) {
  const manualEvents = events.filter(isManualOutreachEvent);
  const counts = getManualOutreachCounts(manualEvents);
  const eventsByDomain = new Map<string, LeadgenEvent[]>();
  for (const event of manualEvents) {
    const domain = getManualOutreachEventDomain(event);
    if (!domain) continue;

    const domainEvents = eventsByDomain.get(domain);
    if (domainEvents) {
      domainEvents.push(event);
    } else {
      eventsByDomain.set(domain, [event]);
    }
  }
  const domainSummaries = new Map<
    string,
    {
      contactCount: number;
      draftCount: number;
      lastEvent: LeadgenEvent | null;
      lastEventWasError: boolean;
    }
  >();
  for (const [domain, domainEvents] of eventsByDomain) {
    const domainCounts = getManualOutreachCounts(domainEvents);
    const domainLastEvent = domainEvents.at(-1) ?? null;
    domainSummaries.set(domain, {
      ...domainCounts,
      lastEvent: domainLastEvent,
      lastEventWasError: domainLastEvent?.eventType === 'error',
    });
  }
  const lastEvent = manualEvents.at(-1) ?? null;
  const latestDomainEvent = findLastLeadgenEvent(manualEvents, (event) =>
    Boolean(getManualOutreachEventDomain(event)),
  );

  return {
    hasEvents: manualEvents.length > 0,
    lastEvent,
    lastEventWasError: lastEvent?.eventType === 'error',
    domain: latestDomainEvent
      ? (getManualOutreachEventDomain(latestDomainEvent) ?? undefined)
      : undefined,
    contactCount: counts.contactCount,
    draftCount: counts.draftCount,
    domainSummaries,
  };
}

function getManualOutreachCounts(events: LeadgenEvent[]) {
  const latestManualStatus = findLastLeadgenEvent(
    events,
    (event) => event.eventType === 'status',
  );
  const contactEventCount = countUniqueLeadgenEvents(
    events,
    (event) =>
      event.eventType === 'contact' &&
      (hasPayloadString(event.payload, 'contactId') ||
        hasPayloadString(event.payload, 'email')),
    (event) =>
      getPayloadString(event.payload, 'contactId') ??
      getPayloadString(event.payload, 'email') ??
      event.id,
  );
  const draftEventCount = countUniqueLeadgenEvents(
    events,
    (event) =>
      event.eventType === 'draft' &&
      (hasPayloadString(event.payload, 'draftId') ||
        hasPayloadString(event.payload, 'contactEmail')),
    (event) =>
      getPayloadString(event.payload, 'draftId') ??
      getPayloadString(event.payload, 'contactEmail') ??
      event.id,
  );
  const leadContactCount = latestManualStatus
    ? getPayloadNumber(latestManualStatus.payload, 'leadContactCount')
    : 0;
  const leadDraftCount = latestManualStatus
    ? getPayloadNumber(latestManualStatus.payload, 'leadDraftCount')
    : 0;

  return {
    contactCount: Math.max(contactEventCount, leadContactCount),
    draftCount: Math.max(draftEventCount, leadDraftCount),
  };
}

function getManualOutreachEventDomain(event: LeadgenEvent) {
  return getPayloadString(event.payload, 'businessDomain');
}

function getSubtaskStatus(
  phaseStatus: TimelinePhaseStatus,
  count: number,
): TimelinePhaseStatus {
  if (phaseStatus === 'active') return 'active';
  if (phaseStatus === 'error') return 'error';
  if (phaseStatus === 'complete' || count > 0) return 'complete';
  return 'pending';
}

function getPhaseStatus({
  complete,
  active,
}: {
  complete: boolean;
  active: boolean;
}): TimelinePhaseStatus {
  if (complete) return 'complete';
  if (active) return 'active';
  return 'pending';
}

function getTimelineTimestamp(
  event: LeadgenEvent | null | undefined,
  status: TimelinePhaseStatus,
) {
  if (status === 'active') return 'now';
  return event ? formatTime(event.createdAt) : undefined;
}

function getTimelinePhaseIconClassName(status: TimelinePhaseStatus) {
  if (status === 'active') {
    return 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200';
  }
  if (status === 'complete') {
    return 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200';
  }
  if (status === 'error') {
    return 'border-destructive/30 bg-destructive/10 text-destructive';
  }
  return 'border-border/70 bg-muted/35 text-muted-foreground';
}

function getTimelineSubtaskClassName(
  tone: TimelineSubtaskTone,
  status: TimelinePhaseStatus,
) {
  if (status === 'pending') {
    return 'border-border/50 bg-muted/20 text-muted-foreground';
  }
  if (status === 'error') {
    return 'border-destructive/20 bg-destructive/5 text-destructive';
  }

  switch (tone) {
    case 'name':
      return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
    case 'category':
      return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
    case 'contacts':
      return 'border-sky-300/20 bg-sky-400/10 text-sky-100';
    case 'drafts':
      return 'border-amber-300/20 bg-amber-300/10 text-amber-100';
  }
}

function getOrderedLeadgenEvents(events: LeadgenSnapshot['events']) {
  return events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      const dateDelta =
        new Date(left.event.createdAt).getTime() -
        new Date(right.event.createdAt).getTime();
      return dateDelta || left.index - right.index;
    })
    .map(({ event }) => event);
}

function findLastLeadgenEvent(
  events: LeadgenSnapshot['events'],
  predicate: (event: LeadgenEvent) => boolean,
) {
  return events.findLast(predicate) ?? null;
}

function countUniqueLeadgenEvents(
  events: LeadgenSnapshot['events'],
  predicate: (event: LeadgenEvent) => boolean,
  getKey: (event: LeadgenEvent) => string,
) {
  const keys = new Set<string>();
  for (const event of events) {
    if (predicate(event)) keys.add(getKey(event));
  }
  return keys.size;
}

function getIntentQueryCount(events: LeadgenSnapshot['events']) {
  const intentEvent = findLastLeadgenEvent(
    events,
    (event) => event.eventType === 'intent-queries',
  );
  return intentEvent
    ? getPayloadArray(intentEvent.payload, 'queries').length
    : 0;
}

function isManualOutreachEvent(event: LeadgenEvent) {
  if (getPayloadString(event.payload, 'trigger') === 'manual') return true;

  return (
    event.eventType === 'status' &&
    event.stage === 'contacts' &&
    hasPayloadString(event.payload, 'leadId') &&
    hasPayloadString(event.payload, 'businessDomain')
  );
}

function isInitialContactEvent(event: LeadgenEvent) {
  return (
    event.eventType === 'contact' &&
    !isManualOutreachEvent(event) &&
    (hasPayloadString(event.payload, 'contactId') ||
      hasPayloadString(event.payload, 'email'))
  );
}

function isInitialDraftEvent(event: LeadgenEvent) {
  return (
    event.eventType === 'draft' &&
    !isManualOutreachEvent(event) &&
    (hasPayloadString(event.payload, 'draftId') ||
      hasPayloadString(event.payload, 'contactEmail'))
  );
}

function isTerminalLeadgenStatus(status: LeadgenSnapshot['status']) {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
}

function getRunHeaderSubtitle(run: LeadgenSnapshot) {
  const latestEvent = getTimelineEvents(run.events).at(-1);
  if (latestEvent) return latestEvent.message;
  if (run.status === 'SUCCEEDED' && run.leadCount > 0) {
    return (
      run.summary ??
      `Found ${run.leadCount} leads, ${run.contactCount} contacts, and ${run.draftCount} drafts.`
    );
  }

  switch (run.status) {
    case 'SUCCEEDED':
      return 'Buyer search complete.';
    case 'FAILED':
      return 'Buyer search failed. Any saved leads remain available below.';
    case 'CANCELED':
      return 'Buyer search canceled. Any saved leads remain available below.';
    case 'QUEUED':
    case 'RUNNING':
      return 'Namefi Leadgen AI is researching buyer angles, contacts, and outreach drafts.';
  }
}

function getTimelineEvents(events: LeadgenSnapshot['events']) {
  const visibleEvents: DisplayableLeadgenEvent[] = [];
  const seenMessages = new Set<string>();
  const orderedEvents = events
    .map((event, index) => ({ event, index }))
    .sort((left, right) => {
      const dateDelta =
        new Date(left.event.createdAt).getTime() -
        new Date(right.event.createdAt).getTime();
      return dateDelta || left.index - right.index;
    });

  for (const { event } of orderedEvents) {
    if (!isDisplayableLeadgenEvent(event)) continue;

    const dedupeKey = `${event.eventType}:${event.message}`;
    if (seenMessages.has(dedupeKey)) continue;

    seenMessages.add(dedupeKey);
    visibleEvents.push(event);
  }

  return visibleEvents;
}

function isDisplayableLeadgenEvent(
  event: LeadgenEvent,
): event is DisplayableLeadgenEvent {
  const message = event.message?.trim();
  if (
    !message ||
    event.transient ||
    event.eventType === 'error' ||
    negativeTimelineMessageRe.test(message)
  ) {
    return false;
  }

  switch (event.eventType) {
    case 'status':
      return isDisplayableStatusEvent(event);
    case 'intent-queries':
      return getPayloadArray(event.payload, 'queries').length > 0;
    case 'lead':
      return (
        hasPayloadString(event.payload, 'leadId') ||
        hasPayloadString(event.payload, 'businessDomain')
      );
    case 'contact':
      return (
        hasPayloadString(event.payload, 'contactId') ||
        hasPayloadString(event.payload, 'email')
      );
    case 'draft':
      return (
        hasPayloadString(event.payload, 'draftId') ||
        hasPayloadString(event.payload, 'contactEmail')
      );
    case 'error':
      return true;
    default:
      return false;
  }
}

function isDisplayableStatusEvent(event: LeadgenEvent) {
  if (event.stage === 'complete') {
    return getPayloadNumber(event.payload, 'leadCount') > 0;
  }

  return (
    event.stage === 'intent' ||
    event.stage === 'search' ||
    event.stage === 'contacts'
  );
}

function getPayloadRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  return payload as Record<string, unknown>;
}

function getPayloadArray(payload: unknown, key: string) {
  const value = getPayloadRecord(payload)[key];
  return Array.isArray(value) ? value : [];
}

function getPayloadNumber(payload: unknown, key: string) {
  const value = getPayloadRecord(payload)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getPayloadString(payload: unknown, key: string) {
  const value = getPayloadRecord(payload)[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function hasPayloadString(payload: unknown, key: string) {
  return Boolean(getPayloadString(payload, key));
}

function getLeadDescription(lead: LeadgenLead) {
  const lines = [lead.rationale.trim()];
  const content = lead.content.trim();

  if (content && !isDuplicateLeadText(lines[0], content)) {
    lines.push(content);
  }

  return lines;
}

function isDuplicateLeadText(primary: string, secondary: string) {
  const normalizedPrimary = normalizeComparableText(primary);
  const normalizedSecondary = normalizeComparableText(secondary);

  if (!normalizedPrimary || !normalizedSecondary) return false;
  return (
    normalizedPrimary === normalizedSecondary ||
    normalizedPrimary.includes(normalizedSecondary) ||
    normalizedSecondary.includes(normalizedPrimary)
  );
}

function normalizeComparableText(value: string) {
  return value.toLowerCase().replace(WHITESPACE_RE, ' ').trim();
}

function normalizeEmailKey(email: string) {
  return email.trim().toLowerCase();
}

function getOutreachRecipients(lead: LeadgenLead) {
  const recipients = new Map<string, OutreachRecipient>();

  for (const contact of lead.contacts) {
    recipients.set(
      normalizeEmailKey(contact.email),
      mapContactToRecipient(contact),
    );
  }

  for (const draft of lead.drafts) {
    const emailKey = normalizeEmailKey(draft.contactEmail);
    if (!recipients.has(emailKey)) {
      recipients.set(emailKey, {
        email: draft.contactEmail.trim(),
        name: null,
        title: null,
        context: null,
        sourceUrl: null,
      });
    }
  }

  return [...recipients.values()];
}

function mapContactToRecipient(contact: LeadgenContact): OutreachRecipient {
  return {
    email: contact.email.trim(),
    name: contact.name,
    title: contact.title,
    context: contact.context,
    sourceUrl: contact.sourceUrl,
  };
}

function getEmailDraftForRecipient({
  lead,
  recipient,
  sourceDomain,
}: {
  lead: LeadgenLead;
  recipient: OutreachRecipient;
  sourceDomain: string;
}): EmailDraftContent {
  const recipientEmailKey = normalizeEmailKey(recipient.email);
  const draft = lead.drafts.find(
    (candidate) =>
      normalizeEmailKey(candidate.contactEmail) === recipientEmailKey,
  );

  return draft ?? buildFallbackEmailDraft({ lead, recipient, sourceDomain });
}

function buildFallbackEmailDraft({
  lead,
  recipient,
  sourceDomain,
}: {
  lead: LeadgenLead;
  recipient: OutreachRecipient;
  sourceDomain: string;
}): EmailDraftContent {
  const firstName = getFirstName(recipient.name);
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const evidence = lead.content.trim();
  const body = [
    greeting,
    '',
    `I'm reaching out because ${lead.businessDomain} looks aligned with ${sourceDomain}. ${lead.rationale.trim()}`,
    evidence && !isDuplicateLeadText(lead.rationale, evidence)
      ? `I also noticed: ${evidence}`
      : null,
    '',
    'Would you be open to a quick call to discuss acquiring this domain?',
    '',
    'Best,',
    'Domain Acquisition Team',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    subject: `Acquiring ${sourceDomain}`,
    fullEmail: body,
  };
}

function getFirstName(name: string | null) {
  return name?.trim().split(WHITESPACE_RE)[0] ?? '';
}

function openMailto(href: string) {
  window.location.href = href;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-h-[72px] rounded-md border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        aria-live="polite"
        className="mt-1 text-2xl font-semibold tabular-nums"
      >
        {value}
      </p>
    </div>
  );
}

function TinyStat({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: 'contacts' | 'drafts';
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'border px-2 font-medium',
        tone === 'contacts'
          ? 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100'
          : 'border-amber-300/35 bg-amber-300/10 text-amber-100',
      )}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  );
}

function RunStatusBadge({ status }: { status: LeadgenSnapshot['status'] }) {
  const isDone = status === 'SUCCEEDED';
  const isFailed = status === 'FAILED' || status === 'CANCELED';
  return (
    <Badge
      variant={isFailed ? 'destructive' : isDone ? 'secondary' : 'outline'}
      className={cn(!isFailed && !isDone && 'border-cyan-400/50 text-cyan-200')}
    >
      {leadgenStatusLabels[status]}
    </Badge>
  );
}

function RunStatusIcon({ status }: { status: LeadgenRunSummary['status'] }) {
  if (status === 'SUCCEEDED') {
    return <CheckCircle2 className="size-4 text-emerald-300" />;
  }
  if (status === 'FAILED' || status === 'CANCELED') {
    return <XCircle className="size-4 text-destructive" />;
  }
  return <ArrowUpRight className="size-4 text-cyan-300" />;
}

function isLikelyDomain(value: string) {
  const normalized = normalizeDomainInput(value);
  return DOMAIN_LIKE_RE.test(normalized);
}

function normalizeDomainInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(PROTOCOL_RE, '')
    .split('/')[0]
    .replace(TRAILING_DOT_RE, '');
}

function formatTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function copyDraft(value: string) {
  if (!navigator.clipboard) {
    toast.error('Clipboard unavailable');
    return;
  }
  void navigator.clipboard.writeText(value).then(() => {
    toast.success('Draft copied');
  });
}
