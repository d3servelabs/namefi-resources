'use client';

import { config } from '@/lib/env';
import {
  POLL_INTERVAL_MS,
  RELOAD_COUNTDOWN_SECONDS,
  UPDATE_TOAST_ID,
  fetchBuildId,
  isKnownBuildId,
  shouldPromptReload,
} from '@/lib/deployment-update';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/** Build id baked into the bundle currently running in this browser tab. */
const CURRENT_BUILD_ID = config.DEPLOY_COMMIT_SHA;

function reloadNow(): void {
  window.location.reload();
}

/**
 * Self-contained countdown rendered inside the persistent update toast. Owns its
 * own timer so it ticks independently of Sonner's internal re-renders, and
 * hard-reloads the page when the countdown reaches zero.
 */
function ReloadCountdownToast() {
  const [secondsLeft, setSecondsLeft] = useState(RELOAD_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      reloadNow();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return (
    <div
      role="status"
      className={cn(
        'flex w-[356px] max-w-[calc(100vw-2rem)] items-center gap-3',
        'rounded-lg border border-border bg-popover px-4 py-3',
        'text-popover-foreground shadow-lg',
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">App has updated</span>
        <span className="text-xs text-muted-foreground">
          Reloading in {secondsLeft}...
        </span>
      </div>
      <Button
        size="sm"
        type="button"
        className="ml-auto shrink-0"
        onClick={reloadNow}
      >
        Reload Now
      </Button>
    </div>
  );
}

/**
 * Invisible global watcher: polls `/api/build-id` and, once the serving
 * deployment's build id differs from the one this tab is running, shows a
 * one-time countdown toast that reloads the page onto the new deployment.
 *
 * Inert outside real deployments — when `DEPLOY_COMMIT_SHA` is `unknown` (local
 * dev / missing CI env) the query is disabled and nothing is ever shown.
 */
export function DeploymentUpdateToast() {
  const hasTriggeredRef = useRef(false);

  const { data: latestBuildId } = useQuery({
    queryKey: ['deployment-build-id'],
    queryFn: ({ signal }) => fetchBuildId(signal),
    enabled: isKnownBuildId(CURRENT_BUILD_ID),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    if (!shouldPromptReload(CURRENT_BUILD_ID, latestBuildId)) return;

    hasTriggeredRef.current = true;
    toast.custom(() => <ReloadCountdownToast />, {
      id: UPDATE_TOAST_ID,
      duration: Number.POSITIVE_INFINITY,
      dismissible: false,
    });
  }, [latestBuildId]);

  return null;
}
