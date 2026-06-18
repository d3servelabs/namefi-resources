import { createLogger } from '#lib/logger';

const logger = createLogger({ module: 'workflow-stage-marker' });

export interface WorkflowMarkerInput {
  /** Short marker message, e.g. 'round 0 · batch 1 · launched'. */
  message: string;
  /** Structured context attached to the marker (counts, kinds, ids). */
  details?: Record<string, unknown>;
}

/**
 * `marker` — a LOG-only LOCAL activity used as a STAGE FINISH MARKER.
 *
 * Proxied from workflows via `proxyLocalActivities`, so it runs in-process on the
 * worker executing the workflow (no task-queue routing) and is registered on EVERY
 * task queue. Each call records a local-activity marker in workflow history — so
 * the Temporal UI timeline shows each stage's COMPLETION with its details — and
 * emits a structured worker log. It NEVER throws: a marker must never affect the
 * workflow it annotates.
 *
 * This replaces the prior 1ms `workflow.sleep` timer markers: a logFunction local
 * activity carries structured `details` (a timer's `summary` is a bare string) and
 * doubles as a worker-log breadcrumb. The per-call UI `summary` shown on the
 * activity is supplied by the caller's proxy options (a per-proxy field), so the
 * caller mints one proxy per marker with `summary` set to the message — see
 * `markerLocalActivities` in `staggered-send-race.ts`.
 */
export const workflowMarkerActivities = {
  async marker(input: WorkflowMarkerInput): Promise<void> {
    try {
      logger.info(
        { context: '[Temporal] stage-marker', ...input.details },
        input.message,
      );
    } catch {
      // A marker must never affect the workflow it annotates.
    }
  },
};

export type WorkflowMarkerActivities = typeof workflowMarkerActivities;
