/** biome-ignore-all lint/performance/noImgElement: using plain img for controlled rendering of remote URLs */
'use client';

import { EmptyPlaceholder } from '@/components/empty-placeholder';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Copy,
  Download,
  Image as ImageIcon,
  Sparkles,
  Type,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TwitterIcon } from 'react-share';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import type { AppRouterOutput } from '@/lib/trpc';
import { collateralLabels } from './ai-generation/poster-generator';

type GenerationData = AppRouterOutput['ai']['getGenerationById'];

interface GenerationDetailsClientProps {
  domain: string;
  generationId: string;
  initialGeneration?: GenerationData;
  error?: string;
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
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Button>
    </EmptyPlaceholder>
  </div>
);

export function GenerationDetailsClient({
  domain,
  generationId,
  initialGeneration,
  error: initialError,
}: GenerationDetailsClientProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [currentUrl, setCurrentUrl] = useState('');
  const shareDialog = useTwitterShareDialog({
    ...defaultShareConfig,
    enabled: true,
    trackShares: false,
    featureKey: 'ai_generation',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // Use the initial generation if provided, otherwise fetch it
  const {
    data: generation,
    isLoading: isGenerationLoading,
    error: fetchError,
  } = useQuery({
    ...trpc.ai.getGenerationById.queryOptions({ id: generationId }),
    enabled: !initialGeneration,
    initialData: initialGeneration,
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
      generation?.type === 'marketing' &&
      generation?.input.type === 'marketing' &&
      !!generation?.referenceGenerationId,
  });

  const handleGoBack = useCallback(() => {
    router.push('/ai-brand-generator');
  }, [router]);

  const handleDownload = useCallback(async () => {
    if (!generation?.url) return;

    try {
      const response = await fetch(generation.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${domain}-${generation.type}-${generationId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, [domain, generation?.type, generation?.url, generationId]);

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
    if (generation?.type !== 'logo') return;
    if (!generation?.id || !generation?.domain) return;
    const params = new URLSearchParams();
    params.set('poster', generation.id);
    params.set('posterDomain', generation.domain);
    router.push(`/ai-brand-generator?${params.toString()}`);
  }, [generation?.domain, generation?.id, generation?.type, router]);

  // Create brand name from domain
  const brandName = domain
    ?.split('.')[0]
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {generation.type === 'logo' ? 'Logo' : 'Poster'} for {brandName}
            </h1>
            <p className="text-muted-foreground mt-1">{domain}</p>
          </div>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Image Display */}
          <div className="lg:col-span-2">
            <Card className="p-0">
              <CardContent className="p-0">
                <div className="relative aspect-square">
                  <img
                    src={generation.url}
                    alt={`AI-generated ${generation.type} for ${domain}`}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="space-y-3">
              {generation.type === 'logo' && (
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleCreatePoster}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Poster
                </Button>
              )}
              <div className="flex flex-col gap-2">
                <Button onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    title="Share on Twitter"
                    onClick={() => {
                      shareDialog.openDialog(domain as any);
                      setIsDialogOpen(true);
                    }}
                  >
                    <TwitterIcon className="mr-2 h-4 w-4 rounded" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                </div>
              </div>
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

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm">Created:</span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(generation.createdAt).toLocaleDateString(
                        undefined,
                        {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        },
                      )}{' '}
                      at{' '}
                      {new Date(generation.createdAt).toLocaleTimeString(
                        undefined,
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        },
                      )}
                    </p>
                  </div>
                </div>
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
                    <Badge variant="outline" className="ml-2 capitalize">
                      {(generation.output?.type === 'logo'
                        ? generation.output.logoStyle
                        : undefined) ??
                        (generation.input?.type === 'logo'
                          ? generation.input.logoStyle
                          : undefined)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Type:</span>
                    <Badge variant="outline" className="ml-2 capitalize">
                      {generation.output?.type === 'logo'
                        ? generation.output.logoType
                        : undefined}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Marketing-specific Metadata */}
            {generation.type === 'marketing' &&
              generation.input.type === 'marketing' &&
              generation.referenceGenerationId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Logo Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isReferenceLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="w-full aspect-square rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : referenceGeneration ? (
                      <>
                        <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                          <img
                            src={referenceGeneration.url}
                            alt="Logo used for marketing generation"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/ai-brand-generator/${generation.referenceGenerationId}`,
                              )
                            }
                            className="text-xs"
                          >
                            View Logo Details
                          </Button>
                        </div>
                      </>
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
        domainName={domain as any}
        shareUrl={currentUrl}
        hasShared={false}
        isCheckingStatus={false}
        isSubmitting={false}
        onSubmit={async () => {}}
        trackShares={false}
        campaignKey={undefined}
        featureKey="ai_generation"
      />
    </>
  );
}
