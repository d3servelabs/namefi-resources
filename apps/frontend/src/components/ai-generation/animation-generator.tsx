/** biome-ignore-all lint/performance/noImgElement: using plain img for grid thumbnails and simplicity */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { z } from 'zod';
import {
  ANIMATION_MODELS,
  ANIMATION_MODEL_IDS,
  ANIMATION_MOTION_PRESETS,
  ANIMATION_MOTION_PRESET_IDS,
  type AnimationModel,
  type AnimationMotionPresetInput,
} from '@namefi-astra/ai/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { cn } from '@/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { BaseGenerator, baseFormSchema } from './shared/base-generator';
import { ControlPanel } from './shared/form-fields';
import type { Generation } from './shared/types';

const animationFormSchema = baseFormSchema.extend({
  selectedLogoId: z.string().uuid(),
  motionPreset: z
    .enum(ANIMATION_MOTION_PRESET_IDS)
    .default('let-ai-choose' satisfies AnimationMotionPresetInput),
  model: z
    .enum(ANIMATION_MODEL_IDS)
    .default('veo-3.1-generate-preview' satisfies AnimationModel),
});

type AnimationFormInput = z.input<typeof animationFormSchema>;
type AnimationFormData = z.output<typeof animationFormSchema>;

export type { AnimationFormData };

interface AnimationGeneratorProps {
  onGenerate: (data: AnimationFormData) => void;
  isLoading?: boolean;
  fixedDomain?: NamefiNormalizedDomain;
  availableLogos?: Generation[];
  latestGeneration?: Generation;
  onGenerateMore?: () => void;
  initialSelectedLogoId?: string;
}

