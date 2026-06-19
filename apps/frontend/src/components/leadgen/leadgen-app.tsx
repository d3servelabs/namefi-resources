'use client';

import { AuthRequired } from '@/components/auth-required';
import { GenerationUsage } from '@/components/ai-generation/generation-usage';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { DomainSearchCombobox } from '@/components/domain-search-combobox';
import { PageShell } from '@/components/page-shell';
import { useAuth } from '@/hooks/use-auth';
import { useDomainSearchOptions } from '@/hooks/use-domain-search-options';
import {
  MARKETPLACE_LISTINGS_FLAG,
  useBooleanOpenFeatureFlag,
} from '@/lib/openfeature-flags';
import {
  getCurrentReturnPath,
  usePostAuthIntentExecutor,
  useRequirePostAuthIntent,
  type PostAuthIntentFor,
} from '@/hooks/use-post-auth-intent';
import { isChainSupportedByAnyMarketplace } from '@/lib/marketplaces/chains';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import {
  getLeadgenOutreachCreditEstimate,
  getLeadgenRunCreditEstimate,
} from '@namefi-astra/common/ai-generation-credits';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils/contract-addresses';
import {
  isLeadgenLeadOrderCustomized,
  reconcileLeadgenLeadOrder,
} from '@namefi-astra/common/leadgen-order';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@namefi-astra/ui/components/shadcn/radio-group';
import { ScrollAreaContent } from '@namefi-astra/ui/components/namefi/scroll-area-content';
import { ScrollArea } from '@namefi-astra/ui/components/shadcn/scroll-area';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { LeadgenUserSignalState } from '@namefi-astra/common/contract/leadgen-contract';
import {
  closestCorners,
  closestCenter,
  DragOverlay,
  DndContext,
  getFirstCollision,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DroppableContainer,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@trpc/tanstack-react-query';
import {
  ArrowUpRight,
  Building2,
  ChevronDown,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  EyeOff,
  ExternalLink,
  FileText,
  GripVertical,
  Info,
  ListChecks,
  Loader2,
  Mail,
  Play,
  RotateCcw,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
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
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  buildLeadgenCrmCsv,
  isLeadgenCrmCsvExportAvailable,
} from './leadgen-export';
import {
  areLeadIdsEqual,
  flattenSectionLeadIds,
  getDropTargetSectionId,
  getLeadSectionIdByLeadId,
  getSectionLeadIds,
  getSectionUserSignalState,
  leadOrganizationSectionIds,
  moveLeadInSections,
  moveLeadToSectionEnd,
  type LeadOrganizationSectionId,
  type LeadSectionLeadIds,
} from './leadgen-lead-sections';
import { buildMailtoHref } from './leadgen-mailto';
import {
  buildLeadPresentationModel,
  isTerminalLeadgenStatus,
  type LeadPresentation,
  type LeadPresentationModel,
} from './leadgen-presentation';
import { upsertLeadgenRunByCreatedDesc } from './leadgen-run-order';

type LeadgenSnapshot = AppRouterOutput['leadgen']['getRun'];
type LeadgenRunSummary = AppRouterOutput['leadgen']['listRuns'][number];
type UserDomain = AppRouterOutput['users']['getCurrentUserDomains'][number];
type LeadgenStartSuggestion = {
  domain: string;
  reason: 'parked' | 'unconfigured' | 'active' | 'owned';
  hasPreviousRun: boolean;
};
type LeadgenLeadSignalUpdate = {
  leadId: string;
  state: LeadgenUserSignalState;
};
type LeadOrderSaveOptions = {
  signalUpdates?: LeadgenLeadSignalUpdate[];
  onSaved?: () => void;
  onError?: () => void;
  onSettled?: () => void;
};
type LeadgenLead = LeadgenSnapshot['leads'][number];
type LeadgenEvent = LeadgenSnapshot['events'][number];
type DisplayableLeadgenEvent = LeadgenEvent & { message: string };
type LeadgenContact = LeadgenLead['contacts'][number];
type UserGenerationUsage = AppRouterOutput['ai']['getUserGenerationUsage'];
type ReasoningEffort = LeadgenSnapshot['reasoningEffort'];
type LeadgenStartRunPayload = {
  domain: string;
  reasoningEffort: ReasoningEffort;
};
type UnownedDomainRunConfirmation = {
  payload: LeadgenStartRunPayload;
  estimatedCredits?: number;
};
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
const HOW_TO_SELL_DOMAIN_BLOG_HREF =
  '/r/en/blog/how-to-sell-a-domain-name-you-own' as Route;
const CreateListingModal = dynamic(
  () =>
    import(
      '@/components/domain-and-dns-managment/panels/marketplace/create-listing-modal-runtime'
    ).then((m) => m.CreateListingModalRuntime),
  { ssr: false },
);
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
const recentRunsQueryInput = { limit: 12 };
const runListEdgeFadeMask =
  'linear-gradient(to bottom, transparent 0, black min(24px, var(--scroll-area-overflow-y-start)), black calc(100% - min(24px, var(--scroll-area-overflow-y-end, 24px))), transparent 100%)';
const runListScrollAreaStyle: CSSProperties & {
  '--leadgen-run-list-edge-fade-mask': string;
} = {
  '--leadgen-run-list-edge-fade-mask': runListEdgeFadeMask,
};
const runListScrollAreaClassName = cn(
  '[&_[data-slot=scroll-area-viewport]]:max-h-[24rem]',
  '[&_[data-slot=scroll-area-viewport]]:pe-3',
  '[&_[data-slot=scroll-area-viewport]]:[-webkit-mask-image:var(--leadgen-run-list-edge-fade-mask)]',
  '[&_[data-slot=scroll-area-viewport]]:[-webkit-mask-repeat:no-repeat]',
  '[&_[data-slot=scroll-area-viewport]]:[mask-image:var(--leadgen-run-list-edge-fade-mask)]',
  '[&_[data-slot=scroll-area-viewport]]:[mask-repeat:no-repeat]',
);
const RUN_LIST_VIEWPORT_SELECTOR = '[data-slot="scroll-area-viewport"]';
const leadLayoutTransition = {
  type: 'spring',
  stiffness: 380,
  damping: 38,
  mass: 0.8,
} as const;
const leadSortableTransition = {
  duration: 170,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
const leadDropAnimation = {
  duration: 160,
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;
const leadDndMeasuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
} as const;
const leadKeyboardDirections: string[] = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left,
];
type LeadCollisionDetectionArgs = Parameters<CollisionDetection>[0];

const leadMultipleContainersKeyboardCoordinates: KeyboardCoordinateGetter = (
  event,
  { context: { active, collisionRect, droppableContainers, droppableRects } },
) => {
  if (!leadKeyboardDirections.includes(event.code)) {
    return undefined;
  }

  event.preventDefault();

  if (!active || !collisionRect) {
    return undefined;
  }

  const filteredContainers = droppableContainers.getEnabled().filter((entry) =>
    isLeadKeyboardDroppableCandidate({
      active,
      collisionRect,
      droppableRects,
      entry,
      eventCode: event.code,
    }),
  );
  const closestId = getFirstCollision(
    closestCorners({
      active,
      collisionRect,
      droppableContainers: filteredContainers,
      droppableRects,
      pointerCoordinates: null,
    }),
    'id',
  );

  if (closestId == null) {
    return undefined;
  }

  const newDroppable = droppableContainers.get(closestId);
  const newNode = newDroppable?.node.current;
  const newRect = newDroppable?.rect.current;

  if (!newNode || !newRect) {
    return undefined;
  }

  if (newDroppable.data.current?.type === 'section') {
    return {
      x: newRect.left + 20,
      y: newRect.top + 74,
    };
  }

  return {
    x: newRect.left,
    y: newRect.top,
  };
};

function isLeadKeyboardDroppableCandidate({
  active,
  collisionRect,
  droppableRects,
  entry,
  eventCode,
}: {
  active: NonNullable<
    Parameters<KeyboardCoordinateGetter>[1]['context']['active']
  >;
  collisionRect: NonNullable<
    Parameters<KeyboardCoordinateGetter>[1]['context']['collisionRect']
  >;
  droppableRects: Parameters<KeyboardCoordinateGetter>[1]['context']['droppableRects'];
  entry: DroppableContainer;
  eventCode: string;
}) {
  if (entry.disabled) {
    return false;
  }

  const rect = droppableRects.get(entry.id);

  if (!rect || shouldSkipPopulatedLeadSection(entry, active)) {
    return false;
  }

  switch (eventCode) {
    case KeyboardCode.Down:
      return collisionRect.top < rect.top;
    case KeyboardCode.Up:
      return collisionRect.top > rect.top;
    case KeyboardCode.Left:
      return collisionRect.left >= rect.left + rect.width;
    case KeyboardCode.Right:
      return collisionRect.left + collisionRect.width <= rect.left;
    default:
      return false;
  }
}

function shouldSkipPopulatedLeadSection(
  entry: DroppableContainer,
  active: NonNullable<
    Parameters<KeyboardCoordinateGetter>[1]['context']['active']
  >,
) {
  const data = entry.data.current;

  return (
    data?.type === 'section' &&
    Array.isArray(data.children) &&
    data.children.length > 0 &&
    active.data.current?.type !== 'section'
  );
}

function getLeadCollisionOverId(
  args: LeadCollisionDetectionArgs,
  sectionLeadIds: LeadSectionLeadIds,
) {
  const pointerIntersections = pointerWithin(args);
  const intersections =
    pointerIntersections.length > 0
      ? pointerIntersections
      : rectIntersection(args);
  const overId = getFirstCollision(intersections, 'id');

  if (overId == null) {
    return null;
  }

  const overSectionId = getLeadOrganizationSectionId(overId);

  if (!overSectionId) {
    return overId;
  }

  return (
    getClosestLeadIdInSection(args, overId, sectionLeadIds[overSectionId]) ??
    overId
  );
}

function getClosestLeadIdInSection(
  args: LeadCollisionDetectionArgs,
  sectionId: UniqueIdentifier,
  sectionItemIds: string[],
) {
  if (sectionItemIds.length === 0) {
    return null;
  }

  return getFirstCollision(
    closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        (container) =>
          container.id !== sectionId &&
          sectionItemIds.includes(toStringIdentifier(container.id)),
      ),
    }),
    'id',
  );
}

