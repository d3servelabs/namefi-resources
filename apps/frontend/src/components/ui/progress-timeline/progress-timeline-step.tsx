'use client';

import { cn } from '@/lib/cn';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';
import { ChevronRight } from 'lucide-react';
import { ProgressTimelineIcon } from './progress-timeline-icon';
import type { StepDisplayInfo, StepStatus, TimelineStep } from './types';

interface ProgressTimelineStepProps {
  status: StepStatus;
  label: string;
  helper: string;
  isActive?: boolean;
  /** Substeps for nested workflows */
  substeps?: TimelineStep[];
  /** Display info for substeps (required if substeps are provided) */
  substepDisplayInfo?: Record<string, StepDisplayInfo>;
}

const statusLabelMap: Record<StepStatus, string> = {
  COMPLETED: 'Complete',
  IN_PROGRESS: 'In progress',
  FAILED: 'Needs attention',
  SKIPPED: 'Skipped',
  PENDING: 'Pending',
};

function StepStatusPill({ status }: { status: StepStatus }) {
  const label = statusLabelMap[status] ?? status;

  const toneClass =
    status === 'COMPLETED'
      ? 'bg-emerald-500/15 text-emerald-600'
      : status === 'IN_PROGRESS'
        ? 'bg-brand-primary/10 text-brand-primary'
        : status === 'FAILED'
          ? 'bg-amber-500/15 text-amber-600'
          : 'bg-muted/40 text-muted-foreground';

  return (
    <span
      className={cn(
        'rounded-full px-2 py-1 text-xs font-medium capitalize',
        toneClass,
      )}
    >
      {label}
    </span>
  );
}

/**
 * A single step in the progress timeline.
 * Supports nested substeps that can be expanded/collapsed.
 */
export function ProgressTimelineStep({
  status,
  label,
  helper,
  isActive = false,
  substeps,
  substepDisplayInfo,
}: ProgressTimelineStepProps) {
  const hasSubsteps = substeps && substeps.length > 0;

  // Simple step without substeps
  if (!hasSubsteps) {
    return (
      <li
        className={cn(
          'flex items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors',
          isActive
            ? 'border-brand-primary/30 bg-brand-primary/5'
            : 'bg-muted/10',
        )}
      >
        <span className="mt-0.5">
          <ProgressTimelineIcon status={status} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <StepStatusPill status={status} />
      </li>
    );
  }

  // Step with substeps - render as collapsible
  return (
    <li>
      <Collapsible defaultOpen={status === 'IN_PROGRESS'}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2 transition-colors text-left group',
              isActive
                ? 'border-brand-primary/30 bg-brand-primary/5'
                : 'bg-muted/10 hover:bg-muted/20',
            )}
          >
            <span className="mt-0.5">
              <ProgressTimelineIcon status={status} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{helper}</p>
            </div>
            <div className="flex items-center gap-2">
              <StepStatusPill status={status} />
              <ChevronRight className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ul className="ml-6 mt-1 space-y-1 border-l-2 border-muted/30 pl-4">
            {substeps.map((substep) => {
              const displayInfo = substepDisplayInfo?.[substep.id];
              return (
                <li
                  key={substep.id}
                  className="flex items-start gap-2 py-1.5 text-sm"
                >
                  <span className="mt-0.5">
                    <ProgressTimelineIcon status={substep.status} size="sm" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/80">
                      {displayInfo?.label ?? substep.id}
                    </p>
                    {displayInfo?.helper && (
                      <p className="text-xs text-muted-foreground truncate">
                        {displayInfo.helper}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs',
                      substep.status === 'COMPLETED' && 'text-emerald-600',
                      substep.status === 'IN_PROGRESS' && 'text-brand-primary',
                      substep.status === 'FAILED' && 'text-amber-600',
                      substep.status === 'SKIPPED' && 'text-muted-foreground',
                      substep.status === 'PENDING' && 'text-muted-foreground',
                    )}
                  >
                    {statusLabelMap[substep.status]}
                  </span>
                </li>
              );
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}
