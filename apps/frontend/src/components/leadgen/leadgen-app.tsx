'use client';

import { AuthRequired } from '@/components/auth-required';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/hooks/use-auth';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import NumberFlow from '@number-flow/react';
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
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
type LeadgenRunSummary = AppRouterOutput['leadgen']['listRuns'][number];
type LeadgenLead = LeadgenSnapshot['leads'][number];
type LeadgenEvent = LeadgenSnapshot['events'][number];
type ReasoningEffort = LeadgenSnapshot['reasoningEffort'];

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
const getLeadgenRunHref = (runId: string) => `/leadgen/${runId}` as Route;
const layoutSpring = {
  type: 'spring',
  stiffness: 520,
  damping: 42,
  mass: 0.8,
} as const;
const softSpring = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.7,
} as const;
const leadgenStatusLabels = {
  QUEUED: 'Queued',
  RUNNING: 'Searching',
  SUCCEEDED: 'Complete',
  FAILED: 'Needs review',
  CANCELED: 'Canceled',
} satisfies Record<LeadgenSnapshot['status'], string>;
const leadBucketLabels = {
  general: 'Category match',
  substring: 'Name match',
} satisfies Record<LeadgenLead['bucket'], string>;
const skeletonRows = ['first', 'second', 'third'];
const negativeTimelineMessageRe =
  /\b(?:no|not|failed|failure|error|without|couldn['’]?t|could not|didn['’]?t|did not|unable|invalid|canceled|cancelled)\b/i;

function isActiveRunStatus(status: LeadgenSnapshot['status']) {
  return status === 'QUEUED' || status === 'RUNNING';
}

function isTerminalRunStatus(status: LeadgenSnapshot['status']) {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'CANCELED';
}

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
          if (isTerminalRunStatus(snapshot.status)) {
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
  const isRunning = run ? isActiveRunStatus(run.status) : false;
  const isRunLoading = Boolean(activeRunId) && activeRunQuery.isLoading && !run;
  const canSubmit = isLikelyDomain(domain) && !startRun.isPending;

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
            </div>
          </section>

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
}: {
  isRunLoading: boolean;
  isRunning: boolean;
  run: LeadgenSnapshot | null;
}) {
  if (isRunLoading) {
    return <RunWorkspaceSkeleton />;
  }

  if (run) {
    return <RunWorkspace run={run} isRunning={isRunning} />;
  }

  return <EmptyWorkspace />;
}

