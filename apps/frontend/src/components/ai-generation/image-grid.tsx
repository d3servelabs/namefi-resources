'use client';

import { useState } from 'react';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import {
  buildDownloadFilename,
  copyGenerationLink,
  downloadGenerationAsset,
  getGenerationFileExtension,
  resolveGenerationLink,
} from './shared/generation-actions';
import { GenerationActionButtons } from './shared/generation-action-buttons';

export interface GeneratedItem {
  id?: string;
  url?: string | null;
  previewUrl?: string | null;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  style?: string;
  type?: string;
  timestamp?: string;
  imageCount?: number;
  basedOnLogo?: {
    id: string;
    result: string;
    metadata?: {
      logoType?: string;
      logoStyle?: string;
    };
  };
  kind?: 'logo' | 'marketing' | 'animation';
  domain?: NamefiNormalizedDomain;
}

interface LogoAction {
  label: string;
  onClick: (item: GeneratedItem) => void;
}

interface ImageGridProps {
  items: GeneratedItem[];
  title: string;
  onGenerateAnother?: () => void;
  brandDomain?: NamefiNormalizedDomain;
  logoActions?: LogoAction[];
}

export function ImageGrid({
  items,
  title,
  onGenerateAnother: _onGenerateAnother,
  brandDomain,
  logoActions,
}: ImageGridProps) {
  const shareDialog = useTwitterShareDialog({
    ...defaultShareConfig,
    enabled: true,
    trackShares: false,
    featureKey: 'ai_generation',
  });
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    url?: string;
    domain?: NamefiNormalizedDomain;
  }>({ open: false });
  const router = useRouter();
  const handleOpenShare = (
    item: GeneratedItem,
    domainOverride?: NamefiNormalizedDomain,
  ) => {
    const link = resolveGenerationLink({ id: item.id, fallbackUrl: item.url });
    const domain = domainOverride ?? item.domain;
    if (!link || !domain) {
      toast.error('Unable to share', {
        description:
          'A shareable link or domain was not found for this generation.',
      });
      return;
    }
    shareDialog.openDialog(domain);
    setDialogState({ open: true, url: link, domain });
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const itemKey = item.id ? `gen-${item.id}` : `idx-${index}`;
            const previewUrl = item.previewUrl ?? item.thumbnailUrl ?? item.url;

            const cardContent = (
              <Card key={itemKey} className="overflow-hidden">
                <div className="relative aspect-square">
                  {previewUrl ? (
                    /** biome-ignore lint/performance/noImgElement: using plain img keeps square thumbnail layout lightweight */
                    <img
                      src={previewUrl}
                      alt={`${title} ${index + 1}`}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted/30 text-sm text-muted-foreground">
                      Preview unavailable
                    </div>
                  )}
                </div>
                {/* Action buttons below image */}
                <div className="p-3 border-b border-t flex justify-center">
                  <GenerationActionButtons
                    appearance="grid"
                    ctaActions={
                      logoActions && item.kind === 'logo' && item.id
                        ? logoActions.map((action) => ({
                            label: action.label,
                            onClick: (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              action.onClick(item);
                            },
                          }))
                        : undefined
                    }
                    onCopy={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void copyGenerationLink({
                        id: item.id,
                        fallbackUrl: item.url ?? undefined,
                      });
                    }}
                    onShare={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleOpenShare(item, brandDomain);
                    }}
                    onDownload={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void downloadGenerationAsset({
                        url: item.url,
                        filename: buildDownloadFilename(
                          `${title}-${index + 1}`,
                          getGenerationFileExtension(item.mimeType),
                        ),
                      });
                    }}
                    disabled={{
                      share: !item.url,
                      download: !item.url,
                    }}
                  />
                </div>
                <CardContent className="px-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.type && (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {item.type}
                      </span>
                    )}
                    {item.style && (
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {item.style}
                      </span>
                    )}
                    {item.basedOnLogo && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        Based on logo
                      </span>
                    )}
                  </div>

                  {/* Show logo reference if available */}
                  {item.basedOnLogo && (
                    <div className="mb-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">Based on:</p>
                      <div className="flex items-center gap-2">
                        {/** biome-ignore lint/performance/noImgElement: referencing original logo image directly */}
                        <img
                          src={item.basedOnLogo.result}
                          alt="Referenced logo"
                          className="w-8 h-8 object-cover rounded"
                          loading="lazy"
                        />
                        <div className="flex gap-1">
                          {item.basedOnLogo.metadata?.logoType && (
                            <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {item.basedOnLogo.metadata.logoType}
                            </span>
                          )}
                          {item.basedOnLogo.metadata?.logoStyle && (
                            <span className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded">
                              {item.basedOnLogo.metadata.logoStyle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );

            return (
              // biome-ignore lint/a11y/useSemanticElements: wrapping buttons prevents nesting interactive elements
              <div
                key={itemKey}
                role="button"
                tabIndex={0}
                aria-label={`View generation ${index + 1}`}
                className="cursor-pointer"
                onClick={() => {
                  if (item.id) {
                    router.push(`/ai-brand-generator/${item.id}`);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && item.id) {
                    e.preventDefault();
                    router.push(`/ai-brand-generator/${item.id}`);
                  }
                }}
              >
                {cardContent}
              </div>
            );
          })}
        </div>
      </div>
      <TwitterShareDialog
        isOpen={dialogState.open && !!shareDialog.isOpen}
        onClose={() => {
          setDialogState({ open: false });
          shareDialog.onClose();
        }}
        domainName={dialogState.domain ?? brandDomain ?? null}
        shareUrl={dialogState.url || ''}
        hasShared={false}
        isCheckingStatus={false}
        isSubmitting={false}
        onSubmit={async () => {
          /* no-op: external share flow handles submission */
        }}
        trackShares={false}
        campaignKey={undefined}
        featureKey="ai_generation"
      />
    </>
  );
}
