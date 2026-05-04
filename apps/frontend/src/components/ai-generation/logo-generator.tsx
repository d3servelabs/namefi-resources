'use client';

import { Card, CardContent } from '@namefi-astra/ui/components/shadcn/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@namefi-astra/ui/components/shadcn/form';
import {
  LOGO_STYLES,
  LOGO_TEXT_TREATMENTS,
  LOGO_TYPOGRAPHY,
  LOGO_TYPES,
  type ImageModel as Model,
  type LogoStyleInput,
  type LogoTextTreatmentInput,
  type LogoTypographyInput,
  type LogoTypeInput,
} from '@namefi-astra/ai/types';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { LucideIcon } from 'lucide-react';
import {
  Atom,
  CaseSensitive,
  Check,
  Crown,
  Disc,
  Droplet,
  Handshake,
  Heart,
  Image as ImageIcon,
  Landmark,
  Leaf,
  PartyPopper,
  ShieldCheck,
  Shapes,
  Smile,
  Sparkles,
  Square,
  Sun,
  Type,
} from 'lucide-react';
import { z } from 'zod';
import { BaseGenerator, baseFormSchema } from './shared/base-generator';
import { ControlPanel } from './shared/form-fields';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useMemo, useState, type ReactNode } from 'react';
import type { Generation } from './shared/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@namefi-astra/ui/components/shadcn/select';
import { Switch } from '@namefi-astra/ui/components/shadcn/switch';
import { Label } from '@namefi-astra/ui/components/shadcn/label';

const logoTypeOptions = Object.keys(LOGO_TYPES) as LogoTypeInput[];
const logoStyleOptions = Object.keys(LOGO_STYLES) as LogoStyleInput[];
const logoTextTreatmentOptions = Object.keys(
  LOGO_TEXT_TREATMENTS,
) as LogoTextTreatmentInput[];
const logoTypographyOptions = Object.keys(
  LOGO_TYPOGRAPHY,
) as LogoTypographyInput[];

type TileConfig = {
  icon: LucideIcon;
  gradient: string;
  iconClassName?: string;
  accent?: ReactNode;
};

const LOGO_TYPE_TILES: Record<LogoTypeInput, TileConfig> = {
  'let-ai-choose': {
    icon: Sparkles,
    gradient: 'bg-gradient-to-br from-slate-900 via-indigo-700 to-fuchsia-500',
    iconClassName: 'text-white',
    accent: (
      <>
        <span className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
        <span className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
      </>
    ),
  },
  'image-icon': {
    icon: ImageIcon,
    gradient: 'bg-gradient-to-br from-sky-200 via-cyan-200 to-blue-200',
    iconClassName: 'text-slate-700',
    accent: (
      <span className="absolute right-6 top-6 h-6 w-6 rounded-full bg-yellow-200/70" />
    ),
  },
  'abstract-icon': {
    icon: Shapes,
    gradient: 'bg-gradient-to-br from-violet-200 via-fuchsia-200 to-rose-200',
    iconClassName: 'text-violet-700',
    accent: (
      <>
        <span className="absolute left-5 top-6 h-8 w-8 rounded-full bg-white/40" />
        <span className="absolute bottom-6 right-6 h-10 w-10 rounded-xl bg-white/30" />
      </>
    ),
  },
  wordmark: {
    icon: Type,
    gradient: 'bg-gradient-to-br from-slate-50 via-white to-slate-200',
    iconClassName: 'text-slate-700',
    accent: (
      <>
        <span className="absolute left-6 right-10 top-[62%] h-1 rounded-full bg-slate-900/10" />
        <span className="absolute left-8 right-6 top-[72%] h-1 rounded-full bg-slate-900/10" />
      </>
    ),
  },
  'letter-mark': {
    icon: CaseSensitive,
    gradient: 'bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100',
    iconClassName: 'text-amber-700',
    accent: (
      <span className="absolute left-6 top-6 h-14 w-14 rounded-full bg-white/40" />
    ),
  },
  mascot: {
    icon: Smile,
    gradient: 'bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100',
    iconClassName: 'text-emerald-700',
    accent: (
      <>
        <span className="absolute left-8 top-7 h-2 w-2 rounded-full bg-emerald-400/70" />
        <span className="absolute right-8 top-7 h-2 w-2 rounded-full bg-emerald-400/70" />
      </>
    ),
  },
};

