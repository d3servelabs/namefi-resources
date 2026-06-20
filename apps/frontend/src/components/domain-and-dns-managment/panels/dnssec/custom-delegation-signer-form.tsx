'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import {
  type SubmitHandler,
  useForm,
  type ControllerRenderProps,
  type UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  EyeIcon,
  Loader2,
  PencilIcon,
  RadarIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { LoadingButton } from '@/components/buttons/loading-button';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import {
  DnssecAlgorithms,
  DnssecDigestType,
  DnssecFlags,
} from '@namefi-astra/zod-dns';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Card } from '@namefi-astra/ui/components/shadcn/card';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { cn } from '@namefi-astra/ui/lib/cn';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import { Input } from '@namefi-astra/ui/components/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@namefi-astra/ui/components/shadcn/tabs';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';

type DnsTranslator = ReturnType<typeof useTranslations<'dnsManagement'>>;

const SUPPORTED_ALGORITHMS = [
  { value: DnssecAlgorithms.RSA_SHA_256, label: '8 — RSA/SHA-256' },
  { value: DnssecAlgorithms.RSA_SHA_512, label: '10 — RSA/SHA-512' },
  {
    value: DnssecAlgorithms.ECDSA_P256SHA256,
    label: '13 — ECDSA P-256/SHA-256',
  },
  {
    value: DnssecAlgorithms.ECDSA_P384SHA384,
    label: '14 — ECDSA P-384/SHA-384',
  },
  { value: DnssecAlgorithms.ED25519, label: '15 — Ed25519' },
  { value: DnssecAlgorithms.ED448, label: '16 — Ed448' },
];

const FLAG_OPTIONS = [
  { value: DnssecFlags.KSK, label: '257 — KSK' },
  { value: DnssecFlags.ZSK, label: '256 — ZSK' },
];

const DIGEST_TYPE_OPTIONS = [
  { value: DnssecDigestType.SHA_1, label: '1 — SHA-1' },
  { value: DnssecDigestType.SHA_256, label: '2 — SHA-256' },
  { value: DnssecDigestType.SHA_384, label: '4 — SHA-384' },
];

const formSchema = z.object({
  keyTag: z.coerce.number().int().min(0).max(65535),
  algorithm: z.coerce.number().int().pipe(z.nativeEnum(DnssecAlgorithms)),
  flags: z.coerce.number().int().pipe(z.nativeEnum(DnssecFlags)),
  publicKey: z
    .string()
    .min(1, 'Public key is required')
    .transform((v) => v.replace(/\s+/g, '')),
  digestType: z.coerce.number().int().pipe(z.nativeEnum(DnssecDigestType)),
  digest: z
    .string()
    .min(1, 'Digest is required')
    .regex(/^[0-9a-fA-F]+$/, 'Digest must be hex'),
});

type FormValues = z.infer<typeof formSchema>;

type ValidateResult =
  AppRouterOutput['domainConfig']['dnssec']['validateDelegationSigner'];
type DerivedCandidate =
  AppRouterOutput['domainConfig']['dnssec']['deriveDelegationSigner']['candidates'][number];

type ValidationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | { status: 'done'; result: ValidateResult };

const PASTE_PLACEHOLDER = [
  'Examples (any of):',
  'example.com.  3600  IN  DNSKEY  257 3 13 mdsswUyr3...',
  'example.com.  3600  IN  DS      36011 8 2 83E49D5079...',
  '257 3 13 mdsswUyr3...',
  '36011 8 2 83E49D5079...',
].join('\n');

export type CustomDelegationSignerFormProps = {
  domainName: PunycodeDomainName;
  onSuccess: () => void;
  onCancel: () => void;
};

