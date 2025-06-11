'use client';

import { CopyLinkButton } from '@/components/copy-link-button';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Download, Plus } from 'lucide-react';
import { TwitterIcon, TwitterShareButton } from 'react-share';

export interface GeneratedItem {
  id?: string;
  url: string;
  prompt?: string;
  concept?: string;
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
  isLoading?: boolean;
  onGenerateAnother?: () => void;
  brandDomain?: string;
}

export function ImageGrid({
  items,
  title,
  isLoading,
  onGenerateAnother,
  brandDomain,
}: ImageGridProps) {
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

  if (!isLoading && items.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <Card key={`${item.url}-${index}`} className="overflow-hidden">
            <div className="relative aspect-square">
              <img
                src={item.url}
                alt={item.concept || item.prompt || `${title} ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
            {/* Action buttons below image */}
            <div className="p-3 border-b border-t flex gap-2 justify-center">
              <CopyLinkButton link={item.url} />
              <TwitterShareButton
                url={item.url}
                title={`Check out my domain: ${brandDomain || 'example.com'} @namefi_io`}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="bg-muted/90"
                  title="Share on Twitter"
                >
                  <TwitterIcon className="h-4 w-4 rounded" />
                </Button>
              </TwitterShareButton>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => handleDownload(item.url, index)}
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
        ))}
        {isLoading && (
          <Card className="overflow-hidden">
            <Skeleton className="w-full aspect-square mb-2" />
            <CardContent>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            </CardContent>
          </Card>
        )}
        {!isLoading && items.length > 0 && onGenerateAnother && (
          <Button
            type="button"
            variant="outline"
            onClick={onGenerateAnother}
            className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed hover:bg-gray-100 transition min-h-[200px] h-full"
            aria-label="Generate another logo"
          >
            <Plus className="w-10 h-10 text-gray-400" />
            <span className="mt-2 text-gray-500">Generate Another</span>
          </Button>
        )}
      </div>
    </div>
  );
}
