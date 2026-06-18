'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { UseFormReturn } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { z } from 'zod';
import {
  ANIMATION_MODES,
  ANIMATION_MODE_IDS,
  ANIMATION_MODELS,
  ANIMATION_MODEL_IDS,
  ANIMATION_MOTION_INTENSITIES,
  ANIMATION_MOTION_INTENSITY_IDS,
  ANIMATION_MOTION_PRESETS,
  ANIMATION_MOTION_PRESET_IDS,
  ANIMATION_SOURCE_MODES,
  ANIMATION_SOURCE_MODE_IDS,
  CINEMATIC_ANIMATION_MODEL_IDS,
  CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  LOOPED_ANIMATION_MODEL_IDS,
  LOOPED_ANIMATION_MOTION_PRESET_IDS,
  type AnimationMode,
  type AnimationModel,
  type AnimationMotionIntensity,
  type AnimationMotionPresetInput,
  type AnimationSourceMode,
} from '@namefi-astra/ai/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import {
  FormControl,
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
import { cn } from '@namefi-astra/ui/lib/cn';
import { useTRPC } from '@/lib/trpc';
import { BaseGenerator, baseFormSchema } from './shared/base-generator';
import { ControlPanel } from './shared/form-fields';
import type { Generation } from './shared/types';
import {
  filterReadyLogoGenerations,
  type ReadyLogoSource,
} from './shared/logo-readiness';
import { useAuth } from '@/hooks/use-auth';

const DEFAULT_ANIMATION_MODE = 'sheet-guided' satisfies AnimationMode;

const animationFormSchema = baseFormSchema
  .extend({
    selectedLogoId: z.string().uuid(),
    mode: z.enum(ANIMATION_MODE_IDS).default(DEFAULT_ANIMATION_MODE),
    sourceMode: z.enum(ANIMATION_SOURCE_MODE_IDS).optional(),
    motionPreset: z
      .enum(ANIMATION_MOTION_PRESET_IDS)
      .default('let-ai-choose' satisfies AnimationMotionPresetInput),
    motionIntensity: z.enum(ANIMATION_MOTION_INTENSITY_IDS).optional(),
    model: z
      .enum(ANIMATION_MODEL_IDS)
      .default('bytedance/seedance-2.0' satisfies AnimationModel),
  })
  .superRefine((value, ctx) => {
    if (value.mode === 'cinematic') {
      if (!value.sourceMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Opening is required for cinematic animation',
          path: ['sourceMode'],
        });
      }

      if (!CINEMATIC_ANIMATION_MODEL_IDS.includes(value.model as never)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a cinematic model',
          path: ['model'],
        });
      }

      if (
        !CINEMATIC_ANIMATION_MOTION_PRESET_IDS.includes(
          value.motionPreset as never,
        )
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a cinematic motion preset',
          path: ['motionPreset'],
        });
      }

      return;
    }

    if (value.mode === 'sheet-guided') {
      if (!LOOPED_ANIMATION_MODEL_IDS.includes(value.model as never)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Choose a Seedance model',
          path: ['model'],
        });
      }

      return;
    }

    if (!value.motionIntensity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Intensity is required for looped animation',
        path: ['motionIntensity'],
      });
    }

    if (!LOOPED_ANIMATION_MODEL_IDS.includes(value.model as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a looped model',
        path: ['model'],
      });
    }

    if (
      !LOOPED_ANIMATION_MOTION_PRESET_IDS.includes(value.motionPreset as never)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose a looped motion preset',
        path: ['motionPreset'],
      });
    }
  });

type AnimationFormInput = z.input<typeof animationFormSchema>;
type AnimationFormData = z.output<typeof animationFormSchema>;

export type { AnimationFormData };

interface AnimationGeneratorProps {
  onGenerate: (data: AnimationFormData) => void;
  isLoading?: boolean;
  fixedDomain?: NamefiNormalizedDomain;
  availableLogos?: ReadyLogoSource[];
  latestGeneration?: Generation;
  onGenerateMore?: () => void;
  initialSelectedLogoId?: string;
}

type AnimationFormHandle = UseFormReturn<
  AnimationFormInput,
  unknown,
  AnimationFormData
>;

const animationModeConfigs = {
  cinematic: {
    modelIds: CINEMATIC_ANIMATION_MODEL_IDS,
    motionPresetIds: CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  },
  looped: {
    modelIds: LOOPED_ANIMATION_MODEL_IDS,
    motionPresetIds: LOOPED_ANIMATION_MOTION_PRESET_IDS,
  },
  'sheet-guided': {
    modelIds: LOOPED_ANIMATION_MODEL_IDS,
    motionPresetIds: CINEMATIC_ANIMATION_MOTION_PRESET_IDS,
  },
} as const;