export function LeadgenApp({
  initialRunId,
  initialLeadId,
}: {
  initialRunId?: string;
  initialLeadId?: string;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const requirePostAuthIntent = useRequirePostAuthIntent();
  const trpc = useTRPC();
  const router = useRouter();
  const requestedDomain = useRequestedLeadgenDomain();
  const queryClient = useQueryClient();
  const { exportingRunId, exportRunCsv } = useLeadgenRunCsvExport();
  const [domain, setDomain] = useState('');
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEffort>('medium');
  const [pendingUnownedDomainRun, setPendingUnownedDomainRun] =
    useState<UnownedDomainRunConfirmation | null>(null);
  const [isOwnershipCheckPending, setIsOwnershipCheckPending] = useState(false);
  const [activeRunId, setActiveRunIdState] = useState<string | null>(
    initialRunId ?? null,
  );
  const [liveRun, setLiveRun] = useState<LeadgenSnapshot | null>(null);
  const [retryingRunIds, setRetryingRunIds] = useState<string[]>([]);
  const activeRunIdRef = useRef(activeRunId);
  const retryingRunIdsRef = useRef<Set<string>>(new Set());
  const startRunInFlightRef = useRef(false);

  const selectActiveRunId = useCallback((runId: string | null) => {
    activeRunIdRef.current = runId;
    setActiveRunIdState(runId);
    setLiveRun((currentRun) => (currentRun?.id === runId ? currentRun : null));
  }, []);
  const applyDomainPrefill = useCallback((nextDomain: string) => {
    setDomain(nextDomain);
    setReasoningEffort('medium');
  }, []);

  useEffect(() => {
    selectActiveRunId(initialRunId ?? null);
  }, [initialRunId, selectActiveRunId]);

  useLeadgenDomainPrefill({
    initialRunId,
    isAuthLoading,
    requestedDomain,
    onPrefill: applyDomainPrefill,
  });

  const runsQuery = useQuery({
    ...trpc.leadgen.listRuns.queryOptions(recentRunsQueryInput),
    enabled: isAuthenticated,
  });
  const userDomainsQuery = useQuery({
    ...trpc.users.getCurrentUserDomains.queryOptions(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const {
    options: outboundDomainOptions,
    isLoading: isOutboundDomainOptionsLoading,
  } = useDomainSearchOptions();
  const usageQuery = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
    enabled: isAuthenticated,
  });
  const usageData = isAuthenticated ? usageQuery.data : undefined;
  const estimatedRunCredits = getEstimatedRunCredits({
    usage: usageData,
    reasoningEffort,
  });

  const activeRunQuery = useQuery({
    ...trpc.leadgen.getRun.queryOptions({ runId: activeRunId ?? '' }),
    enabled: isAuthenticated && Boolean(activeRunId),
  });

  const syncRunSnapshot = useCallback(
    (snapshot: LeadgenSnapshot) => {
      const queryKey = trpc.leadgen.getRun.queryKey({ runId: snapshot.id });
      const cachedSnapshot =
        queryClient.getQueryData<LeadgenSnapshot>(queryKey);
      if (
        cachedSnapshot &&
        getTimestamp(snapshot.updatedAt) <
          getTimestamp(cachedSnapshot.updatedAt)
      ) {
        return;
      }

      if (activeRunIdRef.current === snapshot.id) {
        setLiveRun(snapshot);
      }
      queryClient.setQueryData(queryKey, snapshot);
      queryClient.setQueryData(
        trpc.leadgen.listRuns.queryKey(recentRunsQueryInput),
        (runs: LeadgenRunSummary[] | undefined) =>
          upsertLeadgenRunSummary(runs, snapshot),
      );
    },
    [queryClient, trpc],
  );

  useEffect(() => {
    const snapshot = activeRunQuery.data;
    if (!snapshot || snapshot.id !== activeRunIdRef.current) return;

    syncRunSnapshot(snapshot);
    setDomain(snapshot.domain);
    setReasoningEffort(snapshot.reasoningEffort);
  }, [activeRunQuery.data, syncRunSnapshot]);

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) return;
    setLiveRun(null);
    if (!initialRunId) {
      selectActiveRunId(null);
    }
  }, [initialRunId, isAuthLoading, isAuthenticated, selectActiveRunId]);

  useSubscription({
    ...trpc.leadgen.watchRun.subscriptionOptions(
      { runId: activeRunId ?? '' },
      {
        enabled: isAuthenticated && Boolean(activeRunId),
        onData(snapshot) {
          syncRunSnapshot(snapshot);
          if (isTerminalLeadgenStatus(snapshot.status)) {
            void queryClient.invalidateQueries({
              queryKey: trpc.leadgen.listRuns.queryKey(recentRunsQueryInput),
            });
          }
        },
      },
    ),
  });

  const startRun = useMutation(
    trpc.leadgen.startRun.mutationOptions({
      onSuccess(snapshot) {
        setPendingUnownedDomainRun(null);
        selectActiveRunId(snapshot.id);
        syncRunSnapshot(snapshot);
        router.push(getLeadgenRunHref(snapshot.id));
        void queryClient.invalidateQueries({
          queryKey: trpc.leadgen.listRuns.queryKey(recentRunsQueryInput),
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
      onSettled() {
        startRunInFlightRef.current = false;
      },
    }),
  );

  const retryRun = useMutation(
    trpc.leadgen.retryRun.mutationOptions({
      async onMutate(variables) {
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: trpc.leadgen.getRun.queryKey({ runId: variables.runId }),
          }),
          queryClient.cancelQueries({
            queryKey: trpc.leadgen.listRuns.queryKey(recentRunsQueryInput),
          }),
        ]);
      },
      onSuccess(snapshot) {
        selectActiveRunId(snapshot.id);
        syncRunSnapshot(snapshot);
        router.push(getLeadgenRunHref(snapshot.id));
        toast.success('Buyer search restarted');
        void queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });
      },
      onError(error) {
        toast.error('Could not retry buyer search', {
          description: error.message,
        });
      },
      onSettled(_snapshot, _error, variables) {
        if (!variables) return;

        retryingRunIdsRef.current.delete(variables.runId);
        setRetryingRunIds((runIds) =>
          runIds.filter((runId) => runId !== variables.runId),
        );
        void queryClient.invalidateQueries({
          queryKey: trpc.leadgen.getRun.queryKey({ runId: variables.runId }),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.leadgen.listRuns.queryKey(recentRunsQueryInput),
        });
      },
    }),
  );

  const getUserOwnsNamefiDomain = useCallback(
    async (normalizedDomain: string) => {
      const userDomains =
        userDomainsQuery.data ??
        (await queryClient.fetchQuery({
          ...trpc.users.getCurrentUserDomains.queryOptions(),
          staleTime: 60_000,
        }));

      return userDomains.some(
        (userDomain) =>
          normalizeDomainInput(userDomain.normalizedDomainName) ===
          normalizedDomain,
      );
    },
    [queryClient, trpc, userDomainsQuery.data],
  );

  const startRunWithOwnershipGuard = useCallback(
    async (payload: LeadgenStartRunPayload) => {
      if (startRunInFlightRef.current) return;

      startRunInFlightRef.current = true;
      setIsOwnershipCheckPending(true);

      try {
        const ownsDomain = await getUserOwnsNamefiDomain(payload.domain);
        if (!ownsDomain) {
          setPendingUnownedDomainRun({
            payload,
            estimatedCredits: getEstimatedRunCredits({
              usage: usageData,
              reasoningEffort: payload.reasoningEffort,
            }),
          });
          startRunInFlightRef.current = false;
          return;
        }

        startRun.mutate(payload);
      } catch (error) {
        startRunInFlightRef.current = false;
        toast.error('Could not confirm domain ownership', {
          description:
            error instanceof Error ? error.message : 'Please try again.',
        });
      } finally {
        setIsOwnershipCheckPending(false);
      }
    },
    [getUserOwnsNamefiDomain, startRun, usageData],
  );

  const postAuthHandlers = useMemo(
    () => ({
      'leadgen.run.start': async (
        intent: PostAuthIntentFor<'leadgen.run.start'>,
      ) => {
        const payload = {
          ...intent.payload,
          domain: normalizeDomainInput(intent.payload.domain),
        };
        setDomain(payload.domain);
        setReasoningEffort(payload.reasoningEffort);
        await startRunWithOwnershipGuard(payload);
      },
    }),
    [startRunWithOwnershipGuard],
  );

  usePostAuthIntentExecutor(postAuthHandlers);

  const startSuggestions = useMemo(
    () =>
      getStartSuggestions({
        domains: isAuthenticated ? (userDomainsQuery.data ?? []) : [],
        runs: isAuthenticated ? (runsQuery.data ?? []) : [],
      }),
    [isAuthenticated, userDomainsQuery.data, runsQuery.data],
  );
  const isStartSuggestionsLoading =
    isAuthenticated && (userDomainsQuery.isLoading || runsQuery.isLoading);

  if (isAuthLoading) {
    return <LeadgenSkeleton />;
  }

  if (!isAuthenticated && initialRunId) {
    return <AuthRequired />;
  }

  const activeQueriedRun =
    activeRunQuery.data?.id === activeRunId ? activeRunQuery.data : null;
  const activeLiveRun = liveRun?.id === activeRunId ? liveRun : null;
  const run = isAuthenticated ? (activeLiveRun ?? activeQueriedRun) : null;
  const normalizedRunDomain = run ? normalizeDomainInput(run.domain) : null;
  const ownedDomainForRun = normalizedRunDomain
    ? userDomainsQuery.data?.find(
        (domain) => domain.normalizedDomainName === normalizedRunDomain,
      )
    : undefined;
  const isRunning = run?.status === 'QUEUED' || run?.status === 'RUNNING';
  const isRunLoading = Boolean(activeRunId) && activeRunQuery.isLoading && !run;
  const isSubmittingRun = startRun.isPending || isOwnershipCheckPending;
  const { canSubmit } = getLeadgenSubmitState({
    domain,
    estimatedRunCredits,
    isCreditLoading: isAuthenticated && usageQuery.isLoading,
    isSubmitting: isSubmittingRun,
    usage: usageData,
  });

  const handleSubmit = async () => {
    const normalized = normalizeDomainInput(domain);
    if (!isLikelyDomain(normalized)) {
      toast.error('Enter a domain', {
        description: 'Use a domain you own or represent, like example.com.',
      });
      return;
    }

    setDomain(normalized);
    const payload = { domain: normalized, reasoningEffort };
    if (
      !requirePostAuthIntent({
        kind: 'leadgen.run.start',
        returnPath: getCurrentReturnPath(),
        payload,
      })
    ) {
      return;
    }

    await startRunWithOwnershipGuard(payload);
  };

  const handleConfirmUnownedDomainRun = () => {
    const pendingRun = pendingUnownedDomainRun;
    if (!pendingRun || startRunInFlightRef.current) return;

    startRunInFlightRef.current = true;
    startRun.mutate(pendingRun.payload);
  };

  const handleUnownedDomainDialogOpenChange = (open: boolean) => {
    if (!open && !startRun.isPending) {
      setPendingUnownedDomainRun(null);
    }
  };

  const handleSelectStartSuggestion = (suggestion: LeadgenStartSuggestion) => {
    setDomain(suggestion.domain);
    setReasoningEffort('medium');
    requestAnimationFrame(() => {
      document.getElementById(DOMAIN_INPUT_ID)?.focus();
    });
  };

  const handleRetryRun = (runId: string) => {
    if (retryingRunIdsRef.current.has(runId)) return;

    retryingRunIdsRef.current.add(runId);
    setRetryingRunIds((runIds) =>
      runIds.includes(runId) ? runIds : [...runIds, runId],
    );
    retryRun.mutate({ runId });
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
                <DomainSearchCombobox
                  id={DOMAIN_INPUT_ID}
                  value={domain}
                  onValueChange={setDomain}
                  options={outboundDomainOptions}
                  placeholder="example.com"
                  searchPlaceholder="Search or enter a domain"
                  emptyMessage="No matching domains."
                  isLoading={isOutboundDomainOptionsLoading}
                  allowCustomValue
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
                        'rounded-sm px-2 py-2 text-start transition-colors',
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
                onClick={() => {
                  void handleSubmit();
                }}
              >
                {isSubmittingRun ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Play />
                )}
                Find buyers
              </Button>

              <LeadgenCreditEstimate
                isLoading={isAuthenticated && usageQuery.isLoading}
                isError={isAuthenticated && usageQuery.isError}
                requestedCredits={estimatedRunCredits}
                remainingCredits={usageData?.remainingCredits}
                noun="buyer search"
              />
            </div>
          </section>

          {isAuthenticated && <GenerationUsage />}

          {isAuthenticated && (
            <PastRuns
              runs={runsQuery.data ?? []}
              activeRunId={activeRunId}
              isLoading={runsQuery.isLoading}
              exportingRunId={exportingRunId}
              retryingRunIds={retryingRunIds}
              scrollActiveRunIntoView={Boolean(initialRunId)}
              onExportRun={exportRunCsv}
              onRetryRun={handleRetryRun}
            />
          )}
        </aside>

        <main className="min-w-0 overflow-hidden rounded-lg border border-border/70 bg-card/60 shadow-sm backdrop-blur">
          <LeadgenWorkspacePanel
            isRunLoading={isRunLoading}
            isRunning={isRunning}
            isRetrying={run ? retryingRunIds.includes(run.id) : false}
            run={run}
            ownedDomain={ownedDomainForRun}
            initialLeadId={initialLeadId}
            startSuggestions={startSuggestions}
            isStartSuggestionsLoading={isStartSuggestionsLoading}
            onSelectStartSuggestion={handleSelectStartSuggestion}
            onRetryRun={handleRetryRun}
            onRunUpdated={syncRunSnapshot}
          />
        </main>
      </div>
      <UnownedDomainRunDialog
        pendingRun={pendingUnownedDomainRun}
        isSubmitting={startRun.isPending}
        onConfirm={handleConfirmUnownedDomainRun}
        onOpenChange={handleUnownedDomainDialogOpenChange}
      />
    </PageShell>
  );
}

