'use client';

import { useMemo, type ReactNode } from 'react';
import { ProgressTimelineStep } from './progress-timeline-step';
import { ProgressTimelineSkeleton } from './progress-timeline-skeleton';
import type { StepDisplayInfo, TimelineStep } from './types';
import { cn } from '@namefi-astra/ui/lib/cn';

interface ProgressTimelineProps<TStepId extends string = string> {
  /** Whether the timeline is in a loading state */
  loading?: boolean;
  /** The steps to display */
  steps: TimelineStep[];
  /** Map of step IDs to display labels and helpers */
  stepDisplayInfo: Record<TStepId, StepDisplayInfo>;
  /** Optional title shown above the timeline */
  title?: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional badge component to show status */
  badge?: ReactNode;
  /** Override the active step detection */
  activeStepId?: string | null;
  /** Number of skeleton steps to show when loading */
  skeletonStepCount?: number;
  /** Map of substep IDs to display labels and helpers (for nested workflows) */
  substepDisplayInfo?: Record<string, StepDisplayInfo>;
  /** Function to get substep display info for a specific step (alternative to substepDisplayInfo) */
  getSubstepDisplayInfo?: (
    stepId: string,
  ) => Record<string, StepDisplayInfo> | undefined;
  /** Whether to show the title */
  showTitle?: boolean;
  className?: string;
}

/**
 * A generic progress timeline component for displaying workflow progress.
 *
 * @example
 * ```tsx
 * const stepDisplayInfo = {
 *   'check-support': { label: 'Checking support', helper: 'Verifying DNSSEC compatibility' },
 *   'enable-zone': { label: 'Enabling zone', helper: 'Configuring DNS zone' },
 * };
 *
 * <ProgressTimeline
 *   loading={isLoading}
 *   steps={workflowState.steps}
 *   stepDisplayInfo={stepDisplayInfo}
 *   title="Enabling DNSSEC"
 *   subtitle="Securing your domain"
 * />
 * ```
 */
export function ProgressTimeline<TStepId extends string = string>({
  loading = false,
  steps,
  stepDisplayInfo,
  title,
  subtitle,
  badge,
  activeStepId: activeStepIdOverride,
  skeletonStepCount,
  substepDisplayInfo,
  getSubstepDisplayInfo,
  className,
  showTitle = true,
}: ProgressTimelineProps<TStepId>) {
  // Compute active step if not overridden
  const activeStepId = useMemo(() => {
    if (activeStepIdOverride !== undefined) {
      return activeStepIdOverride;
    }
    const active =
      steps.find((step) => step.status === 'IN_PROGRESS') ??
      steps.find((step) => step.status === 'PENDING');
    return active?.id ?? null;
  }, [steps, activeStepIdOverride]);

  // Compute title from active step if not provided
  const effectiveTitle = useMemo(() => {
    if (title) return title;
    if (activeStepId && stepDisplayInfo[activeStepId as TStepId]) {
      return stepDisplayInfo[activeStepId as TStepId].label;
    }
    return 'Processing...';
  }, [title, activeStepId, stepDisplayInfo]);

  if (loading) {
    return (
      <ProgressTimelineSkeleton
        stepCount={skeletonStepCount ?? Object.keys(stepDisplayInfo).length}
      />
    );
  }

  const hasHeader = showTitle || !!badge;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-background/60 p-6 shadow-sm',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {showTitle && (
            <div>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
              <h2 className="text-xl font-semibold">{effectiveTitle}</h2>
            </div>
          )}
          {badge}
        </div>
      )}

      <ol className={cn('space-y-4', hasHeader && 'mt-5')}>
        {steps.map((step) => {
          const display = stepDisplayInfo[step.id as TStepId];
          if (!display) {
            return null;
          }
          const stepSubstepDisplayInfo =
            getSubstepDisplayInfo?.(step.id) ?? substepDisplayInfo;
          return (
            <ProgressTimelineStep
              key={step.id}
              status={step.status}
              label={display.label}
              helper={step.message ?? display.helper}
              isActive={step.id === activeStepId}
              substeps={step.substeps}
              substepDisplayInfo={stepSubstepDisplayInfo}
            />
          );
        })}
      </ol>
    </div>
  );
}
