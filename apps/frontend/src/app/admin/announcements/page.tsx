'use client';

import { useEffect, useMemo, useState } from 'react';
import { type FieldErrors, useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { withAdminGuard } from '@/components/admin/admin-guard';
import { PageShell } from '@/components/page-shell';
import { PermissionGate } from '@/components/access/PermissionGate';
import { Permission } from '@namefi-astra/utils/permissions';
import {
  conditionOperatorSchema,
  tldPriceKindSchema,
} from '@namefi-astra/common/announcements-condition';
import type { PriceOperand } from '@namefi-astra/common/announcements-condition';
import { isAllowedLinkUrl } from '@namefi-astra/common/contract/announcements-contract';
import type { AppRouterOutput } from '@/lib/trpc';
import { useTRPC } from '@/lib/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { endOfDay, format } from 'date-fns';
import {
  Check,
  ChevronDown,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { Badge } from '@namefi-astra/ui/components/shadcn/badge';
import { AsyncButton } from '@/components/buttons/async-button';
import { DatePickerWithInput } from '@/components/date-picker/date-picker-with-input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@namefi-astra/ui/components/shadcn/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@namefi-astra/ui/components/shadcn/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@namefi-astra/ui/components/shadcn/table';

type AnnouncementRow =
  AppRouterOutput['admin']['announcements']['list']['items'][number];

const OPERATOR_LABELS: Record<
  z.infer<typeof conditionOperatorSchema>,
  string
> = {
  eq: '=',
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
};

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/** Dropdown sentinel for "the main Namefi site" (maps to a null target). */
const MAIN_SITE_VALUE = 'namefi';

// A price operand, flattened so react-hook-form can manage each field; rebuilt
// into the discriminated `PriceOperand` shape on submit.
const operandFormSchema = z.object({
  kind: z.enum(['literal', 'tld']),
  amountUsd: z.number().optional(),
  tld: z.string().optional(),
  priceKind: tldPriceKindSchema,
});

type OperandForm = z.infer<typeof operandFormSchema>;

// Form schema — the condition's two operands are nested so react-hook-form can
// manage them directly; it is rebuilt into the contract shape on submit.
const formSchema = z
  .object({
    title: z.string().max(200).optional(),
    body: z.string().min(1, 'Required').max(5000),
    backgroundColor: z.string().max(64).optional(),
    textColor: z.string().max(64).optional(),
    backgroundOpacity: z.number().min(0).max(100).optional(),
    linkUrl: z
      .string()
      .max(2000)
      .refine((v) => v === '' || isAllowedLinkUrl(v), {
        message: 'Enter an http(s) URL, a mailto: link, or a /path',
      })
      .optional(),
    linkLabel: z.string().max(120).optional(),
    // 'auto' maps to a null target (external → new tab, internal → same tab).
    linkTarget: z.enum(['auto', '_self', '_blank']),
    dismissible: z.boolean(),
    isActive: z.boolean(),
    // Each entry is "namefi" (main site) or a PBN normalizedDomainName.
    targetSites: z.array(z.string()).min(1, 'Select at least one site'),
    priority: z.number().int(),
    startsAt: z.date().optional(),
    endsAt: z.date().optional(),
    conditionType: z.enum(['none', 'PRICE_COMPARE']),
    operator: conditionOperatorSchema,
    left: operandFormSchema,
    right: operandFormSchema,
  })
  .superRefine((val, ctx) => {
    if (val.conditionType !== 'PRICE_COMPARE') return;
    for (const side of ['left', 'right'] as const) {
      const op = val[side];
      if (op.kind === 'literal') {
        if (
          op.amountUsd === undefined ||
          Number.isNaN(op.amountUsd) ||
          op.amountUsd < 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'A non-negative amount is required',
            path: [side, 'amountUsd'],
          });
        }
      } else if (!op.tld?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'TLD is required',
          path: [side, 'tld'],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

function operandDefaults(
  op: PriceOperand | undefined,
  fallbackKind: 'literal' | 'tld',
): OperandForm {
  return {
    kind: op?.kind ?? fallbackKind,
    amountUsd: op?.kind === 'literal' ? op.amountUsd : undefined,
    tld: op?.kind === 'tld' ? op.tld : '',
    priceKind: op?.kind === 'tld' ? op.priceKind : 'registration',
  };
}

function defaultsFor(row: AnnouncementRow | null): FormValues {
  const condition = row?.condition ?? null;
  const compare = condition?.type === 'PRICE_COMPARE' ? condition : null;
  return {
    title: row?.title ?? '',
    body: row?.body ?? '',
    backgroundColor: row?.backgroundColor ?? '',
    textColor: row?.textColor ?? '',
    backgroundOpacity: row?.backgroundOpacity ?? undefined,
    linkUrl: row?.linkUrl ?? '',
    linkLabel: row?.linkLabel ?? '',
    linkTarget: row?.linkTarget ?? 'auto',
    dismissible: row?.dismissible ?? true,
    isActive: row?.isActive ?? true,
    targetSites: row?.targetSites?.length ? row.targetSites : [MAIN_SITE_VALUE],
    priority: row?.priority ?? 0,
    startsAt: row?.startsAt ?? undefined,
    endsAt: row?.endsAt ?? undefined,
    conditionType: compare ? 'PRICE_COMPARE' : 'none',
    operator: compare?.operator ?? 'lte',
    // Default a fresh condition to "<a TLD's price> <op> <a fixed amount>".
    left: operandDefaults(compare?.left, 'tld'),
    right: operandDefaults(compare?.right, 'literal'),
  };
}

function toOperand(op: OperandForm): PriceOperand {
  return op.kind === 'literal'
    ? { kind: 'literal', amountUsd: op.amountUsd ?? 0 }
    : { kind: 'tld', tld: (op.tld ?? '').trim(), priceKind: op.priceKind };
}

function operandLabel(op: PriceOperand): string {
  return op.kind === 'literal'
    ? `$${op.amountUsd}`
    : `.${op.tld} ${op.priceKind}`;
}

function conditionSummary(row: AnnouncementRow): string {
  const c = row.condition;
  if (!c) return '—';
  if (c.type === 'PRICE_COMPARE') {
    return `${operandLabel(c.left)} ${OPERATOR_LABELS[c.operator]} ${operandLabel(c.right)}`;
  }
  return '—';
}

function scheduleSummary(row: AnnouncementRow): string {
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
  if (row.startsAt && row.endsAt)
    return `${fmt(row.startsAt)} → ${fmt(row.endsAt)}`;
  if (row.startsAt) return `from ${fmt(row.startsAt)}`;
  if (row.endsAt) return `until ${fmt(row.endsAt)}`;
  return 'Always';
}

/** Optional color override input: a native swatch plus a free-form CSS value. */
function ColorField({
  form,
  name,
  label,
  fallback,
}: {
  form: UseFormReturn<FormValues>;
  name: 'backgroundColor' | 'textColor';
  label: string;
  fallback: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`${label} picker`}
              value={
                field.value && HEX_COLOR_REGEX.test(field.value)
                  ? field.value
                  : fallback
              }
              onChange={(e) => field.onChange(e.target.value)}
              className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            <FormControl>
              <Input
                placeholder="Default (brand)"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
          </div>
          <FormDescription>Leave blank to use the brand color.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Editor for one side of a price comparison (a fixed amount or a TLD price). */
function OperandFields({
  form,
  side,
  label,
}: {
  form: UseFormReturn<FormValues>;
  side: 'left' | 'right';
  label: string;
}) {
  const kind = form.watch(`${side}.kind`);
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="text-muted-foreground text-xs font-medium">{label}</div>
      <FormField
        control={form.control}
        name={`${side}.kind`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="tld">TLD price</SelectItem>
                <SelectItem value="literal">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {kind === 'tld' ? (
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name={`${side}.tld`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>TLD</FormLabel>
                <FormControl>
                  <Input placeholder="com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${side}.priceKind`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="registration">Registration</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      ) : (
        <FormField
          control={form.control}
          name={`${side}.amountUsd`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount (USD/yr)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={
                    field.value === undefined || Number.isNaN(field.value)
                      ? ''
                      : field.value
                  }
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

function AnnouncementFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AnnouncementRow | null;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { data: siteTargets } = useQuery(
    trpc.admin.announcements.listSiteTargets.queryOptions(),
  );
  const pbnDomains = siteTargets?.pbnDomains ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(editing),
  });

  // Re-seed the form each time the dialog opens (the dialog stays mounted, so
  // `defaultValues` alone won't refresh between create/edit).
  useEffect(() => {
    if (open) {
      form.reset(defaultsFor(editing));
      setAdvancedOpen(Boolean(editing?.condition));
    }
  }, [open, editing, form]);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.admin.announcements.list.queryKey(),
    });

  const createMutation = useMutation(
    trpc.admin.announcements.create.mutationOptions({
      onSuccess: async () => {
        toast.success('Announcement created');
        await invalidate();
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateMutation = useMutation(
    trpc.admin.announcements.update.mutationOptions({
      onSuccess: async () => {
        toast.success('Announcement updated');
        await invalidate();
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const conditionType = form.watch('conditionType');

  const onSubmit = async (values: FormValues) => {
    const condition =
      values.conditionType === 'PRICE_COMPARE'
        ? {
            type: 'PRICE_COMPARE' as const,
            left: toOperand(values.left),
            operator: values.operator,
            right: toOperand(values.right),
          }
        : null;

    const payload = {
      title: values.title?.trim() ? values.title.trim() : null,
      body: values.body,
      backgroundColor: values.backgroundColor?.trim()
        ? values.backgroundColor.trim()
        : null,
      textColor: values.textColor?.trim() ? values.textColor.trim() : null,
      backgroundOpacity:
        values.backgroundOpacity == null ||
        Number.isNaN(values.backgroundOpacity)
          ? null
          : values.backgroundOpacity,
      linkUrl: values.linkUrl ? values.linkUrl : null,
      linkLabel: values.linkLabel ? values.linkLabel : null,
      linkTarget: values.linkTarget === 'auto' ? null : values.linkTarget,
      dismissible: values.dismissible,
      isActive: values.isActive,
      targetSites: values.targetSites,
      priority: values.priority,
      // Date picker is day-granular: start at the chosen day, end at day's end.
      startsAt: values.startsAt ?? null,
      endsAt: values.endsAt ? endOfDay(values.endsAt) : null,
      condition,
    };

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  // Surface validation failures: toast, and reveal the Advanced section when
  // the invalid fields live inside it (otherwise their errors stay hidden).
  const onInvalid = (errors: FieldErrors<FormValues>) => {
    if (errors.left || errors.right || errors.operator) {
      setAdvancedOpen(true);
    }
    toast.error('Please fix the highlighted fields.');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          MOBILE_BOTTOM_SHEET_DIALOG,
          'max-h-[90vh] overflow-y-auto sm:max-w-2xl',
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Edit announcement' : 'New announcement'}
          </DialogTitle>
          <DialogDescription>
            Banners appear as a strip at the top of the site.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Scheduled maintenance" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Celebrate our birthday — domains from $1.00!"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Supports markdown: **bold**, *italic*, `code`, and
                    [links](https://example.com).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetSites"
              render={({ field }) => {
                const selected = new Set(field.value);
                const toggle = (site: string, checked: boolean) => {
                  const next = new Set(field.value);
                  if (checked) next.add(site);
                  else next.delete(site);
                  field.onChange([...next]);
                };
                // Dedupe in case a PBN domain collides with the main-site sentinel.
                const options = [...new Set([MAIN_SITE_VALUE, ...pbnDomains])];
                return (
                  <FormItem>
                    <FormLabel>Show on</FormLabel>
                    <div className="max-h-44 space-y-2 overflow-auto rounded-md border p-3">
                      {options.map((site) => (
                        // biome-ignore lint/a11y/noLabelWithoutControl: the nested base-ui Checkbox is the control.
                        <label
                          key={site}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={selected.has(site)}
                            onCheckedChange={(checked) =>
                              toggle(site, checked === true)
                            }
                          />
                          {site === MAIN_SITE_VALUE
                            ? 'namefi (main site)'
                            : site}
                        </label>
                      ))}
                    </div>
                    <FormDescription>
                      Pick one or more sites — the main Namefi site and/or
                      specific powered-by-namefi domains.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorField
                form={form}
                name="backgroundColor"
                label="Background color"
                fallback="#6d28d9"
              />
              <ColorField
                form={form}
                name="textColor"
                label="Text color"
                fallback="#ffffff"
              />
            </div>

            <FormField
              control={form.control}
              name="backgroundOpacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background opacity (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="100 (opaque)"
                      value={
                        field.value === undefined || Number.isNaN(field.value)
                          ? ''
                          : field.value
                      }
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Applies to the background only. Leave blank for fully
                    opaque.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={Number.isNaN(field.value) ? '' : field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher priority rotates first in the strip.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://…  or  /my-domains"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      An http(s) URL, a mailto: link, or a /path on this site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link label (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Learn more" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="linkTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link behavior</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="auto">
                        Auto (new tab for external links)
                      </SelectItem>
                      <SelectItem value="_self">Same tab</SelectItem>
                      <SelectItem value="_blank">New window/tab</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Internal /paths open via in-app navigation.
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starts at (optional)</FormLabel>
                    <DatePickerWithInput
                      id="announcement-starts-at"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pick a start date"
                      className="flex flex-col gap-1"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endsAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ends at (optional)</FormLabel>
                    <DatePickerWithInput
                      id="announcement-ends-at"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Pick an end date"
                      className="flex flex-col gap-1"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-8">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dismissible"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Dismissible</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <Collapsible
              open={advancedOpen}
              onOpenChange={setAdvancedOpen}
              className="rounded-lg border"
            >
              <CollapsibleTrigger
                type="button"
                className="flex w-full items-center justify-between p-4 text-sm font-medium"
              >
                Advanced — display conditions
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    advancedOpen && 'rotate-180',
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 px-4 pb-4">
                <FormField
                  control={form.control}
                  name="conditionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            Always show (no condition)
                          </SelectItem>
                          <SelectItem value="PRICE_COMPARE">
                            Compare prices
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Conditional banners only show when the rule currently
                        holds. Each side can be a fixed USD amount or a TLD's
                        live price.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {conditionType === 'PRICE_COMPARE' ? (
                  <div className="space-y-3">
                    <OperandFields form={form} side="left" label="Left side" />
                    <FormField
                      control={form.control}
                      name="operator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operator</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="eq">= equals</SelectItem>
                              <SelectItem value="lt">&lt; less than</SelectItem>
                              <SelectItem value="lte">≤ at most</SelectItem>
                              <SelectItem value="gt">
                                &gt; greater than
                              </SelectItem>
                              <SelectItem value="gte">≥ at least</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <OperandFields
                      form={form}
                      side="right"
                      label="Right side"
                    />
                  </div>
                ) : null}
              </CollapsibleContent>
            </Collapsible>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editing ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementsAdmin() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(
    trpc.admin.announcements.list.queryOptions(),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AnnouncementRow | null>(
    null,
  );

  const removeMutation = useMutation(
    trpc.admin.announcements.remove.mutationOptions({
      onSuccess: async () => {
        toast.success('Announcement deleted');
        await queryClient.invalidateQueries({
          queryKey: trpc.admin.announcements.list.queryKey(),
        });
        setPendingDelete(null);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const rows = useMemo(() => data?.items ?? [], [data?.items]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (row: AnnouncementRow) => {
    setEditing(row);
    setDialogOpen(true);
  };

  return (
    <PageShell padding="admin">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Megaphone className="size-6 text-amber-500" />
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground text-sm">
              Manage the site-wide announcement banner.
            </p>
          </div>
        </div>
        <PermissionGate permissions={[Permission.WRITE_ANNOUNCEMENTS]}>
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New announcement
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Rule met?</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    No announcements yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-xs">
                      <div className="truncate font-medium">
                        {row.title ?? (
                          <span className="text-muted-foreground italic">
                            Untitled
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {row.body}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.targetSites?.length
                        ? row.targetSites.join(', ')
                        : 'namefi'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-block size-4 rounded border border-border/50 align-middle',
                          !row.backgroundColor && 'bg-brand-primary',
                        )}
                        style={
                          row.backgroundColor
                            ? { backgroundColor: row.backgroundColor }
                            : undefined
                        }
                        title={row.backgroundColor ?? 'Brand primary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isActive ? 'default' : 'outline'}>
                        {row.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.priority}</TableCell>
                    <TableCell className="text-sm">
                      {conditionSummary(row)}
                    </TableCell>
                    <TableCell title={row.conditionDetail ?? undefined}>
                      {row.conditionMet === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : row.conditionMet ? (
                        <Check className="size-4 text-emerald-500" />
                      ) : (
                        <X className="size-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {scheduleSummary(row)}
                    </TableCell>
                    <TableCell className="text-end">
                      <PermissionGate
                        permissions={[Permission.WRITE_ANNOUNCEMENTS]}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete"
                            onClick={() => setPendingDelete(row)}
                          >
                            <Trash2 className="size-4 text-red-400" />
                          </Button>
                        </div>
                      </PermissionGate>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AnnouncementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “
              {pendingDelete?.title ??
                pendingDelete?.body ??
                'this announcement'}
              ”. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AsyncButton
              variant="destructive"
              onClick={async () => {
                if (pendingDelete) {
                  await removeMutation.mutateAsync({ id: pendingDelete.id });
                }
              }}
            >
              Delete
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

export default withAdminGuard(function AnnouncementsAdminPage() {
  return (
    <PermissionGate
      permissions={[Permission.READ_ANNOUNCEMENTS]}
      permissionsMode="some"
    >
      <AnnouncementsAdmin />
    </PermissionGate>
  );
});