const LOGO_STYLE_TILES: Record<LogoStyleInput, TileConfig> = {
  'let-ai-choose': {
    icon: Sparkles,
    gradient: 'bg-gradient-to-br from-slate-900 via-indigo-700 to-fuchsia-500',
    iconClassName: 'text-white',
    accent: (
      <>
        <span className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-white/10" />
        <span className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
      </>
    ),
  },
  classic: {
    icon: Landmark,
    gradient: 'bg-gradient-to-br from-stone-200 via-amber-100 to-stone-100',
    iconClassName: 'text-stone-700',
    accent: (
      <span className="absolute inset-3 rounded-xl border border-stone-400/30" />
    ),
  },
  innovative: {
    icon: Atom,
    gradient: 'bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-600',
    iconClassName: 'text-white',
    accent: (
      <span className="absolute left-6 top-6 h-10 w-10 rounded-full border border-white/25" />
    ),
  },
  bold: {
    icon: Square,
    gradient: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400',
    iconClassName: 'text-white',
    accent: (
      <span className="absolute bottom-0 right-0 h-16 w-16 bg-white/15" />
    ),
  },
  luxury: {
    icon: Crown,
    gradient: 'bg-gradient-to-br from-neutral-900 via-neutral-800 to-amber-700',
    iconClassName: 'text-amber-200',
    accent: (
      <span className="absolute inset-4 rounded-2xl border border-amber-200/30" />
    ),
  },
  'warm-inviting': {
    icon: Heart,
    gradient: 'bg-gradient-to-br from-rose-200 via-orange-200 to-amber-100',
    iconClassName: 'text-rose-600',
    accent: (
      <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/35" />
    ),
  },
  'fun-playful': {
    icon: PartyPopper,
    gradient: 'bg-gradient-to-br from-pink-300 via-yellow-200 to-emerald-200',
    iconClassName: 'text-rose-600',
    accent: (
      <>
        <span className="absolute left-6 top-8 h-2 w-2 rounded-full bg-white/70" />
        <span className="absolute right-8 top-6 h-3 w-3 rounded-full bg-white/60" />
        <span className="absolute bottom-8 left-10 h-2 w-2 rounded-full bg-white/70" />
      </>
    ),
  },
  retro: {
    icon: Disc,
    gradient: 'bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200',
    iconClassName: 'text-rose-700',
    accent: (
      <>
        <span className="absolute left-[-30%] top-[15%] h-6 w-[160%] rotate-6 bg-white/35" />
        <span className="absolute left-[-30%] top-[42%] h-6 w-[160%] rotate-6 bg-white/25" />
        <span className="absolute left-[-30%] top-[69%] h-6 w-[160%] rotate-6 bg-white/35" />
      </>
    ),
  },
  confidence: {
    icon: ShieldCheck,
    gradient: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900',
    iconClassName: 'text-white',
    accent: (
      <span className="absolute left-[-20%] top-[45%] h-10 w-[140%] -skew-y-6 bg-white/10" />
    ),
  },
  joy: {
    icon: Sun,
    gradient: 'bg-gradient-to-br from-yellow-200 via-amber-200 to-orange-200',
    iconClassName: 'text-amber-600',
    accent: (
      <span className="absolute -bottom-6 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-white/35" />
    ),
  },
  peace: {
    icon: Leaf,
    gradient: 'bg-gradient-to-br from-sky-200 via-emerald-200 to-teal-200',
    iconClassName: 'text-emerald-700',
    accent: (
      <>
        <span className="absolute left-8 right-8 top-[62%] h-1 rounded-full bg-white/35" />
        <span className="absolute left-10 right-6 top-[72%] h-1 rounded-full bg-white/35" />
      </>
    ),
  },
  purity: {
    icon: Droplet,
    gradient: 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
    iconClassName: 'text-slate-400',
    accent: (
      <span className="absolute inset-4 rounded-2xl border border-slate-200/60" />
    ),
  },
  trust: {
    icon: Handshake,
    gradient: 'bg-gradient-to-br from-blue-200 via-sky-200 to-indigo-200',
    iconClassName: 'text-slate-700',
    accent: (
      <span className="absolute inset-4 rounded-2xl border border-blue-600/20" />
    ),
  },
};

