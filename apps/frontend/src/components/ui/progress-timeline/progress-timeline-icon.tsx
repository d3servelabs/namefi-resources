import {
  CheckCircle2,
  Clock,
  Loader2,
  MinusCircle,
  XCircle,
} from 'lucide-react';
import type { StepStatus } from './types';

interface ProgressTimelineIconProps {
  status: StepStatus;
  className?: string;
}

/**
 * Renders an icon based on the step status.
 */
export function ProgressTimelineIcon({
  status,
  className,
}: ProgressTimelineIconProps) {
  const baseClass = className ?? 'h-5 w-5';

  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className={`${baseClass} text-emerald-500`} />;
    case 'IN_PROGRESS':
      return (
        <Loader2 className={`${baseClass} text-brand-primary animate-spin`} />
      );
    case 'FAILED':
      return <XCircle className={`${baseClass} text-amber-500`} />;
    case 'SKIPPED':
      return <MinusCircle className={`${baseClass} text-muted-foreground`} />;
    case 'PENDING':
      return <Clock className={`${baseClass} text-muted-foreground`} />;
  }
}
