'use client';

import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clapperboard,
  Copy,
  Download,
  Image as ImageIcon,
  Maximize2,
  Sparkles,
  Trash2,
  Type,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { TwitterIcon } from 'react-share';
import {
  TwitterShareDialog,
  type TwitterShareSubject,
} from '@/components/hunt/twitter-share-dialog';
import { useTwitterShareDialog } from '@/hooks/use-twitter-share';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import type { AppRouterOutput } from '@/lib/trpc';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { collateralLabels } from './ai-generation/poster-generator';
import { useAuth } from '@/hooks/use-auth';
import { useDeleteGeneration } from './ai-generation/shared/generation-hooks';
import { isReadyLogoGeneration } from './ai-generation/shared/logo-readiness';
import {
  buildDownloadFilename,
  downloadGenerationAsset,
  getGenerationFileExtension,
} from './ai-generation/shared/generation-actions';
import {
  ANIMATION_MODES,
  ANIMATION_MODELS,
  ANIMATION_MOTION_INTENSITIES,
  ANIMATION_MOTION_PRESETS,
  type AnimationMotionPresetId,
  type AnimationMode,
  type AnimationMotionIntensity,
  ANIMATION_SOURCE_MODES,
  type AnimationSourceMode,
  LOGO_STYLES,
  LOGO_TEXT_TREATMENTS,
  LOGO_TYPOGRAPHY,
  LOGO_TYPES,
} from '@namefi-astra/ai/types';

type GenerationData = AppRouterOutput['ai']['getGenerationById'];

interface GenerationDetailsClientProps {
  domain: string;
  generationId: string;
  initialGeneration?: GenerationData;
  error?: string;
}

const GENERIC_GENERATION_ERROR_MESSAGE =
  "We couldn't finish this generation. Please try again.";

const getGenerationShareSubject = (
  type?: GenerationData['type'],
): TwitterShareSubject => {
  if (type === 'marketing') return 'poster';
  return type ?? 'generation';
};

const detailActionButtonClassName =
  'min-h-11 w-full justify-center gap-2 px-4 text-center leading-tight whitespace-normal [&_svg]:shrink-0';

const logoCtaButtonClassName =
  'min-h-11 w-full justify-center gap-2 border border-brand-primary/20 bg-brand-primary px-5 text-center text-sm font-semibold leading-tight whitespace-normal text-primary-foreground shadow-[0_14px_28px_-18px_rgba(16,185,129,0.75)] transition-colors hover:bg-brand-primary/90 [&_svg]:shrink-0';

function formatGenerationCreatedAt(value: GenerationData['createdAt']) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const isoTimestamp = date.toISOString();
  return `${isoTimestamp.slice(0, 10)} at ${isoTimestamp.slice(11, 16)} UTC`;
}

function formatGenerationCreatedAtLocal(value: GenerationData['createdAt']) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

function getGenerationMetadataRecord(
  generation: GenerationData | undefined,
): Record<string, unknown> | undefined {
  return generation?.metadata &&
    typeof generation.metadata === 'object' &&
    !Array.isArray(generation.metadata)
    ? (generation.metadata as Record<string, unknown>)
    : undefined;
}

function resolveAnimationMotionPresetId(
  generation: GenerationData | undefined,
): AnimationMotionPresetId | undefined {
  if (
    generation?.type !== 'animation' ||
    generation.input?.type !== 'animation'
  ) {
    return undefined;
  }

  const metadata = getGenerationMetadataRecord(generation);

  if (
    metadata &&
    'resolvedMotionPreset' in metadata &&
    typeof metadata.resolvedMotionPreset === 'string' &&
    metadata.resolvedMotionPreset in ANIMATION_MOTION_PRESETS
  ) {
    return metadata.resolvedMotionPreset as AnimationMotionPresetId;
  }

  const inputMotionPreset =
    'motionPreset' in generation.input
      ? generation.input.motionPreset
      : undefined;

  if (inputMotionPreset && inputMotionPreset in ANIMATION_MOTION_PRESETS) {
    return inputMotionPreset as AnimationMotionPresetId;
  }

  return undefined;
}

