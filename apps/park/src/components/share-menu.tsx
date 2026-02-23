'use client';

import Link from 'next/link';
import { Check, Copy, Facebook, Share2, Twitter } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/shadcn/button';
import { Card } from '@/components/ui/shadcn/card';
import { cn } from '@/lib/cn';

const COPY_FEEDBACK_TIMEOUT_MS = 1300;
const SHARE_MENU_WIDTH_PX = 224;
const SHARE_MENU_HEIGHT_PX = 156;
const VIEWPORT_PADDING_PX = 8;

interface ParkShareMenuProps {
  domainName: string;
  shareTarget: string;
  className?: string;
  fullWidth?: boolean;
  buttonClassName?: string;
}

export function ParkShareMenu({
  domainName,
  shareTarget,
  className,
  fullWidth = false,
  buttonClassName,
}: ParkShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const topCandidate = rect.bottom + VIEWPORT_PADDING_PX;
    const needsFlipUp =
      topCandidate + SHARE_MENU_HEIGHT_PX >
      window.innerHeight - VIEWPORT_PADDING_PX;

    const top = needsFlipUp
      ? Math.max(
          VIEWPORT_PADDING_PX,
          rect.top - SHARE_MENU_HEIGHT_PX - VIEWPORT_PADDING_PX,
        )
      : topCandidate;

    const rightAlignedLeft = rect.right - SHARE_MENU_WIDTH_PX;
    const left = Math.min(
      Math.max(VIEWPORT_PADDING_PX, rightAlignedLeft),
      window.innerWidth - SHARE_MENU_WIDTH_PX - VIEWPORT_PADDING_PX,
    );

    setMenuStyle({
      left,
      position: 'fixed',
      top,
      width: SHARE_MENU_WIDTH_PX,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    updateMenuPosition();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (menuPanelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const onViewportChange = () => {
      updateMenuPosition();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [isOpen, updateMenuPosition]);

  const shareText = useMemo(
    () => `Check out ${domainName} parked with @namefi_io`,
    [domainName],
  );

  const shareLinks = useMemo(() => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareTarget);
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    };
  }, [shareTarget, shareText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareTarget);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, COPY_FEEDBACK_TIMEOUT_MS);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn('relative', fullWidth && 'w-full', className)}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          'h-full min-h-10 rounded-full border-border/45 bg-white/[0.03] px-4 text-[0.82rem] font-medium text-foreground shadow-none hover:border-border/65 hover:bg-white/[0.08] sm:text-sm',
          fullWidth && 'w-full justify-center',
          buttonClassName,
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        ref={triggerRef}
        onClick={() => setIsOpen((current) => !current)}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <Card
              className="z-[140] border-border/60 bg-background/95 p-1.5 shadow-2xl backdrop-blur"
              ref={menuPanelRef}
              style={menuStyle}
            >
              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-lg text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Link
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Twitter className="h-4 w-4" />
                  Share on X
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full justify-start rounded-lg text-sm"
                onClick={() => setIsOpen(false)}
              >
                <Link
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Facebook className="h-4 w-4" />
                  Share on Facebook
                </Link>
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start rounded-lg text-sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied URL' : 'Copy URL'}
              </Button>
            </Card>,
            document.body,
          )
        : null}
    </div>
  );
}