export function CustomDelegationSignerForm({
  domainName,
  onSuccess,
  onCancel,
}: CustomDelegationSignerFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const tCommon = useTranslations('common');
  const tDns = useTranslations('dnsManagement');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'all',
    defaultValues: {
      keyTag: 0,
      algorithm: DnssecAlgorithms.ECDSA_P256SHA256,
      flags: DnssecFlags.KSK,
      publicKey: '',
      digestType: DnssecDigestType.SHA_256,
      digest: '',
    },
  });

  const [inputMode, setInputMode] = useState<'auto-detect' | 'manual'>(
    'auto-detect',
  );
  const [pastedText, setPastedText] = useState('');
  const [autoDetectCandidates, setAutoDetectCandidates] = useState<
    DerivedCandidate[]
  >([]);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(0);
  const [validation, setValidation] = useState<ValidationState>({
    status: 'idle',
  });
  const [acknowledge, setAcknowledge] = useState(false);
  const [publicKeyMissingNotice, setPublicKeyMissingNotice] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'edit'>('summary');

  // Reset validation + ack whenever any DS field changes.
  useEffect(() => {
    const subscription = form.watch(() => {
      setValidation({ status: 'idle' });
      setAcknowledge(false);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const populateFromCandidate = (candidate: DerivedCandidate) => {
    form.setValue('keyTag', candidate.keyTag, { shouldValidate: true });
    form.setValue('algorithm', candidate.algorithm, { shouldValidate: true });
    form.setValue('flags', candidate.flags, { shouldValidate: true });
    form.setValue('publicKey', candidate.publicKey, { shouldValidate: true });
    form.setValue('digestType', candidate.digestType, { shouldValidate: true });
    form.setValue('digest', candidate.digest, { shouldValidate: true });
    setPublicKeyMissingNotice(candidate.publicKey === '');
  };

  const validateMutation = useMutation(
    trpc.domainConfig.dnssec.validateDelegationSigner.mutationOptions({
      onSuccess(result) {
        setValidation({ status: 'done', result });
      },
      onError(error) {
        // Both lanes failed at the same fundamental point (e.g. owner-guard).
        // Surface as a top-level error result.
        const empty = {
          isValid: false,
          publishedDnskeys: [],
          queriedSource: [],
          errorMessage: error.message,
        };
        setValidation({
          status: 'done',
          result: { authoritative: empty, publicDns: empty },
        });
      },
    }),
  );

  const runValidate = (signingConfig: {
    algorithm: DnssecAlgorithms;
    publicKey: string;
    flags: DnssecFlags;
    keyTag: number;
    digestType: DnssecDigestType;
    digest: string;
  }) => {
    setValidation({ status: 'pending' });
    validateMutation.mutate({ domainName, signingConfig });
  };

  const triggerValidate = (candidate: DerivedCandidate) => {
    if (!candidate.publicKey) return; // DS-only paste — can't validate yet
    runValidate({
      algorithm: candidate.algorithm,
      publicKey: candidate.publicKey,
      flags: candidate.flags,
      keyTag: candidate.keyTag,
      digestType: candidate.digestType,
      digest: candidate.digest,
    });
  };

  const deriveMutation = useMutation(
    trpc.domainConfig.dnssec.deriveDelegationSigner.mutationOptions({
      onSuccess(result, variables) {
        if (result.candidates.length === 0) {
          toast.error('No DS or DNSKEY could be derived from input');
          return;
        }
        const first = result.candidates[0];
        // Auto-detect mode tracks all candidates so user can switch.
        if (!variables.text) {
          setAutoDetectCandidates(result.candidates);
          setSelectedCandidateIdx(0);
          populateFromCandidate(first);
          if (result.candidates.length > 1) {
            toast.info(
              `${result.candidates.length} KSKs published — pick one below.`,
            );
          } else {
            toast.success(`DNSKEY found (key tag ${first.keyTag})`);
          }
          triggerValidate(first);
          return;
        }
        // Manual paste — always one candidate.
        setAutoDetectCandidates([]);
        populateFromCandidate(first);
        if (first.publicKey === '') {
          toast.success('DS fields populated. Public key still required.');
        } else {
          toast.success('Form populated from pasted record');
          triggerValidate(first);
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    }),
  );

  const refetchAfterSubmit = async () => {
    // Force refetch — `getPendingDeferredDelegationSigners` is workflow state
    // that needs to update immediately after submit, not on stale-window expiry.
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
          domainName,
        }),
      }),
      queryClient.refetchQueries({
        queryKey:
          trpc.domainConfig.dnssec.getPendingDeferredDelegationSigners.queryKey(
            { domainName },
          ),
      }),
    ]);
  };

  const associateMutation = useMutation(
    trpc.domainConfig.dnssec.associateDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success('Delegation signer associated');
        await refetchAfterSubmit();
        onSuccess();
      },
      onError(error) {
        toast.error(`Failed to associate delegation signer: ${error.message}`);
      },
    }),
  );

  const deferredMutation = useMutation(
    trpc.domainConfig.dnssec.submitDeferredDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success(
          "DS submission scheduled — we'll associate it once your DNSKEY validates.",
        );
        await refetchAfterSubmit();
        onSuccess();
      },
      onError(error) {
        toast.error(`Failed to schedule DS submission: ${error.message}`);
      },
    }),
  );

  const ackInfo = useMemo(
    () => buildAckInfo(validation, tDns),
    [validation, tDns],
  );

  const validationFailed =
    validation.status === 'done' &&
    !(
      validation.result.authoritative.isValid &&
      validation.result.publicDns.isValid
    );

  const submitDisabled = useMemo(() => {
    if (associateMutation.isPending || deferredMutation.isPending) return true;
    if (validation.status !== 'done') return true;
    return !acknowledge;
  }, [
    associateMutation.isPending,
    deferredMutation.isPending,
    validation.status,
    acknowledge,
  ]);

  const handleManualDerive = () => {
    const trimmed = pastedText.trim();
    if (trimmed.length === 0) {
      toast.error('Paste a DNSKEY or DS record first');
      return;
    }
    deriveMutation.mutate({
      domainName,
      text: trimmed,
      digestType: form.getValues('digestType'),
    });
  };

  const handleAutoDetect = () => {
    deriveMutation.mutate({
      domainName,
      digestType: form.getValues('digestType'),
    });
  };

  const handleSelectCandidate = (idx: number) => {
    setSelectedCandidateIdx(idx);
    const candidate = autoDetectCandidates[idx];
    if (candidate) {
      populateFromCandidate(candidate);
      triggerValidate(candidate);
    }
  };

  const handleValidate = () => {
    // Read current form values and sanitize the two free-form fields
    // (publicKey base64 and digest hex). Persist the cleaned values back
    // into the form state via setValue so the subsequent Submit click —
    // which reads from form.getValues() — sends the same sanitized
    // payload as Validate did. The watcher's idle-reset is suppressed
    // here by passing { shouldValidate: false } so the validation result
    // we're about to fire remains the source of truth.
    const values = form.getValues();
    const cleanedPublicKey = (values.publicKey ?? '').replace(/\s+/g, '');
    const cleanedDigest = (values.digest ?? '').replace(/\s+/g, '');
    if (!cleanedPublicKey || !cleanedDigest) {
      toast.error('Public key and digest are required to validate');
      return;
    }
    if (cleanedPublicKey !== values.publicKey) {
      form.setValue('publicKey', cleanedPublicKey, { shouldValidate: false });
    }
    if (cleanedDigest !== values.digest) {
      form.setValue('digest', cleanedDigest, { shouldValidate: false });
    }
    runValidate({
      algorithm: values.algorithm,
      publicKey: cleanedPublicKey,
      flags: values.flags,
      keyTag: values.keyTag,
      digestType: values.digestType,
      digest: cleanedDigest,
    });
  };

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    // Sanitize at the boundary too (defensive): handleValidate already
    // writes cleaned values back into the form, but a defensive strip
    // here prevents a whitespace-laden publicKey / digest from reaching
    // the registrar via any path we might add later.
    const signingConfig = {
      algorithm: values.algorithm,
      publicKey: (values.publicKey ?? '').replace(/\s+/g, ''),
      flags: values.flags,
      keyTag: values.keyTag,
      digestType: values.digestType,
      digest: (values.digest ?? '').replace(/\s+/g, ''),
    };
    if (validationFailed) {
      // Failing validation + ack checked → schedule deferred workflow.
      deferredMutation.mutate({ domainName, signingConfig });
      return;
    }
    associateMutation.mutate({ domainName, signingConfig });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 min-w-0"
      >
        <Tabs
          value={inputMode}
          onValueChange={(value) =>
            setInputMode(value as 'auto-detect' | 'manual')
          }
        >
          <TabsList>
            <TabsTrigger value="auto-detect">
              {tDns('form.tabs.autoDetect')}
            </TabsTrigger>
            <TabsTrigger value="manual">{tDns('form.tabs.manual')}</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex flex-col gap-3 min-w-0">
            <p className="text-sm text-zinc-400">
              {tDns('form.manual.description')}{' '}
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className="inline rounded bg-blue-500/15 px-1.5 py-0.5 text-blue-300 hover:bg-blue-500/25 cursor-pointer transition-colors"
              >
                {tDns('form.manual.enterFieldsManually')}
              </button>
            </p>
            <Textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={PASTE_PLACEHOLDER}
              rows={5}
              className="font-mono text-xs w-full max-w-full"
            />
            <div className="flex items-center justify-end">
              <LoadingButton
                type="button"
                variant="secondary"
                isLoading={deriveMutation.isPending}
                loadingText={tDns('form.manual.deriving')}
                onClick={handleManualDerive}
                disabled={pastedText.trim().length === 0}
              >
                {tDns('form.manual.derive')}
              </LoadingButton>
            </div>
          </TabsContent>

          <TabsContent
            value="auto-detect"
            className="flex flex-col gap-3 min-w-0"
          >
            <p className="text-sm text-zinc-400">
              {tDns('form.autoDetect.description')}
            </p>
            <div className="flex items-center justify-between gap-2">
              <LoadingButton
                type="button"
                variant="secondary"
                isLoading={deriveMutation.isPending}
                loadingText={tDns('form.autoDetect.detecting')}
                onClick={handleAutoDetect}
              >
                <RadarIcon className="w-4 h-4" />
                {tDns('form.autoDetect.detect')}
              </LoadingButton>
              {autoDetectCandidates.length > 1 ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-zinc-400 shrink-0">
                    {tDns('form.autoDetect.kskCandidate')}
                  </span>
                  <Select
                    value={String(selectedCandidateIdx)}
                    onValueChange={(value) => {
                      if (value === null) return;
                      handleSelectCandidate(Number(value));
                    }}
                  >
                    <SelectTrigger className="min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {autoDetectCandidates.map((candidate, idx) => (
                        <SelectItem
                          // biome-ignore lint/suspicious/noArrayIndexKey: candidate list is stable per detect call
                          key={`${candidate.keyTag}-${idx}`}
                          value={String(idx)}
                        >
                          {tDns('form.autoDetect.candidateOption', {
                            keyTag: candidate.keyTag,
                            algorithm: candidate.algorithm,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-2 min-w-0">
          <h3 className="text-sm font-medium">{tDns('form.dsValuesTitle')}</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              setViewMode((prev) => (prev === 'summary' ? 'edit' : 'summary'))
            }
          >
            {viewMode === 'summary' ? (
              <>
                <PencilIcon className="w-4 h-4" />
                {tCommon('actions.edit')}
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" />
                {tDns('form.viewSummary')}
              </>
            )}
          </Button>
        </div>

        {viewMode === 'summary' ? (
          <DsSummaryTable form={form} tDns={tDns} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <FormField
                control={form.control}
                name="keyTag"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{tDns('form.fields.keyTag')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={65535}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="algorithm"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{tDns('form.fields.algorithm')}</FormLabel>
                    <FormControl>
                      <SelectField
                        field={field}
                        options={SUPPORTED_ALGORITHMS}
                        placeholder={tDns('form.placeholders.algorithm')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flags"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{tDns('form.fields.flags')}</FormLabel>
                    <FormControl>
                      <SelectField
                        field={field}
                        options={FLAG_OPTIONS}
                        placeholder={tDns('form.placeholders.flags')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="digestType"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{tDns('form.fields.digestType')}</FormLabel>
                    <FormControl>
                      <SelectField
                        field={field}
                        options={DIGEST_TYPE_OPTIONS}
                        placeholder={tDns('form.placeholders.digestType')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="publicKey"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>{tDns('form.fields.publicKey')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className="font-mono text-xs w-full max-w-full"
                      placeholder="mdsswUyr3DPW132mOi8V/+T..."
                      {...field}
                    />
                  </FormControl>
                  {publicKeyMissingNotice && !field.value?.trim() ? (
                    <p className="text-xs text-amber-400 mt-1">
                      {tDns('form.publicKeyMissingNotice')}
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="digest"
              render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>{tDns('form.fields.digest')}</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      className="font-mono text-xs w-full max-w-full"
                      placeholder="2BB183AF5F22588179A53B0A98631FAD1A292118..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <ValidationResultPanel state={validation} tDns={tDns} />

        {ackInfo ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-start gap-2 text-sm text-zinc-300">
              <Checkbox
                id="ds-ack"
                checked={acknowledge}
                onCheckedChange={(checked) => setAcknowledge(checked === true)}
              />
              <label htmlFor="ds-ack" className="cursor-pointer">
                {ackInfo.label}
              </label>
            </div>
            {validationFailed ? (
              <p className="text-xs text-zinc-500 ms-6">
                {tDns('form.deferredNotice')}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
          <LoadingButton
            type="button"
            variant="secondary"
            isLoading={validateMutation.isPending}
            loadingText={tDns('form.validating')}
            onClick={handleValidate}
          >
            <ShieldAlertIcon className="w-4 h-4" />
            {tDns('form.validate')}
          </LoadingButton>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              {tCommon('actions.cancel')}
            </Button>
            <LoadingButton
              type="submit"
              isLoading={
                associateMutation.isPending || deferredMutation.isPending
              }
              loadingText={
                deferredMutation.isPending
                  ? tDns('form.scheduling')
                  : tDns('form.submitting')
              }
              disabled={submitDisabled}
            >
              {validationFailed
                ? tDns('form.scheduleDs')
                : tDns('form.submitDs')}
            </LoadingButton>
          </div>
        </div>
      </form>
    </Form>
  );
}

/**
 * The DS summary fields, computed once from the form values. Both the desktop
 * table rows and the mobile card rows render off this single list so the two
 * layouts can never drift.
 */
function summaryEntries(
  values: FormValues,
  tDns: DnsTranslator,
): Array<{ label: string; value: React.ReactNode }> {
  const algorithmLabel =
    SUPPORTED_ALGORITHMS.find((opt) => opt.value === values.algorithm)?.label ??
    String(values.algorithm);
  const flagsLabel =
    FLAG_OPTIONS.find((opt) => opt.value === values.flags)?.label ??
    String(values.flags);
  const digestTypeLabel =
    DIGEST_TYPE_OPTIONS.find((opt) => opt.value === values.digestType)?.label ??
    String(values.digestType);

  return [
    { label: tDns('form.fields.keyTag'), value: values.keyTag },
    { label: tDns('form.fields.algorithm'), value: algorithmLabel },
    { label: tDns('form.fields.flags'), value: flagsLabel },
    { label: tDns('form.fields.digestType'), value: digestTypeLabel },
    {
      label: tDns('form.fields.publicKey'),
      value: values.publicKey ? (
        <span
          className="font-mono break-all text-zinc-200"
          title={values.publicKey}
        >
          {truncateMiddle(values.publicKey, 64)}
        </span>
      ) : (
        <span className="italic text-amber-400">
          {tDns('form.summary.notSet')}
        </span>
      ),
    },
    {
      label: tDns('form.fields.digest'),
      value: values.digest ? (
        <span
          className="font-mono break-all text-zinc-200"
          title={values.digest}
        >
          {values.digest}
        </span>
      ) : (
        <span className="italic text-zinc-500">—</span>
      ),
    },
  ];
}

function DsSummaryTable({
  form,
  tDns,
}: {
  form: UseFormReturn<FormValues>;
  tDns: DnsTranslator;
}) {
  const isMobile = useIsMobile();
  const values = form.watch();
  const entries = summaryEntries(values, tDns);

  if (isMobile) {
    // Mobile: a labeled grouped list rendered from the SAME summary entries as
    // the desktop table — only the layout differs.
    return (
      <Card className="gap-0 overflow-hidden px-0 py-0 min-w-0">
        <dl className="divide-y divide-zinc-800 text-xs">
          {entries.map((entry) => (
            <div
              key={entry.label}
              className="flex items-start justify-between gap-3 p-2 min-w-0"
            >
              <dt className="shrink-0 pt-0.5 text-zinc-400">{entry.label}</dt>
              <dd className="flex min-w-0 flex-col items-end gap-0.5 text-end break-words">
                {entry.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    );
  }

  return (
    <div className="rounded-md border border-zinc-800 overflow-hidden min-w-0">
      {/* desktop-only table; mobile renders cards via useIsMobile above */}
      <table className="w-full text-xs" /* mobile-ok */>
        <tbody>
          {entries.map((entry) => (
            <SummaryRow key={entry.label} label={entry.label}>
              {entry.value}
            </SummaryRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-zinc-800 last:border-b-0">
      <td className="p-2 text-zinc-400 align-top w-32 shrink-0">{label}</td>
      <td className="p-2 min-w-0 break-words">{children}</td>
    </tr>
  );
}

function truncateMiddle(value: string, max: number): string {
  if (value.length <= max) return value;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function SelectField({
  field,
  options,
  placeholder,
}: {
  field: ControllerRenderProps<
    FormValues,
    'algorithm' | 'flags' | 'digestType'
  >;
  options: ReadonlyArray<{ value: number; label: string }>;
  placeholder: string;
}) {
  return (
    <Select
      value={field.value !== undefined ? String(field.value) : undefined}
      onValueChange={(value) => {
        if (value === null) return;
        field.onChange(Number(value));
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// --- Validation result rendering ----------------------------------------

const VALIDATION_LANE_VALUES = ['authoritative', 'public-dns'] as const;

function ValidationResultPanel({
  state,
  tDns,
}: {
  state: ValidationState;
  tDns: DnsTranslator;
}) {
  if (state.status === 'idle') return null;
  if (state.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 rounded-md p-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        {tDns('form.validation.pending')}
      </div>
    );
  }
  return (
    <Accordion
      multiple
      defaultValue={[] as string[]}
      className="flex flex-col gap-2 min-w-0"
    >
      <ValidationLane
        value="authoritative"
        title={tDns('form.validation.laneAuthoritative')}
        lane={state.result.authoritative}
        tDns={tDns}
      />
      <ValidationLane
        value="public-dns"
        title={tDns('form.validation.lanePublicDns')}
        lane={state.result.publicDns}
        tDns={tDns}
      />
    </Accordion>
  );
}

type LanePalette = {
  bg: string;
  border: string;
  triggerText: string;
  subtitleText: string;
  icon: React.ReactNode;
  statusLabel: string;
};

function pickPalette(
  lane: ValidateResult['authoritative'],
  tDns: DnsTranslator,
): LanePalette {
  if (lane.errorMessage) {
    return {
      bg: 'bg-red-950/40',
      border: 'border-red-900/50',
      triggerText: 'text-red-400',
      subtitleText: 'text-red-300/80',
      icon: <ShieldAlertIcon className="w-4 h-4 shrink-0" />,
      statusLabel: tDns('form.validation.statusCouldNotValidate'),
    };
  }
  if (lane.isValid) {
    return {
      bg: 'bg-green-950/30',
      border: 'border-green-900/50',
      triggerText: 'text-green-400',
      subtitleText: 'text-green-300/80',
      icon: <CheckCircle2Icon className="w-4 h-4 shrink-0" />,
      statusLabel: tDns('form.validation.statusMatch'),
    };
  }
  return {
    bg: 'bg-amber-950/30',
    border: 'border-amber-900/50',
    triggerText: 'text-amber-400',
    subtitleText: 'text-amber-300/80',
    icon: <ShieldAlertIcon className="w-4 h-4 shrink-0" />,
    statusLabel: tDns('form.validation.statusNoMatchingDnskey'),
  };
}

function ValidationLane({
  value,
  title,
  lane,
  tDns,
}: {
  value: string;
  title: string;
  lane: ValidateResult['authoritative'];
  tDns: DnsTranslator;
}) {
  const sourceLabel = lane.queriedSource.length
    ? lane.queriedSource.join(', ')
    : '—';
  const palette = pickPalette(lane, tDns);

  return (
    <AccordionItem
      value={value}
      className={cn(
        'rounded-md border min-w-0 not-last:border-b',
        palette.bg,
        palette.border,
      )}
    >
      <AccordionTrigger
        className={cn('px-3 py-2 hover:no-underline', palette.triggerText)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {palette.icon}
          <span className="font-medium truncate">{title}</span>
          <span className="text-xs opacity-80">— {palette.statusLabel}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-3 text-sm">
        {lane.errorMessage ? (
          <div className="flex flex-col gap-1 min-w-0">
            <p className={cn('text-xs break-words', palette.subtitleText)}>
              {lane.errorMessage}
            </p>
            <p className="text-xs text-zinc-500">
              {tDns('form.validation.queried', { source: sourceLabel })}
            </p>
          </div>
        ) : lane.isValid ? (
          <p className={cn('text-xs break-words', palette.subtitleText)}>
            {tDns('form.validation.matched', {
              keyTag: lane.matchedDnskey?.keyTag ?? '',
              source: sourceLabel,
            })}
          </p>
        ) : (
          <div className="flex flex-col gap-2 min-w-0">
            <p className={cn('text-xs break-words', palette.subtitleText)}>
              {tDns('form.validation.noMatch', { source: sourceLabel })}
            </p>
            {lane.publishedDnskeys.length > 0 ? (
              <PublishedDnskeysList
                dnskeys={lane.publishedDnskeys}
                tDns={tDns}
              />
            ) : null}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

type PublishedDnskey =
  ValidateResult['authoritative']['publishedDnskeys'][number];

/**
 * The diagnostic list of published DNSKEYs whose digest didn't match. Desktop
 * keeps the compact table; mobile renders the SAME rows as a labeled card stack
 * (the wide computed-digest column overflows a phone otherwise).
 */
function PublishedDnskeysList({
  dnskeys,
  tDns,
}: {
  dnskeys: PublishedDnskey[];
  tDns: DnsTranslator;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {dnskeys.map((d) => (
          <div
            key={d.publicKey}
            className="rounded-md border border-zinc-800 bg-zinc-900/40 p-2 text-xs text-zinc-300 font-mono"
          >
            <dl className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-zinc-500">
                  {tDns('form.validation.tableFlags')}
                </dt>
                <dd className="text-end">{d.flags}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-zinc-500">
                  {tDns('form.validation.tableAlg')}
                </dt>
                <dd className="text-end">{d.algorithm}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-zinc-500">
                  {tDns('form.validation.tableComputedKeyTag')}
                </dt>
                <dd className="text-end">{d.computedKeyTag}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-zinc-500">
                  {tDns('form.validation.tableComputedDigest')}
                </dt>
                <dd className="break-all" title={d.computedDigest}>
                  {d.computedDigest}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-xs text-zinc-300 overflow-x-auto">
      {/* desktop-only table; mobile renders cards via useIsMobile above */}
      <table className="w-full font-mono" /* mobile-ok */>
        <thead className="text-zinc-500">
          <tr>
            <th className="text-start pe-3">
              {tDns('form.validation.tableFlags')}
            </th>
            <th className="text-start pe-3">
              {tDns('form.validation.tableAlg')}
            </th>
            <th className="text-start pe-3">
              {tDns('form.validation.tableComputedKeyTag')}
            </th>
            <th className="text-start">
              {tDns('form.validation.tableComputedDigest')}
            </th>
          </tr>
        </thead>
        <tbody>
          {dnskeys.map((d) => (
            <tr key={d.publicKey}>
              <td className="pe-3">{d.flags}</td>
              <td className="pe-3">{d.algorithm}</td>
              <td className="pe-3">{d.computedKeyTag}</td>
              <td className="truncate max-w-[20ch]" title={d.computedDigest}>
                {d.computedDigest}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Acknowledgement copy -----------------------------------------------

function buildAckInfo(
  state: ValidationState,
  tDns: DnsTranslator,
): { label: string } | null {
  if (state.status !== 'done') return null;
  const auth = state.result.authoritative;
  const pub = state.result.publicDns;
  // Treat "errored" lanes as not-valid for ack purposes.
  if (!auth.isValid) {
    return { label: tDns('form.ack.validationDidNotPass') };
  }
  if (auth.isValid && pub.isValid) {
    return { label: tDns('form.ack.sure') };
  }
  return { label: tDns('form.ack.notFullyReflected') };
}
