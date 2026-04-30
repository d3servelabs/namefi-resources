'use client';

import { useTRPC } from '@/lib/trpc';
import type { AppRouterInput, AppRouterOutput } from '@/lib/trpc';
import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { AnimationFormData } from '../animation-generator';
import type { LogoFormData } from '../logo-generator';
import type { PosterFormData } from '../poster-generator';
import type {
  AnimationMotionIntensity,
  AnimationSourceMode,
  CinematicAnimationModel,
  CinematicAnimationMotionPresetId,
  ImageModel as Model,
  LoopedAnimationModel,
  LoopedAnimationMotionPresetId,
  LogoStyleInput,
  LogoTextTreatmentInput,
  LogoTypographyInput,
  LogoTypeInput,
  MarketingCollateralTypeInput,
} from '@namefi-astra/ai/types';
import {
  ANIMATION_MOTION_INTENSITY_IDS,
  ANIMATION_SOURCE_MODE_IDS,
  CINEMATIC_ANIMATION_MODEL_IDS,
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  LOOPED_ANIMATION_MODEL_IDS,
  LOOPED_ANIMATION_MOTION_PRESET_IDS,
} from '@namefi-astra/ai/types';
import { useGalleryPending } from '../gallery-pending-context';

interface UseLogoGenerationProps {
  domain?: NamefiNormalizedDomain;
}

type GenerationListItem =
  AppRouterOutput['ai']['getUserGenerationsFiltered'][number];
type UserGenerationsFilterInput =
  AppRouterInput['ai']['getUserGenerationsFiltered'];

function prependGeneration<GenerationItemT extends GenerationListItem>(
  old: readonly GenerationItemT[] | undefined,
  data: GenerationItemT,
) {
  if (!old?.length) {
    return [data];
  }

  return [data, ...old.filter((item) => item.id !== data.id)];
}

function getAiQueryPath(queryKey: QueryKey): readonly string[] | undefined {
  const path = queryKey[0];

  if (
    !Array.isArray(path) ||
    path.some((segment) => typeof segment !== 'string')
  ) {
    return undefined;
  }

  return path as readonly string[];
}

function getAiProcedureName(queryKey: QueryKey) {
  const path = getAiQueryPath(queryKey);

  if (path?.[0] !== 'ai') {
    return undefined;
  }

  return path[1];
}

function getQueryInput<InputValueT>(
  queryKey: QueryKey,
): InputValueT | undefined {
  const metadata = queryKey[1];

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }

  if (!('input' in metadata)) {
    return undefined;
  }

  return metadata.input as InputValueT | undefined;
}

function matchesFilteredGenerationQuery(
  input: UserGenerationsFilterInput | undefined,
  generation: GenerationListItem,
) {
  if (input?.types?.length && !input.types.includes(generation.type)) {
    return false;
  }

  if (input?.domains?.length && !input.domains.includes(generation.domain)) {
    return false;
  }

  return true;
}

function invalidateGenerationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      getAiProcedureName(query.queryKey) === 'getUserGenerationsFiltered',
    refetchType: 'active',
  });

  queryClient.invalidateQueries({
    queryKey: trpc.ai.getUserDomains.queryKey(),
  });

  queryClient.invalidateQueries({
    queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
  });
}

function seedGenerationCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  trpc: ReturnType<typeof useTRPC>,
  data: GenerationListItem,
  domain?: NamefiNormalizedDomain,
) {
  const targetDomain = data.domain ?? domain;
  if (!targetDomain) {
    return;
  }

  queryClient.setQueryData(
    trpc.ai.getGenerationsByDomain.queryKey({ domain: targetDomain }),
    (old) =>
      prependGeneration(
        old as AppRouterOutput['ai']['getGenerationsByDomain'] | undefined,
        data,
      ),
  );

  const filteredGenerationQueries = queryClient.getQueriesData<
    GenerationListItem[]
  >({
    predicate: (query) =>
      getAiProcedureName(query.queryKey) === 'getUserGenerationsFiltered',
  });

  for (const [queryKey, existingRows] of filteredGenerationQueries) {
    if (!Array.isArray(existingRows)) {
      continue;
    }

    const input = getQueryInput<UserGenerationsFilterInput>(queryKey);
    if (!matchesFilteredGenerationQuery(input, data)) {
      continue;
    }

    const nextRows = prependGeneration(existingRows, data);
    queryClient.setQueryData(
      queryKey,
      typeof input?.limit === 'number'
        ? nextRows.slice(0, input.limit)
        : nextRows,
    );
  }

  queryClient.setQueryData(
    trpc.ai.getGenerationById.queryKey({ id: data.id }),
    data,
  );

  queryClient.invalidateQueries({
    queryKey: trpc.ai.getGenerationsByDomain.queryKey({
      domain: targetDomain,
    }),
  });
}

