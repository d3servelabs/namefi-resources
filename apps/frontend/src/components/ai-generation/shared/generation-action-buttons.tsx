'use client';

import { Button } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/cn';
import {
  Copy as CopyIcon,
  Download as DownloadIcon,
  Twitter,
  Sparkles,
} from 'lucide-react';
import type { MouseEvent } from 'react';

interface GenerationActionButtonsProps {
  appearance: 'overlay' | 'featured' | 'grid';
  onCopy: (event: MouseEvent<HTMLButtonElement>) => void;
  onShare: (event: MouseEvent<HTMLButtonElement>) => void;
  onDownload: (event: MouseEvent<HTMLButtonElement>) => void;
  posterAction?: {
    label?: string;
    onClick: (event: MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
  };
  disabled?: {
    copy?: boolean;
    share?: boolean;
    download?: boolean;
  };
}

const appearanceConfig = {
  overlay: {
    buttonClass:
      'h-9 rounded-full border-border/30 bg-white/20 backdrop-blur text-white shadow transition hover:bg-white/30',
    variant: 'outline' as const,
    size: 'sm' as const,
    posterClass:
      'h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 gap-2 shadow-md transition',
  },
  featured: {
    buttonClass:
      'h-8 rounded-full border-border/50 bg-background/60 text-foreground transition hover:bg-background/80',
    variant: 'outline' as const,
    size: 'sm' as const,
    posterClass:
      'h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 gap-2 shadow-md transition',
  },
  grid: {
    buttonClass:
      'h-9 rounded-full bg-muted/90 px-3 text-foreground hover:bg-muted',
    variant: 'secondary' as const,
    size: 'sm' as const,
    posterClass:
      'h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 px-4',
  },
} as const;

export function GenerationActionButtons({
  appearance,
  onCopy,
  onShare,
  onDownload,
  posterAction,
  disabled,
}: GenerationActionButtonsProps) {
  const config = appearanceConfig[appearance];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {posterAction && (
        <Button
          size={config.size}
          className={config.posterClass}
          onClick={posterAction.onClick}
          disabled={posterAction.disabled}
        >
          <Sparkles className="h-4 w-4" />
          {posterAction.label ?? 'Create Poster'}
        </Button>
      )}
      <Button
        size={config.size}
        variant={config.variant}
        className={config.buttonClass}
        onClick={onCopy}
        disabled={disabled?.copy}
      >
        <CopyIcon
          className={cn('h-4 w-4', appearance === 'grid' ? '' : 'mr-1')}
        />
        {appearance === 'grid' ? 'Copy Link' : 'Copy'}
      </Button>
      <Button
        size={config.size}
        variant={config.variant}
        className={config.buttonClass}
        onClick={onShare}
        disabled={disabled?.share}
      >
        <Twitter
          className={cn('h-4 w-4', appearance === 'grid' ? '' : 'mr-1')}
        />
        {appearance === 'grid' ? 'Tweet' : 'Tweet'}
      </Button>
      <Button
        size={config.size}
        variant={config.variant}
        className={config.buttonClass}
        onClick={onDownload}
        disabled={disabled?.download}
      >
        <DownloadIcon
          className={cn('h-4 w-4', appearance === 'grid' ? '' : 'mr-1')}
        />
        {appearance === 'grid' ? 'Download' : 'Download'}
      </Button>
    </div>
  );
}