function useRequestedLeadgenDomain() {
  const searchParams = useSearchParams();
  const requestedDomainParam = searchParams.get('domain');

  return useMemo(() => {
    if (!requestedDomainParam) return null;

    const normalized = normalizeDomainInput(requestedDomainParam);
    return isLikelyDomain(normalized) ? normalized : null;
  }, [requestedDomainParam]);
}

function useLeadgenDomainPrefill({
  initialRunId,
  isAuthLoading,
  requestedDomain,
  onPrefill,
}: {
  initialRunId?: string;
  isAuthLoading: boolean;
  requestedDomain: string | null;
  onPrefill: (domain: string) => void;
}) {
  useEffect(() => {
    if (initialRunId || !requestedDomain) return;

    onPrefill(requestedDomain);

    if (isAuthLoading) return;

    const frame = requestAnimationFrame(() => {
      document.getElementById(DOMAIN_INPUT_ID)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [initialRunId, isAuthLoading, onPrefill, requestedDomain]);
}

function UnownedDomainRunDialog({
  pendingRun,
  isSubmitting,
  onConfirm,
  onOpenChange,
}: {
  pendingRun: UnownedDomainRunConfirmation | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const domain = pendingRun?.payload.domain ?? '';
  const creditEstimate =
    pendingRun?.estimatedCredits !== undefined
      ? `Estimated cost: ${formatAiCredits(pendingRun.estimatedCredits)}.`
      : 'This buyer search will spend AI credits.';

  return (
    <Dialog open={Boolean(pendingRun)} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-[460px]')}
      >
        <DialogHeader>
          <DialogTitle>Continue with this domain?</DialogTitle>
          <DialogDescription>
            Namefi does not show {domain} in your owned domains.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm leading-6 text-amber-900 dark:text-amber-100">
          Starting outbound lead generation for this domain will burn AI
          credits. Proceed only if you own or represent this domain and are okay
          spending those credits.
          <span className="mt-2 block font-medium">{creditEstimate}</span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={onConfirm}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Play />}
            Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  isRetrying,
  run,
  ownedDomain,
  initialLeadId,
  startSuggestions,
  isStartSuggestionsLoading,
  onSelectStartSuggestion,
  onRetryRun,
  onRunUpdated,
}: {
  isRunLoading: boolean;
  isRunning: boolean;
  isRetrying: boolean;
  run: LeadgenSnapshot | null;
  ownedDomain?: UserDomain;
  initialLeadId?: string;
  startSuggestions: LeadgenStartSuggestion[];
  isStartSuggestionsLoading: boolean;
  onSelectStartSuggestion: (suggestion: LeadgenStartSuggestion) => void;
  onRetryRun: (runId: string) => void;
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
        isRetrying={isRetrying}
        ownedDomain={ownedDomain}
        initialLeadId={initialLeadId}
        onRetryRun={onRetryRun}
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

function useLeadgenLeadOrder({
  run,
  onRunUpdated,
}: {
  run: LeadgenSnapshot;
  onRunUpdated: (run: LeadgenSnapshot) => void;
}) {
  const trpc = useTRPC();
  const currentRunIdRef = useRef(run.id);
  const currentRunGenerationRef = useRef(0);
  const latestSaveIdRef = useRef(0);
  const pendingSaveCountRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedSnapshotRef = useRef<LeadgenSnapshot | null>(null);
  const { mutateAsync: saveLeadOrder } = useMutation(
    trpc.leadgen.setLeadOrder.mutationOptions(),
  );
  const agentOrderedLeadIds = useMemo(
    () => run.leads.map((lead) => lead.id),
    [run.leads],
  );
  const [userOrderedLeadIds, setUserOrderedLeadIds] = useState<string[]>(() =>
    reconcileLeadgenLeadOrder(run.userLeadOrder, agentOrderedLeadIds),
  );
  const hasCustomLeadOrder = isLeadgenLeadOrderCustomized({
    agentOrderedLeadIds,
    userOrderedLeadIds,
  });
  const getSnapshotLeadOrder = useCallback((snapshot: LeadgenSnapshot) => {
    return reconcileLeadgenLeadOrder(
      snapshot.userLeadOrder,
      snapshot.leads.map((lead) => lead.id),
    );
  }, []);
  const isCurrentRunGeneration = useCallback(
    (requestRunId: string, requestRunGeneration: number) => {
      return (
        currentRunIdRef.current === requestRunId &&
        currentRunGenerationRef.current === requestRunGeneration
      );
    },
    [],
  );
  const isCurrentSave = useCallback(
    ({
      requestRunGeneration,
      requestRunId,
      saveId,
    }: {
      requestRunGeneration: number;
      requestRunId: string;
      saveId: number;
    }) => {
      return (
        isCurrentRunGeneration(requestRunId, requestRunGeneration) &&
        latestSaveIdRef.current === saveId
      );
    },
    [isCurrentRunGeneration],
  );
  const applySavedSnapshot = useCallback(
    (snapshot: LeadgenSnapshot) => {
      setUserOrderedLeadIds(getSnapshotLeadOrder(snapshot));
      onRunUpdated(snapshot);
    },
    [getSnapshotLeadOrder, onRunUpdated],
  );
  const rollbackLeadOrderSave = useCallback(
    ({
      agentLeadIds,
      requestRunId,
      runLeadOrder,
    }: {
      agentLeadIds: string[];
      requestRunId: string;
      runLeadOrder: string[];
    }) => {
      const rollbackSnapshot =
        lastSavedSnapshotRef.current?.id === requestRunId
          ? lastSavedSnapshotRef.current
          : null;

      if (rollbackSnapshot) {
        applySavedSnapshot(rollbackSnapshot);
        return;
      }

      setUserOrderedLeadIds(
        reconcileLeadgenLeadOrder(runLeadOrder, agentLeadIds),
      );
    },
    [applySavedSnapshot],
  );
  const handleSavedLeadOrder = useCallback(
    ({
      options,
      requestRunGeneration,
      requestRunId,
      saveId,
      snapshot,
    }: {
      options: LeadOrderSaveOptions;
      requestRunGeneration: number;
      requestRunId: string;
      saveId: number;
      snapshot: LeadgenSnapshot;
    }) => {
      if (!isCurrentRunGeneration(requestRunId, requestRunGeneration)) return;

      lastSavedSnapshotRef.current = snapshot;

      if (!isCurrentSave({ requestRunGeneration, requestRunId, saveId })) {
        return;
      }

      applySavedSnapshot(snapshot);
      options.onSaved?.();
    },
    [applySavedSnapshot, isCurrentRunGeneration, isCurrentSave],
  );
  const handleFailedLeadOrderSave = useCallback(
    ({
      agentLeadIds,
      error,
      options,
      requestRunGeneration,
      requestRunId,
      runLeadOrder,
      saveId,
    }: {
      agentLeadIds: string[];
      error: unknown;
      options: LeadOrderSaveOptions;
      requestRunGeneration: number;
      requestRunId: string;
      runLeadOrder: string[];
      saveId: number;
    }) => {
      if (!isCurrentSave({ requestRunGeneration, requestRunId, saveId })) {
        return;
      }

      rollbackLeadOrderSave({
        agentLeadIds,
        requestRunId,
        runLeadOrder,
      });
      options.onError?.();
      toast.error('Could not save prospect order', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      });
    },
    [isCurrentSave, rollbackLeadOrderSave],
  );
  const settleLeadOrderSave = useCallback(
    ({
      options,
      requestRunGeneration,
      requestRunId,
    }: {
      options: LeadOrderSaveOptions;
      requestRunGeneration: number;
      requestRunId: string;
    }) => {
      pendingSaveCountRef.current = Math.max(
        0,
        pendingSaveCountRef.current - 1,
      );
      if (isCurrentRunGeneration(requestRunId, requestRunGeneration)) {
        options.onSettled?.();
      }
    },
    [isCurrentRunGeneration],
  );

  useEffect(() => {
    currentRunIdRef.current = run.id;
    currentRunGenerationRef.current += 1;
    latestSaveIdRef.current += 1;
    pendingSaveCountRef.current = 0;
    saveQueueRef.current = Promise.resolve();
    lastSavedSnapshotRef.current = null;
  }, [run.id]);

  useEffect(() => {
    setUserOrderedLeadIds((currentLeadIds) =>
      reconcileLeadgenLeadOrder(
        pendingSaveCountRef.current > 0 ? currentLeadIds : run.userLeadOrder,
        agentOrderedLeadIds,
      ),
    );
  }, [agentOrderedLeadIds, run.userLeadOrder]);

  const queueLeadOrderSave = useCallback(
    (orderedLeadIds: string[], options: LeadOrderSaveOptions = {}) => {
      const requestRunId = run.id;
      const requestRunGeneration = currentRunGenerationRef.current;
      const reconciledLeadIds = reconcileLeadgenLeadOrder(
        orderedLeadIds,
        agentOrderedLeadIds,
      );
      const saveId = latestSaveIdRef.current + 1;
      latestSaveIdRef.current = saveId;
      pendingSaveCountRef.current += 1;
      setUserOrderedLeadIds(reconciledLeadIds);

      const save = async () => {
        try {
          const snapshot = await saveLeadOrder({
            runId: requestRunId,
            leadIds: reconciledLeadIds,
            signalUpdates: options.signalUpdates ?? [],
          });
          handleSavedLeadOrder({
            options,
            requestRunGeneration,
            requestRunId,
            saveId,
            snapshot,
          });
        } catch (error) {
          handleFailedLeadOrderSave({
            agentLeadIds: agentOrderedLeadIds,
            error,
            options,
            requestRunGeneration,
            requestRunId,
            runLeadOrder: run.userLeadOrder,
            saveId,
          });
        } finally {
          settleLeadOrderSave({
            options,
            requestRunGeneration,
            requestRunId,
          });
        }
      };

      saveQueueRef.current = saveQueueRef.current.then(save, save);
    },
    [
      agentOrderedLeadIds,
      handleFailedLeadOrderSave,
      handleSavedLeadOrder,
      run.id,
      run.userLeadOrder,
      saveLeadOrder,
      settleLeadOrderSave,
    ],
  );

  const handleResetLeadOrder = useCallback(() => {
    queueLeadOrderSave([], {
      onSaved() {
        toast.success('Prospect order reset');
      },
    });
  }, [queueLeadOrderSave]);

  return {
    userOrderedLeadIds,
    hasCustomLeadOrder,
    handleLeadOrderChange: queueLeadOrderSave,
    handleResetLeadOrder,
  };
}

function RunWorkspace({
  run,
  isRunning,
  isRetrying,
  ownedDomain,
  initialLeadId,
  onRetryRun,
  onRunUpdated,
}: {
  run: LeadgenSnapshot;
  isRunning: boolean;
  isRetrying: boolean;
  ownedDomain?: UserDomain;
  initialLeadId?: string;
  onRetryRun: (runId: string) => void;
  onRunUpdated: (run: LeadgenSnapshot) => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const marketplaceListingEnabled = useBooleanOpenFeatureFlag(
    MARKETPLACE_LISTINGS_FLAG,
  );
  const marketplaceChainSupported = ownedDomain
    ? isChainSupportedByAnyMarketplace(ownedDomain.chainId)
    : false;
  const domainExportDetailsQuery = useQuery(
    trpc.domainConfig.getDomainExportDetails.queryOptions(
      {
        domainName: ownedDomain?.normalizedDomainName ?? run.domain,
      },
      {
        enabled:
          marketplaceListingEnabled &&
          Boolean(ownedDomain) &&
          marketplaceChainSupported,
      },
    ),
  );
  const usageQuery = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
  });
  const [pendingOutreachLeadIds, setPendingOutreachLeadIds] = useState<
    string[]
  >([]);
  const [pendingUserSignalLeadIds, setPendingUserSignalLeadIds] = useState<
    string[]
  >([]);
  const [
    optimisticUserSignalStateByLeadId,
    setOptimisticUserSignalStateByLeadId,
  ] = useState<Partial<Record<string, LeadgenUserSignalState>>>({});
  const {
    userOrderedLeadIds,
    hasCustomLeadOrder,
    handleLeadOrderChange,
    handleResetLeadOrder,
  } = useLeadgenLeadOrder({
    run,
    onRunUpdated,
  });
  const [reviewOutreachLeadId, setReviewOutreachLeadId] = useState<
    string | null
  >(null);
  const previousRunIdRef = useRef(run.id);
  const appliedInitialLeadRef = useRef<string | null>(null);
  const presentation = useMemo(
    () =>
      buildLeadPresentationModel(run, {
        userSignalStateByLeadId: optimisticUserSignalStateByLeadId,
        userOrderLeadIds: userOrderedLeadIds,
      }),
    [optimisticUserSignalStateByLeadId, run, userOrderedLeadIds],
  );
  const buyerAngles = getBuyerAngles(run);

  useEffect(() => {
    if (previousRunIdRef.current === run.id) return;

    previousRunIdRef.current = run.id;
    setOptimisticUserSignalStateByLeadId({});
    setPendingUserSignalLeadIds([]);
  }, [run.id]);

  useEffect(() => {
    if (!initialLeadId) {
      appliedInitialLeadRef.current = null;
      return;
    }

    const initialLeadKey = `${run.id}:${initialLeadId}`;
    if (appliedInitialLeadRef.current === initialLeadKey) return;
    const initialLead = run.leads.find((lead) => lead.id === initialLeadId);
    if (!initialLead) return;

    appliedInitialLeadRef.current = initialLeadKey;
    document
      .getElementById(getLeadCardDomId(initialLeadId))
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (hasReviewableOutreach(initialLead)) {
      setReviewOutreachLeadId(initialLeadId);
    }
  }, [initialLeadId, run.id, run.leads]);

  const generateLeadOutreach = useMutation(
    trpc.leadgen.generateLeadOutreach.mutationOptions({
      onSuccess(snapshot, variables) {
        onRunUpdated(snapshot);
        void queryClient.invalidateQueries({
          queryKey: trpc.leadgen.listRuns.queryKey(recentRunsQueryInput),
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

  const handleLeadOrganizationChange = (
    orderedLeadIds: string[],
    signalUpdate?: LeadgenLeadSignalUpdate,
  ) => {
    if (!signalUpdate) {
      handleLeadOrderChange(orderedLeadIds);
      return;
    }

    if (pendingUserSignalLeadIds.includes(signalUpdate.leadId)) return;

    setPendingUserSignalLeadIds((leadIds) =>
      leadIds.includes(signalUpdate.leadId)
        ? leadIds
        : [...leadIds, signalUpdate.leadId],
    );
    setOptimisticUserSignalStateByLeadId((states) => ({
      ...states,
      [signalUpdate.leadId]: signalUpdate.state,
    }));
    const clearPendingSignal = () => {
      setOptimisticUserSignalStateByLeadId((states) =>
        omitLeadSignalState(states, signalUpdate.leadId),
      );
      setPendingUserSignalLeadIds((leadIds) =>
        leadIds.filter((leadId) => leadId !== signalUpdate.leadId),
      );
    };

    handleLeadOrderChange(orderedLeadIds, {
      signalUpdates: [signalUpdate],
      onSaved() {
        if (signalUpdate.state === 'hidden') {
          toast('Prospect hidden', {
            description: 'Moved to the Hidden section.',
          });
        }
      },
      onSettled: clearPendingSignal,
    });
  };

  const headerSubtitle = getRunHeaderSubtitle(run);
  const canRetryRun = run.status === 'FAILED';
  const canExport = isLeadgenCrmCsvExportAvailable(run);
  const canListOnMarketplace =
    marketplaceListingEnabled &&
    Boolean(ownedDomain) &&
    marketplaceChainSupported &&
    !domainExportDetailsQuery.isLoading &&
    !(domainExportDetailsQuery.data?.readyToExport ?? false);

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
            <HowToSellDomainLink className="mt-2" />
            {(presentation.leads.length > 1 ||
              canRetryRun ||
              canExport ||
              (canListOnMarketplace && ownedDomain)) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {presentation.leads.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasCustomLeadOrder}
                    onClick={handleResetLeadOrder}
                  >
                    <RotateCcw data-icon="inline-start" />
                    Reset order
                  </Button>
                )}
                {canRetryRun && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isRetrying}
                    aria-busy={isRetrying}
                    onClick={() => onRetryRun(run.id)}
                  >
                    {isRetrying ? (
                      <Loader2
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <RefreshCw data-icon="inline-start" />
                    )}
                    {isRetrying ? 'Retrying...' : 'Retry search'}
                  </Button>
                )}
                {canExport && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleExportCrmCsv}
                  >
                    <Download data-icon="inline-start" />
                    Export CRM CSV
                  </Button>
                )}
                {canListOnMarketplace && ownedDomain ? (
                  <OutboundMarketplaceListingCta domain={ownedDomain} />
                ) : null}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:min-w-[320px]">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Prospects" value={presentation.counts.prospects} />
              <Metric label="Contacts" value={presentation.counts.contacts} />
              <Metric label="Drafts" value={run.draftCount} />
            </div>
          </div>
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

          <LeadList
            runId={run.id}
            leads={presentation.leads}
            emptyStateMessage="Prospects will appear here as search finds them."
            sourceDomain={run.domain}
            pendingOutreachLeadIds={pendingOutreachLeadIds}
            reviewOutreachLeadId={reviewOutreachLeadId}
            estimatedOutreachCredits={estimatedOutreachCredits}
            remainingCredits={usageQuery.data?.remainingCredits}
            isOutreachCreditLoading={usageQuery.isLoading}
            isOutreachCreditError={usageQuery.isError}
            isOutreachCreditBlocked={hasInsufficientOutreachCredits}
            pendingUserSignalLeadIds={pendingUserSignalLeadIds}
            onGenerateLeadOutreach={handleGenerateLeadOutreach}
            onReviewOutreachLead={setReviewOutreachLeadId}
            onLeadOrderChange={handleLeadOrganizationChange}
          />
        </section>

        <aside className="min-h-0 border-t border-border/70 p-5 lg:border-s lg:border-t-0">
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

function OutboundMarketplaceListingCta({ domain }: { domain: UserDomain }) {
  const [modalMounted, setModalMounted] = useState(false);

  const handleOpen = () => {
    setModalMounted(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      setModalMounted(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="shrink-0 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
        onClick={handleOpen}
        disabled={modalMounted}
      >
        {modalMounted ? (
          <Loader2 className="animate-spin" />
        ) : (
          <ShoppingBag data-icon="inline-start" />
        )}
        List on marketplace
      </Button>
      {modalMounted ? (
        <CreateListingModal
          domain={domain.normalizedDomainName}
          chainId={domain.chainId}
          tokenAddress={NAMEFI_NFT_CONTRACT_ADDRESS}
          tokenId={domain.tokenId.toString()}
          defaultOpen
          showTrigger={false}
          onOpenChange={handleModalOpenChange}
          ownerAddress={domain.ownerAddress as unknown as `0x${string}`}
        />
      ) : null}
    </>
  );
}

function LeadList({
  runId,
  leads,
  emptyStateMessage,
  sourceDomain,
  pendingOutreachLeadIds,
  reviewOutreachLeadId,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  pendingUserSignalLeadIds,
  onGenerateLeadOutreach,
  onReviewOutreachLead,
  onLeadOrderChange,
}: {
  runId: string;
  leads: LeadPresentation[];
  emptyStateMessage: string;
  sourceDomain: string;
  pendingOutreachLeadIds: string[];
  reviewOutreachLeadId: string | null;
  estimatedOutreachCredits?: number;
  remainingCredits?: number;
  isOutreachCreditLoading: boolean;
  isOutreachCreditError: boolean;
  isOutreachCreditBlocked: boolean;
  pendingUserSignalLeadIds: string[];
  onGenerateLeadOutreach: (leadId: string) => void;
  onReviewOutreachLead: (leadId: string | null) => void;
  onLeadOrderChange: (
    leadIds: string[],
    signalUpdate?: LeadgenLeadSignalUpdate,
  ) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeLeadOverlayWidth, setActiveLeadOverlayWidth] = useState<
    number | null
  >(null);
  const [dragOverlayContainer, setDragOverlayContainer] =
    useState<HTMLElement | null>(null);
  const [dragPreviewSectionLeadIds, setDragPreviewSectionLeadIdsState] =
    useState<LeadSectionLeadIds | null>(null);
  const dragPreviewSectionLeadIdsRef = useRef<LeadSectionLeadIds | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const recentlyMovedToNewSectionRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: leadMultipleContainersKeyboardCoordinates,
    }),
  );
  const [openSections, setOpenSections] = useState<
    Record<LeadOrganizationSectionId, boolean>
  >({
    bookmarked: true,
    prospects: true,
    hidden: false,
  });

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : leadLayoutTransition;
  const bookmarkedLeads = leads.filter(
    (presentation) => presentation.organizationState === 'bookmarked',
  );
  const visibleProspectLeads = leads.filter(
    (presentation) => presentation.organizationState === 'none',
  );
  const hiddenLeads = leads.filter(
    (presentation) => presentation.organizationState === 'hidden',
  );
  const sectionLeads: Record<LeadOrganizationSectionId, LeadPresentation[]> = {
    bookmarked: bookmarkedLeads,
    prospects: visibleProspectLeads,
    hidden: hiddenLeads,
  };
  const baseSectionLeadIds = getSectionLeadIds(sectionLeads);
  const sectionLeadIds = dragPreviewSectionLeadIds ?? baseSectionLeadIds;
  const baseLeadSectionIdByLeadId =
    getLeadSectionIdByLeadId(baseSectionLeadIds);
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      const currentSectionLeadIds =
        dragPreviewSectionLeadIdsRef.current ?? baseSectionLeadIds;
      const overId = getLeadCollisionOverId(args, currentSectionLeadIds);

      if (overId != null) {
        lastOverIdRef.current = overId;

        return [{ id: overId }];
      }

      if (recentlyMovedToNewSectionRef.current) {
        lastOverIdRef.current = activeLeadId;
      }

      return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
    },
    [activeLeadId, baseSectionLeadIds],
  );
  const leadPresentationById = useMemo(
    () =>
      new Map(
        leads.map((presentation) => [presentation.lead.id, presentation]),
      ),
    [leads],
  );
  const activePresentation = activeLeadId
    ? (leadPresentationById.get(activeLeadId) ?? null)
    : null;
  const displaySectionLeads = {
    bookmarked: getLeadPresentationsBySectionIds(
      sectionLeadIds.bookmarked,
      leadPresentationById,
    ),
    prospects: getLeadPresentationsBySectionIds(
      sectionLeadIds.prospects,
      leadPresentationById,
    ),
    hidden: getLeadPresentationsBySectionIds(
      sectionLeadIds.hidden,
      leadPresentationById,
    ),
  } satisfies Record<LeadOrganizationSectionId, LeadPresentation[]>;

  const setSectionOpen = (
    sectionId: LeadOrganizationSectionId,
    open: boolean,
  ) => {
    setOpenSections((sections) => ({
      ...sections,
      [sectionId]: open,
    }));
  };

  useEffect(() => {
    setDragOverlayContainer(document.body);
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      recentlyMovedToNewSectionRef.current = false;
    });

    return () => cancelAnimationFrame(frameId);
  });

  const setDragPreviewSectionLeadIds = (
    sectionLeadIds: LeadSectionLeadIds | null,
  ) => {
    dragPreviewSectionLeadIdsRef.current = sectionLeadIds;
    setDragPreviewSectionLeadIdsState(sectionLeadIds);
  };

  const clearDragState = () => {
    setActiveLeadId(null);
    setActiveLeadOverlayWidth(null);
    setDragPreviewSectionLeadIds(null);
    lastOverIdRef.current = null;
    recentlyMovedToNewSectionRef.current = false;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLeadId(toStringIdentifier(event.active.id));
    setActiveLeadOverlayWidth(event.active.rect.current.initial?.width ?? null);
    setDragPreviewSectionLeadIds(null);
    lastOverIdRef.current = null;
    recentlyMovedToNewSectionRef.current = false;
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) return;

    const draggedLeadId = toStringIdentifier(event.active.id);
    const overId = toStringIdentifier(event.over.id);
    const currentSectionLeadIds =
      dragPreviewSectionLeadIdsRef.current ?? baseSectionLeadIds;
    const currentLeadSectionIdByLeadId = getLeadSectionIdByLeadId(
      currentSectionLeadIds,
    );
    const sourceSectionId =
      currentLeadSectionIdByLeadId.get(draggedLeadId) ??
      baseLeadSectionIdByLeadId.get(draggedLeadId);
    const targetSectionId = getDropTargetSectionId({
      overId,
      leadSectionIdByLeadId: currentLeadSectionIdByLeadId,
    });

    if (!sourceSectionId || !targetSectionId) return;

    const insertIndex =
      sourceSectionId === targetSectionId
        ? undefined
        : getLeadCrossSectionInsertIndex({
            activeTop: event.active.rect.current.translated?.top,
            overId,
            overRect: event.over.rect,
            sectionLeadIds: currentSectionLeadIds,
            targetSectionId,
          });
    const nextSectionLeadIds = moveLeadInSections({
      activeLeadId: draggedLeadId,
      insertIndex,
      overId,
      sourceSectionId,
      targetSectionId,
      sectionLeadIds: currentSectionLeadIds,
    });

    if (
      areLeadIdsEqual(
        flattenSectionLeadIds(currentSectionLeadIds),
        flattenSectionLeadIds(nextSectionLeadIds),
      )
    ) {
      return;
    }

    if (sourceSectionId !== targetSectionId) {
      recentlyMovedToNewSectionRef.current = true;
    }

    setDragPreviewSectionLeadIds(nextSectionLeadIds);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const previewSectionLeadIds = dragPreviewSectionLeadIdsRef.current;
    const overId = event.over?.id ?? lastOverIdRef.current;
    clearDragState();

    if (overId == null) return;

    const draggedLeadId = toStringIdentifier(event.active.id);
    const overIdString = toStringIdentifier(overId);
    const sourceSectionId = baseLeadSectionIdByLeadId.get(draggedLeadId);
    const dragEndSectionLeadIds = previewSectionLeadIds ?? baseSectionLeadIds;
    const dragEndLeadSectionIdByLeadId = getLeadSectionIdByLeadId(
      dragEndSectionLeadIds,
    );
    const targetSectionId =
      getDropTargetSectionId({
        overId: overIdString,
        leadSectionIdByLeadId: dragEndLeadSectionIdByLeadId,
      }) ?? dragEndLeadSectionIdByLeadId.get(draggedLeadId);

    if (!sourceSectionId || !targetSectionId) return;

    const nextSectionLeadIds =
      previewSectionLeadIds ??
      moveLeadInSections({
        activeLeadId: draggedLeadId,
        insertIndex:
          sourceSectionId === targetSectionId
            ? undefined
            : getLeadCrossSectionInsertIndex({
                activeTop: event.active.rect.current.translated?.top,
                overId: overIdString,
                overRect: event.over?.rect ?? null,
                sectionLeadIds: baseSectionLeadIds,
                targetSectionId,
              }),
        overId: overIdString,
        sourceSectionId,
        targetSectionId,
        sectionLeadIds: baseSectionLeadIds,
      });
    const previousLeadIds = flattenSectionLeadIds(baseSectionLeadIds);
    const nextLeadIds = flattenSectionLeadIds(nextSectionLeadIds);

    const nextState =
      sourceSectionId === targetSectionId
        ? null
        : getSectionUserSignalState(targetSectionId);
    const activeLead = leadPresentationById.get(draggedLeadId);
    const signalUpdate =
      nextState && activeLead?.organizationState !== nextState
        ? { leadId: draggedLeadId, state: nextState }
        : undefined;

    if (!areLeadIdsEqual(previousLeadIds, nextLeadIds) || signalUpdate) {
      onLeadOrderChange(nextLeadIds, signalUpdate);
    }

    if (sourceSectionId !== targetSectionId) {
      setSectionOpen(targetSectionId, true);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
        {emptyStateMessage}
      </div>
    );
  }

  const renderLeadCard = (
    presentation: LeadPresentation,
    sectionId: LeadOrganizationSectionId,
  ) => (
    <SortableLeadCard
      key={presentation.lead.id}
      sectionId={sectionId}
      presentation={presentation}
      transition={transition}
      shouldReduceMotion={shouldReduceMotion}
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
      isUserSignalPending={pendingUserSignalLeadIds.includes(
        presentation.lead.id,
      )}
      isSortingDisabled={pendingUserSignalLeadIds.includes(
        presentation.lead.id,
      )}
      onGenerateLeadOutreach={onGenerateLeadOutreach}
      onReviewOutreachChange={(open) =>
        onReviewOutreachLead(open ? presentation.lead.id : null)
      }
      onSetUserSignal={(state) => {
        const targetSectionId = getUserSignalDestinationSectionId(state);
        const nextSectionLeadIds = moveLeadToSectionEnd({
          leadId: presentation.lead.id,
          sectionLeadIds,
          targetSectionId,
        });
        const nextLeadIds = flattenSectionLeadIds(nextSectionLeadIds);

        setSectionOpen(targetSectionId, true);
        onLeadOrderChange(nextLeadIds, {
          leadId: presentation.lead.id,
          state,
        });
      }}
    />
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      measuring={leadDndMeasuring}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <LayoutGroup id={`leadgen-list-${runId}-${sourceDomain}`}>
        <motion.div
          layout="position"
          className="flex flex-col gap-3"
          transition={transition}
          data-dragging={Boolean(activeLeadId) || undefined}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <LeadOrganizationSection
              key="bookmarked"
              sectionId="bookmarked"
              title="Bookmarks"
              count={displaySectionLeads.bookmarked.length}
              icon={Star}
              open={openSections.bookmarked}
              leadIds={sectionLeadIds.bookmarked}
              emptyStateMessage="Bookmarked prospects will stay pinned here."
              transition={transition}
              onOpenChange={(open) => setSectionOpen('bookmarked', open)}
            >
              {displaySectionLeads.bookmarked.map((presentation) =>
                renderLeadCard(presentation, 'bookmarked'),
              )}
            </LeadOrganizationSection>

            <LeadOrganizationSection
              key="prospects"
              sectionId="prospects"
              title="Prospects"
              count={displaySectionLeads.prospects.length}
              icon={ListChecks}
              open={openSections.prospects}
              leadIds={sectionLeadIds.prospects}
              emptyStateMessage="No unmarked prospects right now."
              transition={transition}
              onOpenChange={(open) => setSectionOpen('prospects', open)}
            >
              {displaySectionLeads.prospects.map((presentation) =>
                renderLeadCard(presentation, 'prospects'),
              )}
            </LeadOrganizationSection>

            <LeadOrganizationSection
              key="hidden"
              sectionId="hidden"
              title="Hidden"
              count={displaySectionLeads.hidden.length}
              icon={EyeOff}
              open={openSections.hidden}
              leadIds={sectionLeadIds.hidden}
              emptyStateMessage="Crossed-out prospects move here."
              muted
              transition={transition}
              onOpenChange={(open) => setSectionOpen('hidden', open)}
            >
              {displaySectionLeads.hidden.map((presentation) =>
                renderLeadCard(presentation, 'hidden'),
              )}
            </LeadOrganizationSection>
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
      {dragOverlayContainer
        ? createPortal(
            <DragOverlay
              adjustScale={false}
              dropAnimation={shouldReduceMotion ? null : leadDropAnimation}
              style={
                activeLeadOverlayWidth
                  ? { width: activeLeadOverlayWidth }
                  : undefined
              }
            >
              {activePresentation ? (
                <div className="pointer-events-none">
                  <LeadCard
                    presentation={activePresentation}
                    transition={
                      shouldReduceMotion ? { duration: 0 } : transition
                    }
                    sourceDomain={sourceDomain}
                    isPreparingOutreach={pendingOutreachLeadIds.includes(
                      activePresentation.lead.id,
                    )}
                    isReviewingOutreach={false}
                    estimatedOutreachCredits={estimatedOutreachCredits}
                    remainingCredits={remainingCredits}
                    isOutreachCreditLoading={isOutreachCreditLoading}
                    isOutreachCreditError={isOutreachCreditError}
                    isOutreachCreditBlocked={isOutreachCreditBlocked}
                    isUserSignalPending={pendingUserSignalLeadIds.includes(
                      activePresentation.lead.id,
                    )}
                    showDragHandlePreview
                    isDragOverlay
                    onGenerateLeadOutreach={() => undefined}
                    onReviewOutreachChange={() => undefined}
                    onSetUserSignal={() => undefined}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            dragOverlayContainer,
          )
        : null}
    </DndContext>
  );
}

function SortableLeadCard({
  sectionId,
  presentation,
  transition,
  shouldReduceMotion,
  sourceDomain,
  isPreparingOutreach,
  isReviewingOutreach,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  isUserSignalPending,
  isSortingDisabled,
  onGenerateLeadOutreach,
  onReviewOutreachChange,
  onSetUserSignal,
}: {
  sectionId: LeadOrganizationSectionId;
  presentation: LeadPresentation;
  transition: typeof leadLayoutTransition | { duration: number };
  shouldReduceMotion: boolean | null;
  sourceDomain: string;
  isPreparingOutreach: boolean;
  isReviewingOutreach: boolean;
  estimatedOutreachCredits?: number;
  remainingCredits?: number;
  isOutreachCreditLoading: boolean;
  isOutreachCreditError: boolean;
  isOutreachCreditBlocked: boolean;
  isUserSignalPending: boolean;
  isSortingDisabled: boolean;
  onGenerateLeadOutreach: (leadId: string) => void;
  onReviewOutreachChange: (open: boolean) => void;
  onSetUserSignal: (state: LeadgenUserSignalState) => void;
}) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition: sortableTransition,
    isDragging,
  } = useSortable({
    id: presentation.lead.id,
    disabled: isSortingDisabled,
    transition: shouldReduceMotion ? null : leadSortableTransition,
    data: {
      sectionId,
      type: 'lead',
    },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: sortableTransition,
  } satisfies CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'will-change-transform',
        isDragging && 'relative z-10 opacity-30',
      )}
    >
      <LeadCard
        presentation={presentation}
        transition={transition}
        sourceDomain={sourceDomain}
        isPreparingOutreach={isPreparingOutreach}
        isReviewingOutreach={isReviewingOutreach}
        estimatedOutreachCredits={estimatedOutreachCredits}
        remainingCredits={remainingCredits}
        isOutreachCreditLoading={isOutreachCreditLoading}
        isOutreachCreditError={isOutreachCreditError}
        isOutreachCreditBlocked={isOutreachCreditBlocked}
        isUserSignalPending={isUserSignalPending}
        dragHandle={{
          attributes,
          isDisabled: isSortingDisabled,
          isDragging,
          listeners,
          setActivatorNodeRef,
        }}
        onGenerateLeadOutreach={onGenerateLeadOutreach}
        onReviewOutreachChange={onReviewOutreachChange}
        onSetUserSignal={onSetUserSignal}
      />
    </div>
  );
}