function resolveAnimationSourceMode(
  generation: GenerationData | undefined,
): AnimationSourceMode | undefined {
  if (
    generation?.type !== 'animation' ||
    generation.input?.type !== 'animation' ||
    generation.input.mode !== 'cinematic'
  ) {
    return undefined;
  }

  return generation.input.sourceMode === 'subject-reference'
    ? 'subject-reference'
    : 'exact-frame';
}

function resolveAnimationMode(
  generation: GenerationData | undefined,
): AnimationMode | undefined {
  if (
    generation?.type !== 'animation' ||
    generation.input?.type !== 'animation'
  ) {
    return undefined;
  }

  return generation.input.mode;
}

function resolveAnimationMotionIntensity(
  generation: GenerationData | undefined,
): AnimationMotionIntensity | undefined {
  if (
    generation?.type !== 'animation' ||
    generation.input?.type !== 'animation' ||
    generation.input.mode !== 'looped'
  ) {
    return undefined;
  }

  return generation.input.motionIntensity;
}

function isSheetGuidedAnimation(generation: GenerationData | undefined) {
  return (
    generation?.type === 'animation' &&
    generation.input?.type === 'animation' &&
    generation.input.mode === 'sheet-guided'
  );
}

function resolveAnimationSheetReference(
  generation: GenerationData | undefined,
) {
  if (!isSheetGuidedAnimation(generation)) {
    return undefined;
  }

  const metadata = getGenerationMetadataRecord(generation);
  const url = metadata?.animationSheetUrl;

  if (typeof url !== 'string' || !url) {
    return undefined;
  }

  return {
    url,
    model:
      typeof metadata.sheetModel === 'string' ? metadata.sheetModel : undefined,
  };
}

