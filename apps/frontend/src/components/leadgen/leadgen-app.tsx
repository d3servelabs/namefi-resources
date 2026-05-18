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
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
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
  Download,
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
import {
  buildLeadgenCrmCsv,
  isLeadgenCrmCsvExportAvailable,
} from './leadgen-export';
import { buildMailtoHref } from './leadgen-mailto';
import {
  buildLeadPresentationModel,
  type LeadPresentation,
  type LeadPresentationModel,
} from './leadgen-presentation';

type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
type LeadgenRunSummary = AppRouterOutput['leadgen']['listRuns'][number];
type UserDomain = AppRouterOutput['users']['getCurrentUserDomains'][number];
type LeadgenStartSuggestion = {
  domain: string;
  reason: 'parked' | 'unconfigured' | 'active' | 'owned';
  hasPreviousRun: boolean;
};
type LeadgenLead = LeadgenSnapshot['leads'][number];
type LeadgenEvent = LeadgenSnapshot['events'][number];
type DisplayableLeadgenEvent = LeadgenEvent & { message: string };
type LeadgenContact = LeadgenLead['contacts'][number];
type UserGenerationUsage = AppRouterOutput['ai']['getUserGenerationUsage'];
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
const getLeadgenRunHref = (runId: string) => `/outbound/${runId}` as Route;
const leadgenStatusLabels = {
  QUEUED: 'Queued',
  RUNNING: 'Searching',
  SUCCEEDED: 'Success',
  FAILED: 'Failed',
  CANCELED: 'Canceled',
} satisfies Record<LeadgenSnapshot['status'], string>;
const negativeTimelineMessageRe =
  /\b(?:no|not|failed|failure|error|without|couldn['\u2019]?t|could not|didn['\u2019]?t|did not|unable|invalid|canceled|cancelled)\b/i;
const skeletonRows = ['first', 'second', 'third'];