type LeadDragHandleProps = {
  attributes: DraggableAttributes;
  isDisabled: boolean;
  isDragging: boolean;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLButtonElement | null) => void;
};

function LeadOrganizationDropArea({
  sectionId,
  leadIds,
  count,
  emptyStateMessage,
  isOver,
  transition,
  children,
}: {
  sectionId: LeadOrganizationSectionId;
  leadIds: string[];
  count: number;
  emptyStateMessage: string;
  isOver: boolean;
  transition: typeof leadLayoutTransition | { duration: number };
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid min-h-20 gap-3 p-3 transition-colors',
        isOver && 'bg-primary/5',
      )}
    >
      <SortableContext
        id={sectionId}
        items={leadIds}
        strategy={verticalListSortingStrategy}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {count > 0 ? (
            children
          ) : (
            <motion.div
              key={`${sectionId}-empty`}
              layout
              transition={transition}
              className="rounded-md border border-dashed border-border/70 p-4 text-sm text-muted-foreground"
            >
              {emptyStateMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </SortableContext>
    </div>
  );
}

function LeadCard({
  presentation,
  transition,
  sourceDomain,
  isPreparingOutreach,
  isReviewingOutreach,
  estimatedOutreachCredits,
  remainingCredits,
  isOutreachCreditLoading,
  isOutreachCreditError,
  isOutreachCreditBlocked,
  isUserSignalPending,
  dragHandle,
  showDragHandlePreview = false,
  isDragOverlay = false,
  onGenerateLeadOutreach,
  onReviewOutreachChange,
  onSetUserSignal,
}: {
  presentation: LeadPresentation;
  transition: typeof leadLayoutTransition | { duration: number };
  sourceDomain: string;
  isPreparingOutreach: boolean;
  isReviewingOutreach: boolean;
  estimatedOutreachCredits?: number;
  remainingCredits?: number;
  isOutreachCreditLoading: boolean;
  isOutreachCreditError: boolean;
  isOutreachCreditBlocked: boolean;
  isUserSignalPending: boolean;
  dragHandle?: LeadDragHandleProps;
  showDragHandlePreview?: boolean;
  isDragOverlay?: boolean;
  onGenerateLeadOutreach: (leadId: string) => void;
  onReviewOutreachChange: (open: boolean) => void;
  onSetUserSignal: (state: LeadgenUserSignalState) => void;
}) {
  const { lead } = presentation;
  const recipients = useMemo(() => getOutreachRecipients(lead), [lead]);
  const hasEmailCta = recipients.length > 0 && lead.drafts.length > 0;
  const shouldPrepareOutreach =
    lead.contacts.length === 0 || lead.drafts.length < lead.contacts.length;
  const showOutreachPanel = hasEmailCta || shouldPrepareOutreach;
  const isHidden = presentation.organizationState === 'hidden';

  return (
    <motion.article
      id={isDragOverlay ? undefined : getLeadCardDomId(lead.id)}
      layout={isDragOverlay ? false : 'position'}
      transition={transition}
      className={cn(
        'w-full scroll-mt-6 rounded-lg border border-border/70 bg-background/60 p-4 shadow-xs will-change-transform',
        isHidden && 'border-dashed bg-muted/20 opacity-75',
        isDragOverlay &&
          'border-primary/40 bg-background/95 opacity-100 shadow-xl ring-1 ring-primary/15 backdrop-blur-sm',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://${lead.businessDomain}`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex items-center gap-1 text-lg font-semibold hover:text-primary',
                isHidden && 'text-muted-foreground line-through',
              )}
            >
              {lead.businessDomain}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {presentation.buyerSummary}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {dragHandle ? (
            <ProspectDragHandle dragHandle={dragHandle} />
          ) : showDragHandlePreview ? (
            <ProspectDragHandlePreview />
          ) : null}
          <ProspectSignalActions
            state={presentation.organizationState}
            isPending={isUserSignalPending}
            onSetState={onSetUserSignal}
          />
          <LeadContactCountBadge contactCount={lead.contacts.length} />
        </div>
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
      {!isDragOverlay && (
        <LeadEmailDialog
          lead={lead}
          open={isReviewingOutreach}
          recipients={recipients}
          sourceDomain={sourceDomain}
          onOpenChange={onReviewOutreachChange}
        />
      )}
    </motion.article>
  );
}

function getUserSignalDestinationSectionId(
  state: LeadgenUserSignalState,
): LeadOrganizationSectionId {
  if (state === 'bookmarked') {
    return 'bookmarked';
  }

  if (state === 'hidden') {
    return 'hidden';
  }

  return 'prospects';
}

function getLeadPresentationsBySectionIds(
  leadIds: string[],
  leadPresentationById: Map<string, LeadPresentation>,
) {
  return leadIds.flatMap((leadId) => {
    const presentation = leadPresentationById.get(leadId);
    return presentation ? [presentation] : [];
  });
}

function ProspectDragHandle({
  dragHandle,
}: {
  dragHandle: LeadDragHandleProps;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={dragHandle.setActivatorNodeRef}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Reorder prospect"
            disabled={dragHandle.isDisabled}
            className={cn(
              'touch-none cursor-grab text-muted-foreground active:cursor-grabbing',
              dragHandle.isDragging && 'cursor-grabbing',
            )}
            {...dragHandle.attributes}
            {...(dragHandle.listeners ?? {})}
          />
        }
      >
        <GripVertical data-icon="inline-start" />
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>Reorder prospect</TooltipContent>
    </Tooltip>
  );
}

