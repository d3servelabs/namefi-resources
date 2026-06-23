'use client';

import {
  FeedbackToastContent,
  type FeedbackToastCopy,
} from '@/components/feedback/feedback-toast';
import { LocalStorageKeys } from '@/lib/local-storage-keys';
import { capturePostHogEvent, isPostHogConfigured } from '@/lib/posthog';
import { useTRPC } from '@/lib/trpc';
import type { feedbackTriggerSchema } from '@/lib/feedback-triggers';
import { useConsentManager } from '@c15t/nextjs';
import { useMutation } from '@tanstack/react-query';
import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { useLocalStorage } from 'usehooks-ts';
import { useAuth } from '@/hooks/use-auth';

type FeedbackTrigger = z.infer<typeof feedbackTriggerSchema>;

type FeedbackEntry = {
  id?: string | null;
  rating?: number | null;
  message?: string | null;
};

type FeedbackState = {
  lastPromptedAt?: string;
  lastSubmittedAt?: string;
  lastDismissedAt?: string;
  lastTrigger?: FeedbackTrigger;
  lastMilestonePromptedAt?: string;
  entries?: Partial<Record<FeedbackTrigger, FeedbackEntry>>;
};
type FeedbackSubmissions = Record<
  string,
  {
    id: string;
    trigger: FeedbackTrigger;
    rating: number;
    message?: string | null;
    submittedAt?: string;
    claimed?: boolean;
  }
>;

type FeedbackContextValue = {
  requestFeedback: (
    trigger: FeedbackTrigger,
    options?: { force?: boolean },
  ) => boolean;
  hasIdentity: boolean;
};

const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined,
);

const FEEDBACK_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1_000; // avoid re-prompting more than once a day
const MILESTONE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1_000; // 30 days between milestone triggers
const ENABLE_ANONYMOUS_CLAIMING = false;

const FEEDBACK_TOAST_IDS: Record<FeedbackTrigger, string> = {
  MILESTONE_CHECKOUT_SUCCESS: 'feedback-checkout-toast',
  MILESTONE_LOGO_GENERATED: 'feedback-milestone-toast',
  MILESTONE_DNS_UPDATED: 'feedback-milestone-toast',
};

const MILESTONE_FEEDBACK_COPY: FeedbackToastCopy = {
  title: 'Enjoying Namefi?',
  description: 'Tell us what feels great and what is rough around the edges.',
  placeholder: 'What is working well? Where did you get stuck?',
};

const FEEDBACK_COPY: Record<FeedbackTrigger, FeedbackToastCopy> = {
  MILESTONE_CHECKOUT_SUCCESS: {
    title: 'Thanks for your purchase!',
    description:
      'Mind telling us how checkout felt? Two lines help us polish the flow.',
    placeholder:
      'Tell us about speed, clarity, or anything surprising during checkout.',
  },
  MILESTONE_LOGO_GENERATED: MILESTONE_FEEDBACK_COPY,
  MILESTONE_DNS_UPDATED: MILESTONE_FEEDBACK_COPY,
};

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}

