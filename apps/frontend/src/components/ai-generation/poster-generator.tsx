'use client';

import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import { cn } from '@namefi-astra/ui/lib/cn';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { BaseGenerator, baseFormSchema } from './shared/base-generator';
import { ControlPanel } from './shared/form-fields';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import type { Generation } from './shared/types';
import {
  filterReadyLogoGenerations,
  type ReadyLogoSource,
} from './shared/logo-readiness';
import type { UseFormReturn } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import type {
  ImageModel as Model,
  MarketingCollateralTypeInput,
} from '@namefi-astra/ai/types';
import { MARKETING_COLLATERAL_TYPE_INPUT_IDS } from '@namefi-astra/ai/types';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

export const collateralLabels: Record<MarketingCollateralTypeInput, string> = {
  billboard: 'Billboard',
  apparel: 'Apparel',
  vehicle: 'Vehicle',
  product: 'Product',
  let_ai_choose: 'Let AI Choose',
};

function buildCollateralLabels(
  t: ReturnType<typeof useTranslations<'aiGeneration'>>,
): Record<MarketingCollateralTypeInput, string> {
  return {
    billboard: t('poster.collateral.billboard'),
    apparel: t('poster.collateral.apparel'),
    vehicle: t('poster.collateral.vehicle'),
    product: t('poster.collateral.product'),
    let_ai_choose: t('poster.collateral.letAiChoose'),
  };
}

const posterFormSchema = baseFormSchema.extend({
  selectedLogoId: z.string().uuid(),
  collateralType: z
    .enum(MARKETING_COLLATERAL_TYPE_INPUT_IDS)
    .default('let_ai_choose'),
  model: z
    .enum([
      'gpt-image-1',
      'gpt-image-1.5',
      'gpt-image-2',
      'gemini-2.5-flash-image',
      'gemini-3-pro-image-preview',
    ])
    .default('gpt-image-2'),
});

type PosterFormInput = z.input<typeof posterFormSchema>;
type PosterFormData = z.output<typeof posterFormSchema>;

export type { PosterFormData };

interface PosterGeneratorProps {
  onGenerate: (data: PosterFormData) => void;
  isLoading?: boolean;
  fixedDomain?: NamefiNormalizedDomain;
  availableLogos?: ReadyLogoSource[];
  latestGeneration?: Generation;
  onGenerateMore?: () => void;
  initialSelectedLogoId?: string;
}