function ProspectDragHandlePreview() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      tabIndex={-1}
      aria-hidden="true"
      className="pointer-events-none cursor-grabbing text-muted-foreground"
    >
      <GripVertical data-icon="inline-start" />
    </Button>
  );
}

function LeadOrganizationSection({
  sectionId,
  title,
  count,
  icon: Icon,
  open,
  leadIds,
  emptyStateMessage,
  muted = false,
  transition,
  onOpenChange,
  children,
}: {
  sectionId: LeadOrganizationSectionId;
  title: string;
  count: number;
  icon: LucideIcon;
  open: boolean;
  leadIds: string[];
  emptyStateMessage: string;
  muted?: boolean;
  transition: typeof leadLayoutTransition | { duration: number };
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: sectionId,
    data: {
      children: leadIds,
      sectionId,
      type: 'section',
    },
  });

  return (
    <motion.section
      ref={setNodeRef}
      layout="position"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={transition}
      className={cn(
        'overflow-hidden rounded-lg border border-border/70 bg-background/45',
        muted && 'bg-muted/10',
        isOver && 'border-primary/50 bg-primary/5',
      )}
    >
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="group flex min-h-11 w-full items-center gap-2 px-3 text-start transition-colors hover:bg-muted/40"
              aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
            />
          }
        >
          <ChevronDown className="-rotate-90 size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-0" />
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{title}</span>
          <Badge variant={muted ? 'outline' : 'secondary'}>{count}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <LeadOrganizationDropArea
            sectionId={sectionId}
            leadIds={leadIds}
            count={count}
            emptyStateMessage={emptyStateMessage}
            isOver={isOver}
            transition={transition}
          >
            {children}
          </LeadOrganizationDropArea>
        </CollapsibleContent>
      </Collapsible>
    </motion.section>
  );
}