function AnimationSheetDialogImage({ alt, src }: { alt: string; src: string }) {
  const [dimensions, setDimensions] = useState<{
    height: number;
    width: number;
  } | null>(null);

  return (
    <div
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-lg"
      style={{
        aspectRatio: dimensions
          ? `${dimensions.width} / ${dimensions.height}`
          : '3 / 2',
        maxWidth: dimensions ? Math.min(dimensions.width, 1024) : undefined,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="object-contain"
        onLoad={(event) => {
          const { naturalHeight, naturalWidth } = event.currentTarget;
          if (naturalHeight > 0 && naturalWidth > 0) {
            setDimensions({ height: naturalHeight, width: naturalWidth });
          }
        }}
      />
    </div>
  );
}

const LoadingSkeleton = () => (
  <div className="container max-w-4xl mx-auto py-8 px-8">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Main Content Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Image Skeleton */}
      <div className="lg:col-span-2">
        <Skeleton className="w-full aspect-square rounded-lg" />
      </div>

      {/* Details Skeleton */}
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ErrorPlaceholder = ({
  error,
  onGoBack,
}: {
  error: string;
  onGoBack: () => void;
}) => (
  <div className="container max-w-4xl mx-auto py-8 px-8">
    <EmptyPlaceholder>
      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
        <ImageIcon className="size-10 text-muted-foreground" />
      </div>
      <EmptyPlaceholder.Title>Generation not found</EmptyPlaceholder.Title>
      <EmptyPlaceholder.Description>
        {error || 'The generation you are looking for could not be found.'}
      </EmptyPlaceholder.Description>
      <Button variant="outline" onClick={onGoBack} className="mt-4">
        <ArrowLeft className="me-2 h-4 w-4" />
        Go back
      </Button>
    </EmptyPlaceholder>
  </div>
);

function AnimationPreview(props: {
  domain: string;
  mode?: AnimationMode;
  posterUrl?: string | null;
  url: string;
}) {
  const isLooped = props.mode === 'looped';
  const modeLabel = props.mode
    ? ANIMATION_MODES[props.mode].name.toLowerCase()
    : 'logo';

  return (
    <video
      aria-label={`AI-generated ${modeLabel} animation for ${props.domain}`}
      autoPlay={isLooped}
      className="h-full w-full rounded-lg bg-black object-contain"
      controls
      loop={isLooped}
      muted={isLooped}
      playsInline
      poster={props.posterUrl ?? undefined}
      preload="metadata"
      src={props.url}
    />
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: this container coordinates loading, polling, media display, detail cards, and destructive actions for three generation types.
export function GenerationDetailsClient({
  domain,
  generationId,
  initialGeneration,
  error: initialError,
}: GenerationDetailsClientProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const trpc = useTRPC();
  const [currentUrl, setCurrentUrl] = useState('');
  const [localCreatedAtDisplay, setLocalCreatedAtDisplay] = useState<
    string | null
  >(null);
  const shareDialog = useTwitterShareDialog({
    enabled: true,
    trackShares: false,
    featureKey: 'ai_generation',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSheetPreviewOpen, setIsSheetPreviewOpen] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const shouldLiveRefresh =
    initialGeneration?.status === 'PENDING' ||
    initialGeneration?.status === 'PROCESSING';
  // The SSR getGenerationById query uses a public client, so a missing
  // initialGeneration?.userId means useQuery should refetch after auth to
  // hydrate owner-only fields.
  const shouldRefetchPrivateGenerationFields =
    isAuthenticated && !isAuthLoading && !initialGeneration?.userId;

  // Hydrate from the server result, but keep pending jobs live until they settle.
  const {
    data: generation,
    isLoading: isGenerationLoading,
    error: fetchError,
  } = useQuery({
    ...trpc.ai.getGenerationById.queryOptions({ id: generationId }),
    enabled:
      !initialGeneration ||
      shouldLiveRefresh ||
      shouldRefetchPrivateGenerationFields,
    initialData: initialGeneration,
    refetchInterval: (query) => {
      const data = query.state.data as GenerationData | undefined;
      return data?.status === 'PENDING' || data?.status === 'PROCESSING'
        ? 2_500
        : false;
    },
  });

  useEffect(() => {
    if (!generation?.createdAt) {
      setLocalCreatedAtDisplay(null);
      return;
    }

    setLocalCreatedAtDisplay(
      formatGenerationCreatedAtLocal(generation.createdAt),
    );
  }, [generation?.createdAt]);

  const deleteMutation = useDeleteGeneration({
    onSuccess: () => {
      setDeleteDialogOpen(false);
    },
  });

  // Fetch reference generation (logo) for marketing generations
  const {
    data: referenceGeneration,
    isLoading: isReferenceLoading,
    error: referenceError,
  } = useQuery({
    ...trpc.ai.getGenerationById.queryOptions({
      id: generation?.referenceGenerationId || '',
    }),
    enabled:
      (generation?.type === 'marketing' || generation?.type === 'animation') &&
      !!generation?.referenceGenerationId,
  });

  const handleGoBack = useCallback(() => {
    router.push('/studio');
  }, [router]);

  const handleDownload = useCallback(async () => {
    if (!generation?.url) return;

    await downloadGenerationAsset({
      url: generation.url,
      filename: buildDownloadFilename(
        `${domain}-${generation.type}-${generationId}`,
        getGenerationFileExtension(generation.mimeType),
      ),
    });
  }, [
    domain,
    generation?.mimeType,
    generation?.type,
    generation?.url,
    generationId,
  ]);

  const getTextTreatmentLabel = (value: string) =>
    LOGO_TEXT_TREATMENTS[value as keyof typeof LOGO_TEXT_TREATMENTS]?.name ??
    value;

  const getTypographyLabel = (value: string) =>
    LOGO_TYPOGRAPHY[value as keyof typeof LOGO_TYPOGRAPHY]?.name ?? value;

  const getLogoTypeLabel = (value: string) =>
    LOGO_TYPES[value as keyof typeof LOGO_TYPES]?.name ?? value;

  const getLogoStyleLabel = (value: string) =>
    LOGO_STYLES[value as keyof typeof LOGO_STYLES]?.name ?? value;

  const logoStyleValue =
    generation?.output?.type === 'logo'
      ? generation.output.logoStyle
      : generation?.input?.type === 'logo'
        ? generation.input.logoStyle
        : undefined;

  const logoTypeValue =
    generation?.output?.type === 'logo'
      ? generation.output.logoType
      : generation?.input?.type === 'logo'
        ? generation.input.logoType
        : undefined;

  const textTreatmentValue =
    generation?.output?.type === 'logo'
      ? generation.output.textTreatment
      : generation?.input?.type === 'logo'
        ? generation.input.textTreatment
        : undefined;

  const typographyValue =
    generation?.output?.type === 'logo'
      ? generation.output.typography
      : generation?.input?.type === 'logo'
        ? generation.input.typography
        : undefined;

  const animationModeValue = resolveAnimationMode(generation);
  const isSheetGuidedAnimationValue = isSheetGuidedAnimation(generation);
  const motionPresetValue = resolveAnimationMotionPresetId(generation);
  const animationSourceModeValue = resolveAnimationSourceMode(generation);
  const animationMotionIntensityValue =
    resolveAnimationMotionIntensity(generation);
  const animationSheetReference = resolveAnimationSheetReference(generation);

  const animationModelValue =
    generation?.output?.type === 'animation'
      ? generation.output.model
      : generation?.input?.type === 'animation'
        ? generation.input.model
        : undefined;

  const statusLabel =
    generation?.status === 'PENDING'
      ? 'Pending'
      : generation?.status === 'PROCESSING'
        ? 'Processing'
        : generation?.status === 'FAILED'
          ? 'Failed'
          : 'Ready';

  const previewUrl = generation?.thumbnailUrl ?? generation?.url;
  const referenceGenerationPreviewUrl =
    referenceGeneration?.thumbnailUrl ?? referenceGeneration?.url;
  const createdAtDisplay = generation
    ? formatGenerationCreatedAt(generation.createdAt)
    : null;
  const visibleCreatedAtDisplay = localCreatedAtDisplay ?? createdAtDisplay;
  const canDelete =
    isAuthenticated &&
    !!user?.id &&
    !!generation?.userId &&
    user.id === generation.userId;
  const canUseAsLogoReference = isReadyLogoGeneration(generation);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      toast('Link copied to clipboard', {
        description: 'You can now share this generation with others',
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link', {
        description: 'Please try again',
      });
    }
  }, [currentUrl]);

  const handleCreatePoster = useCallback(() => {
    if (!isReadyLogoGeneration(generation)) return;
    if (!generation?.id || !generation?.domain) return;
    const params = new URLSearchParams();
    if (canDelete) {
      params.set('poster', generation.id);
    } else {
      params.set('next', 'poster');
      params.set('domain', generation.domain);
    }
    router.push(`/studio?${params.toString()}`);
  }, [canDelete, generation, router]);

  const handleCreateAnimation = useCallback(() => {
    if (!isReadyLogoGeneration(generation)) return;
    if (!generation?.id || !generation?.domain) return;
    const params = new URLSearchParams();
    if (canDelete) {
      params.set('animation', generation.id);
    } else {
      params.set('next', 'animation');
      params.set('domain', generation.domain);
    }
    router.push(`/studio?${params.toString()}`);
  }, [canDelete, generation, router]);

  // Create brand name from domain
  const brandName = domain
    ?.split('.')[0]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  const shareableDomain = generation?.domain
    ? (generation.domain as NamefiNormalizedDomain)
    : null;
  const shareSubject = getGenerationShareSubject(generation?.type);

  useEffect(() => {
    if (generation?.status !== 'FAILED' || !generation.errorMessage) return;

    // biome-ignore lint/suspicious/noConsole: keep provider details out of UI while preserving browser-debug visibility
    console.error('AI generation failed', {
      generationId: generation.id,
      domain: generation.domain,
      type: generation.type,
      errorMessage: generation.errorMessage,
    });
  }, [
    generation?.domain,
    generation?.errorMessage,
    generation?.id,
    generation?.status,
    generation?.type,
  ]);

  if (isGenerationLoading) {
    return <LoadingSkeleton />;
  }

  if (initialError || fetchError || !generation) {
    return (
      <ErrorPlaceholder
        error={initialError || fetchError?.message || 'Generation not found'}
        onGoBack={handleGoBack}
      />
    );
  }

  return (
    <>
      <div className="container max-w-4xl mx-auto py-8 px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            aria-label="Back to Namefi Brand Studio"
            className="flex items-center gap-2 cursor-pointer self-start"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Namefi Brand Studio
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {generation.type === 'logo'
                ? 'Logo'
                : generation.type === 'animation'
                  ? 'Animation'
                  : 'Poster'}{' '}
              for {brandName}
            </h1>
            <p className="text-muted-foreground mt-1">{domain}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Media Display */}
          <div className="lg:col-span-2">
            <Card className="p-0">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  {generation.type === 'animation' && generation.url ? (
                    <AnimationPreview
                      domain={domain}
                      mode={animationModeValue}
                      posterUrl={
                        isSheetGuidedAnimationValue
                          ? undefined
                          : generation.thumbnailUrl
                      }
                      url={generation.url}
                    />
                  ) : previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={`AI-generated ${generation.type} for ${domain}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 67vw"
                      loading="eager"
                      fetchPriority="high"
                      className="rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted/30 p-8 text-center">
                      <div>
                        <div className="text-lg font-semibold">
                          {statusLabel}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {generation.status === 'FAILED'
                            ? GENERIC_GENERATION_ERROR_MESSAGE
                            : 'The asset is not available yet.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {!generation.url && (
                    <div className="absolute inset-0 flex items-end justify-start rounded-lg bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6">
                      <div className="rounded-lg bg-black/60 px-4 py-3 text-white">
                        <div className="text-sm font-semibold">
                          {statusLabel}
                        </div>
                        <div className="text-xs text-white/80">
                          {generation.status === 'FAILED'
                            ? GENERIC_GENERATION_ERROR_MESSAGE
                            : generation.status === 'PROCESSING'
                              ? 'Your generation is still running.'
                              : 'Your generation is queued and will appear here shortly.'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="space-y-3">
              {canUseAsLogoReference && (
                <div className="grid gap-2">
                  <Button
                    className={logoCtaButtonClassName}
                    onClick={handleCreatePoster}
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Poster
                  </Button>
                  <Button
                    className={logoCtaButtonClassName}
                    onClick={handleCreateAnimation}
                  >
                    <Clapperboard className="h-4 w-4" />
                    Animate Logo
                  </Button>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDownload}
                  className={detailActionButtonClassName}
                  disabled={!generation.url}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className={detailActionButtonClassName}
                    title="Share on Twitter"
                    onClick={() => {
                      if (!shareableDomain) {
                        return;
                      }

                      shareDialog.openDialog(shareableDomain);
                      setIsDialogOpen(true);
                    }}
                  >
                    <TwitterIcon className="h-4 w-4 rounded" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className={detailActionButtonClassName}
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </div>
              {canDelete && (
                <AlertDialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="destructive"
                        className={detailActionButtonClassName}
                        disabled={deleteMutation.isPending}
                      />
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete this generation?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the{' '}
                        {generation.type === 'marketing'
                          ? 'poster'
                          : generation.type === 'animation'
                            ? 'animation'
                            : 'logo'}{' '}
                        for <strong>{domain}</strong> from your gallery. This
                        action can't be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteMutation.isPending}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          deleteMutation.mutate({ id: generationId });
                          router.replace('/studio');
                        }}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Generation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Type:</span>
                  <Badge variant="secondary" className="capitalize">
                    {generation.type}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Status:</span>
                  <Badge
                    variant={
                      generation.status === 'FAILED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {statusLabel}
                  </Badge>
                </div>

                {generation.type === 'marketing' && (
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Collateral:</span>
                    <Badge variant="secondary" className="capitalize">
                      {(() => {
                        const key =
                          generation.output?.type === 'marketing'
                            ? generation.output.collateralType
                            : undefined;
                        return key
                          ? (collateralLabels[
                              key as keyof typeof collateralLabels
                            ] ?? key)
                          : 'Unknown';
                      })()}
                    </Badge>
                  </div>
                )}

                {generation.type === 'animation' && motionPresetValue && (
                  <div className="flex items-center gap-2">
                    <Clapperboard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Motion:</span>
                    <Badge variant="secondary">
                      {ANIMATION_MOTION_PRESETS[motionPresetValue].name}
                    </Badge>
                  </div>
                )}

                {generation.type === 'animation' && animationModeValue && (
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Mode:</span>
                    <Badge variant="secondary">
                      {ANIMATION_MODES[animationModeValue].name}
                    </Badge>
                  </div>
                )}

                {generation.type === 'animation' &&
                  animationModeValue === 'cinematic' &&
                  animationSourceModeValue && (
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Opening:</span>
                      <Badge variant="secondary">
                        {ANIMATION_SOURCE_MODES[animationSourceModeValue].name}
                      </Badge>
                    </div>
                  )}

                {generation.type === 'animation' &&
                  animationModeValue === 'looped' &&
                  animationMotionIntensityValue && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Intensity:</span>
                      <Badge variant="secondary">
                        {
                          ANIMATION_MOTION_INTENSITIES[
                            animationMotionIntensityValue
                          ].name
                        }
                      </Badge>
                    </div>
                  )}

                {generation.type === 'animation' && animationModelValue && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Model:</span>
                    <Badge variant="secondary">
                      {ANIMATION_MODELS[animationModelValue].name}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm">Created:</span>
                    <p className="text-xs text-muted-foreground">
                      {visibleCreatedAtDisplay ?? 'Unknown'}
                    </p>
                  </div>
                </div>

                {generation.errorMessage && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {GENERIC_GENERATION_ERROR_MESSAGE}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logo-specific Metadata */}
            {generation.type === 'logo' && (
              <Card>
                <CardHeader>
                  <CardTitle>Logo Properties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Style:</span>
                    <Badge variant="outline" className="ms-2 capitalize">
                      {logoStyleValue ? getLogoStyleLabel(logoStyleValue) : ''}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Type:</span>
                    <Badge variant="outline" className="ms-2 capitalize">
                      {logoTypeValue ? getLogoTypeLabel(logoTypeValue) : ''}
                    </Badge>
                  </div>
                  {textTreatmentValue && (
                    <div>
                      <span className="text-sm font-medium">TLD:</span>
                      <Badge variant="outline" className="ms-2 capitalize">
                        {getTextTreatmentLabel(textTreatmentValue)}
                      </Badge>
                    </div>
                  )}
                  {typographyValue && (
                    <div>
                      <span className="text-sm font-medium">Typography:</span>
                      <Badge variant="outline" className="ms-2 capitalize">
                        {getTypographyLabel(typographyValue)}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Source Logo */}
            {(generation.type === 'marketing' ||
              generation.type === 'animation') &&
              generation.referenceGenerationId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Source Logo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isReferenceLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="w-full aspect-square rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : referenceGeneration && referenceGenerationPreviewUrl ? (
                      <>
                        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                          <Image
                            src={referenceGenerationPreviewUrl}
                            alt="Logo used for derivative generation"
                            fill
                            sizes="(max-width: 1024px) 100vw, 320px"
                            className="object-contain"
                          />
                        </div>

                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/studio/${generation.referenceGenerationId}`,
                              )
                            }
                            className="text-xs"
                          >
                            View Logo Details
                          </Button>
                        </div>
                      </>
                    ) : referenceGeneration ? (
                      <div className="text-sm text-muted-foreground">
                        Source logo preview is unavailable
                      </div>
                    ) : referenceError ? (
                      <div className="text-sm text-muted-foreground">
                        Failed to load logo details
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No logo reference found
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {animationSheetReference && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5" />
                    Animation Sheet
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <button
                    type="button"
                    className="group relative aspect-[3/2] w-full overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => setIsSheetPreviewOpen(true)}
                    aria-label="Open animation sheet preview"
                  >
                    <Image
                      src={animationSheetReference.url}
                      alt={`Generated animation sheet for ${domain}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 320px"
                      className="object-contain"
                    />
                    <span className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Maximize2 className="size-4" />
                    </span>
                  </button>

                  {animationSheetReference.model && (
                    <div>
                      <span className="text-sm font-medium">Sheet model:</span>
                      <Badge variant="outline" className="ms-2">
                        {animationSheetReference.model}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      {/* Shared Twitter dialog for AI Generation */}
      <TwitterShareDialog
        isOpen={isDialogOpen && !!shareDialog.isOpen}
        onClose={() => {
          setIsDialogOpen(false);
          shareDialog.onClose();
        }}
        domainName={shareableDomain}
        shareUrl={currentUrl}
        hasShared={false}
        isCheckingStatus={false}
        isSubmitting={false}
        onSubmit={async () => {
          // Share confirmation is handled outside this details view.
        }}
        trackShares={false}
        campaignKey={undefined}
        featureKey="ai_generation"
        shareSubject={shareSubject}
      />
      <Dialog open={isSheetPreviewOpen} onOpenChange={setIsSheetPreviewOpen}>
        <DialogContent className="!max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle>Animation sheet</DialogTitle>
            <DialogDescription>
              The generated storyboard used to guide this animation.
            </DialogDescription>
          </DialogHeader>
          {animationSheetReference && (
            <div className="max-h-[78vh] overflow-auto bg-muted/30 p-4">
              <AnimationSheetDialogImage
                src={animationSheetReference.url}
                alt={`Generated animation sheet for ${domain}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
