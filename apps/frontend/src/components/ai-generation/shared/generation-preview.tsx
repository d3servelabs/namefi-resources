'use client';

import { NamefiButton } from '@/components/buttons/namefi-button';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Separator } from '@/components/ui/shadcn/separator';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Download, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { TwitterIcon, TwitterShareButton } from 'react-share';
import { toast } from 'sonner';
import type { GenerationLoadingState } from './use-generation-state';

// Circular progress component with fake loading percentage
const CircularProgress = ({
  isLoading,
}: {
  isLoading: boolean;
  loadingState: GenerationLoadingState;
}) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLoadingRef = useRef(isLoading);
  const [messageIndex, setMessageIndex] = useState(0);

  // Fun rotating messages
  const messages = [
    '🎨 Mixing digital paint...',
    '🤖 AI neurons firing...',
    '✨ Sprinkling creativity...',
    '🎭 Adding artistic flair...',
    '🌈 Blending colors perfectly...',
    '🔮 Channeling design magic...',
    '🎪 Orchestrating pixels...',
    '🚀 Launching imagination...',
    '💫 Polishing final touches...',
    '🎯 Perfecting composition...',
  ];

  useEffect(() => {
    // Only reset progress when loading transitions from false to true
    if (isLoading && !isLoadingRef.current) {
      // Reset progress when loading starts
      setProgress(0);
      setMessageIndex(0);
    }

    isLoadingRef.current = isLoading;

    if (isLoading) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Simulate progress
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const timeConstant = 250; // Adjust this to control the curve

          // Calculate elapsed time based on current progress
          // Inverse of the progress formula: t = -τ * ln(1 - progress/95)
          let elapsedIntervals: number;
          if (prev === 0) {
            elapsedIntervals = 0;
          } else {
            elapsedIntervals = -timeConstant * Math.log(1 - prev / 95);
          }

          // Move forward one interval
          elapsedIntervals += 1;

          // Calculate new progress
          const newProgress =
            95 * (1 - Math.exp(-elapsedIntervals / timeConstant));

          // Ensure strictly increasing (no decreases)
          return Math.max(prev, newProgress);
        });
      }, 100);

      // Rotate messages every 2 seconds
      const messageInterval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2000);

      return () => {
        clearInterval(messageInterval);
      };
    }

    if (!isLoading) {
      // Complete the progress when loading finishes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Animate to 100% when loading completes
      setProgress((prev) => {
        if (prev > 0 && prev < 100) {
          return 100;
        }
        return prev;
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLoading]);

  const strokeWidth = 4;
  const radius = 40; // This is the actual radius used in the SVG
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24">
        <svg
          height={96}
          width={96}
          viewBox="0 0 96 96"
          className="absolute inset-0 transform -rotate-90"
          aria-label="Loading progress"
        >
          <title>Loading progress: {Math.round(progress)}%</title>
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={40}
            cx={48}
            cy={48}
          />
          {/* Progress circle */}
          <circle
            stroke="#10b981"
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.3s ease',
            }}
            r={40}
            cx={48}
            cy={48}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-white select-none">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-sm text-white text-center"
      >
        {messages[messageIndex]}
      </motion.p>
    </div>
  );
};

interface GenerationImageLoaderProps {
  src?: string;
  alt: string;
  isLoading: boolean;
  loadingState?: GenerationLoadingState;
  className?: string;
}

