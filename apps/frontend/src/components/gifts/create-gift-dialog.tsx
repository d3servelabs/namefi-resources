'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTRPC } from '@/lib/trpc';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { Switch } from '@/components/ui/shadcn/switch';
import { Button } from '@/components/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
// Calendar component not present in shadcn; fallback to a simple date input
import { Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { NaturalLanguageDatePicker } from '@/components/date-picker/natural-language-date-picker';
import { toast } from 'sonner';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';

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
    expirationDate: z.date({
      required_error: 'Please select an expiration date',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.giftType === 'exact' && !data.exactDomainName) {
      ctx.addIssue({
        code: 'custom',
        path: ['exactDomainName'],
        message: 'Exact domain is required',
      });
    }
    if (data.giftType === 'parent' && !data.parentDomain) {
      ctx.addIssue({
        code: 'custom',
        path: ['parentDomain'],
        message: 'Parent domain is required',
      });
    }
  });

type CreateGiftForm = z.infer<typeof createGiftSchema>;

interface CreateGiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateGiftDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateGiftDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trpc = useTRPC();

  // Fetch user's PBN domains
  const domainsQuery = useQuery(trpc.pbnOwner.listOwnedDomains.queryOptions());

  const form = useForm<CreateGiftForm>({
    resolver: zodResolver(createGiftSchema),
    defaultValues: {
      giftType: 'exact',
      reserveHold: true,
      expirationDate: addDays(new Date(), 30), // Default to 30 days from now
    },
  });

  const giftType = form.watch('giftType');
  const reserveHold = form.watch('reserveHold');
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

  const onSubmit = (data: CreateGiftForm) => {
    setIsSubmitting(true);
    const isParent = data.giftType === 'parent';
    const reserveHold = !isParent && !!data.reserveHold;
    createGiftMutation.mutate({
      pbnDomain: data.pbnDomain,
      recipientEmail: data.recipientEmail,
      exactDomainName: !isParent ? data.exactDomainName : undefined,
      parentDomain: isParent ? data.pbnDomain : undefined,
      reason: data.reason,
      personalMessage: data.personalMessage,
      issueFreeClaim: true,
      reserveHold: reserveHold,
      freeClaimExpirationDate: isParent ? data.expirationDate : null,
      reservationExpirationDate: reserveHold ? data.expirationDate : null,
      sendEmail: true,
    });
  };

  const domains = domainsQuery.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[600px] !w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Gift</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* PBN Domain Selection */}
            <FormField
              control={form.control}
              name="pbnDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Domain</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a domain you own" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem
                          key={domain.normalizedDomainName}
                          value={domain.normalizedDomainName}
                        >
                          {domain.normalizedDomainName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the Powered by Namefi domain you want to gift from
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
                    onValueChange={field.onChange}
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
                      <Input placeholder="alice.yourdomain.com" {...field} />
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
            <div className="flex justify-end space-x-2 pt-4">
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
