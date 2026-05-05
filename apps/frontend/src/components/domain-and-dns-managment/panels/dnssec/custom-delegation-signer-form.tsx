'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  type SubmitHandler,
  useForm,
  type ControllerRenderProps,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2Icon, Loader2, ShieldAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { LoadingButton } from '@/components/buttons/loading-button';
import { useTRPC } from '@/lib/trpc';
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

type ValidationState =
  | { status: 'idle' }
  | { status: 'pending' }
  | {
      status: 'done';
      isValid: boolean;
      matchedKeyTag?: number;
      matchedNs?: string;
      publishedDnskeys: Array<{
        flags: number;
        algorithm: number;
        publicKey: string;
        computedKeyTag: number;
        computedDigest: string;
        matchesProvided: boolean;
      }>;
      nameserversQueried: string[];
      errorMessage?: string;
    };

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

  const [inputMode, setInputMode] = useState<'paste-dnskey' | 'enter-ds'>(
    'paste-dnskey',
  );
  const [dnskeyText, setDnskeyText] = useState('');
  const [validation, setValidation] = useState<ValidationState>({
    status: 'idle',
  });
  const [acknowledgeMismatch, setAcknowledgeMismatch] = useState(false);

  // Reset validation whenever the user edits any DS field that contributes
  // to it. `form.watch(callback)` returns a subscription that fires on
  // every value change without re-running the effect on every render.
  useEffect(() => {
    const subscription = form.watch(() => {
      setValidation({ status: 'idle' });
      setAcknowledgeMismatch(false);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const deriveMutation = useMutation(
    trpc.domainConfig.dnssec.deriveDsFromDnskey.mutationOptions({
      onSuccess(result) {
        form.setValue('keyTag', result.keyTag, { shouldValidate: true });
        form.setValue('algorithm', result.algorithm, { shouldValidate: true });
        form.setValue('flags', result.flags, { shouldValidate: true });
        form.setValue('publicKey', result.publicKey, { shouldValidate: true });
        form.setValue('digestType', result.digestType, {
          shouldValidate: true,
        });
        form.setValue('digest', result.digest, { shouldValidate: true });
        setInputMode('enter-ds');
        toast.success('DS fields populated from DNSKEY');
      },
      onError(error) {
        toast.error(`Could not parse DNSKEY: ${error.message}`);
      },
    }),
  );

  const validateMutation = useMutation(
    trpc.domainConfig.dnssec.validateDelegationSigner.mutationOptions({
      onSuccess(result) {
        const matched = result.publishedDnskeys.find((d) => d.matchesProvided);
        setValidation({
          status: 'done',
          isValid: result.isValid,
          matchedKeyTag: matched?.computedKeyTag,
          matchedNs: result.nameserversQueried[0],
          publishedDnskeys: result.publishedDnskeys,
          nameserversQueried: result.nameserversQueried,
          errorMessage: result.errorMessage,
        });
      },
      onError(error) {
        setValidation({
          status: 'done',
          isValid: false,
          publishedDnskeys: [],
          nameserversQueried: [],
          errorMessage: error.message,
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

  const submitDisabled = useMemo(() => {
    if (associateMutation.isPending) return true;
    if (validation.status !== 'done') return true;
    if (validation.isValid) return false;
    return !acknowledgeMismatch;
  }, [associateMutation.isPending, validation, acknowledgeMismatch]);

  const handleDeriveFromDnskey = () => {
    const trimmed = dnskeyText.trim();
    if (trimmed.length === 0) {
      toast.error('Paste a DNSKEY record first');
      return;
    }
    deriveMutation.mutate({
      domainName,
      dnskeyRecord: trimmed,
      digestType: form.getValues('digestType'),
    });
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
        className="flex flex-col gap-4"
      >
        <Tabs
          value={inputMode}
          onValueChange={(value) =>
            setInputMode(value as 'paste-dnskey' | 'enter-ds')
          }
        >
          <TabsList>
            <TabsTrigger value="paste-dnskey">Paste DNSKEY</TabsTrigger>
            <TabsTrigger value="enter-ds">Enter DS fields</TabsTrigger>
          </TabsList>

          <TabsContent value="paste-dnskey" className="flex flex-col gap-3">
            <p className="text-sm text-zinc-400">
              Paste the full DNSKEY record from your DNS provider. We'll derive
              the matching DS values for the digest type selected below.
            </p>
            <Textarea
              value={dnskeyText}
              onChange={(e) => setDnskeyText(e.target.value)}
              placeholder={`${domainName}. 3600 IN DNSKEY 257 3 13 mdsswUyr3...`}
              rows={4}
              className="font-mono text-xs"
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-zinc-500">
                Accepts full record or just the rdata (flags protocol algorithm
                publicKey).
              </p>
              <LoadingButton
                type="button"
                variant="secondary"
                isLoading={deriveMutation.isPending}
                loadingText="Deriving..."
                onClick={handleDeriveFromDnskey}
                disabled={dnskeyText.trim().length === 0}
              >
                Derive DS fields
              </LoadingButton>
            </div>
          </TabsContent>

          <TabsContent value="enter-ds" className="text-sm text-zinc-400">
            Edit the DS fields below directly. Use this when your DNS provider
            shows DS values rather than DNSKEY.
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="keyTag"
            render={({ field }) => (
              <FormItem>
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
              <FormItem>
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
              <FormItem>
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
              <FormItem>
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
            <FormItem>
              <FormLabel>Public key (base64)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  className="font-mono text-xs"
                  placeholder="mdsswUyr3DPW132mOi8V/+T..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="digest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Digest (hex)</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  className="font-mono text-xs"
                  placeholder="2BB183AF5F22588179A53B0A98631FAD1A292118..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ValidationResult state={validation} />

        {validation.status === 'done' && !validation.isValid ? (
          <div className="flex items-start gap-2 text-sm text-zinc-300">
            <Checkbox
              id="ds-mismatch-ack"
              checked={acknowledgeMismatch}
              onCheckedChange={(checked) =>
                setAcknowledgeMismatch(checked === true)
              }
            />
            <label htmlFor="ds-mismatch-ack" className="cursor-pointer">
              I understand validation didn't pass and want to associate this DS
              anyway (e.g. staging before flipping nameservers).
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
            Validate against published DNSKEY
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

function ValidationResult({ state }: { state: ValidationState }) {
  if (state.status === 'idle') return null;
  if (state.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-800/50 rounded-md p-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Querying DNSKEY records at authoritative nameservers...
      </div>
    );
  }
  if (state.errorMessage) {
    return (
      <div className="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-md p-3">
        <ShieldAlertIcon className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Could not validate</p>
          <p className="text-xs text-red-300/80 mt-1">{state.errorMessage}</p>
        </div>
      </div>
    );
  }
  if (state.isValid) {
    return (
      <div className="flex items-start gap-2 text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-md p-3">
        <CheckCircle2Icon className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">
            Matches DNSKEY published at {state.matchedNs}
          </p>
          <p className="text-xs text-green-300/80 mt-1">
            Computed key tag: {state.matchedKeyTag}. Safe to submit.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 text-sm text-amber-400 bg-amber-950/30 border border-amber-900/50 rounded-md p-3">
      <div className="flex items-start gap-2">
        <ShieldAlertIcon className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">No matching DNSKEY found</p>
          <p className="text-xs text-amber-300/80 mt-1">
            None of the DNSKEYs published at your nameservers produces the
            digest you entered. Compare the values below.
          </p>
        </div>
      </div>
      {state.publishedDnskeys.length > 0 ? (
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
              {state.publishedDnskeys.map((d) => (
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