function toStringIdentifier(id: UniqueIdentifier) {
  return String(id);
}

function getLeadOrganizationSectionId(
  id: UniqueIdentifier,
): LeadOrganizationSectionId | null {
  const sectionId = toStringIdentifier(id);

  return leadOrganizationSectionIds.includes(
    sectionId as LeadOrganizationSectionId,
  )
    ? (sectionId as LeadOrganizationSectionId)
    : null;
}

function getLeadCrossSectionInsertIndex({
  activeTop,
  overId,
  overRect,
  sectionLeadIds,
  targetSectionId,
}: {
  activeTop?: number;
  overId: string;
  overRect: { top: number; height: number } | null;
  sectionLeadIds: LeadSectionLeadIds;
  targetSectionId: LeadOrganizationSectionId;
}) {
  const targetLeadIds = sectionLeadIds[targetSectionId];

  if (getLeadOrganizationSectionId(overId)) {
    return targetLeadIds.length;
  }

  const overIndex = targetLeadIds.indexOf(overId);
  const isBelowOverItem =
    overRect && activeTop != null && activeTop > overRect.top + overRect.height;

  return overIndex >= 0
    ? overIndex + (isBelowOverItem ? 1 : 0)
    : targetLeadIds.length;
}

function ProspectSignalActions({
  state,
  isPending,
  onSetState,
}: {
  state: LeadgenUserSignalState;
  isPending: boolean;
  onSetState: (state: LeadgenUserSignalState) => void;
}) {
  const isBookmarked = state === 'bookmarked';
  const isHidden = state === 'hidden';

  return (
    <fieldset className="flex items-center gap-1 border-0 p-0">
      <legend className="sr-only">Organize prospect</legend>
      <ProspectSignalButton
        label={isBookmarked ? 'Remove bookmark' : 'Bookmark prospect'}
        pressed={isBookmarked}
        disabled={isPending}
        onClick={() => onSetState(isBookmarked ? 'none' : 'bookmarked')}
      >
        <Star data-icon="inline-start" />
      </ProspectSignalButton>
      <ProspectSignalButton
        label={isHidden ? 'Restore prospect' : 'Hide prospect'}
        pressed={isHidden}
        disabled={isPending}
        onClick={() => onSetState(isHidden ? 'none' : 'hidden')}
      >
        <EyeOff data-icon="inline-start" />
      </ProspectSignalButton>
    </fieldset>
  );
}