export function LeadgenApp({ initialRunId }: { initialRunId?: string }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { exportingRunId, exportRunCsv } = useLeadgenRunCsvExport();
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
  const userDomainsQuery = useQuery({
    ...trpc.users.getCurrentUserDomains.queryOptions(),
    enabled: isAuthenticated,
    staleTime: 60_000,
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
          if (isTerminalLeadgenStatus(snapshot.status)) {
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
  const startSuggestions = useMemo(
    () =>
      getStartSuggestions({
        domains: userDomainsQuery.data ?? [],
        runs: runsQuery.data ?? [],
      }),
    [userDomainsQuery.data, runsQuery.data],
  );
  const isStartSuggestionsLoading =
    userDomainsQuery.isLoading || runsQuery.isLoading;

  if (isAuthLoading) {
    return <LeadgenSkeleton />;
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  const run = liveRun ?? activeRunQuery.data ?? null;
  const isRunning = run?.status === 'QUEUED' || run?.status === 'RUNNING';
  const isRunLoading = Boolean(activeRunId) && activeRunQuery.isLoading && !run;
  const estimatedRunCredits = getEstimatedRunCredits({
    usage: usageQuery.data,
    reasoningEffort,
  });
  const { canSubmit } = getLeadgenSubmitState({
    domain,
    estimatedRunCredits,
    isCreditLoading: usageQuery.isLoading,
    isSubmitting: startRun.isPending,
    usage: usageQuery.data,
  });

  const handleSubmit = () => {
    submitLeadgenRun({
      domain,
      reasoningEffort,
      setDomain,
      startRun: startRun.mutate,
    });
  };

  const handleSelectStartSuggestion = (suggestion: LeadgenStartSuggestion) => {
    setDomain(suggestion.domain);
    setReasoningEffort('medium');
    requestAnimationFrame(() => {
      document.getElementById(DOMAIN_INPUT_ID)?.focus();
    });
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
                  ready-to-send outreach drafts.
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
            exportingRunId={exportingRunId}
            onExportRun={exportRunCsv}
          />
        </aside>

        <main className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm backdrop-blur">
          <LeadgenWorkspacePanel
            isRunLoading={isRunLoading}
            isRunning={isRunning}
            run={run}
            startSuggestions={startSuggestions}
            isStartSuggestionsLoading={isStartSuggestionsLoading}
            onSelectStartSuggestion={handleSelectStartSuggestion}
            onRunUpdated={setLiveRun}
          />
        </main>
      </div>
    </PageShell>
  );
}

function useLeadgenRunCsvExport() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [exportingRunId, setExportingRunId] = useState<string | null>(null);

  const exportRunCsv = async (runId: string) => {
    if (exportingRunId) return;

    setExportingRunId(runId);
    try {
      const run = await queryClient.fetchQuery(
        trpc.leadgen.getRun.queryOptions({ runId }),
      );

      if (!isLeadgenCrmCsvExportAvailable(run)) {
        toast('This run is not ready to export');
        return;
      }

      downloadLeadgenCrmCsv(run);
      toast.success('CRM CSV exported');
    } catch (error) {
      toast.error('Could not export CRM CSV', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setExportingRunId(null);
    }
  };

  return { exportingRunId, exportRunCsv };
}

function LeadgenWorkspacePanel({
  isRunLoading,
  isRunning,
  run,
  startSuggestions,
  isStartSuggestionsLoading,
  onSelectStartSuggestion,
  onRunUpdated,
}: {
  isRunLoading: boolean;
  isRunning: boolean;
  run: LeadgenSnapshot | null;
  startSuggestions: LeadgenStartSuggestion[];
  isStartSuggestionsLoading: boolean;
  onSelectStartSuggestion: (suggestion: LeadgenStartSuggestion) => void;
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

  return (
    <EmptyWorkspace
      suggestions={startSuggestions}
      isLoading={isStartSuggestionsLoading}
      onSelectSuggestion={onSelectStartSuggestion}
    />
  );
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
  const [pendingOutreachLeadIds, setPendingOutreachLeadIds] = useState<
    string[]
  >([]);
  const [reviewOutreachLeadId, setReviewOutreachLeadId] = useState<
    string | null
  >(null);
  const presentation = useMemo(() => buildLeadPresentationModel(run), [run]);
  const buyerAngles = getBuyerAngles(run);

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
      onSettled(_snapshot, _error, variables) {
        setPendingOutreachLeadIds((leadIds) =>
          leadIds.filter((leadId) => leadId !== variables.leadId),
        );
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
    if (pendingOutreachLeadIds.includes(leadId)) return;
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

    setPendingOutreachLeadIds((leadIds) =>
      leadIds.includes(leadId) ? leadIds : [...leadIds, leadId],
    );
    generateLeadOutreach.mutate({ runId: run.id, leadId });
  };

  const headerSubtitle = getRunHeaderSubtitle(run);
  const canExport = isLeadgenCrmCsvExportAvailable(run);

  const handleExportCrmCsv = () => {
    if (!canExport) {
      toast('This run is not ready to export');
      return;
    }

    downloadLeadgenCrmCsv(run);
    toast.success('CRM CSV exported');
  };

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
            {canExport && (
              <div className="mt-3 flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportCrmCsv}
                >
                  <Download data-icon="inline-start" />
                  Export CRM CSV
                </Button>
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:min-w-[320px]">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Top" value={presentation.counts.top} />
              <Metric label="Contacts" value={presentation.counts.contacts} />
              <Metric label="Drafts" value={run.draftCount} />
            </div>
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
          {buyerAngles.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Buyer angles
              </p>
              <div className="flex flex-wrap gap-2">
                {buyerAngles.map((angle) => (
                  <span
                    key={angle}
                    className="rounded-md border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {angle}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Tabs defaultValue="best">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="best">
                  Top prospects ({presentation.counts.top})
                </TabsTrigger>
                <TabsTrigger value="more">
                  Secondary ({presentation.counts.secondary})
                </TabsTrigger>
              </TabsList>
              {presentation.counts.checking > 0 && (
                <span className="text-xs text-muted-foreground">
                  Still checking {presentation.counts.checking}
                </span>
              )}
            </div>
            <TabsContent value="best" className="mt-4">
              <LeadList
                leads={presentation.groups.top}
                sourceDomain={run.domain}
                pendingOutreachLeadIds={pendingOutreachLeadIds}
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
            <TabsContent value="more" className="mt-4">
              <LeadList
                leads={presentation.groups.secondary}
                sourceDomain={run.domain}
                pendingOutreachLeadIds={pendingOutreachLeadIds}
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
            presentation={presentation}
            isRunning={isRunning}
            pendingOutreachLeadIds={pendingOutreachLeadIds}
          />
        </aside>
      </div>
    </div>
  );
}

function LeadList({
  leads,
  sourceDomain,
  pendingOutreachLeadIds,
  reviewOutreachLeadId,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  onGenerateLeadOutreach,
  onReviewOutreachLead,
}: {
  leads: LeadPresentation[];
  sourceDomain: string;
  pendingOutreachLeadIds: string[];
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
        Prospects will appear here as they are found.
      </div>
    );
  }

  const renderLeadCard = (presentation: LeadPresentation) => (
    <LeadCard
      key={presentation.lead.id}
      presentation={presentation}
      sourceDomain={sourceDomain}
      isPreparingOutreach={pendingOutreachLeadIds.includes(
        presentation.lead.id,
      )}
      isReviewingOutreach={reviewOutreachLeadId === presentation.lead.id}
      estimatedOutreachCredits={estimatedOutreachCredits}
      remainingCredits={remainingCredits}
      isOutreachCreditLoading={isOutreachCreditLoading}
      isOutreachCreditError={isOutreachCreditError}
      isOutreachCreditBlocked={isOutreachCreditBlocked}
      onGenerateLeadOutreach={onGenerateLeadOutreach}
      onReviewOutreachChange={(open) =>
        onReviewOutreachLead(open ? presentation.lead.id : null)
      }
    />
  );

  return <div className="grid gap-3">{leads.map(renderLeadCard)}</div>;
}

function LeadCard({
  presentation,
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
  presentation: LeadPresentation;
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
  const { lead } = presentation;
  const recipients = useMemo(() => getOutreachRecipients(lead), [lead]);
  const canPrepareOutreach =
    lead.status !== 'checking' && lead.status !== 'suppressed';
  const hasEmailCta = recipients.length > 0 && lead.drafts.length > 0;
  const shouldPrepareOutreach =
    canPrepareOutreach &&
    (lead.contacts.length === 0 || lead.drafts.length < lead.contacts.length);
  const showOutreachPanel =
    canPrepareOutreach && (hasEmailCta || shouldPrepareOutreach);

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
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {presentation.buyerSummary}
          </p>
        </div>
        <LeadContactCountBadge contactCount={lead.contacts.length} />
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

function LeadContactCountBadge({ contactCount }: { contactCount: number }) {
  return (
    <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-muted/30 px-2.5 text-xs font-medium tabular-nums text-muted-foreground">
      <Mail className="size-3.5" />
      {contactCount} {contactCount === 1 ? 'contact' : 'contacts'}
    </span>
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
type TimelineSubtaskTone = 'best' | 'checking' | 'more' | 'contacts' | 'drafts';

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
  detail?: string;
  subtasks?: TimelineSubtask[];
};

function Timeline({
  run,
  presentation,
  isRunning,
  pendingOutreachLeadIds,
}: {
  run: LeadgenSnapshot;
  presentation: LeadPresentationModel;
  isRunning: boolean;
  pendingOutreachLeadIds: string[];
}) {
  const pendingOutreachLeads = run.leads.filter((lead) =>
    pendingOutreachLeadIds.includes(lead.id),
  );
  const phases = getCompactTimelinePhases({
    run,
    presentation,
    isRunning,
    pendingOutreachLeads,
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
        {phase.status === 'active' ? (
          <ActivityDots />
        ) : (
          <Icon className="size-3.5" />
        )}
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
            {phase.detail && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-muted-foreground">
                {phase.detail}
              </p>
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
  exportingRunId,
  onExportRun,
}: {
  runs: LeadgenRunSummary[];
  activeRunId: string | null;
  isLoading: boolean;
  exportingRunId: string | null;
  onExportRun: (runId: string) => Promise<void>;
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
        <div className="flex flex-col gap-2">
          {runs.map((run) => {
            const canExport = isLeadgenCrmCsvExportAvailable(run);
            const isExporting = exportingRunId === run.id;

            return (
              <div
                key={run.id}
                className={cn(
                  'rounded-md border bg-background/40 p-3 transition-colors hover:bg-muted/40',
                  run.id === activeRunId
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border/70',
                )}
              >
                <div className="flex items-center gap-2">
                  <Link
                    href={getLeadgenRunHref(run.id)}
                    className="min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <p className="truncate text-sm font-medium">{run.domain}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isTerminalLeadgenStatus(run.status)
                        ? `${run.leadCount} leads - ${run.draftCount} drafts`
                        : 'Searching...'}
                    </p>
                  </Link>
                  {canExport && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={isExporting}
                      aria-label={`Download CRM CSV for ${run.domain}`}
                      onClick={() => {
                        void onExportRun(run.id);
                      }}
                    >
                      {isExporting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Download />
                      )}
                    </Button>
                  )}
                  <span className="flex w-4 shrink-0 items-center justify-center">
                    <RunStatusIcon status={run.status} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function getStartSuggestions({
  domains,
  runs,
}: {
  domains: UserDomain[];
  runs: LeadgenRunSummary[];
}): LeadgenStartSuggestion[] {
  const previousRunDomains = new Set(
    runs.map((run) => normalizeDomainInput(run.domain)),
  );

  return domains
    .map((domain) => {
      const suggestion = {
        domain: domain.normalizedDomainName,
        reason: getStartSuggestionReason(domain),
        hasPreviousRun: previousRunDomains.has(domain.normalizedDomainName),
      };
      return {
        suggestion,
        score: getStartSuggestionScore(domain, suggestion),
      };
    })
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;
      if (scoreDifference !== 0) return scoreDifference;
      return a.suggestion.domain.localeCompare(b.suggestion.domain);
    })
    .slice(0, 3)
    .map((item) => item.suggestion);
}

function getStartSuggestionReason(
  domain: UserDomain,
): LeadgenStartSuggestion['reason'] {
  const dns = domain.dnsStatus;
  if (
    dns.isUsingNamefiNameservers &&
    dns.isParkingEnabled &&
    !dns.hasWebRecords &&
    !dns.forwardTo
  ) {
    return 'parked';
  }
  if (dns.isUsingNamefiNameservers && !dns.hasWebRecords && !dns.forwardTo) {
    return 'unconfigured';
  }
  if (dns.hasWebRecords || dns.hasMxRecords) return 'active';
  return 'owned';
}

function getStartSuggestionScore(
  domain: UserDomain,
  suggestion: LeadgenStartSuggestion,
) {
  const dns = domain.dnsStatus;
  let score = 0;
  if (suggestion.reason === 'parked') score += 45;
  if (suggestion.reason === 'unconfigured') score += 25;
  if (dns.hasWebRecords || dns.hasMxRecords) score += 10;
  if (isTraditionalDomain(domain.normalizedDomainName)) score += 12;
  if (suggestion.hasPreviousRun) score -= 20;
  return score;
}

function isTraditionalDomain(domain: UserDomain['normalizedDomainName']) {
  const parsed = parseDomainName(domain);
  return parsed.valid && parsed.registryType === 'traditional';
}

function EmptyWorkspace({
  suggestions,
  isLoading,
  onSelectSuggestion,
}: {
  suggestions: LeadgenStartSuggestion[];
  isLoading: boolean;
  onSelectSuggestion: (suggestion: LeadgenStartSuggestion) => void;
}) {
  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-5">
      <div className="w-full max-w-3xl">
        <div className="mb-5 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/55 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-cyan-300" />
            Suggested starts
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            {hasSuggestions
              ? 'Choose a starting domain'
              : 'Start with a domain'}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {hasSuggestions
              ? 'Select one from your portfolio, or enter another domain you own.'
              : 'Enter a domain you own or represent. Namefi Outbound will build buyer angles and outreach drafts from there.'}
          </p>
        </div>

        <div className="mt-7 grid items-stretch gap-3 lg:grid-cols-3">
          {isLoading
            ? skeletonRows.map((row) => (
                <div
                  key={`leadgen-empty-suggestion-${row}`}
                  className={emptyStateCardClassName}
                >
                  <Skeleton className="size-10 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-24 max-w-full" />
                    <Skeleton className="h-4 w-36 max-w-full" />
                  </div>
                  <Skeleton className="size-4 rounded-full" />
                </div>
              ))
            : hasSuggestions
              ? suggestions.map((suggestion) => (
                  <LeadgenStartSuggestionButton
                    key={suggestion.domain}
                    suggestion={suggestion}
                    onSelect={onSelectSuggestion}
                  />
                ))
              : fallbackEmptyPrompts.map((prompt) => {
                  const Icon = prompt.icon;
                  return (
                    <div key={prompt.title} className={emptyStateCardClassName}>
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-5">
                          {prompt.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
        </div>
      </div>
    </div>
  );
}

const emptyStateCardClassName =
  'flex min-h-24 items-center gap-4 rounded-lg border border-border/70 bg-background/55 p-4 shadow-sm';

const fallbackEmptyPrompts: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Use a primary domain',
    description: 'Primary domains are usually the simplest place to start.',
    icon: Search,
  },
  {
    title: 'Pick a clear market',
    description:
      'A domain tied to an industry, product, or location can lead to stronger buyer ideas.',
    icon: Sparkles,
  },
  {
    title: 'Try a brandable name',
    description:
      'Short, memorable names are good candidates for outreach drafts.',
    icon: Building2,
  },
];

function LeadgenStartSuggestionButton({
  suggestion,
  onSelect,
}: {
  suggestion: LeadgenStartSuggestion;
  onSelect: (suggestion: LeadgenStartSuggestion) => void;
}) {
  const Icon = getStartSuggestionIcon(suggestion.reason);
  const label = getStartSuggestionLabel(suggestion);

  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion)}
      className={cn(
        emptyStateCardClassName,
        'group w-full text-left transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50',
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-300 transition-colors group-hover:bg-cyan-500/15">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <p className="text-xs font-medium leading-4 text-muted-foreground">
            Find buyers for
          </p>
          {label ? (
            <span className="shrink-0 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-normal text-muted-foreground">
              {label}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold leading-5 text-foreground [overflow-wrap:anywhere]">
          {suggestion.domain}
        </p>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-cyan-300" />
    </button>
  );
}

function getStartSuggestionIcon(
  reason: LeadgenStartSuggestion['reason'],
): LucideIcon {
  switch (reason) {
    case 'parked':
      return Search;
    case 'unconfigured':
      return Sparkles;
    case 'active':
      return Building2;
    case 'owned':
      return UserRoundSearch;
  }
}

function getStartSuggestionLabel(suggestion: LeadgenStartSuggestion) {
  if (suggestion.hasPreviousRun) {
    return 'refresh';
  }

  return null;
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
  presentation,
  isRunning,
  pendingOutreachLeads,
}: {
  run: LeadgenSnapshot;
  presentation: LeadPresentationModel;
  isRunning: boolean;
  pendingOutreachLeads: LeadgenLead[];
}): TimelinePhase[] {
  const orderedEvents = getOrderedLeadgenEvents(run.events);
  const terminal = isTerminalLeadgenStatus(run.status);
  const intentResultEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.eventType === 'intent-queries',
  );
  const intentStatusEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.stage === 'intent',
  );
  const searchEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.stage === 'search' || event.eventType === 'lead',
  );
  const triageEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.stage === 'triage' || event.eventType === 'triage',
  );
  const outreachEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) =>
      !isManualOutreachEvent(event) &&
      (event.stage === 'contacts' ||
        event.stage === 'drafts' ||
        event.eventType === 'contact' ||
        event.eventType === 'draft'),
  );
  const completeEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.stage === 'complete',
  );
  const manualOutreach = getManualOutreachSummary(orderedEvents);
  const queryCount = Math.max(
    getBuyerAngles(run).length,
    getIntentQueryCount(orderedEvents),
  );
  const hasBuyerAngles = Boolean(intentResultEvent) || queryCount > 0;
  const searchStarted = Boolean(searchEvent);
  const visibleLeadCount =
    presentation.counts.top +
    presentation.counts.secondary +
    presentation.counts.checking;
  const scoredLeadCount =
    presentation.counts.top + presentation.counts.secondary;
  const contactPendingCount = presentation.groups.top.filter(
    (lead) =>
      lead.lead.contactReadiness === 'not_searched' &&
      lead.lead.contacts.length < 3,
  ).length;
  const initialOutreachCounts = getInitialOutreachTimelineCounts({
    run,
    orderedEvents,
    manualOutreach,
  });
  const pendingDraftCount = Math.max(
    0,
    initialOutreachCounts.contactCount - initialOutreachCounts.draftCount,
  );
  const intentStatus = getPhaseStatus({
    complete: hasBuyerAngles,
    active: isRunning && !hasBuyerAngles,
  });
  const earlySearchStatus = getPhaseStatus({
    complete:
      terminal || (visibleLeadCount > 0 && presentation.counts.checking === 0),
    active:
      isRunning &&
      (searchStarted || visibleLeadCount > 0) &&
      (visibleLeadCount === 0 || presentation.counts.checking > 0),
  });
  const scoringStatus = getPhaseStatus({
    complete: scoredLeadCount > 0 && presentation.counts.checking === 0,
    active: isRunning && presentation.counts.checking > 0,
  });
  const outreachStatus = getPhaseStatus({
    complete:
      initialOutreachCounts.draftCount > 0 ||
      terminal ||
      (Boolean(outreachEvent) &&
        contactPendingCount === 0 &&
        pendingDraftCount === 0),
    active:
      isRunning &&
      Boolean(outreachEvent) &&
      (contactPendingCount > 0 || pendingDraftCount > 0),
  });
  const completion = getCompletionTimelineState(run, presentation);
  const showOutreachSubtasks =
    outreachStatus !== 'pending' ||
    initialOutreachCounts.contactCount > 0 ||
    initialOutreachCounts.draftCount > 0;
  const phases: TimelinePhase[] = [
    {
      id: 'buyer-angles',
      title: 'Finding buyer angles',
      status: intentStatus,
      icon: Target,
      timestamp: getTimelineTimestamp(
        intentResultEvent ?? intentStatusEvent,
        intentStatus,
      ),
      badge: queryCount > 0 ? `${queryCount} angles` : undefined,
    },
    {
      id: 'checking-early-prospects',
      title: 'Finding prospects',
      status: earlySearchStatus,
      icon: Search,
      timestamp: getTimelineTimestamp(searchEvent, earlySearchStatus),
      badge:
        visibleLeadCount > 0
          ? `${visibleLeadCount} ${visibleLeadCount === 1 ? 'prospect' : 'prospects'}`
          : undefined,
    },
    {
      id: 'scoring-prospects',
      title: 'Scoring prospects',
      status: scoringStatus,
      icon: Target,
      timestamp: getTimelineTimestamp(triageEvent, scoringStatus),
      detail: getActiveEventMessage(triageEvent, scoringStatus),
      subtasks: getTimelineSubtasks([
        presentation.counts.top > 0
          ? {
              id: 'top-prospects',
              label: 'Top prospects',
              value: `${presentation.counts.top} found`,
              tone: 'best',
              icon: Target,
              status: getSubtaskStatus(scoringStatus, presentation.counts.top),
            }
          : null,
        presentation.counts.secondary > 0
          ? {
              id: 'secondary-prospects',
              label: 'Secondary prospects',
              value: `${presentation.counts.secondary} found`,
              tone: 'more',
              icon: Search,
              status: getSubtaskStatus(
                scoringStatus,
                presentation.counts.secondary,
              ),
            }
          : null,
      ]),
    },
    {
      id: 'preparing-outreach',
      title: 'Preparing outreach',
      status: outreachStatus,
      icon: Sparkles,
      timestamp: getTimelineTimestamp(outreachEvent, outreachStatus),
      detail: getActiveEventMessage(outreachEvent, outreachStatus),
      subtasks: showOutreachSubtasks
        ? [
            {
              id: 'contacts',
              label: 'Contacts',
              value: `${initialOutreachCounts.contactCount} found`,
              tone: 'contacts',
              icon: Mail,
              status: getSubtaskStatus(
                outreachStatus,
                initialOutreachCounts.contactCount,
              ),
            },
            {
              id: 'drafts',
              label: 'Drafts',
              value: `${initialOutreachCounts.draftCount} ready`,
              tone: 'drafts',
              icon: FileText,
              status:
                outreachStatus === 'active' && pendingDraftCount > 0
                  ? 'active'
                  : getSubtaskStatus(
                      outreachStatus,
                      initialOutreachCounts.draftCount,
                    ),
            },
          ]
        : undefined,
    },
    {
      id: 'search-complete',
      title:
        run.status === 'SUCCEEDED' || run.status === 'FAILED'
          ? completion.title
          : 'Wrapping up',
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
    pendingOutreachLeads,
  });
  if (additionalOutreachPhase) {
    phases.push(additionalOutreachPhase);
  }

  return phases;
}

function getTimelineSubtasks(
  subtasks: Array<TimelineSubtask | null>,
): TimelineSubtask[] | undefined {
  const visibleSubtasks = subtasks.filter(
    (subtask): subtask is TimelineSubtask => Boolean(subtask),
  );

  return visibleSubtasks.length > 0 ? visibleSubtasks : undefined;
}

function getEventMessage(event: LeadgenEvent | null | undefined) {
  const message = event?.message?.trim();
  if (!event || !message) return undefined;
  return isDisplayableLeadgenEvent({ ...event, message }) ? message : undefined;
}

function getActiveEventMessage(
  event: LeadgenEvent | null | undefined,
  status: TimelinePhaseStatus,
) {
  return status === 'active' ? getEventMessage(event) : undefined;
}

function getCompletionTimelineState(
  run: LeadgenSnapshot,
  presentation: LeadPresentationModel,
) {
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
    badge:
      run.status === 'SUCCEEDED'
        ? `${presentation.counts.top + presentation.counts.secondary} prospects`
        : undefined,
  };
}

// Prefer explicit automated outreach events, but fall back to run totals minus
// manualOutreach because subscriptions can contain aggregated counts before all
// contact/draft events are present. Math.max keeps the timeline from regressing.
function getInitialOutreachTimelineCounts({
  run,
  orderedEvents,
  manualOutreach,
}: {
  run: LeadgenSnapshot;
  orderedEvents: LeadgenSnapshot['events'];
  manualOutreach: ReturnType<typeof getManualOutreachSummary>;
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

  return {
    contactCount: Math.max(
      contactEventCount,
      Math.max(0, run.contactCount - manualOutreach.contactCount),
    ),
    draftCount: Math.max(
      draftEventCount,
      Math.max(0, run.draftCount - manualOutreach.draftCount),
    ),
  };
}

function getAdditionalOutreachPhase({
  manualOutreach,
  pendingOutreachLeads,
}: {
  manualOutreach: ReturnType<typeof getManualOutreachSummary>;
  pendingOutreachLeads: LeadgenLead[];
}): TimelinePhase | null {
  if (!manualOutreach.hasEvents && pendingOutreachLeads.length === 0) {
    return null;
  }

  const active = pendingOutreachLeads.length > 0;
  const primaryPendingLead = pendingOutreachLeads[0] ?? null;
  const cardDomain = getAdditionalOutreachDomainLabel({
    manualOutreach,
    pendingOutreachLeads,
  });
  const domainSummary = primaryPendingLead
    ? manualOutreach.domainSummaries.get(primaryPendingLead.businessDomain)
    : cardDomain
      ? manualOutreach.domainSummaries.get(cardDomain)
      : null;
  const lastEventWasError =
    domainSummary?.lastEventWasError ?? manualOutreach.lastEventWasError;
  const status = getAdditionalOutreachStatus(active, lastEventWasError);
  const contactCount = Math.max(
    domainSummary?.contactCount ?? 0,
    getPendingLeadContactCount(pendingOutreachLeads),
  );
  const draftCount = Math.max(
    domainSummary?.draftCount ?? 0,
    getPendingLeadDraftCount(pendingOutreachLeads),
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
        status: getAdditionalOutreachSubtaskStatus({
          phaseStatus: status,
          complete: contactCount >= 3 || (!active && !lastEventWasError),
        }),
      },
      {
        id: 'additional-drafts',
        label: 'Drafts',
        value: `${draftCount} ready`,
        tone: 'drafts',
        icon: FileText,
        status: getAdditionalOutreachSubtaskStatus({
          phaseStatus: status,
          complete:
            draftCount > 0 ||
            (!active && !lastEventWasError && contactCount === 0),
        }),
      },
    ],
  };
}

function getAdditionalOutreachDomainLabel({
  manualOutreach,
  pendingOutreachLeads,
}: {
  manualOutreach: ReturnType<typeof getManualOutreachSummary>;
  pendingOutreachLeads: LeadgenLead[];
}) {
  if (pendingOutreachLeads.length > 1) {
    return `${pendingOutreachLeads.length} leads`;
  }
  return pendingOutreachLeads[0]?.businessDomain ?? manualOutreach.domain;
}

function getPendingLeadContactCount(leads: LeadgenLead[]) {
  return leads.reduce((count, lead) => count + lead.contacts.length, 0);
}

function getPendingLeadDraftCount(leads: LeadgenLead[]) {
  return leads.reduce((count, lead) => count + lead.drafts.length, 0);
}

function getAdditionalOutreachStatus(
  active: boolean,
  lastEventWasError: boolean,
): TimelinePhaseStatus {
  if (active) return 'active';
  return lastEventWasError ? 'error' : 'complete';
}

function getAdditionalOutreachSubtaskStatus({
  phaseStatus,
  complete,
}: {
  phaseStatus: TimelinePhaseStatus;
  complete: boolean;
}): TimelinePhaseStatus {
  if (phaseStatus === 'error') return 'error';
  return complete ? 'complete' : phaseStatus;
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
  if (active) return 'active';
  if (complete) return 'complete';
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
    case 'best':
      return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
    case 'checking':
      return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
    case 'more':
      return 'border-muted-foreground/20 bg-muted/20 text-muted-foreground';
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

function getBuyerAngles(run: LeadgenSnapshot) {
  return run.intentQueries;
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

function downloadLeadgenCrmCsv(run: LeadgenSnapshot) {
  const csv = buildLeadgenCrmCsv(run);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = buildLeadgenCrmFilename(run.domain);
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildLeadgenCrmFilename(domain: string) {
  const safeDomain = domain
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/^-+|-+$/g, '');

  return `namefi-outbound-${safeDomain || 'results'}.csv`;
}

function getRunHeaderSubtitle(run: LeadgenSnapshot) {
  const latestEvent = getTimelineEvents(run.events).at(-1);
  if (latestEvent) return latestEvent.message;
  if (run.status === 'SUCCEEDED' && run.leadCount > 0) {
    return (
      run.summary ??
      `Found ${run.leadCount} prospects and ${run.contactCount} contacts.`
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
      return 'Namefi Outbound is researching buyer angles, prospects, contacts, and drafts.';
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
    case 'triage':
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
  const thesis = lead.thesis.trim() || lead.rationale.trim();
  const body = [
    greeting,
    '',
    `I'm reaching out because ${lead.businessDomain} looks aligned with ${sourceDomain}. ${thesis}`,
    evidence && !isDuplicateLeadText(thesis, evidence)
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

function getEstimatedRunCredits({
  usage,
  reasoningEffort,
}: {
  usage?: UserGenerationUsage;
  reasoningEffort: ReasoningEffort;
}) {
  return usage
    ? getLeadgenRunCreditEstimate({
        creditCosts: usage.creditCosts,
        reasoningEffort,
      })
    : undefined;
}

function getLeadgenSubmitState({
  domain,
  estimatedRunCredits,
  isCreditLoading,
  isSubmitting,
  usage,
}: {
  domain: string;
  estimatedRunCredits?: number;
  isCreditLoading: boolean;
  isSubmitting: boolean;
  usage?: UserGenerationUsage;
}) {
  const hasInsufficientRunCredits =
    usage && estimatedRunCredits !== undefined
      ? estimatedRunCredits > usage.remainingCredits
      : false;

  return {
    hasInsufficientRunCredits,
    canSubmit:
      isLikelyDomain(domain) &&
      !isSubmitting &&
      !isCreditLoading &&
      !hasInsufficientRunCredits,
  };
}

function submitLeadgenRun({
  domain,
  reasoningEffort,
  setDomain,
  startRun,
}: {
  domain: string;
  reasoningEffort: ReasoningEffort;
  setDomain: (domain: string) => void;
  startRun: (input: {
    domain: string;
    reasoningEffort: ReasoningEffort;
  }) => void;
}) {
  const normalized = normalizeDomainInput(domain);
  if (!isLikelyDomain(normalized)) {
    toast.error('Enter a domain', {
      description: 'Use a domain you own or represent, like example.com.',
    });
    return;
  }

  setDomain(normalized);
  startRun({ domain: normalized, reasoningEffort });
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