const TileGraphic = ({ tile }: { tile: TileConfig }) => {
  const Icon = tile.icon;
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden',
        tile.gradient,
      )}
    >
      {tile.accent}
      <Icon
        className={cn(
          'relative z-10 h-11 w-11 drop-shadow-sm',
          tile.iconClassName,
        )}
      />
    </div>
  );
};

const logoFormSchema = baseFormSchema.extend({
  type: z
    .enum(logoTypeOptions as [LogoTypeInput, ...LogoTypeInput[]])
    .default('let-ai-choose'),
  style: z
    .enum(logoStyleOptions as [LogoStyleInput, ...LogoStyleInput[]])
    .default('let-ai-choose'),
  textTreatment: z
    .enum(
      logoTextTreatmentOptions as [
        LogoTextTreatmentInput,
        ...LogoTextTreatmentInput[],
      ],
    )
    .default('let-ai-choose'),
  typography: z
    .enum(
      logoTypographyOptions as [LogoTypographyInput, ...LogoTypographyInput[]],
    )
    .default('let-ai-choose'),
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

type LogoFormData = z.infer<typeof logoFormSchema>;

export type { LogoFormData };

interface LogoGeneratorProps {
  onGenerate: (data: LogoFormData) => void;
  isLoading?: boolean;
  fixedDomain?: NamefiNormalizedDomain;
  latestGeneration?: Generation;
  onGenerateMore?: () => void;
  onPosterRequest?: (generation: Generation) => void;
}

export function LogoGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
  latestGeneration,
  onGenerateMore,
  onPosterRequest,
}: LogoGeneratorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const getTypeDisplay = (type: string) => {
    const logoType = LOGO_TYPES[type as keyof typeof LOGO_TYPES];
    return logoType ? logoType.name : type;
  };

  const getStyleDisplay = (style: string) => {
    const logoStyle = LOGO_STYLES[style as keyof typeof LOGO_STYLES];
    return logoStyle ? logoStyle.name : style;
  };

  const getTextTreatmentDisplay = (treatment: string) => {
    const textTreatment =
      LOGO_TEXT_TREATMENTS[treatment as keyof typeof LOGO_TEXT_TREATMENTS];
    return textTreatment ? textTreatment.name : treatment;
  };

  const getTypographyDisplay = (typography: string) => {
    const typographyOption =
      LOGO_TYPOGRAPHY[typography as keyof typeof LOGO_TYPOGRAPHY];
    return typographyOption ? typographyOption.name : typography;
  };

  const getModelDisplay = (model: Model) => {
    if (model === 'gemini-3-pro-image-preview') return 'Gemini 3 Pro (preview)';
    if (model === 'gemini-2.5-flash-image') return 'Gemini 2.5 (legacy)';
    if (model === 'gpt-image-2') return 'OpenAI 2';
    if (model === 'gpt-image-1.5') return 'OpenAI 1.5';
    return 'OpenAI (legacy)';
  };

  const defaultValues = useMemo(() => {
    return {
      domain: fixedDomain || '',
      type: LOGO_TYPES['let-ai-choose'].id,
      style: LOGO_STYLES['let-ai-choose'].id,
      description: '',
      textTreatment: LOGO_TEXT_TREATMENTS['let-ai-choose'].id,
      typography: LOGO_TYPOGRAPHY['let-ai-choose'].id,
      model: 'gpt-image-2' as Model,
    };
  }, [fixedDomain]);

  return (
    <BaseGenerator
      onSubmit={onGenerate}
      isLoading={isLoading}
      fixedDomain={fixedDomain}
      formSchema={logoFormSchema}
      defaultValues={defaultValues}
      domainPlaceholder="Select or enter your brand domain"
      domainSelectOnly={false}
      submitButtonText="Generate"
      submitLoadingText="Generating"
      latestGeneration={latestGeneration}
      onGenerateMore={onGenerateMore}
      onPosterRequest={onPosterRequest}
      creditCostConfig={{
        type: 'logo',
        getModel: (values) => values.model,
      }}
    >
      {({ form, openPanel, setOpenPanel }) => {
        const selectedType = form.watch('type');
        const selectedStyle = form.watch('style');
        const selectedTextTreatment = form.watch('textTreatment');
        const selectedTypography = form.watch('typography');
        const selectedModel = form.watch('model');

        return (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ControlPanel
                className="flex-1"
                buttons={[
                  ...(showAdvanced
                    ? [
                        {
                          key: 'type',
                          label: 'Type',
                          badge: selectedType
                            ? getTypeDisplay(selectedType)
                            : undefined,
                          onClick: () =>
                            setOpenPanel(openPanel === 'type' ? null : 'type'),
                          isActive: openPanel === 'type',
                        },
                      ]
                    : []),
                  ...(showAdvanced
                    ? [
                        {
                          key: 'style',
                          label: 'Style',
                          badge: selectedStyle
                            ? getStyleDisplay(selectedStyle)
                            : undefined,
                          onClick: () =>
                            setOpenPanel(
                              openPanel === 'style' ? null : 'style',
                            ),
                          isActive: openPanel === 'style',
                        },
                      ]
                    : []),
                  ...(showAdvanced
                    ? [
                        {
                          key: 'text',
                          label: 'TLD',
                          badge: selectedTextTreatment
                            ? getTextTreatmentDisplay(selectedTextTreatment)
                            : undefined,
                          onClick: () =>
                            setOpenPanel(openPanel === 'text' ? null : 'text'),
                          isActive: openPanel === 'text',
                        },
                      ]
                    : []),
                  ...(showAdvanced
                    ? [
                        {
                          key: 'typography',
                          label: 'Typography',
                          badge: selectedTypography
                            ? getTypographyDisplay(selectedTypography)
                            : undefined,
                          onClick: () =>
                            setOpenPanel(
                              openPanel === 'typography' ? null : 'typography',
                            ),
                          isActive: openPanel === 'typography',
                        },
                      ]
                    : []),
                  ...(showAdvanced
                    ? [
                        {
                          key: 'model',
                          label: 'Model',
                          badge: selectedModel
                            ? getModelDisplay(selectedModel)
                            : undefined,
                          onClick: () =>
                            setOpenPanel(
                              openPanel === 'model' ? null : 'model',
                            ),
                          isActive: openPanel === 'model',
                        },
                      ]
                    : []),
                  {
                    key: 'description',
                    label: 'Brand Vision',
                    onClick: () =>
                      setOpenPanel(
                        openPanel === 'description' ? null : 'description',
                      ),
                    isActive: openPanel === 'description',
                  },
                ]}
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Label htmlFor="logo-advanced" className="text-xs font-medium">
                  Advanced
                </Label>
                <Switch
                  id="logo-advanced"
                  checked={showAdvanced}
                  onCheckedChange={setShowAdvanced}
                />
              </div>
            </div>

            {/* Type Selection Tiles */}
            {showAdvanced && openPanel === 'type' && (
              <FormField
                control={form.control}
                name={'type'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a type
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(LOGO_TYPES).map(([key, type]) => (
                          <Card
                            key={key}
                            className={cn(
                              'cursor-pointer transition-all hover:shadow-lg',
                              field.value === key && 'ring-2 ring-orange-500',
                            )}
                            onClick={() => {
                              field.onChange(key);
                              setOpenPanel(null);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                                <TileGraphic
                                  tile={
                                    LOGO_TYPE_TILES[key as LogoTypeInput] ??
                                    LOGO_TYPE_TILES['let-ai-choose']
                                  }
                                />
                                {field.value === key &&
                                  key !== 'let-ai-choose' && (
                                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                      <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                    </div>
                                  )}
                              </div>
                              <h4 className="font-medium text-sm mb-1">
                                {type.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {type.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Style Selection Tiles */}
            {showAdvanced && openPanel === 'style' && (
              <FormField
                control={form.control}
                name={'style'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a style
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(LOGO_STYLES).map(([key, style]) => (
                          <Card
                            key={key}
                            className={cn(
                              'cursor-pointer transition-all hover:shadow-lg',
                              field.value === key && 'ring-2 ring-orange-500',
                            )}
                            onClick={() => {
                              field.onChange(key);
                              setOpenPanel(null);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                                <TileGraphic
                                  tile={
                                    LOGO_STYLE_TILES[key as LogoStyleInput] ??
                                    LOGO_STYLE_TILES['let-ai-choose']
                                  }
                                />
                                {field.value === key &&
                                  key !== 'let-ai-choose' && (
                                    <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                      <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                    </div>
                                  )}
                              </div>
                              <h4 className="font-medium text-sm mb-1">
                                {style.name}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {style.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* TLD Treatment Selection */}
            {showAdvanced && openPanel === 'text' && (
              <FormField
                control={form.control}
                name={'textTreatment'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a TLD treatment
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(LOGO_TEXT_TREATMENTS).map(
                          ([key, treatment]) => (
                            <Card
                              key={key}
                              className={cn(
                                'cursor-pointer transition-all hover:shadow-lg',
                                field.value === key && 'ring-2 ring-orange-500',
                              )}
                              onClick={() => {
                                field.onChange(key as LogoTextTreatmentInput);
                                setOpenPanel(null);
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                                  {key === 'let-ai-choose' ? (
                                    <TileGraphic
                                      tile={LOGO_STYLE_TILES['let-ai-choose']}
                                    />
                                  ) : (
                                    <img
                                      src={treatment.image}
                                      alt={treatment.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                  {field.value === key &&
                                    key !== 'let-ai-choose' && (
                                      <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                        <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                      </div>
                                    )}
                                </div>
                                <h4 className="font-medium text-sm mb-1">
                                  {treatment.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {treatment.description}
                                </p>
                              </CardContent>
                            </Card>
                          ),
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Typography Selection */}
            {showAdvanced && openPanel === 'typography' && (
              <FormField
                control={form.control}
                name={'typography'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose typography
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(LOGO_TYPOGRAPHY).map(
                          ([key, typography]) => (
                            <Card
                              key={key}
                              className={cn(
                                'cursor-pointer transition-all hover:shadow-lg',
                                field.value === key && 'ring-2 ring-orange-500',
                              )}
                              onClick={() => {
                                field.onChange(key as LogoTypographyInput);
                                setOpenPanel(null);
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                                  {key === 'let-ai-choose' ? (
                                    <TileGraphic
                                      tile={LOGO_STYLE_TILES['let-ai-choose']}
                                    />
                                  ) : (
                                    <img
                                      src={typography.image}
                                      alt={typography.name}
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                  {field.value === key &&
                                    key !== 'let-ai-choose' && (
                                      <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                        <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                      </div>
                                    )}
                                </div>
                                <h4 className="font-medium text-sm mb-1">
                                  {typography.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {typography.description}
                                </p>
                              </CardContent>
                            </Card>
                          ),
                        )}
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
                      Choose a model
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
                          <SelectValue placeholder="Select a model" />
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
          </>
        );
      }}
    </BaseGenerator>
  );
}
