'use client';

import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Form } from '@namefi-astra/ui/components/shadcn/form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  getAiGenerationCreditCost,
  type AiGenerationCreditType,
} from '@namefi-astra/common/ai-generation-credits';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  useForm,
  useWatch,
  type UseFormReturn,
  type DefaultValues,
  type FieldPath,
  type Resolver,
} from 'react-hook-form';
import { z } from 'zod';
import { DomainField, DescriptionField } from './form-fields';
import { GenerateSubmitButton } from './submit-button';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { Generation } from './types';
import { toast } from 'sonner';

const domainInputSchema = z
  .string()
  .trim()
  .transform((val) => val.toLowerCase())
  .pipe(namefiNormalizedDomainSchema);

// Base form schema with domain and description
export const baseFormSchema = z.object({
  domain: domainInputSchema,
  description: z.string().optional(),
});

export type BaseFormInput = z.input<typeof baseFormSchema>;
export type BaseFormOutput = z.output<typeof baseFormSchema>;
export type BaseFormData = BaseFormOutput;

type BaseGeneratorSchema = z.ZodTypeAny;
type BaseGeneratorInput<TSchema extends BaseGeneratorSchema> =
  z.input<TSchema> & BaseFormInput;
type BaseGeneratorOutput<TSchema extends BaseGeneratorSchema> =
  z.output<TSchema> & BaseFormOutput;
type CreditCostConfig<TValues> = {
  type: AiGenerationCreditType;
  getMode?: (values: Partial<TValues>) => string | undefined;
  getModel?: (values: Partial<TValues>) => string | undefined;
};

interface BaseGeneratorProps<TSchema extends BaseGeneratorSchema> {
  onSubmit: (data: BaseGeneratorOutput<TSchema>) => void;
  isLoading?: boolean;
  disabled?: boolean;
  fixedDomain?: NamefiNormalizedDomain;
  formSchema: TSchema;
  defaultValues: DefaultValues<BaseGeneratorInput<TSchema>>;
  children?: (props: {
    form: UseFormReturn<
      BaseGeneratorInput<TSchema>,
      unknown,
      BaseGeneratorOutput<TSchema>
    >;
    openPanel: string | null;
    setOpenPanel: (panel: string | null) => void;
    domainToUse: string;
  }) => ReactNode;
  submitButtonText?: string;
  submitLoadingText?: string;
  className?: string;
  latestGeneration?: Generation;
  onGenerateMore?: () => void;
  domainPlaceholder?: string;
  domainSelectOnly?: boolean;
  domainOnlyDomainsWithLogos?: boolean;
  onDomainChange?: (domain: string) => void;
  onFormReady?: (
    form: UseFormReturn<
      BaseGeneratorInput<TSchema>,
      unknown,
      BaseGeneratorOutput<TSchema>
    >,
  ) => void;
  onPosterRequest?: (generation: Generation) => void;
  creditCostConfig?: CreditCostConfig<BaseGeneratorInput<TSchema>>;
}

