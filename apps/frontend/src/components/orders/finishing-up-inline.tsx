'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@namefi-astra/ui/components/shadcn/sheet';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Check, Gem, type LucideIcon, Shield, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import { type ReactNode, useState } from 'react';
import type { AppRouterOutput } from '@/lib/trpc';
import type { PostRegistrationTask } from './post-registration-tasks';

type InternalAIGenerations =
  AppRouterOutput['ai']['getInternalGenerationsByDomains'];

// Heavy (carousel + images) and only seen once a chip is tapped — keep it off
// the order-page bundle.
const AiLogoCarousel = dynamic(
  () => import('./internal-ai-generations').then((m) => m.AiLogoCarousel),
  { ssr: false },
);

type ChipStatus = PostRegistrationTask['status'];

// Short label + a high-quality, non-green lucide icon per chip. The icon color
// stays neutral so the green status cues (glow / check) read as status, not the
// icon itself.
const CHIP_CONFIG: Record<string, { label: string; Icon: LucideIcon }> = {
  mint: { label: 'NFT', Icon: Gem },
  dnssec: { label: 'DNSSEC', Icon: Shield },
  ai: { label: "Just AI'ng", Icon: Sparkles },
};

interface Chip {
  key: string;
  status: ChipStatus;
}

/**
 * Demoted "what's still finishing" strip on the order completion page: a row of
 * icon chips — the post-registration tasks (NFT / DNSSEC) plus "Just AI'ng".
 * In-progress chips glow; done chips get a brand-green check badge. Each chip is
 * tappable and opens a details popup (a Dialog on desktop, an upslide bottom
 * Sheet on mobile) built from shared components.
 */
export function FinishingUpInline({
  tasks,
  aiDomains,
  aiGenerations,
  aiLoading = false,
}: {
  tasks: PostRegistrationTask[];
  aiDomains: string[];
  aiGenerations?: InternalAIGenerations;
  aiLoading?: boolean;
}) {
  const isMobile = useIsMobile();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const chips: Chip[] = [
    ...tasks.map((t) => ({ key: t.key, status: t.status })),
    ...(aiDomains.length > 0
      ? [{ key: 'ai', status: aiLoading ? 'in-progress' : 'done' } as Chip]
      : []),
  ];

  if (chips.length === 0) {
    return null;
  }

  const detail = getChipDetail(openKey, {
    aiDomains,
    aiGenerations,
    aiLoading,
  });
  const open = detail !== null;
  const onOpenChange = (next: boolean) => {
    if (!next) setOpenKey(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-xs">
        <span className="text-zinc-400">Finishing up</span>
        {chips.map((chip) => {
          const cfg = CHIP_CONFIG[chip.key];
          if (!cfg) return null;
          const { Icon, label } = cfg;
          const done = chip.status === 'done';
          const inProgress = chip.status === 'in-progress';
          return (
            <button
              type="button"
              key={chip.key}
              onClick={() => setOpenKey(chip.key)}
              className="group inline-flex items-center gap-1.5 rounded-sm"
            >
              <span className="relative inline-flex shrink-0">
                {inProgress ? (
                  <span aria-hidden className="icon-glow-aura" />
                ) : null}
                <Icon
                  className={cn(
                    'relative z-10 h-[18px] w-[18px] text-zinc-200 transition-colors group-hover:text-white',
                    inProgress && 'animate-icon-glow',
                  )}
                  strokeWidth={2}
                />
                {done ? (
                  <span className="-right-1 -bottom-1 absolute z-20 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                    <Check className="h-2 w-2 text-white" strokeWidth={4} />
                  </span>
                ) : null}
              </span>
              <span className="text-zinc-400 underline-offset-2 transition-colors group-hover:text-zinc-100 group-hover:underline">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent
            side="bottom"
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-5 pb-8"
          >
            <SheetHeader className="px-0">
              <SheetTitle>{detail?.title}</SheetTitle>
              <SheetDescription>{detail?.description}</SheetDescription>
            </SheetHeader>
            {detail?.body}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{detail?.title}</DialogTitle>
              <DialogDescription>{detail?.description}</DialogDescription>
            </DialogHeader>
            {detail?.body}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function getChipDetail(
  key: string | null,
  ai: {
    aiDomains: string[];
    aiGenerations?: InternalAIGenerations;
    aiLoading: boolean;
  },
): { title: string; description: string; body: ReactNode } | null {
  switch (key) {
    case 'mint':
      return {
        title: 'Minting your NFT',
        description: "What's happening on-chain right now.",
        body: (
          <p className="text-muted-foreground text-sm">
            Your domain is registered and yours to manage now. In the background
            we're minting its NFT on-chain so ownership is fully tokenized —
            usually a few minutes. Listing for sale unlocks once it's minted and
            visible on-chain.
          </p>
        ),
      };
    case 'dnssec':
      return {
        title: 'Enabling DNSSEC',
        description: 'Automatic DNS security for your domain.',
        body: (
          <p className="text-muted-foreground text-sm">
            DNSSEC adds a cryptographic signature to your domain's DNS so
            answers can't be forged in transit. We're turning it on
            automatically — nothing for you to do.
          </p>
        ),
      };
    case 'ai':
      return {
        title: 'Just AIng by Namefi™',
        description: 'Logo previews we generated for your brand(s).',
        body: (
          <AiLogoCarousel
            domains={ai.aiDomains}
            internalAIGenerations={ai.aiGenerations}
            isLoading={ai.aiLoading}
          />
        ),
      };
    default:
      return null;
  }
}