function RunWorkspace({
  run,
  isRunning,
}: {
  run: LeadgenSnapshot;
  isRunning: boolean;
}) {
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

  const latestEvent = [...run.events].reverse().find((event) => event.message);

  return (
    <LayoutGroup id={`leadgen-run-${run.id}`}>
      <motion.div
        layout
        className="flex h-full min-h-[calc(100vh-8rem)] flex-col"
        transition={{ layout: layoutSpring }}
      >
        <div className="relative overflow-hidden border-b border-border/70 p-5">
          {isRunning && <WorkingBackdrop />}
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {run.domain}
                </h2>
                <RunStatusBadge status={run.status} />
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {latestEvent?.message ??
                  'Namefi Leadgen AI is preparing buyer research for this domain.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
              <Metric label="Leads" value={run.leadCount} />
              <Metric label="Contacts" value={run.contactCount} />
              <Metric label="Drafts" value={run.draftCount} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-auto p-5">
            <AnimatePresence initial={false}>
              {run.intentQueries.length > 0 && (
                <motion.div
                  layout
                  className="mb-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    layout: layoutSpring,
                    opacity: { duration: 0.2 },
                  }}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Buyer angles
                  </p>
                  <motion.div layout className="flex flex-wrap gap-2">
                    <AnimatePresence initial={false}>
                      {run.intentQueries.map((query, index) => (
                        <motion.span
                          layout
                          key={query}
                          className="rounded-md border border-border/70 bg-background/70 px-2.5 py-1 text-xs text-muted-foreground shadow-sm"
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{
                            delay: index * 0.025,
                            layout: layoutSpring,
                            scale: { duration: 0.18 },
                          }}
                        >
                          {query}
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">
                  <span className="inline-flex items-center gap-1.5">
                    Likely buyers
                    <NumberFlow value={buckets.general.length} />
                  </span>
                </TabsTrigger>
                <TabsTrigger value="substring">
                  <span className="inline-flex items-center gap-1.5">
                    Name matches
                    <NumberFlow value={buckets.substring.length} />
                  </span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-4">
                <LeadList leads={buckets.general} />
              </TabsContent>
              <TabsContent value="substring" className="mt-4">
                <LeadList leads={buckets.substring} />
              </TabsContent>
            </Tabs>
          </section>

          <aside className="border-t border-border/70 p-5 lg:border-l lg:border-t-0">
            <Timeline events={run.events} isRunning={isRunning} />
          </aside>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}

function LeadList({ leads }: { leads: LeadgenLead[] }) {
  return (
    <motion.div
      layout
      className="grid gap-3"
      transition={{ layout: layoutSpring }}
    >
      <AnimatePresence initial={false}>
        {leads.length === 0 ? (
          <motion.div
            key="empty-leads"
            layout
            className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ layout: layoutSpring, opacity: { duration: 0.18 } }}
          >
            Buyer matches will appear here as they are found.
          </motion.div>
        ) : (
          leads.map((lead, index) => (
            <LeadCard
              key={`${lead.bucket}-${lead.businessDomain}`}
              lead={lead}
              index={index}
            />
          ))
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LeadCard({ lead, index }: { lead: LeadgenLead; index: number }) {
  const primaryDraft = lead.drafts[0];
  const primaryContact = lead.contacts[0];

  return (
    <motion.article
      layout
      className="rounded-lg border border-border/70 bg-background/70 p-4 shadow-sm"
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.985 }}
      transition={{
        delay: index * 0.025,
        layout: layoutSpring,
        opacity: { duration: 0.18 },
        scale: { duration: 0.22 },
      }}
    >
      <motion.div
        layout
        className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
      >
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
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {lead.rationale}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TinyStat
            icon={Mail}
            value={lead.contacts.length}
            label={lead.contacts.length === 1 ? 'contact' : 'contacts'}
          />
          <TinyStat
            icon={Sparkles}
            value={lead.drafts.length}
            label={lead.drafts.length === 1 ? 'draft' : 'drafts'}
          />
        </div>
      </motion.div>

      <motion.div
        layout
        className="mt-3 rounded-md border border-border/60 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground"
      >
        {lead.content}
      </motion.div>

      <AnimatePresence initial={false}>
        {(primaryContact || primaryDraft) && (
          <motion.div
            key="lead-results"
            layout
            className="mt-3 grid gap-3 xl:grid-cols-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ layout: layoutSpring, opacity: { duration: 0.18 } }}
          >
            <AnimatePresence initial={false}>
              {primaryContact && (
                <motion.div
                  key={`contact-${primaryContact.id}`}
                  layout
                  className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{
                    layout: softSpring,
                    opacity: { duration: 0.2 },
                  }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                    Contact found
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {primaryContact.name || primaryContact.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {primaryContact.title || primaryContact.email}
                  </p>
                </motion.div>
              )}
              {primaryDraft && (
                <motion.div
                  key={`draft-${primaryDraft.id}`}
                  layout
                  className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{
                    layout: softSpring,
                    opacity: { duration: 0.2 },
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                        Draft ready
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        {primaryDraft.subject}
                      </p>
                    </div>
                    <Button
                      aria-label="Copy draft"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => copyDraft(primaryDraft.fullEmail)}
                    >
                      <Copy />
                    </Button>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    {primaryDraft.fullEmail}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function Timeline({
  events,
  isRunning,
}: {
  events: LeadgenSnapshot['events'];
  isRunning: boolean;
}) {
  const visibleEvents = useMemo(
    () => events.filter((event) => isPositiveTimelineEvent(event)).slice(-18),
    [events],
  );

  return (
    <motion.div layout transition={{ layout: layoutSpring }}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Search updates
        </p>
        {isRunning && <WorkingStatus />}
      </div>
      <motion.div layout className="relative space-y-3">
        {visibleEvents.length === 0 ? (
          <motion.p
            key="empty-timeline"
            layout
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Positive updates will appear as buyer matches land.
          </motion.p>
        ) : (
          <>
            <div className="absolute bottom-2 left-3 top-3 w-px bg-gradient-to-b from-border via-border to-transparent" />
            <AnimatePresence initial={false}>
              {visibleEvents.map((event) => {
                const marker = getTimelineMarker(event);
                const Icon = marker.icon;

                return (
                  <motion.div
                    layout
                    key={event.id}
                    className="relative flex gap-3"
                    initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                    transition={{
                      layout: layoutSpring,
                      opacity: { duration: 0.18 },
                      filter: { duration: 0.18 },
                    }}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border shadow-sm backdrop-blur',
                        marker.className,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 rounded-md border border-border/50 bg-background/45 px-3 py-2">
                      <p className="text-sm leading-5">{event.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatTime(event.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </motion.div>
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
        <motion.div layout className="space-y-2">
          <AnimatePresence initial={false}>
            {runs.map((run) => (
              <motion.div
                layout
                key={run.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{
                  layout: layoutSpring,
                  opacity: { duration: 0.18 },
                }}
              >
                <Link
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
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <NumberFlow value={run.leadCount} />
                    leads
                    <span className="text-border">/</span>
                    <NumberFlow value={run.draftCount} />
                    drafts
                  </p>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
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

function RunWorkspaceSkeleton() {
  return (
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col">
      <div className="relative overflow-hidden border-b border-border/70 p-5">
        <WorkingBackdrop />
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
            {skeletonRows.map((row) => (
              <div
                key={`metric-${row}`}
                className="rounded-md border border-border/70 bg-background/70 p-3"
              >
                <Skeleton className="h-3 w-14" />
                <Skeleton className="mt-3 h-7 w-10" />
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
                className="rounded-lg border border-border/70 bg-background/70 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-4/5" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-7 w-20 rounded-md" />
                    <Skeleton className="h-7 w-20 rounded-md" />
                  </div>
                </div>
                <Skeleton className="mt-3 h-16 w-full rounded-md" />
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
                <Skeleton className="mt-1 size-2 rounded-full" />
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
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(103, 232, 249, 0.22) 1px, transparent 0)',
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
          className="absolute -inset-y-16 left-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent blur-xl"
          animate={{ x: ['-150%', '360%'] }}
          transition={{
            duration: 2.2,
            ease: [0.22, 1, 0.36, 1],
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 0.35,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-card/75 via-card/45 to-card/75" />
    </div>
  );
}

function WorkingStatus() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
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
      Working
    </span>
  );
}

function isPositiveTimelineEvent(event: LeadgenEvent) {
  if (!event.message || event.transient || event.eventType === 'error') {
    return false;
  }

  return !negativeTimelineMessageRe.test(event.message);
}

function getTimelineMarker(event: LeadgenEvent): {
  icon: LucideIcon;
  className: string;
} {
  if (event.eventType === 'intent-queries' || event.stage === 'intent') {
    return {
      icon: Target,
      className: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
    };
  }

  if (event.eventType === 'lead') {
    return {
      icon: Building2,
      className: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
    };
  }

  if (event.eventType === 'contact') {
    return {
      icon: Mail,
      className: 'border-sky-300/25 bg-sky-300/10 text-sky-200',
    };
  }

  if (event.eventType === 'draft') {
    return {
      icon: FileText,
      className: 'border-violet-300/25 bg-violet-300/10 text-violet-200',
    };
  }

  if (event.stage === 'complete') {
    return {
      icon: CheckCircle2,
      className: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200',
    };
  }

  if (event.eventType === 'search-progress' || event.stage === 'search') {
    return {
      icon: Search,
      className: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200',
    };
  }

  return {
    icon: Sparkles,
    className: 'border-border bg-muted/30 text-muted-foreground',
  };
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      layout
      className="rounded-md border border-border/70 bg-background/70 p-3 shadow-sm"
      transition={{ layout: layoutSpring }}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <NumberFlow
        value={value}
        className="mt-1 block text-2xl font-semibold tabular-nums"
      />
    </motion.div>
  );
}

function TinyStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      <NumberFlow
        value={value}
        className="font-medium tabular-nums text-foreground"
      />
      {label}
    </span>
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

function formatTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);
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
