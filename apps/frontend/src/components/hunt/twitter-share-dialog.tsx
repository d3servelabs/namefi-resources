'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { useState, useCallback, useMemo, type FormEvent } from 'react';
import { toast } from 'sonner';
import { usePendingToast } from '@/hooks/use-pending-toast';
import { XBrandIcon } from '@namefi-astra/ui/components/namefi/brand-icons';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';
import { useTranslations } from 'next-intl';

type HuntTranslator = ReturnType<typeof useTranslations<'hunt'>>;

const URL_PROTOCOL_REGEX = /^https?:\/\//i;
const LEADING_WWW_REGEX = /^www\./;

const normalizePostUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return URL_PROTOCOL_REGEX.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const isTwitterPostUrl = (value: string) => {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(LEADING_WWW_REGEX, '');
    if (
      hostname !== 'x.com' &&
      hostname !== 'twitter.com' &&
      hostname !== 'mobile.twitter.com'
    ) {
      return false;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    return (
      (parts.length >= 3 &&
        (parts[1] === 'status' || parts[1] === 'statuses')) ||
      (parts[0] === 'i' && parts[1] === 'web' && parts[2] === 'status')
    );
  } catch {
    return false;
  }
};

const createShareFormSchema = (invalidPostUrlMessage: string) =>
  z.object({
    postUrl: z
      .string()
      .trim()
      .min(1, invalidPostUrlMessage)
      .transform(normalizePostUrl)
      .pipe(z.string().url(invalidPostUrlMessage))
      .refine(isTwitterPostUrl, { message: invalidPostUrlMessage }),
  });

type ShareFormData = z.infer<ReturnType<typeof createShareFormSchema>>;

const getPostUrlValidationMessage = (
  error: z.ZodError<unknown>,
  fallback: string,
) =>
  error.issues.find((issue) => issue.path[0] === 'postUrl')?.message ??
  fallback;

const createShareFormResolver = (
  invalidPostUrlMessage: string,
): Resolver<ShareFormData> => {
  const schema = createShareFormSchema(invalidPostUrlMessage);
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return {
        errors: {} as Record<string, never>,
        values: result.data,
      };
    }

    const postUrlIssue = result.error.issues.find(
      (issue) => issue.path[0] === 'postUrl',
    );

    return {
      errors: {
        postUrl: {
          type: postUrlIssue?.code ?? 'validate',
          message: getPostUrlValidationMessage(
            result.error,
            invalidPostUrlMessage,
          ),
        },
      },
      values: {},
    };
  };
};

export type TwitterShareSubject =
  | 'domain'
  | 'logo'
  | 'poster'
  | 'animation'
  | 'generation';

interface TwitterShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  domainName: NamefiNormalizedDomain | null;
  shareUrl: string | null;
  hasShared: boolean;
  isCheckingStatus: boolean;
  isSubmitting: boolean;
  onSubmit: (postUrl: string) => Promise<void>;
  trackShares?: boolean; // Whether to show tracking-related UI
  campaignKey?: string; // Campaign key for analytics tracking
  featureKey: string; // Feature identifier for analytics source
  shareSubject?: TwitterShareSubject;
}

function resolveTwitterShareCopy({
  domainName,
  featureKey,
  shareSubject,
  trackShares,
  t,
}: {
  domainName: NamefiNormalizedDomain | null;
  featureKey: string;
  shareSubject?: TwitterShareSubject;
  trackShares: boolean;
  t: HuntTranslator;
}) {
  const resolvedShareSubject =
    shareSubject ?? (featureKey === 'ai_generation' ? 'generation' : 'domain');
  const shareSubjectLabel =
    resolvedShareSubject === 'domain' ? 'domain' : resolvedShareSubject;
  const shareTarget =
    resolvedShareSubject === 'domain'
      ? domainName
      : `this ${shareSubjectLabel} for ${domainName}`;
  const dialogTitle =
    resolvedShareSubject === 'domain'
      ? t('share.titleDomain', { domainName: domainName ?? '' })
      : t('share.titleSubject', {
          subject: shareSubjectLabel,
          domainName: domainName ?? '',
        });
  const dialogDescription =
    resolvedShareSubject === 'domain'
      ? trackShares
        ? t('share.descriptionDomainTracked')
        : t('share.descriptionDomain')
      : t('share.descriptionSubject', { subject: shareSubjectLabel });
  const tweetText =
    resolvedShareSubject === 'domain'
      ? `Check out ${domainName} on Namefi Hunt.`
      : `Check out this ${shareSubjectLabel} for ${domainName}, generated with Namefi.`;
  const hashtags =
    resolvedShareSubject === 'domain'
      ? 'Namefi,DomainHunt'
      : 'Namefi,AIBranding';

  return {
    dialogDescription,
    dialogTitle,
    hashtags,
    shareTarget,
    tweetText,
  };
}

