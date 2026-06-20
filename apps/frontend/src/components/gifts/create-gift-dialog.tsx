'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
// Calendar component not present in shadcn; fallback to a simple date input
import { Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { NaturalLanguageDatePicker } from '@/components/date-picker/natural-language-date-picker';
import { toast } from 'sonner';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { da } from 'date-fns/locale';

const createGiftSchema = z
  .object({
    pbnDomain: namefiNormalizedDomainSchema,
    recipientEmail: z.string().email('Please enter a valid email address'),
    giftType: z.enum(['exact', 'parent']),
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
    reserveHold: z.boolean().optional(),
    reason: z.string().optional(),
    personalMessage: z.string().optional(),
    expirationDate: z.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.giftType === 'exact') {
      if (!data.exactDomainName) {
        ctx.addIssue({
          code: 'custom',
          path: ['exactDomainName'],
          message: 'Exact domain is required',
        });
      } else if (!data.exactDomainName.endsWith(data.pbnDomain)) {
        ctx.addIssue({
          code: 'custom',
          path: ['exactDomainName'],
          message: `Exact domain must end with "${data.pbnDomain}" domain`,
        });
      }
    }
    if (data.giftType === 'parent' && !data.parentDomain) {
      ctx.addIssue({
        code: 'custom',
        path: ['parentDomain'],
        message: 'Parent domain is required',
      });
    }
  });

type CreateGiftFormInput = z.input<typeof createGiftSchema>;
type CreateGiftFormOutput = z.output<typeof createGiftSchema>;

interface CreateGiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  pbnDomain?: string;
}

export function CreateGiftDialog({
  open,
  onOpenChange,
  onSuccess,
  pbnDomain: forcedPbnDomain,
}: CreateGiftDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trpc = useTRPC();

  // Fetch user's PBN domains
  const domainsQuery = useQuery(
    trpc.pbnOwner.listOwnedDomains.queryOptions(void 0, {
      enabled: !forcedPbnDomain,
    }),
  );

  const form = useForm<CreateGiftFormInput, unknown, CreateGiftFormOutput>({
    resolver: zodResolver(createGiftSchema) as Resolver<
      CreateGiftFormInput,
      unknown,
      CreateGiftFormOutput
    >,
    defaultValues: {
      pbnDomain: forcedPbnDomain ?? '',
      giftType: 'exact',
      reserveHold: true,
      expirationDate: null,
    },
  });

  const giftType = form.watch('giftType');
  const [expirationDisplay, setExpirationDisplay] = useState<string>(() => {
    const d = form.getValues('expirationDate');
    return d ? format(d, 'MMMM dd, yyyy') : '';
  });

  const createGiftMutation = useMutation(
    trpc.pbnReservations.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          data.emailSent
            ? 'Gift created and email sent successfully!'
            : 'Gift created successfully, but email failed to send',
        );
        form.reset();
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(`Failed to create gift: ${error.message}`);
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    }),
  );

  const onSubmit = (data: CreateGiftFormOutput) => {
    setIsSubmitting(true);
    const isParent = data.giftType === 'parent';
    const reserveHold = !isParent && !!data.reserveHold;
    createGiftMutation.mutate({
      pbnDomain: forcedPbnDomain ?? data.pbnDomain,
      recipientEmail: data.recipientEmail,
      exactDomainName: !isParent ? data.exactDomainName : undefined,
      parentDomain: isParent ? (forcedPbnDomain ?? data.pbnDomain) : undefined,
      reason: data.reason,
      personalMessage: data.personalMessage,
      issueFreeClaim: true,
      reserveHold: reserveHold,
      freeClaimExpirationDate: data.expirationDate,
      reservationExpirationDate: reserveHold ? data.expirationDate : null,
      sendEmail: true,
    });
  };

  const domains = domainsQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          '!max-w-[600px] !w-full overflow-y-auto',
        )}
      >
        <DialogHeader>
          <DialogTitle>Create Gift</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              onSubmit(createGiftSchema.parse(data)),
            )}
            className="space-y-4"
          >
            {/* PBN Domain Selection */}
            <FormField
              control={form.control}
              name="pbnDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Domain</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (!value || forcedPbnDomain) return;
                      field.onChange(value);
                    }}
                    defaultValue={forcedPbnDomain ?? field.value}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!!forcedPbnDomain}>
                        <SelectValue placeholder="Select a domain you own" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {forcedPbnDomain ? (
                        <SelectItem value={forcedPbnDomain}>
                          {forcedPbnDomain}
                        </SelectItem>
                      ) : (
                        domains.map((domain) => (
                          <SelectItem
                            key={domain.normalizedDomainName}
                            value={domain.normalizedDomainName}
                          >
                            {domain.normalizedDomainName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {forcedPbnDomain
                      ? 'Domain is fixed for this page'
                      : 'Select the Powered by Namefi domain you want to gift from'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recipient Email */}
            <FormField
              control={form.control}
              name="recipientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <FormControl>
                    <Input placeholder="recipient@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email address of the gift recipient
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gift Type */}
            <FormField
              control={form.control}
              name="giftType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gift Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (!value) return;
                      field.onChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="exact">Specific Domain</SelectItem>
                      <SelectItem value="parent">Any Subdomain</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Gift a specific domain or allow recipient to choose any
                    subdomain
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Domain Details */}
            {giftType === 'exact' && (
              <FormField
                control={form.control}
                name="exactDomainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exact Domain Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`alice.${forcedPbnDomain ?? form.getValues('pbnDomain')}`}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The specific domain name to gift
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {giftType === 'exact' && (
              <FormField
                control={form.control}
                name="reserveHold"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Reserve while pending</FormLabel>
                      <FormDescription>
                        Prevent others from claiming this exact domain until the
                        gift expires or is received.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {giftType === 'parent' && (
              <div className="text-sm text-muted-foreground">
                Parent domain will be the selected PBN domain.
              </div>
            )}

            {/* Expiration Date */}
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiration Date</FormLabel>
                  <FormControl>
                    <NaturalLanguageDatePicker
                      value={{
                        display: expirationDisplay,
                        date: field.value ?? undefined,
                      }}
                      onChange={(v) => {
                        setExpirationDisplay(v.display ?? '');
                        if (v.date) {
                          field.onChange(v.date);
                        }
                      }}
                      hideLabel
                      hideTagline
                    />
                  </FormControl>
                  <FormDescription>
                    When this gift expires if not claimed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Welcome gift, Contest prize, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Brief reason for this gift</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Personal Message */}
            <FormField
              control={form.control}
              name="personalMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a personal message for the recipient..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Personal message to include in the gift email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                Create Gift
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