function ProspectSignalButton({
  label,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={pressed ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
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

function getLeadCardDomId(leadId: string) {
  return `leadgen-lead-${leadId}`;
}

function HowToSellDomainLink({ className }: { className?: string }) {
  return (
    <Link
      href={HOW_TO_SELL_DOMAIN_BLOG_HREF}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
    >
      <Info className="size-3.5" aria-hidden="true" />
      How to sell a domain
    </Link>
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
          className="w-full bg-brand-primary text-primary-foreground hover:bg-brand-primary/90 focus-visible:ring-brand-primary/50 sm:w-auto"
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
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'max-h-[min(90vh,860px)] w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-[620px]',
        )}
      >
        <DialogHeader>
          <DialogTitle>Email {lead.businessDomain}</DialogTitle>
          <DialogDescription>
            Choose a recipient and open the draft in your email client.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 overflow-y-auto pe-1">
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
type TimelineSubtaskTone = 'prospects' | 'contacts' | 'drafts';

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
      <div className="min-h-0 flex-1 overflow-y-auto pe-1">
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
  retryingRunIds,
  scrollActiveRunIntoView,
  onExportRun,
  onRetryRun,
}: {
  runs: LeadgenRunSummary[];
  activeRunId: string | null;
  isLoading: boolean;
  exportingRunId: string | null;
  retryingRunIds: string[];
  scrollActiveRunIntoView: boolean;
  onExportRun: (runId: string) => Promise<void>;
  onRetryRun: (runId: string) => void;
}) {
  const runListRootRef = useRef<HTMLDivElement | null>(null);
  const selectedRunRef = useRef<HTMLDivElement | null>(null);
  const scrolledRunIdRef = useRef<string | null>(null);
  const activeRunListKey =
    activeRunId && runs.some((run) => run.id === activeRunId)
      ? activeRunId
      : null;

  useEffect(() => {
    if (
      !scrollActiveRunIntoView ||
      !activeRunId ||
      !activeRunListKey ||
      isLoading ||
      scrolledRunIdRef.current === activeRunId
    ) {
      return;
    }

    const runList = runListRootRef.current?.querySelector<HTMLDivElement>(
      RUN_LIST_VIEWPORT_SELECTOR,
    );
    const selectedRun = selectedRunRef.current;
    if (!runList || !selectedRun) return;

    const frame = window.requestAnimationFrame(() => {
      const listRect = runList.getBoundingClientRect();
      const runRect = selectedRun.getBoundingClientRect();
      const targetScrollTop =
        runList.scrollTop +
        runRect.top -
        listRect.top -
        (runList.clientHeight - runRect.height) / 2;

      runList.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'auto',
      });
      scrolledRunIdRef.current = activeRunId;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeRunId, activeRunListKey, isLoading, scrollActiveRunIntoView]);

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
        <div ref={runListRootRef} style={runListScrollAreaStyle}>
          <ScrollArea
            overflowEdgeThreshold={1}
            className={runListScrollAreaClassName}
          >
            <ScrollAreaContent>
              <div className="flex flex-col gap-2 pb-1">
                {runs.map((run) => {
                  const canExport = isLeadgenCrmCsvExportAvailable(run);
                  const isExporting = exportingRunId === run.id;
                  const canRetry = run.status === 'FAILED';
                  const isRetrying = retryingRunIds.includes(run.id);
                  const retryLabel = isRetrying
                    ? `Retrying buyer search for ${run.domain}`
                    : `Retry buyer search for ${run.domain}`;

                  return (
                    <div
                      key={run.id}
                      ref={run.id === activeRunId ? selectedRunRef : undefined}
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
                          <p className="truncate text-sm font-medium">
                            {run.domain}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isTerminalLeadgenStatus(run.status)
                              ? `${run.leadCount} leads - ${run.draftCount} drafts`
                              : 'Searching...'}
                          </p>
                        </Link>
                        {canRetry && (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  disabled={isRetrying}
                                  aria-busy={isRetrying}
                                  aria-label={retryLabel}
                                  onClick={() => onRetryRun(run.id)}
                                />
                              }
                            >
                              {isRetrying ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <RefreshCw />
                              )}
                            </TooltipTrigger>
                            <TooltipContent sideOffset={6}>
                              {isRetrying ? 'Retrying search' : 'Retry search'}
                            </TooltipContent>
                          </Tooltip>
                        )}
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
            </ScrollAreaContent>
          </ScrollArea>
        </div>
      )}
    </section>
  );
}

