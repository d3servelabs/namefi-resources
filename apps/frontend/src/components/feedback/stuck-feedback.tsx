'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@namefi-astra/ui/components/shadcn/radio-group';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { useSidebar } from '@namefi-astra/ui/components/shadcn/sidebar';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useConsentManager } from '@c15t/nextjs';
import { XIcon } from 'lucide-react';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAccount } from 'wagmi';
import { capturePostHogEvent, isPostHogConfigured } from '@/lib/posthog';

/**
 * Contextual "are you stuck?" feedback widget. When a user dwells on a key flow
 * (today: the cart) without progressing, a small dismissible card asks what
 * they were trying to do and routes the answer to PostHog for follow-up.
 *
 * Privacy: PostHog is a measurement tool, so the whole widget is gated behind
 * c15t measurement consent — it never mounts, captures, or loads `posthog-js`
 * when consent is absent. See d3servelabs/namefi-astra#4634.
 *
 * Copy is intentionally inlined in English for this first iteration; localizing
 * it via next-intl is a fast follow.
 */

const DEFAULT_DELAY_MS = 5_000;

const INTENT_OPTIONS = [
  { value: 'register_domain', label: 'Register a domain' },
  { value: 'import_domain', label: 'Import a domain' },
  { value: 'manage_domain_or_dns', label: 'Manage a domain or configure DNS' },
  { value: 'list_for_sale', label: 'List a domain for sale' },
  { value: 'other', label: 'Other' },
] as const;

type StuckFeedbackProps = {
  /** Where the widget is shown — captured with the response. */
  source: string;
  /** Idle time before the widget appears, in ms. */
  delayMs?: number;
};

export function StuckFeedback({
  source,
  delayMs = DEFAULT_DELAY_MS,
}: StuckFeedbackProps) {
  const { consents, isLoadingConsentInfo } = useConsentManager();
  const hasMeasurementConsent = consents.measurement;
  const { isConnected } = useAccount();
  const { state: sidebarState, isMobile } = useSidebar();

  const storageKey = `namefi:stuck-feedback:${source}`;

  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [intent, setIntent] = useState<string>('');
  const [message, setMessage] = useState('');
  const [noCryptoWallet, setNoCryptoWallet] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  const intentFieldId = useId();
  const messageFieldId = useId();
  const noWalletFieldId = useId();

  // Reveal the widget after the idle delay, once per session per source.
  useEffect(() => {
    if (isLoadingConsentInfo) return;
    if (!hasMeasurementConsent) return;
    if (!isPostHogConfigured()) return;
    if (sessionStorage.getItem(storageKey)) return;

    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, 'shown');
      shownAtRef.current = Date.now();
      setVisible(true);
      void capturePostHogEvent('stuck_feedback_shown', {
        source,
        wallet_connected: isConnected,
      });
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [
    delayMs,
    hasMeasurementConsent,
    isConnected,
    isLoadingConsentInfo,
    source,
    storageKey,
  ]);

  // Trigger the entrance transition on the frame after the card mounts.
  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const dwellMs = useCallback(
    () => (shownAtRef.current ? Date.now() - shownAtRef.current : null),
    [],
  );

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(storageKey, 'dismissed');
    void capturePostHogEvent('stuck_feedback_dismissed', {
      source,
      wallet_connected: isConnected,
      dwell_ms: dwellMs(),
    });
    setEntered(false);
    window.setTimeout(() => setVisible(false), 150);
  }, [dwellMs, isConnected, source, storageKey]);

  const handleSubmit = useCallback(() => {
    sessionStorage.setItem(storageKey, 'submitted');
    void capturePostHogEvent('stuck_feedback_submitted', {
      source,
      intent: intent || null,
      message: message.trim() || null,
      no_crypto_wallet: noCryptoWallet,
      wallet_connected: isConnected,
      dwell_ms: dwellMs(),
    });
    setSubmitted(true);
    window.setTimeout(() => {
      setEntered(false);
      window.setTimeout(() => setVisible(false), 150);
    }, 2_000);
  }, [
    dwellMs,
    intent,
    isConnected,
    message,
    noCryptoWallet,
    source,
    storageKey,
  ]);

  const desktopInlineStart =
    sidebarState === 'expanded'
      ? 'calc(var(--sidebar-width) + 1rem)'
      : 'calc(var(--sidebar-width-icon) + 1rem)';
  const feedbackStyle = useMemo<CSSProperties | undefined>(
    () => (isMobile ? undefined : { insetInlineStart: desktopInlineStart }),
    [desktopInlineStart, isMobile],
  );

  if (!visible) return null;

  const canSubmit = intent !== '' || noCryptoWallet || message.trim() !== '';

  return (
    <section
      aria-label="Feedback"
      data-testid="stuck-feedback"
      style={feedbackStyle}
      className={cn(
        // Bottom-start keeps clear of bottom-right Sonner toasts. The inline
        // style above shifts the desktop card past the sidebar rail.
        'fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom,0px))] start-4 z-50 w-[calc(100vw-2rem)] sm:w-[360px]',
        'rounded-xl border border-border bg-card p-4 shadow-lg',
        'transition-all duration-200 ease-out',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        data-testid="stuck-feedback-dismiss"
        className="absolute right-2 top-2 text-muted-foreground"
        onClick={handleDismiss}
      >
        <XIcon />
      </Button>

      {submitted ? (
        <div className="py-4 pr-6" data-testid="stuck-feedback-thanks">
          <p className="text-base font-semibold">Thanks for the note</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We use this to make Namefi easier. We'll follow up if you asked us
            to.
          </p>
        </div>
      ) : (
        <div className="pr-6">
          <p className="text-base font-semibold">Are you stuck?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us what you want to do and we'll help.
          </p>

          <RadioGroup
            className="mt-3 gap-2"
            value={intent}
            onValueChange={(value: string) => setIntent(value)}
            aria-labelledby={intentFieldId}
          >
            {INTENT_OPTIONS.map((option) => (
              <Label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-sm font-normal"
              >
                <RadioGroupItem value={option.value} />
                {option.label}
              </Label>
            ))}
          </RadioGroup>

          <Textarea
            id={messageFieldId}
            className="mt-3 min-h-16 text-sm"
            placeholder="Anything else? (optional)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />

          <Label
            htmlFor={noWalletFieldId}
            className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-normal"
          >
            <Checkbox
              id={noWalletFieldId}
              checked={noCryptoWallet}
              onCheckedChange={(checked) => setNoCryptoWallet(checked === true)}
            />
            I don't have a crypto wallet
          </Label>

          <Button
            type="button"
            size="sm"
            className="mt-4 w-full"
            disabled={!canSubmit}
            data-testid="stuck-feedback-submit"
            onClick={handleSubmit}
          >
            Send
          </Button>
        </div>
      )}
    </section>
  );
}