function pickAllowedValue<TValue extends string>(
  value: string | undefined,
  allowedValues: readonly [TValue, ...TValue[]],
): TValue {
  if (value && allowedValues.includes(value as TValue)) {
    return value as TValue;
  }

  return allowedValues[0];
}

function getAnimationModeConfig(mode: AnimationMode) {
  return animationModeConfigs[mode];
}

function setAnimationFormValue<TField extends keyof AnimationFormInput>(
  form: AnimationFormHandle,
  field: TField,
  value: AnimationFormInput[TField],
) {
  form.setValue(field as never, value as never, {
    shouldDirty: true,
    shouldTouch: true,
    shouldValidate: true,
  });
}

function resolveAnimationSelection(params: {
  mode: AnimationMode;
  sourceMode?: AnimationSourceMode;
  model: AnimationModel;
  motionPreset: AnimationMotionPresetInput;
  motionIntensity?: AnimationMotionIntensity;
}) {
  const modeConfig = getAnimationModeConfig(params.mode);

  return {
    isLoopedMode: params.mode === 'looped',
    modelIds: modeConfig.modelIds,
    motionPresetIds: modeConfig.motionPresetIds,
    resolvedSourceMode: params.sourceMode ?? ANIMATION_SOURCE_MODE_IDS[0],
    resolvedModel: pickAllowedValue(params.model, modeConfig.modelIds),
    resolvedMotionPreset: pickAllowedValue(
      params.motionPreset,
      modeConfig.motionPresetIds,
    ),
    resolvedMotionIntensity:
      params.motionIntensity ?? ANIMATION_MOTION_INTENSITY_IDS[0],
  };
}

function applyAnimationModeChange(params: {
  form: AnimationFormHandle;
  mode: AnimationMode;
  currentModel: AnimationModel;
  currentMotionPreset: AnimationMotionPresetInput;
  currentSourceMode?: AnimationSourceMode;
  currentMotionIntensity?: AnimationMotionIntensity;
  setOpenPanel: (panel: string | null) => void;
}) {
  const nextModeConfig = getAnimationModeConfig(params.mode);
  const nextModel = pickAllowedValue(
    params.currentModel,
    nextModeConfig.modelIds,
  );
  const nextMotionPreset = pickAllowedValue(
    params.currentMotionPreset,
    nextModeConfig.motionPresetIds,
  );

  setAnimationFormValue(params.form, 'mode', params.mode);
  setAnimationFormValue(params.form, 'model', nextModel);
  setAnimationFormValue(params.form, 'motionPreset', nextMotionPreset);

  if (params.mode === 'cinematic') {
    setAnimationFormValue(
      params.form,
      'sourceMode',
      params.currentSourceMode ?? ANIMATION_SOURCE_MODE_IDS[0],
    );
  } else if (params.mode === 'looped') {
    setAnimationFormValue(
      params.form,
      'motionIntensity',
      params.currentMotionIntensity ?? ANIMATION_MOTION_INTENSITY_IDS[0],
    );
  }

  params.setOpenPanel(null);
}

function buildControlPanelButtons(params: {
  mode: AnimationMode;
  openPanel: string | null;
  setOpenPanel: (panel: string | null) => void;
  selectedLogo: ReadyLogoSource | undefined;
  resolvedSourceMode: AnimationSourceMode;
  resolvedMotionPreset: AnimationMotionPresetInput;
  resolvedMotionIntensity: AnimationMotionIntensity;
  resolvedModel: AnimationModel;
}) {
  const togglePanel = (panel: string) => {
    params.setOpenPanel(params.openPanel === panel ? null : panel);
  };

  const buttons: Array<{
    key: string;
    label: string;
    badge?: string;
    onClick: () => void;
    isActive: boolean;
  }> = [
    {
      key: 'mode',
      label: 'Mode',
      badge: ANIMATION_MODES[params.mode].name,
      onClick: () => togglePanel('mode'),
      isActive: params.openPanel === 'mode',
    },
    {
      key: 'logos',
      label: 'Use Logo',
      badge: params.selectedLogo ? 'Selected' : undefined,
      onClick: () => togglePanel('logos'),
      isActive: params.openPanel === 'logos',
    },
    {
      key: 'description',
      label: 'Description',
      onClick: () => togglePanel('description'),
      isActive: params.openPanel === 'description',
    },
  ];

  if (params.mode === 'cinematic') {
    buttons.push({
      key: 'opening',
      label: 'Opening',
      badge: ANIMATION_SOURCE_MODES[params.resolvedSourceMode].name,
      onClick: () => togglePanel('opening'),
      isActive: params.openPanel === 'opening',
    });
  }

  if (params.mode !== 'sheet-guided') {
    buttons.push({
      key: 'motion',
      label: 'Motion',
      badge: ANIMATION_MOTION_PRESETS[params.resolvedMotionPreset].name,
      onClick: () => togglePanel('motion'),
      isActive: params.openPanel === 'motion',
    });
  }

  if (params.mode === 'looped') {
    buttons.push({
      key: 'intensity',
      label: 'Intensity',
      badge: ANIMATION_MOTION_INTENSITIES[params.resolvedMotionIntensity].name,
      onClick: () => togglePanel('intensity'),
      isActive: params.openPanel === 'intensity',
    });
  }

  buttons.push({
    key: 'model',
    label: 'Model',
    badge: ANIMATION_MODELS[params.resolvedModel].name,
    onClick: () => togglePanel('model'),
    isActive: params.openPanel === 'model',
  });

  return buttons;
}