export function BaseGenerator<TSchema extends BaseGeneratorSchema>({
  onSubmit,
  isLoading,
  disabled,
  fixedDomain,
  formSchema,
  defaultValues,
  children,
  submitButtonText = 'Generate',
  submitLoadingText = 'Generating',
  className = 'max-w-6xl mx-auto flex flex-col',
  domainPlaceholder,
  domainSelectOnly = false,
  domainOnlyDomainsWithLogos = false,
  onDomainChange,
  onFormReady,
  creditCostConfig,
}: BaseGeneratorProps<TSchema>) {
  type FormInput = BaseGeneratorInput<TSchema>;
  type FormOutput = BaseGeneratorOutput<TSchema>;
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const trpc = useTRPC();
  const {
    data: usageData,
    isLoading: isUsageLoading,
    isError: isUsageError,
  } = useQuery({
    ...trpc.ai.getUserGenerationUsage.queryOptions(),
  });

  const usageErrorNotifiedRef = useRef(false);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(
      formSchema as unknown as z.ZodType<FormOutput, FormInput>,
    ) as Resolver<FormInput, unknown, FormOutput>,
    defaultValues: {
      ...defaultValues,
      domain: fixedDomain || defaultValues.domain,
    } as DefaultValues<FormInput>,
    mode: 'onChange',
    reValidateMode: 'onChange',
  });
  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    if (isUsageError && !usageErrorNotifiedRef.current) {
      usageErrorNotifiedRef.current = true;
      toast.error('Unable to check AI credit balance', {
        description:
          'We could not verify your remaining credits, but you can still try generating assets.',
      });
    }
  }, [isUsageError]);

  useEffect(() => {
    if (onFormReady) onFormReady(form);
  }, [onFormReady, form]);

  const handleSubmit = (data: FormOutput) => {
    const domainToUse = fixedDomain || data.domain;

    onSubmit({
      ...data,
      domain: domainToUse,
    });
  };

  const domainToUse =
    fixedDomain || form.watch('domain' as FieldPath<FormInput>);

  useEffect(() => {
    if (onDomainChange && typeof domainToUse === 'string') {
      onDomainChange(domainToUse);
    }
  }, [onDomainChange, domainToUse]);

  // Check if user has reached the monthly limit
  const isLimitReached = usageData?.hasReachedLimit ?? false;
  const estimatedCreditCost =
    usageData && creditCostConfig
      ? getAiGenerationCreditCost({
          creditCosts: usageData.creditCosts,
          type: creditCostConfig.type,
          mode: creditCostConfig.getMode?.(watchedValues as Partial<FormInput>),
          model: creditCostConfig.getModel?.(
            watchedValues as Partial<FormInput>,
          ),
        })
      : undefined;
  const isInsufficientCredits =
    usageData && estimatedCreditCost !== undefined
      ? estimatedCreditCost > usageData.remainingCredits
      : false;
  const isDisabled =
    !form.formState.isValid ||
    disabled ||
    isLimitReached ||
    isInsufficientCredits ||
    isUsageLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        <Card>
          <CardContent>
            {/* Domain Input */}
            <DomainField
              control={form.control}
              name={'domain' as FieldPath<FormInput>}
              fixedDomain={fixedDomain}
              placeholder={domainPlaceholder}
              selectOnly={domainSelectOnly}
              onlyDomainsWithLogos={domainOnlyDomainsWithLogos}
            />

            {/* Custom content from children */}
            {children?.({
              form,
              openPanel,
              setOpenPanel,
              domainToUse: domainToUse as string,
            })}

            {/* Description Field - Conditional based on openPanel */}
            {openPanel === 'description' && (
              <DescriptionField
                control={form.control}
                name={'description' as FieldPath<FormInput>}
              />
            )}
          </CardContent>
        </Card>

        <GenerationCreditCostPreview
          isLoading={isUsageLoading}
          isError={isUsageError}
          requestedCredits={estimatedCreditCost}
          remainingCredits={usageData?.remainingCredits}
        />

        {/* Submit Button */}
        <GenerateSubmitButton
          isLoading={isLoading}
          disabled={isDisabled}
          buttonText={submitButtonText}
          loadingText={submitLoadingText}
        />
      </form>
    </Form>
  );
}

function formatAiCredits(credits: number) {
  return `${credits} AI ${credits === 1 ? 'credit' : 'credits'}`;
}

function GenerationCreditCostPreview({
  isLoading,
  isError,
  requestedCredits,
  remainingCredits,
}: {
  isLoading: boolean;
  isError: boolean;
  requestedCredits?: number;
  remainingCredits?: number;
}) {
  if (isLoading) {
    return (
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Checking AI credit balance...
      </p>
    );
  }

  if (
    isError ||
    requestedCredits === undefined ||
    remainingCredits === undefined
  ) {
    return (
      <p className="mt-5 text-center text-sm text-muted-foreground">
        We will check your AI credit balance before generation starts.
      </p>
    );
  }

  const remainingAfterGeneration = remainingCredits - requestedCredits;

  if (remainingAfterGeneration < 0) {
    return (
      <p className="mt-5 text-center text-sm text-destructive">
        This generation needs {formatAiCredits(requestedCredits)}. You have{' '}
        {formatAiCredits(remainingCredits)} left this month.
      </p>
    );
  }

  return (
    <p className="mt-5 text-center text-sm text-muted-foreground">
      This generation costs {formatAiCredits(requestedCredits)}. You will have{' '}
      {formatAiCredits(remainingAfterGeneration)} left this month.
    </p>
  );
}
