'use client';

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
import type { PunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Checkbox } from '@namefi-astra/ui/components/shadcn/checkbox';
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

  const deriveMutation = useMutation(
    trpc.domainConfig.dnssec.deriveDelegationSigner.mutationOptions({
      onSuccess(result, variables) {
        if (result.candidates.length === 0) {
          toast.error('No DS or DNSKEY could be derived from input');
          return;
        }
        // Auto-detect mode tracks all candidates so user can switch.
        if (!variables.text) {
          setAutoDetectCandidates(result.candidates);
          setSelectedCandidateIdx(0);
          populateFromCandidate(result.candidates[0]);
          if (result.candidates.length > 1) {
            toast.info(
              `${result.candidates.length} KSKs published — pick one below.`,
            );
          } else {
            toast.success(
              `DNSKEY found (key tag ${result.candidates[0].keyTag})`,
            );
          }
          return;
        }
        // Manual paste — always one candidate.
        setAutoDetectCandidates([]);
        populateFromCandidate(result.candidates[0]);
        if (result.candidates[0].publicKey === '') {
          toast.success('DS fields populated. Public key still required.');
        } else {
          toast.success('Form populated from pasted record');
        }
      },
      onError(error) {
        toast.error(error.message);
      },
    }),
  );

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

  const associateMutation = useMutation(
    trpc.domainConfig.dnssec.associateDelegationSigner.mutationOptions({
      async onSuccess() {
        toast.success('Delegation signer associated');
        await queryClient.invalidateQueries({
          queryKey: trpc.domainConfig.dnssec.getDomainDnssecDetails.queryKey({
            domainName,
          }),
        });
        onSuccess();
      },
      onError(error) {
        toast.error(`Failed to associate delegation signer: ${error.message}`);
      },
    }),
  );

  const ackInfo = useMemo(() => buildAckInfo(validation), [validation]);

  const submitDisabled = useMemo(() => {
    if (associateMutation.isPending) return true;
    if (validation.status !== 'done') return true;
    return !acknowledge;
  }, [associateMutation.isPending, validation.status, acknowledge]);

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
    if (candidate) populateFromCandidate(candidate);
  };

  const handleValidate = async () => {
    const isFormValid = await form.trigger();
    if (!isFormValid) {
      toast.error('Fix the form errors before validating');
      return;
    }
    setValidation({ status: 'pending' });
    const values = form.getValues();
    validateMutation.mutate({
      domainName,
      signingConfig: {
        algorithm: values.algorithm,
        publicKey: values.publicKey,
        flags: values.flags,
        keyTag: values.keyTag,
        digestType: values.digestType,
        digest: values.digest,
      },
    });
  };

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    associateMutation.mutate({
      domainName,
      signingConfig: {
        algorithm: values.algorithm,
        publicKey: values.publicKey,
        flags: values.flags,
        keyTag: values.keyTag,
        digestType: values.digestType,
        digest: values.digest,
      },
    });
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
            <TabsTrigger value="auto-detect">Automatic Detection</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="flex flex-col gap-3 min-w-0">
            <p className="text-sm text-zinc-400">
              Paste a DNSKEY or DS record (full zone-file line or just rdata).
              We'll auto-detect the format.
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
                loadingText="Deriving..."
                onClick={handleManualDerive}
                disabled={pastedText.trim().length === 0}
              >
                Derive DS fields
              </LoadingButton>
            </div>
          </TabsContent>

          <TabsContent
            value="auto-detect"
            className="flex flex-col gap-3 min-w-0"
          >
            <p className="text-sm text-zinc-400">
              Query your domain's authoritative nameservers and pick the KSK
              DNSKEY (flags 257). The form below will be populated
              automatically.
            </p>
            <div className="flex items-center justify-between gap-2">
              <LoadingButton
                type="button"
                variant="secondary"
                isLoading={deriveMutation.isPending}
                loadingText="Detecting..."
                onClick={handleAutoDetect}
              >
                <RadarIcon className="w-4 h-4" />
                Detect from authoritative nameservers
              </LoadingButton>
              {autoDetectCandidates.length > 1 ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-zinc-400 shrink-0">
                    KSK candidate
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
                          key tag {candidate.keyTag} — alg {candidate.algorithm}
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
          <h3 className="text-sm font-medium">DS values</h3>
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
                Edit
              </>
            ) : (
              <>
                <EyeIcon className="w-4 h-4" />
                View summary
              </>
            )}
          </Button>
        </div>

        {viewMode === 'summary' ? (
          <DsSummaryTable form={form} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <FormField
                control={form.control}
                name="keyTag"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Key tag</FormLabel>
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
                    <FormLabel>Algorithm</FormLabel>
                    <FormControl>
                      <SelectField
                        field={field}
                        options={SUPPORTED_ALGORITHMS}
                        placeholder="Select algorithm"
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
                    <FormLabel>Flags</FormLabel>
                    <FormControl>
                      <SelectField
                        field={field}
                        options={FLAG_OPTIONS}
                        placeholder="Select flag"
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
                    <FormLabel>Digest type</FormLabel>
                    <FormControl>
                      <SelectField
                        field={field}
                        options={DIGEST_TYPE_OPTIONS}
                        placeholder="Select digest type"
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
                  <FormLabel>Public key (base64)</FormLabel>
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
                      Public key not present in the pasted DS. Use{' '}
                      <span className="font-medium">Automatic Detection</span>{' '}
                      or paste the DNSKEY record so we can submit to the
                      registrar.
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
                  <FormLabel>Digest (hex)</FormLabel>
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

        <ValidationResultPanel state={validation} />

        {ackInfo ? (
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
        ) : null}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
          <LoadingButton
            type="button"
            variant="secondary"
            isLoading={validateMutation.isPending}
            loadingText="Validating..."
            onClick={handleValidate}
          >
            <ShieldAlertIcon className="w-4 h-4" />
            Validate
          </LoadingButton>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              isLoading={associateMutation.isPending}
              loadingText="Submitting..."
              disabled={submitDisabled}
            >
              Submit DS
            </LoadingButton>
          </div>
        </div>
      </form>
    </Form>
  );
}