export function useLogoGeneration({ domain }: UseLogoGenerationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addPendingItem, removePendingItem, resolvePendingItem } =
    useGalleryPending();

  return useMutation(
    trpc.ai.generateLogo.mutationOptions({
      onMutate: async (variables) => {
        const pendingDomain = variables.domain ?? domain;
        if (!pendingDomain) return {};
        const pendingId = addPendingItem({
          domain: pendingDomain,
          type: 'logo',
        });
        return { pendingId } as { pendingId?: string };
      },
      onSuccess: (data, variables, context) => {
        if (context?.pendingId) {
          resolvePendingItem(context.pendingId, data);
        }
        const targetDomain = data?.domain ?? variables?.domain ?? domain;

        seedGenerationCaches(queryClient, trpc, data, targetDomain);
        invalidateGenerationQueries(queryClient, trpc);
      },
      onError: (error, _variables, context) => {
        if (context?.pendingId) {
          removePendingItem(context.pendingId);
        }
        const errorMessage =
          error.message || 'An error occurred generating logos';
        toast.error(errorMessage);
      },
    }),
  );
}

interface UsePosterGenerationProps {
  domain?: NamefiNormalizedDomain;
  availableLogos?: readonly LogoPreviewSource[];
}

type LogoPreviewSource = {
  id?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
};

function resolveLogoPreviewUrl(
  logos: readonly LogoPreviewSource[] | undefined,
  logoId?: string | null,
) {
  if (!logoId) return null;
  const logo = logos?.find((candidate) => candidate.id === logoId);
  return logo?.thumbnailUrl ?? logo?.url ?? null;
}

export function usePosterGeneration({
  domain,
  availableLogos,
}: UsePosterGenerationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addPendingItem, removePendingItem, resolvePendingItem } =
    useGalleryPending();

  return useMutation(
    trpc.ai.generatePoster.mutationOptions({
      onMutate: async (variables) => {
        const pendingDomain = variables.domain ?? domain;
        if (!pendingDomain) return {};
        const pendingId = addPendingItem({
          domain: pendingDomain,
          type: 'marketing',
          previewUrl: resolveLogoPreviewUrl(
            availableLogos,
            variables.referenceLogoGenerationId,
          ),
        });
        return { pendingId } as { pendingId?: string };
      },
      onSuccess: (data, variables, context) => {
        if (context?.pendingId) {
          resolvePendingItem(context.pendingId, data);
        }
        const targetDomain =
          data?.domain ??
          (variables as { domain?: NamefiNormalizedDomain })?.domain ??
          domain;
        seedGenerationCaches(queryClient, trpc, data, targetDomain);
        invalidateGenerationQueries(queryClient, trpc);
      },
      onError: (error, _variables, context) => {
        if (context?.pendingId) {
          removePendingItem(context.pendingId);
        }
        const errorMessage =
          error.message || 'An error occurred generating posters';
        toast.error(errorMessage);
      },
    }),
  );
}

interface UseAnimationGenerationProps {
  domain?: NamefiNormalizedDomain;
  availableLogos?: readonly LogoPreviewSource[];
}

export function useAnimationGeneration({
  domain,
  availableLogos,
}: UseAnimationGenerationProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { addPendingItem, removePendingItem } = useGalleryPending();

  return useMutation(
    trpc.ai.generateAnimation.mutationOptions({
      onMutate: async (variables) => {
        const pendingDomain = variables.domain ?? domain;
        if (!pendingDomain) return {};
        const pendingId = addPendingItem({
          domain: pendingDomain,
          type: 'animation',
          previewUrl: resolveLogoPreviewUrl(
            availableLogos,
            variables.referenceLogoGenerationId,
          ),
        });
        return { pendingId } as { pendingId?: string };
      },
      onSuccess: (data, _variables, context) => {
        seedGenerationCaches(queryClient, trpc, data, data.domain ?? domain);

        if (context?.pendingId) {
          removePendingItem(context.pendingId);
        }

        invalidateGenerationQueries(queryClient, trpc);
      },
      onError: (error, _variables, context) => {
        if (context?.pendingId) {
          removePendingItem(context.pendingId);
        }

        // biome-ignore lint/suspicious/noConsole: keep provider details out of user-facing toasts while preserving browser-debug visibility
        console.error('Animation generation failed', error);
        toast.error("We couldn't start this animation. Please try again.");
      },
    }),
  );
}