export function PosterGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
  availableLogos = [],
  latestGeneration,
  onGenerateMore,
  initialSelectedLogoId,
}: PosterGeneratorProps) {
  const t = useTranslations('aiGeneration');
  const localizedCollateralLabels = useMemo(
    () => buildCollateralLabels(t),
    [t],
  );
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();
  const formRef = useRef<UseFormReturn<
    PosterFormInput,
    unknown,
    PosterFormData
  > | null>(null);
  const defaultValues = useMemo(() => {
    return {
      domain: fixedDomain || '',
      description: '',
      selectedLogoId: '',
      collateralType: 'let_ai_choose' as const,
      model: 'gpt-image-2' as Model,
    };
  }, [fixedDomain]);

  const { data: domainLogos = [] } = useQuery({
    ...trpc.ai.getGenerationsByType.queryOptions({
      domain: selectedDomain as NamefiNormalizedDomain,
      type: 'logo',
    }),
    enabled: isAuthenticated && !!selectedDomain,
    staleTime: 10_000,
  });

  const logosToShow = useMemo<ReadyLogoSource[]>(() => {
    if (selectedDomain) {
      const fallback = availableLogos.filter(
        (logo) => logo.domain === selectedDomain,
      );
      const fetched = filterReadyLogoGenerations(
        domainLogos as unknown as Generation[],
      );
      return fetched.length > 0 ? fetched : fallback;
    }
    return [...availableLogos];
  }, [selectedDomain, domainLogos, availableLogos]);

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
    const logos = logosToShow;
    const currentId = form.getValues('selectedLogoId');
    const currentExists = logos.some((logo) => logo.id === currentId);

    if (currentExists) return;

    const nextId = logos[0]?.id ?? '';
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
      formSchema={posterFormSchema}
      defaultValues={defaultValues}
      domainPlaceholder={t('domainField.brandPlaceholder')}
      domainSelectOnly={true}
      domainOnlyDomainsWithLogos={true}
      onDomainChange={(d) => setSelectedDomain(d)}
      onFormReady={(form) => {
        formRef.current = form;
        const logos = logosToShow;
        if (initialSelectedLogoId) {
          form.setValue('selectedLogoId', initialSelectedLogoId, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
          });
        } else if (logos.length > 0) {
          form.setValue('selectedLogoId', logos[0].id, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
          });
        }
      }}
      submitButtonText={logosToShow.length > 0 ? 'Generate' : 'Select a brand'}
      submitLoadingText="Generating"
      latestGeneration={latestGeneration}
      onGenerateMore={onGenerateMore}
      creditCostConfig={{
        type: 'marketing',
        getModel: (values) => values.model,
      }}
    >
      {({ form, openPanel, setOpenPanel }) => {
        const selectedLogoId = form.watch('selectedLogoId');
        const selectedLogo = logosToShow.find(
          (logo) => logo.id === selectedLogoId,
        );
        const logosForPanel: ReadyLogoSource[] = logosToShow;

        const renderLogoCard = (logo: ReadyLogoSource) => {
          const logoImageSrc = logo.thumbnailUrl ?? logo.url;

          return (
            <Card
              key={logo.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                form.getValues('selectedLogoId') === logo.id &&
                  'ring-2 ring-orange-500',
              )}
              onClick={() => {
                form.setValue('selectedLogoId', logo.id);
                setOpenPanel(null);
              }}
            >
              <CardContent className="p-4">
                <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                  {logoImageSrc ? (
                    <Image
                      src={logoImageSrc}
                      alt={logo.domain}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover"
                    />
                  ) : null}
                  {form.getValues('selectedLogoId') === logo.id && (
                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                      <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {logo.output?.type === 'logo' && logo.output.logoType && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded block text-center">
                      {logo.output.logoType}
                    </span>
                  )}
                  {logo.output?.type === 'logo' && logo.output.logoStyle && (
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded block text-center">
                      {logo.output.logoStyle}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        };

        const controlButtons: Array<{
          key: string;
          label: string;
          badge?: string;
          onClick: () => void;
          isActive: boolean;
        }> = [];

        // Add logo button only if there are logos to pick for current selection
        if (logosToShow.length > 0) {
          controlButtons.push({
            key: 'logos',
            label: t('poster.controls.useLogo'),
            badge: selectedLogo ? t('poster.controls.selected') : undefined,
            onClick: () => setOpenPanel(openPanel === 'logos' ? null : 'logos'),
            isActive: openPanel === 'logos',
          });
        }

        controlButtons.push({
          key: 'description',
          label: t('poster.controls.description'),
          onClick: () =>
            setOpenPanel(openPanel === 'description' ? null : 'description'),
          isActive: openPanel === 'description',
        });

        const selectedModel = form.watch('model');
        const selectedCollateral = form.watch('collateralType');
        const selectedModelLabel =
          selectedModel === 'gemini-3-pro-image-preview'
            ? 'Gemini 3 Pro (preview)'
            : selectedModel === 'gemini-2.5-flash-image'
              ? 'Gemini 2.5 (legacy)'
              : selectedModel === 'gpt-image-2'
                ? 'OpenAI 2'
                : selectedModel === 'gpt-image-1.5'
                  ? 'OpenAI 1.5'
                  : 'OpenAI (legacy)';
        controlButtons.push({
          key: 'model',
          label: t('poster.controls.model'),
          badge: selectedModelLabel,
          onClick: () => setOpenPanel(openPanel === 'model' ? null : 'model'),
          isActive: openPanel === 'model',
        });

        controlButtons.push({
          key: 'collateral',
          label: t('poster.controls.collateral'),
          badge:
            (selectedCollateral &&
              localizedCollateralLabels[selectedCollateral]) ||
            undefined,
          onClick: () =>
            setOpenPanel(openPanel === 'collateral' ? null : 'collateral'),
          isActive: openPanel === 'collateral',
        });

        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ControlPanel
                className="flex-1"
                buttons={controlButtons.filter((b) => {
                  if (b.key === 'logos') return logosToShow.length > 0;
                  if (b.key === 'description') return true;
                  return showAdvanced;
                })}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Label
                  htmlFor="poster-advanced"
                  className="text-xs font-medium"
                >
                  {t('poster.controls.advanced')}
                </Label>
                <Switch
                  id="poster-advanced"
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </div>
            </div>

            {/* Logo Selection */}
            {openPanel === 'logos' && logosForPanel.length > 0 && (
              <FormField
                control={form.control}
                name={'selectedLogoId'}
                render={() => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      {t('poster.chooseLogo')}
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {logosForPanel.map(renderLogoCard)}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Model Selection */}
            {showAdvanced && openPanel === 'model' && (
              <FormField
                control={form.control}
                name={'model'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      {t('poster.chooseModel')}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          if (!val) return;
                          field.onChange(val as Model);
                          setOpenPanel(null);
                        }}
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue placeholder={t('model.select')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-3-pro-image-preview">
                            Gemini 3 Pro (preview)
                          </SelectItem>
                          <SelectItem value="gemini-2.5-flash-image">
                            Gemini 2.5 (legacy)
                          </SelectItem>
                          <SelectItem value="gpt-image-1.5">
                            OpenAI 1.5
                          </SelectItem>
                          <SelectItem value="gpt-image-2">OpenAI 2</SelectItem>
                          <SelectItem value="gpt-image-1">
                            OpenAI (legacy)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Collateral Selection */}
            {showAdvanced && openPanel === 'collateral' && (
              <FormField
                control={form.control}
                name={'collateralType'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      {t('poster.chooseCollateral')}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(val) => {
                          if (!val) return;
                          field.onChange(val);
                          setOpenPanel(null);
                        }}
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue
                            placeholder={t('poster.selectCollateral')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="let_ai_choose">
                            {t('poster.collateral.letAiChoose')}
                          </SelectItem>
                          <SelectItem value="billboard">
                            {t('poster.collateral.billboard')}
                          </SelectItem>
                          <SelectItem value="apparel">
                            {t('poster.collateral.apparel')}
                          </SelectItem>
                          <SelectItem value="vehicle">
                            {t('poster.collateral.vehicle')}
                          </SelectItem>
                          <SelectItem value="product">
                            {t('poster.collateral.product')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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