export function FeedbackProvider({ children }: PropsWithChildren) {
  const trpc = useTRPC();
  const { consents, isLoadingConsentInfo } = useConsentManager();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const canMirrorFeedbackToPostHog =
    !isLoadingConsentInfo && consents.measurement && isPostHogConfigured();
  const canMirrorFeedbackToPostHogRef = useRef(false);

  const [feedbackState, setFeedbackState] = useLocalStorage<FeedbackState>(
    LocalStorageKeys.FEEDBACK_PROMPT_STATE,
    {},
    { initializeWithValue: false },
  );
  const [feedbackSubmissions, setFeedbackSubmissions] =
    useLocalStorage<FeedbackSubmissions>(
      LocalStorageKeys.FEEDBACK_SUBMISSIONS,
      {},
      { initializeWithValue: false },
    );
  const [hasHydrated, setHasHydrated] = useState(false);
  const lastClaimKeyRef = useRef<string>('');

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    canMirrorFeedbackToPostHogRef.current = canMirrorFeedbackToPostHog;
  }, [canMirrorFeedbackToPostHog]);

  const markDismissed = useCallback(
    (at: Date = new Date()) => {
      setFeedbackState((prev) => ({
        ...prev,
        lastDismissedAt: at.toISOString(),
      }));
    },
    [setFeedbackState],
  );

  const openFeedbackToast = useCallback(
    (trigger: FeedbackTrigger) => {
      const copy = FEEDBACK_COPY[trigger];
      const entry = feedbackState.entries?.[trigger];

      toast.custom(
        (toastId) => (
          <FeedbackToastContent
            toastId={toastId}
            copy={copy}
            initialRating={entry?.rating}
            initialMessage={entry?.message ?? undefined}
            initialFeedbackId={entry?.id ?? undefined}
            onShownAction={(shownAtIso) => {
              setFeedbackState((prev) => ({
                ...prev,
                lastPromptedAt: shownAtIso,
                lastTrigger: trigger,
                lastMilestonePromptedAt: shownAtIso,
              }));
            }}
            onSavedAction={({
              id,
              rating,
              message,
              saveSource,
              submittedAt,
            }) => {
              if (
                saveSource === 'form_submit' &&
                canMirrorFeedbackToPostHogRef.current
              ) {
                const trimmedMessage = message?.trim() ?? '';

                void capturePostHogEvent('feedback_toast_saved', {
                  feedback_id: id,
                  trigger,
                  rating,
                  message: trimmedMessage || null,
                  has_message: Boolean(trimmedMessage),
                  message_length: trimmedMessage.length,
                  submitted_at: new Date().toISOString(),
                  source: 'feedback_toast',
                });
              }

              setFeedbackSubmissions((prev) => ({
                ...prev,
                [id]: {
                  id,
                  trigger,
                  rating,
                  message,
                  submittedAt,
                  claimed: prev[id]?.claimed ?? false,
                },
              }));
              setFeedbackState((prev) => ({
                ...prev,
                lastSubmittedAt: submittedAt,
                lastDismissedAt: undefined,
                lastTrigger: trigger,
                entries: {
                  ...(prev.entries ?? {}),
                  [trigger]: { id, rating, message },
                },
              }));
            }}
            onDismissAction={() => {
              markDismissed();
            }}
          />
        ),
        {
          id: FEEDBACK_TOAST_IDS[trigger],
          duration: Number.POSITIVE_INFINITY,
          position: 'bottom-right',
        },
      );
    },
    [feedbackState, markDismissed, setFeedbackState, setFeedbackSubmissions],
  );

  const {
    mutate: claimAnonymousFeedback,
    isPending: isClaimAnonymousFeedbackPending,
  } = useMutation({
    ...trpc.feedback.claimAnonymous.mutationOptions({
      onError: (error) => {
        console.error('[feedback] claim failed', error);
      },
      onSuccess: (_data, variables) => {
        if (!userId) {
          return;
        }

        const attemptedIds = variables?.feedbackIds ?? [];
        if (!attemptedIds.length) {
          return;
        }

        setFeedbackSubmissions((prev) => {
          const next = { ...prev };
          attemptedIds.forEach((id) => {
            const existing = next[id];
            if (existing) {
              next[id] = { ...existing, claimed: true };
            }
          });
          return next;
        });
      },
    }),
  });

  const claimableIds = useMemo(() => {
    if (!userId) return [];
    const ids = Object.values(feedbackSubmissions)
      .filter((entry) => entry.id && !entry.claimed)
      .map((entry) => entry.id);
    return ids.sort();
  }, [feedbackSubmissions, userId]);

  const claimKey = useMemo(() => {
    if (!userId || !claimableIds.length) return '';
    return `${userId}:${claimableIds.join(',')}`;
  }, [claimableIds, userId]);

  useEffect(() => {
    if (!ENABLE_ANONYMOUS_CLAIMING) return;
    if (!userId) return;
    if (!claimKey) return;
    if (isClaimAnonymousFeedbackPending) return;
    if (lastClaimKeyRef.current === claimKey) return;

    lastClaimKeyRef.current = claimKey;
    claimAnonymousFeedback({
      feedbackIds: claimableIds,
    });
  }, [
    claimAnonymousFeedback,
    claimKey,
    claimableIds,
    isClaimAnonymousFeedbackPending,
    userId,
  ]);

  const requestFeedback = useCallback(
    (trigger: FeedbackTrigger, options?: { force?: boolean }) => {
      if (!hasHydrated && !options?.force) {
        return false;
      }

      const now = new Date();
      const state = feedbackState;
      const lastPrompted =
        state.lastPromptedAt && new Date(state.lastPromptedAt);
      const lastDismissed =
        state.lastDismissedAt && new Date(state.lastDismissedAt);
      const lastMilestonePrompted =
        state.lastMilestonePromptedAt &&
        new Date(state.lastMilestonePromptedAt);

      if (!options?.force) {
        if (
          lastPrompted &&
          now.getTime() - lastPrompted.getTime() < FEEDBACK_PROMPT_COOLDOWN_MS
        ) {
          return false;
        }
        if (
          lastDismissed &&
          now.getTime() - lastDismissed.getTime() < FEEDBACK_PROMPT_COOLDOWN_MS
        ) {
          return false;
        }

        if (
          lastMilestonePrompted &&
          now.getTime() - lastMilestonePrompted.getTime() <
            MILESTONE_COOLDOWN_MS
        ) {
          return false;
        }
      }

      openFeedbackToast(trigger);
      return true;
    },
    [feedbackState, hasHydrated, openFeedbackToast],
  );

  // Feedback is solicited only when product code calls requestFeedback after a
  // meaningful event. The old time-spent tracker was removed so idle browsing
  // never writes usage counters or opens usage-time prompts.

  return (
    <FeedbackContext.Provider
      value={{
        requestFeedback,
        hasIdentity: Boolean(userId),
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}