function upsertLeadgenRunSummary(
  runs: LeadgenRunSummary[] | undefined,
  snapshot: LeadgenSnapshot,
): LeadgenRunSummary[] {
  const summary = toLeadgenRunSummary(snapshot);
  return upsertLeadgenRunByCreatedDesc({
    runs,
    run: summary,
    limit: recentRunsQueryInput.limit,
  });
}

function toLeadgenRunSummary(snapshot: LeadgenSnapshot): LeadgenRunSummary {
  return {
    id: snapshot.id,
    domain: snapshot.domain,
    status: snapshot.status,
    reasoningEffort: snapshot.reasoningEffort,
    startedAt: snapshot.startedAt,
    finishedAt: snapshot.finishedAt,
    errorMessage: snapshot.errorMessage,
    summary: snapshot.summary,
    leadCount: snapshot.leadCount,
    contactCount: snapshot.contactCount,
    draftCount: snapshot.draftCount,
    createdAt: snapshot.createdAt,
    updatedAt: snapshot.updatedAt,
  };
}

function getTimestamp(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function omitLeadSignalState(
  states: Partial<Record<string, LeadgenUserSignalState>>,
  leadId: string,
) {
  const nextStates = { ...states };
  delete nextStates[leadId];
  return nextStates;
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
    <div className="flex h-full min-h-[calc(100vh-8rem)] items-center justify-center overflow-y-auto p-5 py-8">
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
          <HowToSellDomainLink className="mt-3 justify-center" />
        </div>

        <div className="mt-7 grid items-stretch gap-3 md:grid-cols-3">
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
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
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
  'flex h-full min-h-28 items-start gap-4 rounded-lg border border-border/70 bg-background/55 p-4 shadow-sm';

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
        'group w-full items-center text-start transition-colors hover:border-cyan-300/45 hover:bg-cyan-300/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50',
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

        <aside className="border-t border-border/70 p-5 lg:border-s lg:border-t-0">
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this consolidates independent timeline signals into one ordered phase model.
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
  const scoringStartedEvent = findLastLeadgenEvent(
    orderedEvents,
    (event) => event.eventType === 'status' && event.stage === 'triage',
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
    presentation.counts.ranked + presentation.counts.checking;
  const triageStarted = Boolean(scoringStartedEvent);
  const contactAttemptedLeadIds = getInitialContactAttemptedLeadIds({
    run,
    events: orderedEvents,
  });
  const contactPendingCount = presentation.groups.ranked.filter(
    (lead) =>
      lead.lead.initialOutreachCandidate &&
      lead.lead.contacts.length < 3 &&
      !contactAttemptedLeadIds.has(lead.lead.id),
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
  const scoringStarted = triageStarted || Boolean(outreachEvent) || terminal;
  const earlySearchStatus = getPhaseStatus({
    complete: terminal || triageStarted,
    active:
      isRunning &&
      (hasBuyerAngles || searchStarted || visibleLeadCount > 0) &&
      !triageStarted,
  });
  const scoringStatus = getPhaseStatus({
    complete:
      scoringStarted &&
      (terminal ||
        Boolean(outreachEvent) ||
        presentation.counts.checking === 0),
    active: isRunning && triageStarted && !outreachEvent,
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
      timestamp: getTimelineTimestamp(
        scoringStartedEvent ?? triageEvent,
        scoringStatus,
      ),
      detail: getActiveEventMessage(triageEvent, scoringStatus),
      subtasks: getTimelineSubtasks([
        presentation.counts.ranked > 0
          ? {
              id: 'ranked-prospects',
              label: 'Scored prospects',
              value: `${presentation.counts.ranked} ranked`,
              tone: 'prospects',
              icon: Search,
              status: getSubtaskStatus(
                scoringStatus,
                presentation.counts.ranked,
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

  phases.push(
    ...getAdditionalOutreachPhases({
      manualOutreach,
      pendingOutreachLeads,
    }),
  );

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
        ? `${presentation.counts.prospects} prospects`
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
    (event) => getLeadPayloadDedupeKey(event, 'email'),
  );
  const draftEventCount = countUniqueLeadgenEvents(
    orderedEvents,
    isInitialDraftEvent,
    (event) => getLeadPayloadDedupeKey(event, 'contactEmail'),
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

function getInitialContactAttemptedLeadIds({
  run,
  events,
}: {
  run: LeadgenSnapshot;
  events: LeadgenSnapshot['events'];
}) {
  const leadIds = new Set(
    run.leads
      .filter((lead) => lead.contacts.length > 0 || lead.drafts.length > 0)
      .map((lead) => lead.id),
  );

  for (const event of events) {
    if (!isInitialContactAttemptEvent(event)) continue;

    const leadId = getPayloadString(event.payload, 'leadId');
    if (leadId) leadIds.add(leadId);
  }

  return leadIds;
}

function isInitialContactAttemptEvent(event: LeadgenEvent) {
  return (
    !isManualOutreachEvent(event) &&
    (event.stage === 'contacts' ||
      event.stage === 'drafts' ||
      event.eventType === 'contact' ||
      event.eventType === 'draft')
  );
}

function getAdditionalOutreachPhases({
  manualOutreach,
  pendingOutreachLeads,
}: {
  manualOutreach: ReturnType<typeof getManualOutreachSummary>;
  pendingOutreachLeads: LeadgenLead[];
}): TimelinePhase[] {
  if (!manualOutreach.hasEvents && pendingOutreachLeads.length === 0) {
    return [];
  }

  if (pendingOutreachLeads.length > 0) {
    return pendingOutreachLeads.map((lead) => {
      const domainSummary = manualOutreach.domainSummaries.get(
        lead.businessDomain,
      );

      return buildAdditionalOutreachPhase({
        id: `additional-outreach-${lead.id}`,
        status: 'active',
        timestamp: 'now',
        domain: lead.businessDomain,
        contactCount: Math.max(
          domainSummary?.contactCount ?? 0,
          lead.contacts.length,
        ),
        draftCount: Math.max(
          domainSummary?.draftCount ?? 0,
          lead.drafts.length,
        ),
        lastEventWasError: false,
      });
    });
  }

  const domainSummary = manualOutreach.domain
    ? manualOutreach.domainSummaries.get(manualOutreach.domain)
    : null;
  const lastEventWasError =
    domainSummary?.lastEventWasError ?? manualOutreach.lastEventWasError;
  const status = getAdditionalOutreachStatus({
    active: false,
    lastEventWasError,
  });
  const contactCount = Math.max(
    domainSummary?.contactCount ?? 0,
    manualOutreach.contactCount,
  );
  const draftCount = Math.max(
    domainSummary?.draftCount ?? 0,
    manualOutreach.draftCount,
  );
  const lastEvent = domainSummary?.lastEvent ?? manualOutreach.lastEvent;

  return [
    buildAdditionalOutreachPhase({
      id: 'additional-outreach-summary',
      status,
      timestamp: getAdditionalOutreachTimestamp(false, lastEvent),
      domain: manualOutreach.domain,
      contactCount,
      draftCount,
      lastEventWasError,
    }),
  ];
}

function buildAdditionalOutreachPhase({
  id,
  status,
  timestamp,
  domain,
  contactCount,
  draftCount,
  lastEventWasError,
}: {
  id: string;
  status: TimelinePhaseStatus;
  timestamp?: string;
  domain?: string;
  contactCount: number;
  draftCount: number;
  lastEventWasError: boolean;
}): TimelinePhase {
  const active = status === 'active';

  return {
    id,
    title: 'Additional outreach',
    status,
    icon: Sparkles,
    timestamp,
    domain,
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

function getAdditionalOutreachStatus({
  active,
  lastEventWasError,
}: {
  active: boolean;
  lastEventWasError: boolean;
}): TimelinePhaseStatus {
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
      event.eventType === 'contact' && hasPayloadString(event.payload, 'email'),
    (event) => getLeadPayloadDedupeKey(event, 'email'),
  );
  const draftEventCount = countUniqueLeadgenEvents(
    events,
    (event) =>
      event.eventType === 'draft' &&
      hasPayloadString(event.payload, 'contactEmail'),
    (event) => getLeadPayloadDedupeKey(event, 'contactEmail'),
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
    case 'prospects':
      return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
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
    hasPayloadString(event.payload, 'email')
  );
}

function isInitialDraftEvent(event: LeadgenEvent) {
  return (
    event.eventType === 'draft' &&
    !isManualOutreachEvent(event) &&
    hasPayloadString(event.payload, 'contactEmail')
  );
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
      return hasPayloadString(event.payload, 'email');
    case 'draft':
      return hasPayloadString(event.payload, 'contactEmail');
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

function getLeadPayloadDedupeKey(event: LeadgenEvent, valueKey: string) {
  const value = getPayloadString(event.payload, valueKey);
  const leadId = getPayloadString(event.payload, 'leadId');

  if (leadId && value) return `${leadId}:${value}`;
  return value ?? leadId ?? event.id;
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

function hasReviewableOutreach(lead: LeadgenLead) {
  return lead.drafts.length > 0 && getOutreachRecipients(lead).length > 0;
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
  const summary = lead.rationale.trim();
  const body = [
    greeting,
    '',
    `I'm reaching out because ${lead.businessDomain} looks aligned with ${sourceDomain}. ${summary}`,
    evidence && !isDuplicateLeadText(summary, evidence)
      ? `I also noticed: ${evidence}`
      : null,
    '',
    'Would you be open to a quick call to discuss acquiring this domain?',
    '',
    'Best,',
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