export function AnimationGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
  availableLogos = [],
  latestGeneration,
  onGenerateMore,
  initialSelectedLogoId,
}: AnimationGeneratorProps) {
  const [selectedDomain, setSelectedDomain] = useState<
    NamefiNormalizedDomain | ''
  >(fixedDomain ?? '');
  const trpc = useTRPC();
  const formRef = useRef<UseFormReturn<
    AnimationFormInput,
    unknown,
    AnimationFormData
  > | null>(null);
  const activeDomain = fixedDomain ?? selectedDomain;

  const defaultValues = useMemo(
    () => ({
      domain: fixedDomain || '',
      description: '',
      selectedLogoId: '',
      motionPreset: 'let-ai-choose' as const,
      model: 'veo-3.1-generate-preview' as const,
    }),
    [fixedDomain],
  );

  const { data: domainLogos = [] } = useQuery({
    ...trpc.ai.getGenerationsByType.queryOptions({
      domain: activeDomain as NamefiNormalizedDomain,
      type: 'logo',
    }),
    enabled: !!activeDomain,
    staleTime: 10_000,
  });

  const logosToShow = useMemo<Generation[]>(() => {
    if (activeDomain) {
      const fallback = availableLogos.filter(
        (logo) => logo.domain === activeDomain,
      );
      const fetched = (domainLogos as unknown as Generation[]) || [];
      return fetched.length > 0 ? fetched : fallback;
    }

    return availableLogos;
  }, [activeDomain, availableLogos, domainLogos]);

  useEffect(() => {
    setSelectedDomain(fixedDomain ?? '');
  }, [fixedDomain]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    if (initialSelectedLogoId) {
      form.setValue('selectedLogoId', initialSelectedLogoId, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: true,
      });
    }
  }, [initialSelectedLogoId]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const currentId = form.getValues('selectedLogoId');
    const currentExists = logosToShow.some((logo) => logo.id === currentId);
    if (currentExists) return;

    const nextId = logosToShow[0]?.id ?? '';
    form.setValue('selectedLogoId', nextId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: true,
    });
  }, [logosToShow]);

  return (
    <BaseGenerator
      onSubmit={onGenerate}
      isLoading={isLoading}
      fixedDomain={fixedDomain}
      formSchema={animationFormSchema}
      defaultValues={defaultValues}
      domainPlaceholder="Select your brand domain (required)"
      domainSelectOnly={true}
      domainOnlyDomainsWithLogos={true}
      onDomainChange={(domain) => {
        setSelectedDomain(domain as NamefiNormalizedDomain | '');
      }}
      onFormReady={(form) => {
        formRef.current = form;

        if (initialSelectedLogoId) {
          form.setValue('selectedLogoId', initialSelectedLogoId, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
          });
          return;
        }

        if (logosToShow.length > 0) {
          form.setValue('selectedLogoId', logosToShow[0].id, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
          });
        }
      }}
      submitButtonText={logosToShow.length > 0 ? 'Animate' : 'Select a brand'}
      submitLoadingText="Generating"
      latestGeneration={latestGeneration}
      onGenerateMore={onGenerateMore}
    >
      {({ form, openPanel, setOpenPanel }) => {
        const selectedLogoId = form.watch('selectedLogoId');
        const selectedModel = form.watch('model');
        const selectedMotionPreset = form.watch('motionPreset');
        const resolvedMotionPreset =
          selectedMotionPreset ?? ANIMATION_MOTION_PRESET_IDS[0];
        const resolvedModel = selectedModel ?? ANIMATION_MODEL_IDS[0];
        const selectedLogo = logosToShow.find(
          (logo) => logo.id === selectedLogoId,
        );
        const selectLogo = (logoId: string) => {
          form.setValue('selectedLogoId', logoId, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
          setOpenPanel(null);
        };

        const renderLogoCard = (logo: Generation) => {
          const isSelected = selectedLogoId === logo.id;

          return (
            <button
              key={logo.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Use ${logo.domain} logo`}
              className="w-full rounded-xl bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => {
                selectLogo(logo.id);
              }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:shadow-lg',
                  isSelected && 'ring-2 ring-orange-500',
                )}
              >
                <CardContent className="p-4">
                  <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
                    <img
                      src={logo.thumbnailUrl ?? logo.url ?? ''}
                      alt={logo.domain}
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20">
                        <Check className="h-8 w-8 rounded-full bg-orange-500 p-1 text-secondary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {logo.output?.type === 'logo' && logo.output.logoType && (
                      <span className="block rounded bg-blue-100 px-2 py-1 text-center text-xs text-blue-700">
                        {logo.output.logoType}
                      </span>
                    )}
                    {logo.output?.type === 'logo' && logo.output.logoStyle && (
                      <span className="block rounded bg-purple-100 px-2 py-1 text-center text-xs text-purple-700">
                        {logo.output.logoStyle}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        };

        return (
          <>
            <ControlPanel
              className="flex-1"
              buttons={[
                {
                  key: 'logos',
                  label: 'Use Logo',
                  badge: selectedLogo ? 'Selected' : undefined,
                  onClick: () =>
                    setOpenPanel(openPanel === 'logos' ? null : 'logos'),
                  isActive: openPanel === 'logos',
                },
                {
                  key: 'description',
                  label: 'Description',
                  onClick: () =>
                    setOpenPanel(
                      openPanel === 'description' ? null : 'description',
                    ),
                  isActive: openPanel === 'description',
                },
                {
                  key: 'motion',
                  label: 'Motion',
                  badge: ANIMATION_MOTION_PRESETS[resolvedMotionPreset].name,
                  onClick: () =>
                    setOpenPanel(openPanel === 'motion' ? null : 'motion'),
                  isActive: openPanel === 'motion',
                },
                {
                  key: 'model',
                  label: 'Model',
                  badge: ANIMATION_MODELS[resolvedModel].name,
                  onClick: () =>
                    setOpenPanel(openPanel === 'model' ? null : 'model'),
                  isActive: openPanel === 'model',
                },
              ]}
            />

            {openPanel === 'logos' && logosToShow.length > 0 && (
              <FormField
                control={form.control}
                name={'selectedLogoId'}
                render={() => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a logo to animate
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {logosToShow.map(renderLogoCard)}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {openPanel === 'motion' && (
              <FormField
                control={form.control}
                name={'motionPreset'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose motion direction
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (!value) return;
                          field.onChange(value as AnimationMotionPresetInput);
                          setOpenPanel(null);
                        }}
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue placeholder="Select motion" />
                        </SelectTrigger>
                        <SelectContent>
                          {ANIMATION_MOTION_PRESET_IDS.map((presetId) => (
                            <SelectItem key={presetId} value={presetId}>
                              {ANIMATION_MOTION_PRESETS[presetId].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {
                        ANIMATION_MOTION_PRESETS[
                          field.value as AnimationMotionPresetInput
                        ].description
                      }
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {openPanel === 'model' && (
              <FormField
                control={form.control}
                name={'model'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a model
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (!value) return;
                          field.onChange(value as AnimationModel);
                          setOpenPanel(null);
                        }}
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {ANIMATION_MODEL_IDS.map((modelId) => (
                            <SelectItem key={modelId} value={modelId}>
                              {ANIMATION_MODELS[modelId].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {
                        ANIMATION_MODELS[field.value as AnimationModel]
                          .description
                      }
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        );
      }}
    </BaseGenerator>
  );
}
