'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { XBrandIcon } from '@namefi-astra/ui/components/namefi/brand-icons';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  type LucideIcon,
  Copy as CopyIcon,
  Download as DownloadIcon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { MouseEvent } from 'react';

interface GenerationCtaAction {
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  icon?: LucideIcon;
}

interface GenerationActionButtonsProps {
  appearance: 'overlay' | 'featured' | 'grid';
  onCopy: (event: MouseEvent<HTMLButtonElement>) => void;
  onShare: (event: MouseEvent<HTMLButtonElement>) => void;
  onDownload: (event: MouseEvent<HTMLButtonElement>) => void;
  ctaActions?: GenerationCtaAction[];
  deleteAction?: {
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
    deleteClass:
      'h-9 rounded-full bg-destructive/80 text-white shadow-md transition hover:bg-destructive',
    deleteVariant: 'destructive' as const,
  },
  featured: {
    buttonClass:
      'h-8 rounded-full border-border/50 bg-background/60 text-foreground transition hover:bg-background/80',
    variant: 'outline' as const,
    size: 'sm' as const,
    posterClass:
      'h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 gap-2 shadow-md transition',
    deleteClass:
      'h-8 rounded-full bg-destructive/80 text-white shadow-md transition hover:bg-destructive',
    deleteVariant: 'destructive' as const,
  },
  grid: {
    buttonClass:
      'h-9 rounded-full bg-muted/90 px-3 text-foreground hover:bg-muted',
    variant: 'secondary' as const,
    size: 'sm' as const,
    posterClass:
      'h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/80 px-4',
    deleteClass:
      'h-9 rounded-full bg-destructive text-white hover:bg-destructive/90 px-3',
    deleteVariant: 'destructive' as const,
  },
} as const;

export function GenerationActionButtons({
  appearance,
  onCopy,
  onShare,
  onDownload,
  ctaActions,
  deleteAction,
  disabled,
}: GenerationActionButtonsProps) {
  const config = appearanceConfig[appearance];

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {ctaActions?.map((action) => {
        const Icon = action.icon ?? Sparkles;

        return (
          <Button
            key={action.label}
            size={config.size}
            className={config.posterClass}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        );
      })}
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
        <XBrandIcon
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
      {deleteAction && (
        <Button
          size={config.size}
          variant={config.deleteVariant}
          className={config.deleteClass}
          onClick={deleteAction.onClick}
          disabled={deleteAction.disabled}
        >
          <Trash2
            className={cn('h-4 w-4', appearance === 'grid' ? '' : 'mr-1')}
          />
          {deleteAction.label ?? 'Delete'}
        </Button>
      )}
    </div>
  );
}