const GenerationImageLoader: React.FC<GenerationImageLoaderProps> = ({
  src,
  alt,
  isLoading,
  loadingState = 'idle',
  className = '',
}) => {
  // Source that is actually displayed (null while loading / preloading)
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  // Track ongoing image preload to avoid race conditions
  const loadingRef = useRef<HTMLImageElement | null>(null);

  // Reset when a new generation starts
  useEffect(() => {
    if (isLoading) {
      // Clear current image immediately to avoid flashing the previous one
      setDisplaySrc(null);
      // Abort any in-progress preload
      if (loadingRef.current) {
        loadingRef.current.onload = null;
        loadingRef.current.onerror = null;
        loadingRef.current = null;
      }
    }
  }, [isLoading]);

  // When generation finishes, preload the provided src
  useEffect(() => {
    if (!isLoading && src) {
      // Start a new preload
      const img = new Image();
      loadingRef.current = img;

      img.onload = () => {
        // Ensure the preload we finished is still the latest one
        if (loadingRef.current === img) {
          setDisplaySrc(src);
          loadingRef.current = null;
        }
      };
      img.onerror = () => {
        // Even if it errors, try to show whatever we have
        if (loadingRef.current === img) {
          setDisplaySrc(src);
          loadingRef.current = null;
        }
      };

      img.src = src;
    }
  }, [isLoading, src]);

  // Render
  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden ${className}`}
    >
      {/* Loading spinner */}
      {(isLoading || !displaySrc) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700 z-10">
          <CircularProgress isLoading={isLoading} loadingState={loadingState} />
        </div>
      )}

      {/* Fade-in image once loaded */}
      {displaySrc && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-white"
        >
          <img
            key={displaySrc}
            src={displaySrc}
            alt={alt}
            className="w-full h-full object-contain"
          />
        </motion.div>
      )}
    </div>
  );
};

interface GenerationPreviewProps {
  isLoading: boolean;
  loadingState?: GenerationLoadingState;
  isVisible: boolean;
  generatedImage?: {
    id: string;
    url: string;
    domain: string;
    description?: string;
    type?: string;
    style?: string;
    category?: string;
  };
  onGenerateMore?: () => void;
  onGeneratePoster?: () => void;
}

export function GenerationPreview({
  isLoading,
  loadingState = 'idle',
  isVisible,
  generatedImage,
  onGenerateMore,
  onGeneratePoster,
}: GenerationPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (generatedImage?.domain) {
      setCurrentUrl(
        `${window.location.origin}/ai-brand-generator/brand/${generatedImage?.domain}/${generatedImage?.id}`,
      );
    }
  }, [generatedImage]);

  // Smooth scroll into view when generation starts
  useEffect(() => {
    if (isVisible && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isVisible]);

  const handleDownload = async () => {
    if (!generatedImage?.url) return;

    try {
      const response = await fetch(generatedImage.url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${generatedImage.domain}-generated.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleCopy = async () => {
    if (!currentUrl) return;

    try {
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Image URL copied to clipboard', {
        description: 'You can now share this image URL with others',
      });
    } catch (error) {
      console.error('Failed to copy image URL:', error);
      toast.error('Failed to copy image URL', {
        description: 'Please try again',
      });
    }
  };

  if (!isVisible || (!isLoading && !generatedImage?.url)) return null;

  return (
    <div ref={previewRef} className="my-8">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent>
            <div className="flex">
              {/* Left side - Logo Preview */}
              <div className="flex-1 pr-8 flex flex-col">
                <div className="flex-1 space-y-6">
                  <GenerationImageLoader
                    src={generatedImage?.url}
                    alt={`Generated logo for ${generatedImage?.domain || 'your domain'}`}
                    isLoading={isLoading}
                    loadingState={loadingState}
                    className="p-8 bg-gray-800 rounded-lg"
                  />

                  {/* Action buttons - positioned at bottom of left section */}
                  <div className="flex gap-3">
                    {isLoading ? (
                      <>
                        <Skeleton className="flex-1 h-10 bg-gray-700" />
                        <Skeleton className="flex-1 h-10 bg-gray-700" />
                        <Skeleton className="flex-1 h-10 bg-gray-700" />
                      </>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={handleDownload}
                          disabled={!generatedImage?.url}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="secondary"
                          className="flex-1"
                          onClick={handleCopy}
                          disabled={!generatedImage?.url}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <TwitterShareButton
                          url={currentUrl}
                          title={`Check out this AI-generated ${generatedImage?.type?.toLowerCase() || 'image'} for ${generatedImage?.domain} @namefi_io`}
                        >
                          <Button
                            variant="secondary"
                            className="flex-1"
                            title="Share on Twitter"
                            disabled={!generatedImage?.url}
                          >
                            <TwitterIcon className="w-4 h-4 mr-1 rounded" />
                            Twitter
                          </Button>
                        </TwitterShareButton>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator orientation="vertical" className="h-auto!" />

              {/* Right side - Details */}
              <div className="flex-1 pl-8 flex flex-col">
                <div className="flex-1 space-y-4">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">
                      {isLoading ? (
                        <Skeleton className="h-6 w-40 bg-gray-700" />
                      ) : (
                        'Generated Image'
                      )}
                    </h2>
                    <p className="text-gray-400 text-sm">
                      {isLoading ? (
                        <Skeleton className="h-4 w-64 bg-gray-700" />
                      ) : (
                        `Your ${generatedImage?.type?.toLowerCase()} is ready! Share it with your audience or tweak and regenerate.`
                      )}
                    </p>

                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white">
                        {isLoading ? (
                          <Skeleton className="h-6 w-48 bg-gray-700" />
                        ) : (
                          generatedImage?.domain || 'example.com'
                        )}
                      </h3>

                      <div className="flex gap-2 text-xs">
                        {isLoading ? (
                          <>
                            <Skeleton className="h-6 w-24 bg-gray-700" />
                            <Skeleton className="h-6 w-20 bg-gray-700" />
                          </>
                        ) : (
                          <>
                            {generatedImage?.category && (
                              <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                                Category: {generatedImage.category}
                              </span>
                            )}
                            {generatedImage?.style && (
                              <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                                Style: {generatedImage.style}
                              </span>
                            )}
                            {generatedImage?.type && (
                              <span className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                                Type: {generatedImage.type}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom aligned buttons */}
                <div className="space-y-3 mt-auto">
                  {isLoading ? (
                    <>
                      <Skeleton className="w-full h-10 bg-gray-700" />
                      {onGeneratePoster && (
                        <Skeleton className="w-full h-10 bg-gray-700" />
                      )}
                    </>
                  ) : (
                    <>
                      <NamefiButton
                        className="w-full bg-brand-primary text-primary-foreground"
                        onClick={onGenerateMore}
                        disabled={!onGenerateMore}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Generate More
                      </NamefiButton>

                      {onGeneratePoster && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={onGeneratePoster}
                          disabled={!onGeneratePoster}
                        >
                          <Sparkles className="w-4 h-4 mr-1" />
                          Generate Poster
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
