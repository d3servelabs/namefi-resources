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
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  Play,
  Search,
  Sparkles,
  UserRoundSearch,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
type LeadgenRunSummary = AppRouterOutput['leadgen']['listRuns'][number];
type LeadgenLead = LeadgenSnapshot['leads'][number];
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
      },
      onError(error) {
        toast.error('Leadgen could not start', {
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
  const canSubmit = isLikelyDomain(domain) && !startRun.isPending;

  const handleSubmit = () => {
    const normalized = normalizeDomainInput(domain);
    if (!isLikelyDomain(normalized)) {
      toast.error('Enter a real domain', {
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Astra leadgen
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  Find buyers, emails, and first drafts.
                </h1>
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
                <p className="mb-1.5 text-sm font-medium">Research depth</p>
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
                Start leadgen
              </Button>
            </div>
          </section>

          <PastRuns
            runs={runsQuery.data ?? []}
            activeRunId={activeRunId}
            isLoading={runsQuery.isLoading}
          />
        </aside>

        <main className="min-w-0 rounded-lg border border-border/70 bg-card/60 shadow-sm backdrop-blur">
          {run ? (
            <RunWorkspace run={run} isRunning={isRunning} />
          ) : (
            <EmptyWorkspace />
          )}
        </main>
      </div>
    </PageShell>
  );
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
    <div className="flex h-full min-h-[calc(100vh-8rem)] flex-col">
      <div className="border-b border-border/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {run.domain}
              </h2>
              <RunStatusBadge status={run.status} />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {latestEvent?.message ??
                'Astra is preparing buyer research for this domain.'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[320px]">
            <Metric label="Leads" value={run.leadCount} />
            <Metric label="Contacts" value={run.contactCount} />
            <Metric label="Drafts" value={run.draftCount} />
          </div>
        </div>

        {isRunning && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300" />
          </div>
        )}
      </div>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-auto p-5">
          {run.intentQueries.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Buyer intent buckets
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
                Category leads ({buckets.general.length})
              </TabsTrigger>
              <TabsTrigger value="substring">
                Exact matches ({buckets.substring.length})
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
    </div>
  );
}

function LeadList({ leads }: { leads: LeadgenLead[] }) {
  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
        Leads will appear here as soon as the run finds them.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {leads.map((lead) => (
        <LeadCard key={`${lead.bucket}-${lead.businessDomain}`} lead={lead} />
      ))}
    </div>
  );
}

function LeadCard({ lead }: { lead: LeadgenLead }) {
  const primaryDraft = lead.drafts[0];
  const primaryContact = lead.contacts[0];

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
            <Badge variant="secondary">{lead.bucket}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {lead.rationale}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <TinyStat icon={Mail} label={`${lead.contacts.length} contacts`} />
          <TinyStat icon={Sparkles} label={`${lead.drafts.length} drafts`} />
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border/60 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
        {lead.content}
      </div>

      {(primaryContact || primaryDraft) && (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {primaryContact && (
            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
                Contact
              </p>
              <p className="mt-1 text-sm font-medium">
                {primaryContact.name || primaryContact.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {primaryContact.title || primaryContact.email}
              </p>
            </div>
          )}
          {primaryDraft && (
            <div className="rounded-md border border-cyan-500/20 bg-cyan-500/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
                    Draft
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {primaryDraft.subject}
                  </p>
                </div>
                <Button
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
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Timeline({
  events,
  isRunning,
}: {
  events: LeadgenSnapshot['events'];
  isRunning: boolean;
}) {
  const visibleEvents = events
    .filter((event) => event.message && !event.transient)
    .slice(-18)
    .reverse();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Run timeline
        </p>
        {isRunning && <Loader2 className="size-4 animate-spin text-cyan-300" />}
      </div>
      <div className="space-y-3">
        {visibleEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Events will appear after the worker claims this run.
          </p>
        ) : (
          visibleEvents.map((event) => (
            <div key={event.id} className="flex gap-3">
              <div className="mt-1 size-2 rounded-full bg-cyan-300" />
              <div className="min-w-0">
                <p className="text-sm">{event.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(event.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
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
        <h2 className="text-sm font-semibold">Past runs</h2>
        <Clock3 className="size-4 text-muted-foreground" />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Your completed and in-progress runs will stay here.
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
          Astra will infer buyer angles, search for company websites, find
          public emails for the first leads, and draft outreach as results land.
        </p>
      </div>
    </div>
  );
}

function LeadgenSkeleton() {
  return (
    <PageShell size="full" padding="none" shellClassName="px-5 py-6 lg:px-8">
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Skeleton className="h-[520px] rounded-lg" />
        <Skeleton className="h-[620px] rounded-lg" />
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function TinyStat({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
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
      {status.toLowerCase()}
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
