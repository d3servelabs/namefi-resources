'use client';

import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Form } from '@/components/ui/shadcn/form';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import {
  useForm,
  type UseFormReturn,
  type FieldValues,
  type DefaultValues,
  type FieldPath,
} from 'react-hook-form';
import { z } from 'zod';
import { DomainField, DescriptionField } from './form-fields';
import { GenerateSubmitButton } from './submit-button';

// Base form schema with domain and description
export const baseFormSchema = z.object({
  domain: z.string().min(1),
  description: z.string().optional(),
});

export type BaseFormData = z.infer<typeof baseFormSchema>;

interface BaseGeneratorProps<T extends FieldValues & BaseFormData> {
  onSubmit: (data: T) => void;
  isLoading?: boolean;
  fixedDomain?: string;
  formSchema: z.ZodSchema<any>;
  defaultValues: DefaultValues<T>;
  children?: (props: {
    form: UseFormReturn<T>;
    openPanel: string | null;
    setOpenPanel: (panel: string | null) => void;
    domainToUse: string;
  }) => ReactNode;
  submitButtonText?: string;
  submitLoadingText?: string;
  className?: string;
}

export function BaseGenerator<T extends FieldValues & BaseFormData>({
  onSubmit,
  isLoading,
  fixedDomain,
  formSchema,
  defaultValues,
  children,
  submitButtonText = 'Generate',
  submitLoadingText = 'Generating',
  className = 'max-w-6xl mx-auto flex flex-col',
}: BaseGeneratorProps<T>) {
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
      domain: fixedDomain || defaultValues.domain,
    } as DefaultValues<T>,
  });

  const handleSubmit = (data: T) => {
    const domainToUse = fixedDomain || data.domain;
    if (domainToUse?.trim()) {
      onSubmit({
        ...data,
        domain: domainToUse,
      });
    }
  };

  const domainToUse = fixedDomain || form.watch('domain' as any);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className={className}>
        <Card>
          <CardContent>
            {/* Domain Input */}
            <DomainField
              control={form.control}
              name={'domain' as FieldPath<T>}
              fixedDomain={fixedDomain}
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
                name={'description' as FieldPath<T>}
              />
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <GenerateSubmitButton
          isLoading={isLoading}
          disabled={!form.formState.isValid}
          buttonText={submitButtonText}
          loadingText={submitLoadingText}
        />
      </form>
    </Form>
  );
}
