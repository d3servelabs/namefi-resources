'use client';

import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { z } from 'zod';
import { BaseGenerator, baseFormSchema } from './shared/base-generator';
import { ControlPanel } from './shared/form-fields';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { useMemo } from 'react';
import type { Generation } from './shared/types';

const posterFormSchema = baseFormSchema.extend({
  selectedLogoId: z.string().uuid(),
});

type PosterFormData = z.infer<typeof posterFormSchema>;

// Export the schema and type for use in other components
export { posterFormSchema };
export type { PosterFormData };

interface PosterGeneratorProps {
  onGenerate: (data: PosterFormData) => void;
  isLoading?: boolean;
  fixedDomain?: NamefiNormalizedDomain;
  availableLogos?: Generation[];
  latestGeneration?: Generation;
  onGenerateMore?: () => void;
}

export function PosterGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
  availableLogos = [],
  latestGeneration,
  onGenerateMore,
}: PosterGeneratorProps) {
  const defaultValues = useMemo(() => {
    return {
      domain: fixedDomain || '',
      description: '',
      selectedLogoId: availableLogos.length > 0 ? availableLogos[0].id : '',
    };
  }, [fixedDomain, availableLogos]);

  return (
    <BaseGenerator
      onSubmit={onGenerate}
      isLoading={isLoading}
      fixedDomain={fixedDomain}
      formSchema={posterFormSchema}
      defaultValues={defaultValues}
      submitButtonText={
        availableLogos.length > 0
          ? 'Generate'
          : 'Select a brand below or generate a logo'
      }
      submitLoadingText="Generating"
      latestGeneration={latestGeneration}
      onGenerateMore={onGenerateMore}
    >
      {({ form, openPanel, setOpenPanel }) => {
        const selectedLogoId = form.watch('selectedLogoId');
        const selectedLogo = availableLogos.find(
          (logo) => logo.id === selectedLogoId,
        );

        const controlButtons: Array<{
          key: string;
          label: string;
          badge?: string;
          onClick: () => void;
          isActive: boolean;
        }> = [];

        // Add logo button only if there are available logos
        if (availableLogos.length > 0) {
          controlButtons.push({
            key: 'logos',
            label: 'Use Logo',
            badge: selectedLogo ? 'Selected' : undefined,
            onClick: () => setOpenPanel(openPanel === 'logos' ? null : 'logos'),
            isActive: openPanel === 'logos',
          });
        }

        controlButtons.push({
          key: 'description',
          label: 'Description',
          onClick: () =>
            setOpenPanel(openPanel === 'description' ? null : 'description'),
          isActive: openPanel === 'description',
        });

        return (
          <>
            {/* Control Buttons */}
            <ControlPanel buttons={controlButtons} />

            {/* Logo Selection */}
            {openPanel === 'logos' && availableLogos.length > 0 && (
              <FormField
                control={form.control}
                name={'selectedLogoId'}
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a logo to base your poster on
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {availableLogos.map((logo) => (
                          <Card
                            key={logo.id}
                            className={cn(
                              'cursor-pointer transition-all hover:shadow-lg',
                              field.value === logo.id &&
                                'ring-2 ring-orange-500',
                            )}
                            onClick={() => {
                              field.onChange(logo.id);
                              setOpenPanel(null);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                                <img
                                  src={logo.url}
                                  alt={logo.domain}
                                  className="w-full h-full object-cover"
                                />
                                {field.value === logo.id && (
                                  <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-secondary-foreground bg-orange-500 rounded-full p-1" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                {logo.input?.type === 'logo' && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded block text-center">
                                    {logo.input.logoType}
                                  </span>
                                )}
                                {logo.input?.type === 'logo' && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded block text-center">
                                    {logo.input.logoStyle}
                                  </span>
                                )}
                              </div>
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
          </>
        );
      }}
    </BaseGenerator>
  );
}