function AnimationLogoCard(props: {
  logo: ReadyLogoSource;
  isSelected: boolean;
  onSelect: (logoId: string) => void;
}) {
  const { logo, isSelected, onSelect } = props;
  const logoImageSrc = logo.thumbnailUrl ?? logo.url;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`Use ${logo.domain} logo`}
      className="w-full rounded-xl bg-transparent p-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={() => {
        onSelect(logo.id);
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
            {logoImageSrc ? (
              <Image
                src={logoImageSrc}
                alt={logo.domain}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            ) : null}
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
}

interface AnimationGeneratorPanelsProps {
  form: AnimationFormHandle;
  logosToShow: ReadyLogoSource[];
  openPanel: string | null;
  setOpenPanel: (panel: string | null) => void;
}

function AnimationGeneratorPanels({
  form,
  logosToShow,
  openPanel,
  setOpenPanel,
}: AnimationGeneratorPanelsProps) {
  const selectedLogoId = form.watch('selectedLogoId');
  const selectedMode = form.watch('mode') ?? DEFAULT_ANIMATION_MODE;
  const selectedSourceMode = form.watch('sourceMode');
  const selectedModel = form.watch('model') ?? ANIMATION_MODEL_IDS[0];
  const selectedMotionPreset =
    form.watch('motionPreset') ?? ANIMATION_MOTION_PRESET_IDS[0];
  const selectedMotionIntensity = form.watch('motionIntensity');
  const selection = resolveAnimationSelection({
    mode: selectedMode,
    sourceMode: selectedSourceMode,
    model: selectedModel,
    motionPreset: selectedMotionPreset,
    motionIntensity: selectedMotionIntensity,
  });
  const selectedLogo = logosToShow.find((logo) => logo.id === selectedLogoId);

  const handleModeChange = (mode: AnimationMode) => {
    applyAnimationModeChange({
      form,
      mode,
      currentModel: selectedModel,
      currentMotionPreset: selectedMotionPreset,
      currentSourceMode: selection.resolvedSourceMode,
      currentMotionIntensity: selection.resolvedMotionIntensity,
      setOpenPanel,
    });
  };

  const handleLogoSelect = (logoId: string) => {
    setAnimationFormValue(form, 'selectedLogoId', logoId);
    setOpenPanel(null);
  };

  const controlButtons = buildControlPanelButtons({
    mode: selectedMode,
    openPanel,
    setOpenPanel,
    selectedLogo,
    resolvedSourceMode: selection.resolvedSourceMode,
    resolvedMotionPreset: selection.resolvedMotionPreset,
    resolvedMotionIntensity: selection.resolvedMotionIntensity,
    resolvedModel: selection.resolvedModel,
  });

  return (
    <>
      <ControlPanel className="flex-1" buttons={controlButtons} />

      {openPanel === 'mode' && (
        <div className="mt-6 space-y-3">
          <FormLabel className="text-lg font-semibold">
            Choose animation mode
          </FormLabel>
          <div className="flex flex-wrap gap-2">
            {ANIMATION_MODE_IDS.map((modeId) => (
              <Button
                key={modeId}
                type="button"
                variant={selectedMode === modeId ? 'default' : 'outline'}
                onClick={() => {
                  handleModeChange(modeId);
                }}
              >
                {ANIMATION_MODES[modeId].name}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {ANIMATION_MODES[selectedMode].description}
          </p>
        </div>
      )}

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
                  {logosToShow.map((logo) => (
                    <AnimationLogoCard
                      key={logo.id}
                      logo={logo}
                      isSelected={selectedLogoId === logo.id}
                      onSelect={handleLogoSelect}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {openPanel === 'opening' && selectedMode === 'cinematic' && (
        <FormField
          control={form.control}
          name={'sourceMode'}
          render={({ field }) => (
            <FormItem className="mt-6">
              <FormLabel className="text-lg font-semibold">
                Choose opening style
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (!value) return;
                    field.onChange(value as AnimationSourceMode);
                    setOpenPanel(null);
                  }}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select opening style" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATION_SOURCE_MODE_IDS.map((sourceModeId) => (
                      <SelectItem key={sourceModeId} value={sourceModeId}>
                        {ANIMATION_SOURCE_MODES[sourceModeId].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  ANIMATION_SOURCE_MODES[
                    (field.value ??
                      selection.resolvedSourceMode) as AnimationSourceMode
                  ].description
                }
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {openPanel === 'motion' && selectedMode !== 'sheet-guided' && (
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
                    {selection.motionPresetIds.map((presetId) => (
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
                    pickAllowedValue(
                      field.value,
                      selection.motionPresetIds,
                    ) as AnimationMotionPresetInput
                  ].description
                }
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {openPanel === 'intensity' && selection.isLoopedMode && (
        <FormField
          control={form.control}
          name={'motionIntensity'}
          render={({ field }) => (
            <FormItem className="mt-6">
              <FormLabel className="text-lg font-semibold">
                Choose motion intensity
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value ?? ANIMATION_MOTION_INTENSITY_IDS[0]}
                  onValueChange={(value) => {
                    if (!value) return;
                    field.onChange(value as AnimationMotionIntensity);
                    setOpenPanel(null);
                  }}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Select intensity" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANIMATION_MOTION_INTENSITY_IDS.map((intensityId) => (
                      <SelectItem key={intensityId} value={intensityId}>
                        {ANIMATION_MOTION_INTENSITIES[intensityId].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  ANIMATION_MOTION_INTENSITIES[
                    (field.value ??
                      ANIMATION_MOTION_INTENSITY_IDS[0]) as AnimationMotionIntensity
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
                    {selection.modelIds.map((modelId) => (
                      <SelectItem key={modelId} value={modelId}>
                        {ANIMATION_MODELS[modelId].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="mt-2 text-sm text-muted-foreground">
                {
                  ANIMATION_MODELS[
                    pickAllowedValue(field.value, selection.modelIds)
                  ].description
                }
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
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
  const { isAuthenticated } = useAuth();
  const formRef = useRef<UseFormReturn<
    AnimationFormInput,
    unknown,
    AnimationFormData
  > | null>(null);
  const activeDomain = fixedDomain ?? selectedDomain;

  const defaultValues = useMemo<AnimationFormInput>(
    () => ({
      domain: fixedDomain || '',
      description: '',
      selectedLogoId: '',
      mode: DEFAULT_ANIMATION_MODE,
      sourceMode: 'exact-frame' as const,
      motionPreset: 'let-ai-choose' as const,
      motionIntensity: 'subtle' as const,
      model: 'bytedance/seedance-2.0' as const,
    }),
    [fixedDomain],
  );

  const { data: domainLogos = [] } = useQuery({
    ...trpc.ai.getGenerationsByType.queryOptions({
      domain: activeDomain as NamefiNormalizedDomain,
      type: 'logo',
    }),
    enabled: isAuthenticated && !!activeDomain,
    staleTime: 10_000,
  });

  const logosToShow = useMemo<ReadyLogoSource[]>(() => {
    if (activeDomain) {
      const fallback = availableLogos.filter(
        (logo) => logo.domain === activeDomain,
      );
      const fetched = filterReadyLogoGenerations(
        domainLogos as unknown as Generation[],
      );
      return fetched.length > 0 ? fetched : fallback;
    }

    return [...availableLogos];
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
      creditCostConfig={{
        type: 'animation',
        getMode: (values) => values.mode,
        getModel: (values) => values.model,
      }}
    >
      {({ form, openPanel, setOpenPanel }) => (
        <AnimationGeneratorPanels
          form={form}
          logosToShow={logosToShow}
          openPanel={openPanel}
          setOpenPanel={setOpenPanel}
        />
      )}
    </BaseGenerator>
  );
}