function DsSummaryTable({ form }: { form: UseFormReturn<FormValues> }) {
  const values = form.watch();
  const algorithmLabel =
    SUPPORTED_ALGORITHMS.find((opt) => opt.value === values.algorithm)?.label ??
    String(values.algorithm);
  const flagsLabel =
    FLAG_OPTIONS.find((opt) => opt.value === values.flags)?.label ??
    String(values.flags);
  const digestTypeLabel =
    DIGEST_TYPE_OPTIONS.find((opt) => opt.value === values.digestType)?.label ??
    String(values.digestType);

  return (
    <div className="rounded-md border border-zinc-800 overflow-hidden min-w-0">
      <table className="w-full text-xs">
        <tbody>
          <SummaryRow label="Key tag">{values.keyTag}</SummaryRow>
          <SummaryRow label="Algorithm">{algorithmLabel}</SummaryRow>
          <SummaryRow label="Flags">{flagsLabel}</SummaryRow>
          <SummaryRow label="Digest type">{digestTypeLabel}</SummaryRow>
          <SummaryRow label="Public key">
            {values.publicKey ? (
              <span
                className="font-mono break-all text-zinc-200"
                title={values.publicKey}
              >
                {truncateMiddle(values.publicKey, 64)}
              </span>
            ) : (
              <span className="italic text-amber-400">not set</span>
            )}
          </SummaryRow>
          <SummaryRow label="Digest">
            {values.digest ? (
              <span
                className="font-mono break-all text-zinc-200"
                title={values.digest}
              >
                {values.digest}
              </span>
            ) : (
              <span className="italic text-zinc-500">—</span>
            )}
          </SummaryRow>
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

function ValidationResultPanel({ state }: { state: ValidationState }) {
  if (state.status === 'idle') return null;
  if (state.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 rounded-md p-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Querying DNSKEY records at authoritative nameservers and public DNS...
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <ValidationLane
        title="Authoritative nameservers"
        lane={state.result.authoritative}
      />
      <ValidationLane
        title="Public DNS (Google)"
        lane={state.result.publicDns}
      />
    </div>
  );
}

function ValidationLane({
  title,
  lane,
}: {
  title: string;
  lane: ValidateResult['authoritative'];
}) {
  const sourceLabel = lane.queriedSource.length
    ? lane.queriedSource.join(', ')
    : '—';

  if (lane.errorMessage) {
    return (
      <div className="flex flex-col gap-1 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md p-3 min-w-0">
        <div className="flex items-start gap-2">
          <ShieldAlertIcon className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">{title} — could not validate</p>
            <p className="text-xs text-red-300/80 mt-1 break-words">
              {lane.errorMessage}
            </p>
            <p className="text-xs text-zinc-500 mt-1">Queried: {sourceLabel}</p>
          </div>
        </div>
      </div>
    );
  }

  if (lane.isValid) {
    return (
      <div className="flex items-start gap-2 text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-md p-3 min-w-0">
        <CheckCircle2Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">{title} — match</p>
          <p className="text-xs text-green-300/80 mt-1 break-words">
            Computed key tag {lane.matchedDnskey?.keyTag}. Source: {sourceLabel}
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded-md p-3 min-w-0">
      <div className="flex items-start gap-2">
        <ShieldAlertIcon className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">{title} — no matching DNSKEY</p>
          <p className="text-xs text-amber-300/80 mt-1 break-words">
            None of the published DNSKEYs at {sourceLabel} produces the digest
            you entered.
          </p>
        </div>
      </div>
      {lane.publishedDnskeys.length > 0 ? (
        <div className="text-xs text-zinc-300 mt-1 overflow-x-auto">
          <table className="w-full font-mono">
            <thead className="text-zinc-500">
              <tr>
                <th className="text-left pr-3">Flags</th>
                <th className="text-left pr-3">Alg</th>
                <th className="text-left pr-3">Computed key tag</th>
                <th className="text-left">Computed digest</th>
              </tr>
            </thead>
            <tbody>
              {lane.publishedDnskeys.map((d) => (
                <tr key={d.publicKey}>
                  <td className="pr-3">{d.flags}</td>
                  <td className="pr-3">{d.algorithm}</td>
                  <td className="pr-3">{d.computedKeyTag}</td>
                  <td
                    className="truncate max-w-[20ch]"
                    title={d.computedDigest}
                  >
                    {d.computedDigest}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

// --- Acknowledgement copy -----------------------------------------------

function buildAckInfo(state: ValidationState): { label: string } | null {
  if (state.status !== 'done') return null;
  const auth = state.result.authoritative;
  const pub = state.result.publicDns;
  // Treat "errored" lanes as not-valid for ack purposes.
  if (!auth.isValid) {
    return {
      label:
        "I understand validation didn't pass and want to associate this DS anyway (e.g. staging before flipping nameservers).",
    };
  }
  if (auth.isValid && pub.isValid) {
    return { label: "I'm sure, associate this DS." };
  }
  return {
    label:
      'I understand that DNSKEY has not fully reflect in all regions and some regions might have a slight downtime after this change. I want to associate this DS anyway.',
  };
}
