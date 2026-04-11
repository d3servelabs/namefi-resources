'use client';

import Link from 'next/link';
import type { SVGProps } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
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

type BrandIconProps = SVGProps<SVGSVGElement>;

function XBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26L23 21.75h-6.74l-5.28-6.79-5.94 6.79H1.73l7.73-8.835L1 2.25h6.91l4.77 6.231zm-1.161 17.52h1.833L6.915 4.126H4.949z" />
    </svg>
  );
}

function FacebookBrandIcon(props: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-6h2.25l.5-3H13.5V9.75c0-.87.28-1.5 1.5-1.5H16.5V5.2c-.28-.04-1.24-.12-2.34-.12-2.32 0-3.91 1.42-3.91 4.03V12H8v3h2.25v6z" />
    </svg>
  );
}

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
                  <XBrandIcon className="h-4 w-4" />
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
                  <FacebookBrandIcon className="h-4 w-4" />
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
