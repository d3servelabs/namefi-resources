'use client';

import { useState } from 'react';
import { CopyLinkButton } from '@/components/copy-link-button';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Download } from 'lucide-react';
import { TwitterIcon } from 'react-share';
import { TwitterShareDialog } from '@/components/hunt/twitter-share-dialog';
import {
  defaultShareConfig,
  useTwitterShareDialog,
} from '@/hooks/use-twitter-share';
import { useRouter } from 'next/navigation';

export interface GeneratedItem {
  id?: string;
  url: string;
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
}

interface ImageGridProps {
  items: GeneratedItem[];
  title: string;
  onGenerateAnother?: () => void;
  brandDomain?: string;
}

export function ImageGrid({
  items,
  title,
  onGenerateAnother: _onGenerateAnother,
  brandDomain,
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
    domain?: string;
  }>({ open: false });
  const router = useRouter();
  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const itemKey = item.id ? `gen-${item.id}` : `idx-${index}`;

            const cardContent = (
              <Card key={itemKey} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={item.url}
                    alt={`${title} ${index + 1}`}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                </div>
                {/* Action buttons below image */}
                <div className="p-3 border-b border-t flex gap-2 justify-center">
                  <CopyLinkButton
                    link={
                      item.id && brandDomain
                        ? `${window.location.origin}/ai-brand-generator/brand/${brandDomain}/${item.id}`
                        : item.url
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="bg-muted/90"
                    title="Share on Twitter"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const detailUrl =
                        item.id && brandDomain
                          ? `${window.location.origin}/ai-brand-generator/brand/${brandDomain}/${item.id}`
                          : item.url;
                      shareDialog.openDialog(
                        (brandDomain || 'example.com') as any,
                      );
                      setDialogState({
                        open: true,
                        url: detailUrl,
                        domain: brandDomain || undefined,
                      });
                    }}
                  >
                    <TwitterIcon className="h-4 w-4 rounded" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDownload(item.url, index);
                    }}
                    className="bg-muted/90"
                    title="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
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

            // Navigable card via onClick; buttons inside stop propagation
            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
              <div
                key={itemKey}
                className="cursor-pointer"
                onClick={() => {
                  if (item.id && brandDomain) {
                    router.push(
                      `/ai-brand-generator/brand/${brandDomain}/${item.id}`,
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === 'Enter' || e.key === ' ') &&
                    item.id &&
                    brandDomain
                  ) {
                    e.preventDefault();
                    router.push(
                      `/ai-brand-generator/brand/${brandDomain}/${item.id}`,
                    );
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
        domainName={(dialogState.domain || brandDomain || 'example.com') as any}
        shareUrl={dialogState.url || ''}
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