// Helper functions for generation payloads
export const createLogoGenerationPayload = (data: LogoFormData) => {
  const payload: {
    domain: NamefiNormalizedDomain;
    type: LogoTypeInput;
    style: LogoStyleInput;
    description?: string;
    model: Model;
    textTreatment: LogoTextTreatmentInput;
    typography: LogoTypographyInput;
  } = {
    domain: data.domain,
    type: data.type,
    style: data.style,
    model: data.model as Model,
    textTreatment: data.textTreatment,
    typography: data.typography,
  };

  if (data.description) {
    payload.description = data.description;
  }

  return payload;
};

export const createPosterGenerationPayload = (data: PosterFormData) => {
  const requestBody: {
    domain: NamefiNormalizedDomain;
    description?: string;
    referenceLogoGenerationId?: string;
    model: Model;
    collateralType: MarketingCollateralTypeInput;
  } = {
    domain: data.domain,
    description: data.description,
    model: data.model as Model,
    collateralType: data.collateralType,
  };

  // If a logo is selected, include the logo generation ID for reference
  if (data.selectedLogoId) {
    requestBody.referenceLogoGenerationId = data.selectedLogoId;
  }

  return requestBody;
};

export const createAnimationGenerationPayload = (data: AnimationFormData) => {
  let requestBody: AppRouterInput['ai']['generateAnimation'];

  if (data.mode === 'sheet-guided') {
    requestBody = {
      mode: 'sheet-guided',
      domain: data.domain,
      referenceLogoGenerationId: data.selectedLogoId,
      model: pickAnimationValue(
        data.model,
        LOOPED_ANIMATION_MODEL_IDS,
      ) as LoopedAnimationModel,
      sheetModel: 'gpt-image-2',
    };
  } else if (data.mode === 'looped') {
    requestBody = {
      mode: 'looped',
      domain: data.domain,
      referenceLogoGenerationId: data.selectedLogoId,
      motionPreset: pickAnimationValue(
        data.motionPreset,
        LOOPED_ANIMATION_MOTION_PRESET_IDS,
      ) as LoopedAnimationMotionPresetId,
      motionIntensity: pickAnimationValue(
        data.motionIntensity,
        ANIMATION_MOTION_INTENSITY_IDS,
      ) as AnimationMotionIntensity,
      model: pickAnimationValue(
        data.model,
        LOOPED_ANIMATION_MODEL_IDS,
      ) as LoopedAnimationModel,
    };
  } else {
    requestBody = {
      mode: 'cinematic',
      domain: data.domain,
      referenceLogoGenerationId: data.selectedLogoId,
      sourceMode: pickAnimationValue(
        data.sourceMode,
        ANIMATION_SOURCE_MODE_IDS,
      ) as AnimationSourceMode,
      motionPreset: pickAnimationValue(
        data.motionPreset,
        CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
      ) as CinematicAnimationMotionPresetId,
      model: pickAnimationValue(
        data.model,
        CINEMATIC_ANIMATION_MODEL_IDS,
      ) as CinematicAnimationModel,
    };
  }

  if (data.description) {
    requestBody.description = data.description;
  }

  return requestBody;
};

type FeaturedRecentGenerations =
  AppRouterOutput['ai']['getFeaturedAndRecentGenerations'];

interface UseDeleteGenerationOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

type DeleteGenerationContext = {
  removedId: string;
  previousUserGenerations: Array<[QueryKey, unknown]>;
  previousGenerationsByDomain: Array<[QueryKey, unknown]>;
  previousGenerationsByType: Array<[QueryKey, unknown]>;
  previousFeaturedAndRecent: FeaturedRecentGenerations | undefined;
};

