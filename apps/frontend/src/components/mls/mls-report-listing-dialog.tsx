'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  MLS_LISTING_REPORT_REASONS,
  type MlsCreateListingReportInput,
  type MlsCreateListingReportResponse,
  type MlsListingReportReason,
} from '@/lib/mls/feed';

const REPORT_REASON_OPTIONS: Array<{
  value: MlsListingReportReason;
  label: string;
  description: string;
}> = [
  {
    value: 'already_sold',
    label: 'Already sold',
    description: 'The domain has already sold and should not stay in the feed.',
  },
  {
    value: 'inaccurate_price',
    label: 'Inaccurate price',
    description: 'The listed asking price appears wrong or misleading.',
  },
  {
    value: 'not_for_sale',
    label: 'Not for sale',
    description: 'The post does not represent a real domain sale listing.',
  },
  {
    value: 'duplicate_listing',
    label: 'Duplicate listing',
    description: 'This sale was already listed elsewhere in the feed.',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Use details to describe the issue clearly.',
  },
] as const;

const reportListingSchema = z.object({
  reason: z.enum(MLS_LISTING_REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(1_000, 'Keep details under 1000 characters.')
    .optional(),
});

type ReportListingFormValues = z.infer<typeof reportListingSchema>;

interface MlsReportListingDialogProps {
  listingId: string;
  domain: string;
}

export function MlsReportListingDialog({
  listingId,
  domain,
}: MlsReportListingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<ReportListingFormValues>({
    resolver: zodResolver(reportListingSchema),
    defaultValues: {
      reason: REPORT_REASON_OPTIONS[0].value,
      details: '',
    },
  });

  const selectedReason = form.watch('reason');
  const detailsValue = form.watch('details') ?? '';
  const selectedReasonDescription = useMemo(
    () =>
      REPORT_REASON_OPTIONS.find((option) => option.value === selectedReason)
        ?.description ?? null,
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
      const response = await fetch('/api/mls/listings/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await extractErrorMessage(
            response,
            'Unable to submit report. Please try again.',
          ),
        );
      }

      const responsePayload =
        (await response.json()) as MlsCreateListingReportResponse | null;
      if (!responsePayload?.id) {
        throw new Error('Unexpected report response from server.');
      }

      setIsReported(true);
      setIsOpen(false);
      form.reset({
        reason: REPORT_REASON_OPTIONS[0].value,
        details: '',
      });
      toast.success(`Report submitted for ${domain}.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit report. Please try again.';
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
            className="text-white/50 hover:text-white"
            disabled={isReported}
            aria-label={`Report listing for ${domain}`}
          >
            <AlertTriangle className="size-4" />
            {isReported ? 'Reported' : 'Report'}
          </Button>
        }
      />

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report listing</DialogTitle>
          <DialogDescription>
            Flag issues with <span className="font-medium">{domain}</span>. Our
            team reviews reports before taking action.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={onSubmit}>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent align="start">
                      {REPORT_REASON_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReasonDescription ? (
                    <p className="text-xs text-muted-foreground">
                      {selectedReasonDescription}
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
                  <FormLabel>Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      rows={4}
                      maxLength={1_000}
                      disabled={isSubmitting}
                      placeholder="Add context that will help us verify the issue."
                    />
                  </FormControl>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Optional notes to support your report.</span>
                    <span>{detailsValue.length}/1000</span>
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isReported}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Submitting
                  </span>
                ) : (
                  'Submit report'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

async function extractErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    const normalized = payload.error?.trim();
    return normalized && normalized.length > 0 ? normalized : fallback;
  } catch {
    return fallback;
  }
}
