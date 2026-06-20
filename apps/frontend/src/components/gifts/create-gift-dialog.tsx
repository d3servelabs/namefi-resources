'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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

const createGiftSchema = (t: ReturnType<typeof useTranslations<'gifts'>>) =>
  z
    .object({
      pbnDomain: namefiNormalizedDomainSchema,
      recipientEmail: z.string().email(t('validation.invalidEmail')),
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
            message: t('validation.exactRequired'),
          });
        } else if (!data.exactDomainName.endsWith(data.pbnDomain)) {
          ctx.addIssue({
            code: 'custom',
            path: ['exactDomainName'],
            message: t('validation.exactMustEndWith', {
              domain: data.pbnDomain,
            }),
          });
        }
      }
      if (data.giftType === 'parent' && !data.parentDomain) {
        ctx.addIssue({
          code: 'custom',
          path: ['parentDomain'],
          message: t('validation.parentRequired'),
        });
      }
    });

type CreateGiftSchema = ReturnType<typeof createGiftSchema>;
type CreateGiftFormInput = z.input<CreateGiftSchema>;
type CreateGiftFormOutput = z.output<CreateGiftSchema>;

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
  const t = useTranslations('gifts');
  const tCommon = useTranslations('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trpc = useTRPC();

  const giftSchema = useMemo(() => createGiftSchema(t), [t]);

  // Fetch user's PBN domains
  const domainsQuery = useQuery(
    trpc.pbnOwner.listOwnedDomains.queryOptions(void 0, {
      enabled: !forcedPbnDomain,
    }),
  );

  const form = useForm<CreateGiftFormInput, unknown, CreateGiftFormOutput>({
    resolver: zodResolver(giftSchema) as Resolver<
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
            ? t('toast.createdEmailSent')
            : t('toast.createdEmailFailed'),
        );
        form.reset();
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(t('toast.createFailed', { error: error.message }));
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
          <DialogTitle>{t('create.title')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              onSubmit(giftSchema.parse(data)),
            )}
            className="space-y-4"
          >
            {/* PBN Domain Selection */}
            <FormField
              control={form.control}
              name="pbnDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.yourDomain')}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (!value || forcedPbnDomain) return;
                      field.onChange(value);
                    }}
                    defaultValue={forcedPbnDomain ?? field.value}
                  >
                    <FormControl>
                      <SelectTrigger disabled={!!forcedPbnDomain}>
                        <SelectValue
                          placeholder={t('fields.yourDomainPlaceholder')}
                        />
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
                      ? t('fields.yourDomainDescriptionFixed')
                      : t('fields.yourDomainDescription')}
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
                  <FormLabel>{t('fields.recipientEmail')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('fields.recipientEmailPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.recipientEmailDescription')}
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
                  <FormLabel>{t('fields.giftType')}</FormLabel>
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
                      <SelectItem value="exact">
                        {t('fields.giftTypeExact')}
                      </SelectItem>
                      <SelectItem value="parent">
                        {t('fields.giftTypeParent')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('fields.giftTypeDescription')}
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
                    <FormLabel>{t('fields.exactDomainName')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('fields.exactDomainNamePlaceholder', {
                          domain:
                            forcedPbnDomain ?? form.getValues('pbnDomain'),
                        })}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('fields.exactDomainNameDescription')}
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
                      <FormLabel>{t('fields.reserveLabel')}</FormLabel>
                      <FormDescription>
                        {t('fields.reserveDescription')}
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
                {t('fields.parentNote')}
              </div>
            )}

            {/* Expiration Date */}
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.expirationDate')}</FormLabel>
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
                    {t('fields.expirationDateDescription')}
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
                  <FormLabel>{t('fields.reason')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('fields.reasonPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.reasonDescription')}
                  </FormDescription>
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
                  <FormLabel>{t('fields.personalMessage')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('fields.personalMessagePlaceholder')}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('fields.personalMessageDescription')}
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
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {t('create.submit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
