/** biome-ignore-all lint/performance/noImgElement: using <img> for tile previews */
'use client';

import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { LOGO_STYLES, LOGO_TYPES } from '@/lib/ai-generation-logo-options';
import { cn } from '@/lib/cn';
import { Check, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { BaseGenerator, baseFormSchema } from './shared/base-generator';
import { ControlPanel } from './shared/form-fields';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useMemo, useState } from 'react';
import type { Generation } from './shared/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import type {
  ImageModel as Model,
  LogoStyleInput,
  LogoTypeInput,
} from '@namefi-astra/ai/client';
import { Switch } from '@/components/ui/shadcn/switch';
import { Label } from '@/components/ui/shadcn/label';

const logoTypeOptions = Object.keys(LOGO_TYPES) as LogoTypeInput[];
const logoStyleOptions = Object.keys(LOGO_STYLES) as LogoStyleInput[];

const logoFormSchema = baseFormSchema.extend({
  type: z
    .enum(logoTypeOptions as [LogoTypeInput, ...LogoTypeInput[]])
    .default('let-ai-choose'),
  style: z
    .enum(logoStyleOptions as [LogoStyleInput, ...LogoStyleInput[]])
    .default('let-ai-choose'),
  model: z
    .enum(['gpt-image-1', 'gemini-2.5-flash-image'])
    .default('gpt-image-1'),
});

type LogoFormData = z.infer<typeof logoFormSchema>;

// Export the schema and type for use in other components
export { logoFormSchema };
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

  const getModelDisplay = (model: Model) =>
    model === 'gemini-2.5-flash-image' ? 'Gemini' : 'OpenAI';

  const defaultValues = useMemo(() => {
    return {
      domain: fixedDomain || '',
      type: LOGO_TYPES['let-ai-choose'].id,
      style: LOGO_STYLES['let-ai-choose'].id,
      description: '',
      model: 'gpt-image-1' as Model,
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
    >
      {({ form, openPanel, setOpenPanel }) => {
        const selectedType = form.watch('type');
        const selectedStyle = form.watch('style');
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
                                <img
                                  src={type.image}
                                  alt={type.name}
                                  className="w-full h-full object-cover"
                                />
                                {field.value === key && (
                                  <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                  </div>
                                )}
                                {key === 'let-ai-choose' && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-secondary-foreground" />
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
                                <img
                                  src={style.image}
                                  alt={style.name}
                                  className="w-full h-full object-cover"
                                />
                                {field.value === key && (
                                  <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                  </div>
                                )}
                                {key === 'let-ai-choose' && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-secondary-foreground" />
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
                          field.onChange(val as Model);
                          setOpenPanel(null);
                        }}
                      >
                        <SelectTrigger className="w-full max-w-sm">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gemini-2.5-flash-image">
                            Gemini
                          </SelectItem>
                          <SelectItem value="gpt-image-1">OpenAI</SelectItem>
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