export function TwitterShareDialog({
  isOpen,
  onClose,
  domainName,
  shareUrl,
  hasShared,
  isCheckingStatus,
  isSubmitting,
  onSubmit,
  trackShares = true,
  campaignKey,
  featureKey,
  shareSubject,
}: TwitterShareDialogProps) {
  const t = useTranslations('hunt');
  const tCommon = useTranslations('common');
  const [hasCopied, setHasCopied] = useState(false);
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const invalidPostUrlMessage = t('share.invalidPostUrl');
  const shareFormResolver = useMemo(
    () => createShareFormResolver(invalidPostUrlMessage),
    [invalidPostUrlMessage],
  );

  const form = useForm<ShareFormData>({
    resolver: shareFormResolver,
    mode: 'onChange',
    defaultValues: {
      postUrl: '',
    },
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;
  const shouldShowTrackingForm = trackShares && !hasShared;

  const { dialogDescription, dialogTitle, hashtags, shareTarget, tweetText } =
    resolveTwitterShareCopy({
      domainName,
      featureKey,
      shareSubject,
      trackShares,
      t,
    });

  // Generate Twitter intent URL
  const twitterIntentUrl = useMemo(() => {
    if (!shareUrl || !domainName) return null;

    const params = new URLSearchParams({
      text: tweetText,
      url: shareUrl,
      hashtags,
    });

    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [shareUrl, domainName, tweetText, hashtags]);

  // Copy share URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl || !domainName) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      toast.success(t('share.copySuccess'));
      setTimeout(() => setHasCopied(false), 2000);

      // Track copy intent
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.ShareIntent,
        properties: {
          domainName,
          campaignKey,
          featureKey,
          trigger: 'copy_button',
          sharedUrl: shareUrl,
        },
      });
    } catch {
      toast.error(t('share.copyError'));
    }
  }, [
    shareUrl,
    domainName,
    campaignKey,
    featureKey,
    logEventWithInteractionLoggers,
    t,
  ]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (data: ShareFormData) => {
      try {
        await onSubmit(data.postUrl);
        reset();
      } catch (error) {
        // Set server error on the form field
        const errorMessage =
          error instanceof Error ? error.message : t('share.recordError');

        setError('postUrl', {
          type: 'server',
          message: errorMessage,
        });
      }
    },
    [onSubmit, reset, setError, t],
  );

  const handleShareFormSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      void handleSubmit(handleFormSubmit)(event).catch((error: unknown) => {
        const message =
          error instanceof z.ZodError
            ? getPostUrlValidationMessage(error, invalidPostUrlMessage)
            : t('share.checkPostUrl');

        setError('postUrl', {
          type: 'validate',
          message,
        });
      });
    },
    [handleSubmit, handleFormSubmit, setError, t, invalidPostUrlMessage],
  );

  // Handle dialog close
  const handleClose = useCallback(() => {
    reset();
    setHasCopied(false);
    onClose();
  }, [reset, onClose]);

  // Handle open Twitter intent
  const handleOpenTwitter = useCallback(() => {
    if (twitterIntentUrl && shareUrl && domainName) {
      window.open(twitterIntentUrl, '_blank', 'width=600,height=400');

      // Track tweet intent
      logEventWithInteractionLoggers({
        name: InteractionLoggingEventName.ShareIntent,
        properties: {
          domainName,
          campaignKey,
          featureKey,
          trigger: 'tweet_button',
          sharedUrl: shareUrl,
        },
      });
    }
  }, [
    twitterIntentUrl,
    shareUrl,
    domainName,
    campaignKey,
    featureKey,
    logEventWithInteractionLoggers,
  ]);

  usePendingToast(isSubmitting, t('share.recordingShare'));

  if (!domainName || !shareUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-[500px]')}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XBrandIcon className="h-5 w-5 text-blue-500" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share URL Display */}
          <div className="space-y-2">
            <Label>{t('share.shareUrlLabel')}</Label>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="shrink-0"
              >
                {hasCopied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Tweet Button */}
          <div className="space-y-2">
            <Label>{t('share.quickShareLabel')}</Label>
            <Button
              onClick={handleOpenTwitter}
              disabled={!twitterIntentUrl}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <XBrandIcon className="me-2 h-4 w-4" />
              {t('share.shareOnTwitter')}
              <ExternalLink className="h-4 w-4 ms-2" />
            </Button>
            <p className="text-xs text-muted-foreground">
              {t('share.prefilledHint', { target: shareTarget ?? '' })}
            </p>
          </div>

          {/* Status Badge - only show if tracking is enabled */}
          {trackShares && hasShared && (
            <div className="flex items-center justify-center">
              <Badge
                variant="secondary"
                className="text-green-600 bg-green-50 border-green-200"
              >
                <CheckCircle className="h-3 w-3 me-1" />
                {t('share.alreadyShared')}
              </Badge>
            </div>
          )}

          {/* Form for manual URL submission - only show if tracking is enabled and not already shared */}
          {shouldShowTrackingForm && (
            <div className="space-y-4 border-t pt-4">
              <Form {...form}>
                <form onSubmit={handleShareFormSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="postUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('share.postUrlLabel')}{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://twitter.com/username/status/1234567890"
                            {...field}
                            className={
                              errors.postUrl
                                ? 'border-red-500 focus-visible:ring-red-500'
                                : ''
                            }
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          {t('share.postUrlHint')}
                        </p>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isSubmitting}
                    >
                      {tCommon('actions.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !form.formState.isValid ||
                        isSubmitting ||
                        isCheckingStatus
                      }
                    >
                      {isSubmitting
                        ? t('share.recording')
                        : t('share.recordShare')}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* Close button - show if tracking is disabled or if already shared */}
          {(!trackShares || hasShared) && (
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>
                {tCommon('actions.close')}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
