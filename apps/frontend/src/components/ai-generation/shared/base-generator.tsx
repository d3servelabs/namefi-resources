'use client';

import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Form } from '@/components/ui/shadcn/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  useForm,
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

  useEffect(() => {
    if (isUsageError && !usageErrorNotifiedRef.current) {
      usageErrorNotifiedRef.current = true;
      toast.error('Unable to check AI usage limits', {
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
  const isDisabled =
    !form.formState.isValid || disabled || isLimitReached || isUsageLoading;

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
