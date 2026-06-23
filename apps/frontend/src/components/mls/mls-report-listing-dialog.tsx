'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import {
  MLS_LISTING_REPORT_REASONS,
  type MlsCreateListingReportInput,
  type MlsListingReportReason,
} from '@/lib/mls/feed';
import { useTRPCClient } from '@/lib/trpc';

const REPORT_REASON_OPTIONS: Array<{
  value: MlsListingReportReason;
  messageKey: string;
}> = [
  { value: 'already_sold', messageKey: 'alreadySold' },
  { value: 'inaccurate_price', messageKey: 'inaccuratePrice' },
  { value: 'not_for_sale', messageKey: 'notForSale' },
  { value: 'duplicate_listing', messageKey: 'duplicateListing' },
  { value: 'other', messageKey: 'other' },
] as const;

function buildReportListingSchema(detailsTooLongMessage: string) {
  return z.object({
    reason: z.enum(MLS_LISTING_REPORT_REASONS),
    details: z.string().trim().max(1_000, detailsTooLongMessage).optional(),
  });
}

type ReportListingFormValues = z.infer<
  ReturnType<typeof buildReportListingSchema>
>;

interface MlsReportListingDialogProps {
  listingId: string;
  domain: string;
  triggerClassName?: string;
}

export function MlsReportListingDialog({
  listingId,
  domain,
  triggerClassName,
}: MlsReportListingDialogProps) {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');
  // next-intl's typed keys can't verify data-driven keys; this alias keeps
  // the static t() calls type-checked while allowing the dynamic ones.
  const tDynamic = t as (key: string) => string;
  const trpcClient = useTRPCClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reportListingSchema = useMemo(
    () => buildReportListingSchema(t('report.detailsTooLong')),
    [t],
  );

  const form = useForm<ReportListingFormValues>({
    resolver: zodResolver(reportListingSchema),
    defaultValues: {
      reason: REPORT_REASON_OPTIONS[0].value,
      details: '',
    },
  });

  const selectedReason = form.watch('reason');
  const detailsValue = form.watch('details') ?? '';
  const selectedReasonOption = useMemo(
    () =>
      REPORT_REASON_OPTIONS.find((option) => option.value === selectedReason) ??
      null,
    [selectedReason],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);

    const details = values.details?.trim();
    const payload: MlsCreateListingReportInput = {
      listingId,
      reason: values.reason,
      ...(details ? { details } : {}),
    };

    try {
      const responsePayload =
        await trpcClient.mls.reportListing.mutate(payload);
      if (!responsePayload?.id) {
        throw new Error(t('report.unexpectedResponse'));
      }

      setIsReported(true);
      setIsOpen(false);
      form.reset({
        reason: REPORT_REASON_OPTIONS[0].value,
        details: '',
      });
      toast.success(t('report.submitSuccess', { domain }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('report.submitErrorFallback');
      setSubmitError(message);
      toast.error(message);
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSubmitError(null);
        }
        setIsOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'text-white/35 hover:text-white/55',
              triggerClassName,
            )}
            disabled={isReported}
            aria-label={t('report.triggerAriaLabel', { domain })}
          >
            <AlertTriangle className="size-4" />
            {isReported ? t('report.reported') : t('report.trigger')}
          </Button>
        }
      />

      <DialogContent className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-lg')}>
        <DialogHeader>
          <DialogTitle>{t('report.dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t.rich('report.dialogDescription', {
              domain,
              highlight: (chunks) => (
                <span className="font-medium">{chunks}</span>
              ),
            })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('report.reasonLabel')}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t('report.reasonPlaceholder')}
                        >
                          {selectedReasonOption
                            ? tDynamic(
                                `report.reasons.${selectedReasonOption.messageKey}.label`,
                              )
                            : null}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent align="start">
                      {REPORT_REASON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {tDynamic(
                            `report.reasons.${option.messageKey}.label`,
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReasonOption ? (
                    <p className="text-xs text-muted-foreground">
                      {tDynamic(
                        `report.reasons.${selectedReasonOption.messageKey}.description`,
                      )}
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('report.detailsLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      rows={4}
                      maxLength={1_000}
                      disabled={isSubmitting}
                      placeholder={t('report.detailsPlaceholder')}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('report.detailsHelp')}</span>
                    <span>
                      {t('report.detailsCounter', {
                        count: detailsValue.length,
                      })}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {submitError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
                {submitError}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || isReported}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    {t('report.submitting')}
                  </span>
                ) : (
                  t('report.submit')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
