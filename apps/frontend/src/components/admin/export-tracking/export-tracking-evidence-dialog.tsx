'use client';

import { useState } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { RefreshCw, Search, Sparkles } from 'lucide-react';
import type { EvidenceSourceEntry } from './types';

/** Human label per per-source evidence status. */
const SOURCE_STATUS_LABEL: Record<EvidenceSourceEntry['status'], string> = {
  positive_pending: 'Pending transfer',
  positive_period: 'Transfer period',
  positive_completed: 'Completed (gone)',
  positive_failed: 'Failed',
  negative: 'Present / no signal',
  no_data: 'No data',
  error: 'Error',
};

const POSITIVE_STATUSES: EvidenceSourceEntry['status'][] = [
  'positive_pending',
  'positive_period',
  'positive_completed',
  'positive_failed',
];

type GatherResult = {
  domain: string;
  chainId: number;
  status: string;
  evidence: EvidenceSourceEntry[];
  decision: { action: string; reason: string };
  gatheredAt: string;
};

type SummaryResult = {
  summary: string | null;
  reasoning: string | null;
  model: string | null;
};

/** One re-gathered source as a labeled row with a status chip + optional error. */
function SourceRow({ entry }: { entry: EvidenceSourceEntry }) {
  const positive = POSITIVE_STATUSES.includes(entry.status);
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{entry.source}</span>
      <span className="flex flex-col items-end gap-0.5 text-end">
        <Badge variant={positive ? 'default' : 'outline'}>
          {SOURCE_STATUS_LABEL[entry.status] ?? entry.status}
        </Badge>
        {entry.error ? (
          <span className="text-xs text-destructive break-all">
            {entry.error}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * AI brief (DeepSeek) for the re-gathered evidence — its own query so the slower
 * model call never blocks the evidence display, fired only once evidence is in.
 */
function EvidenceAiSummary({
  recordId,
  result,
}: {
  recordId: string;
  result: GatherResult;
}) {
  const trpc = useTRPC();
  const summaryQuery = useQuery({
    ...trpc.admin.exportTracking.summarizeExportEvidence.queryOptions({
      id: recordId,
      evidence: result.evidence,
      decisionAction: result.decision.action,
      decisionReason: result.decision.reason,
    }),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const data = summaryQuery.data as SummaryResult | undefined;

  return (
    <div className="space-y-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-blue-400" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          AI summary
        </h3>
        {data?.model ? (
          <Badge variant="outline" className="text-xs">
            {data.model}
          </Badge>
        ) : null}
      </div>
      {summaryQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Generating AI summary… (the model reasons before answering, so this
          can take a moment)
        </p>
      ) : summaryQuery.isError ? (
        <p className="text-sm text-red-500">
          Failed: {summaryQuery.error.message}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => summaryQuery.refetch()}
          >
            retry
          </button>
        </p>
      ) : data?.summary != null ? (
        <>
          <p className="whitespace-pre-wrap text-sm text-foreground/90">
            {data.summary || 'No summary text returned by the model.'}
          </p>
          {data.reasoning ? (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground">
                Show reasoning
              </summary>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {data.reasoning}
              </p>
            </details>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          AI summary unavailable — DeepSeek is not configured
          (`DEEPSEEK_API_KEY`).
        </p>
      )}
    </div>
  );
}

/**
 * Lazy evidence panel: re-gathers evidence server-side on demand (the same
 * context-free gather the workflow uses), shows the per-source verdicts + the
 * decision it would produce now, then offers an AI brief. Read-only — it does
 * not write to the tracking row.
 */
function EvidencePanel({ recordId }: { recordId: string }) {
  const trpc = useTRPC();
  const [enabled, setEnabled] = useState(false);
  const evidenceQuery = useQuery({
    ...trpc.admin.exportTracking.gatherExportEvidence.queryOptions({
      id: recordId,
    }),
    enabled,
    staleTime: 60_000,
  });
  const result = evidenceQuery.data as GatherResult | undefined;

  if (!enabled) {
    return (
      <Button
        data-testid="admin.export-tracking.gather-evidence-button"
        size="sm"
        variant="outline"
        onClick={() => setEnabled(true)}
      >
        <Search className="h-3.5 w-3.5 me-1.5" />
        Re-gather evidence
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {evidenceQuery.isFetching
            ? 'Gathering evidence…'
            : result
              ? `Gathered ${new Date(result.gatheredAt).toLocaleString()}`
              : ''}
        </span>
        <Button
          size="sm"
          variant="ghost"
          disabled={evidenceQuery.isFetching}
          onClick={() => evidenceQuery.refetch()}
        >
          <RefreshCw
            className={cn(
              'h-3.5 w-3.5 me-1.5',
              evidenceQuery.isFetching && 'animate-spin',
            )}
          />
          Refresh
        </Button>
      </div>

      {evidenceQuery.isError ? (
        <p className="text-sm text-red-500">
          Failed: {evidenceQuery.error.message}{' '}
          <button
            type="button"
            className="underline"
            onClick={() => evidenceQuery.refetch()}
          >
            retry
          </button>
        </p>
      ) : result ? (
        <>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Decision now</span>
              <Badge variant="secondary">{result.decision.action}</Badge>
            </div>
            <p className="mt-1 break-words text-muted-foreground">
              {result.decision.reason}
            </p>
          </div>

          <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
            {result.evidence.map((entry) => (
              <SourceRow key={entry.source} entry={entry} />
            ))}
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              View raw evidence JSON
            </summary>
            <pre className="mt-1 max-h-80 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
              {JSON.stringify(result.evidence, null, 2)}
            </pre>
          </details>

          <EvidenceAiSummary recordId={recordId} result={result} />
        </>
      ) : null}
    </div>
  );
}

/**
 * Per-row "Decision support" dialog: lets an admin re-gather export evidence on
 * demand and get a DeepSeek brief, mirroring the decision-gates evidence panel.
 */
export function ExportTrackingEvidenceDialog({
  recordId,
  domain,
  'data-testid': testId,
}: {
  recordId: string;
  domain: string;
  'data-testid'?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button size="sm" variant="outline" data-testid={testId} />}
      >
        <Search className="h-3.5 w-3.5 me-1.5" />
        Evidence
      </DialogTrigger>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          // Tailwind v4 important is a SUFFIX (`max-w-3xl!`); the base
          // DialogContent pins `sm:max-w-md`, so without it the modal renders
          // narrow. Wide enough for the per-source verdicts + JSON + AI brief.
          'max-w-3xl! max-h-[85vh] overflow-y-auto',
        )}
      >
        <DialogHeader>
          <DialogTitle>Decision support</DialogTitle>
          <DialogDescription>
            Re-gather live evidence for{' '}
            <span className="break-all font-mono">{domain}</span> and get an AI
            brief. Read-only — this does not change the tracking row.
          </DialogDescription>
        </DialogHeader>
        <EvidencePanel recordId={recordId} />
      </DialogContent>
    </Dialog>
  );
}
