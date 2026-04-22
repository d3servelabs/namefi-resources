'use client';

import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@namefi-astra/ui/components/shadcn/dialog';
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { usePendingToast } from '@/hooks/use-pending-toast';
import { XBrandIcon } from '@namefi-astra/ui/components/namefi/brand-icons';
import { ExternalLink, Copy, CheckCircle } from 'lucide-react';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useInteractionLoggers } from '@/components/providers/analytics';
import { InteractionLoggingEventName } from '@/lib/analytics-events';

const shareFormSchema = z.object({
  postUrl: z.string().url('Please enter a valid Twitter/X post URL'),
});

type ShareFormData = z.infer<typeof shareFormSchema>;

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
}: TwitterShareDialogProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { logEventWithInteractionLoggers } = useInteractionLoggers();

  const form = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
    mode: 'onChange',
    defaultValues: {
      postUrl: '',
    },
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { errors, isValid },
  } = form;

  // Generate Twitter intent URL
  const twitterIntentUrl = useMemo(() => {
    if (!shareUrl || !domainName) return null;

    const tweetText = `Check out ${domainName} — discovered on Namefi Hunt! 🔥`;
    const params = new URLSearchParams({
      text: tweetText,
      url: shareUrl,
      hashtags: 'Namefi,DomainHunt',
    });

    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [shareUrl, domainName]);

  // Copy share URL to clipboard
  const handleCopyUrl = useCallback(async () => {
    if (!shareUrl || !domainName) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setHasCopied(true);
      toast.success('Share URL copied to clipboard!');
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
      toast.error('Failed to copy URL');
    }
  }, [
    shareUrl,
    domainName,
    campaignKey,
    featureKey,
    logEventWithInteractionLoggers,
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
          error instanceof Error
            ? error.message
            : 'Failed to record your share. Please try again.';

        setError('postUrl', {
          type: 'server',
          message: errorMessage,
        });
      }
    },
    [onSubmit, reset, setError],
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

  usePendingToast(isSubmitting, 'Recording your share...');

  if (!domainName || !shareUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XBrandIcon className="h-5 w-5 text-blue-500" />
            Share {domainName}
          </DialogTitle>
          <DialogDescription>
            Share this domain on Twitter/X to help others discover it
            {trackShares ? ' and earn rewards!' : '!'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share URL Display */}
          <div className="space-y-2">
            <Label>Share URL</Label>
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
            <Label>Quick Share</Label>
            <Button
              onClick={handleOpenTwitter}
              disabled={!twitterIntentUrl}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <XBrandIcon className="mr-2 h-4 w-4" />
              Tweet about {domainName}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Opens Twitter/X with a pre-filled tweet including your share URL
            </p>
          </div>

          {/* Status Badge - only show if tracking is enabled */}
          {trackShares && hasShared && (
            <div className="flex items-center justify-center">
              <Badge
                variant="secondary"
                className="text-green-600 bg-green-50 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Already shared
              </Badge>
            </div>
          )}

          {/* Form for manual URL submission - only show if tracking is enabled and not already shared */}
          {trackShares && !hasShared && (
            <div className="space-y-4 border-t pt-4">
              <Form {...form}>
                <form
                  onSubmit={handleSubmit(handleFormSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="postUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Twitter/X Post URL{' '}
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
                          Paste the URL of your tweet after sharing to earn
                          rewards
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
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isValid || isSubmitting || isCheckingStatus}
                    >
                      {isSubmitting ? 'Recording...' : 'Record Share'}
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
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