function pickAnimationValue<TValue extends string>(
  value: string | undefined,
  allowedValues: readonly [TValue, ...TValue[]],
): TValue {
  if (value && allowedValues.includes(value as TValue)) {
    return value as TValue;
  }

  return allowedValues[0];
}

function restoreQuerySnapshots(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshots: Array<[QueryKey, unknown]> | undefined,
) {
  if (!snapshots) {
    return;
  }

  for (const [queryKey, data] of snapshots) {
    queryClient.setQueryData(queryKey, data);
  }
}

function getMutationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }

  return 'Failed to delete generation';
}

export function useDeleteGeneration(options: UseDeleteGenerationOptions = {}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.ai.deleteGeneration.mutationOptions({
      onMutate: async (
        variables,
      ): Promise<DeleteGenerationContext | undefined> => {
        const removedId = variables?.id;
        if (!removedId) return undefined;

        await queryClient.cancelQueries({
          predicate: (query) =>
            getAiProcedureName(query.queryKey) !== undefined,
        });

        const previousUserGenerations = queryClient.getQueriesData({
          predicate: (query) =>
            getAiProcedureName(query.queryKey) === 'getUserGenerationsFiltered',
        });
        const previousGenerationsByDomain = queryClient.getQueriesData({
          predicate: (query) =>
            getAiProcedureName(query.queryKey) === 'getGenerationsByDomain',
        });
        const previousGenerationsByType = queryClient.getQueriesData({
          predicate: (query) =>
            getAiProcedureName(query.queryKey) === 'getGenerationsByType',
        });
        const previousFeaturedAndRecent =
          queryClient.getQueryData<FeaturedRecentGenerations>(
            trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
          );

        queryClient.setQueriesData(
          {
            predicate: (query) =>
              getAiProcedureName(query.queryKey) ===
              'getUserGenerationsFiltered',
          },
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((item) => item.id !== removedId);
          },
        );

        queryClient.setQueriesData(
          {
            predicate: (query) =>
              getAiProcedureName(query.queryKey) === 'getGenerationsByDomain',
          },
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((item) => item.id !== removedId);
          },
        );

        queryClient.setQueriesData(
          {
            predicate: (query) =>
              getAiProcedureName(query.queryKey) === 'getGenerationsByType',
          },
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.filter((item) => item.id !== removedId);
          },
        );

        queryClient.setQueryData(
          trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              featured: (old.featured ?? []).filter(
                (item) => item.id !== removedId,
              ),
              recent: (old.recent ?? []).filter(
                (item) => item.id !== removedId,
              ),
            };
          },
        );

        return {
          removedId,
          previousUserGenerations,
          previousGenerationsByDomain,
          previousGenerationsByType,
          previousFeaturedAndRecent,
        };
      },
      onSuccess: (_data, variables) => {
        if (variables?.id) {
          queryClient.setQueryData(
            trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                featured: (old.featured ?? []).filter(
                  (item) => item.id !== variables.id,
                ),
                recent: (old.recent ?? []).filter(
                  (item) => item.id !== variables.id,
                ),
              };
            },
          );
        }

        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = getAiProcedureName(query.queryKey);
            return (
              key === 'getUserGenerationsFiltered' ||
              key === 'getGenerationsByDomain' ||
              key === 'getGenerationsByType' ||
              key === 'getGenerationById' ||
              key === 'getFeaturedAndRecentGenerations'
            );
          },
        });

        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserDomains.queryKey(),
        });

        queryClient.invalidateQueries({
          queryKey: trpc.ai.getUserGenerationUsage.queryKey(),
        });

        toast.success('Generation deleted');
        options.onSuccess?.();
      },
      onError: (error, _variables, context) => {
        restoreQuerySnapshots(queryClient, context?.previousUserGenerations);
        restoreQuerySnapshots(
          queryClient,
          context?.previousGenerationsByDomain,
        );
        restoreQuerySnapshots(queryClient, context?.previousGenerationsByType);
        if (context?.previousFeaturedAndRecent !== undefined) {
          queryClient.setQueryData<FeaturedRecentGenerations | undefined>(
            trpc.ai.getFeaturedAndRecentGenerations.queryKey(),
            context.previousFeaturedAndRecent,
          );
        }
        toast.error(getMutationErrorMessage(error));
        options.onError?.(error);
      },
    }),
  );
}
