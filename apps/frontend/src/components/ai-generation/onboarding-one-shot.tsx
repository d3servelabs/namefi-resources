/** biome-ignore-all lint/performance/noImgElement: using plain img in onboarding preview */
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { useState } from 'react';
import {
  BaseGenerator,
  baseFormSchema,
  type BaseFormData,
} from './shared/base-generator';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  useLogoGeneration,
  usePosterGeneration,
} from './shared/generation-hooks';
import { GenerationUsage } from '@/components/ai-generation/generation-usage';
import { toast } from 'sonner';

type OnboardingFormData = BaseFormData;

export function AIOnboardingOneShot({
  onFinishAction,
}: {
  onFinishAction?: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const logoMutation = useLogoGeneration({ domain: undefined });
  const posterMutation = usePosterGeneration({ domain: undefined });

  const defaultValues: OnboardingFormData = {
    domain: '' as NamefiNormalizedDomain,
    description: '',
  };

  const handleCreateBrand = async (values: OnboardingFormData) => {
    if (!values.domain) return;

    setIsGenerating(true);
    const logoPayload = {
      domain: values.domain as NamefiNormalizedDomain,
      type: 'let-ai-choose',
      style: 'let-ai-choose',
      description: values.description || undefined,
      model: 'gpt-image-1' as const,
    };
    const marketingPayload = {
      domain: values.domain as NamefiNormalizedDomain,
      description: values.description || undefined,
      collateralType: 'let_ai_choose' as const,
      model: 'gemini-2.5-flash-image-preview' as const,
    };

    try {
      const logo = await logoMutation.mutateAsync(logoPayload);
      await posterMutation.mutateAsync({
        ...marketingPayload,
        referenceLogoGenerationId: logo.id,
      });
      toast.success('Brand assets generated', {
        description: 'Check the gallery to see your new logo and poster.',
      });
      if (onFinishAction) onFinishAction();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Please try again later.';
      toast.error('Failed to generate brand assets', { description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Start with one-click brand setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            We will generate a logo and a marketing image with smart defaults.
            You can refine more afterwards.
          </p>

          <GenerationUsage className="mb-6" />
          <BaseGenerator<OnboardingFormData>
            onSubmit={(values) => {
              void handleCreateBrand(values);
            }}
            isLoading={isGenerating}
            disabled={isGenerating}
            formSchema={baseFormSchema}
            defaultValues={defaultValues}
            submitButtonText="Generate my brand"
            submitLoadingText="Generating..."
            domainPlaceholder="Enter or select your brand domain"
          />
        </CardContent>
      </Card>
    </div>
  );
}
