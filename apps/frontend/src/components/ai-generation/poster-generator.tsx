'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/shadcn/form';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { Generation } from '@namefi-astra/ai/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NamefiButton } from '../namefi-button';

const posterFormSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  description: z.string().optional(),
  selectedLogoId: z.string().optional(),
});

type PosterFormData = z.infer<typeof posterFormSchema>;

interface PosterGeneratorProps {
  onGenerate: (
    domain: string,
    description?: string,
    selectedLogoId?: string,
  ) => void;
  isLoading?: boolean;
  fixedDomain?: string; // When provided, domain input is hidden and this value is used
  availableLogos?: Generation[]; // Available logo generations for selection
}

export function PosterGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
  availableLogos = [],
}: PosterGeneratorProps) {
  const [openPanel, setOpenPanel] = useState<null | 'about' | 'logos'>(null);

  const form = useForm<PosterFormData>({
    resolver: zodResolver(posterFormSchema),
    defaultValues: {
      domain: fixedDomain || '',
      description: '',
      selectedLogoId: '',
    },
  });

  const handleSubmit = (data: PosterFormData) => {
    const domainToUse = fixedDomain || data.domain;
    if (domainToUse?.trim()) {
      onGenerate(
        domainToUse,
        data.description || undefined,
        data.selectedLogoId || undefined,
      );
    }
  };

  const selectedLogoId = form.watch('selectedLogoId');
  const domainToUse = fixedDomain || form.watch('domain');
  const selectedLogo = availableLogos.find(
    (logo) => logo.id === selectedLogoId,
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-6xl mx-auto flex flex-col"
      >
        <Card>
          <CardContent>
            {/* Domain Input - Hidden when fixedDomain is provided */}
            {!fixedDomain && (
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Enter your domain (e.g., example.com)"
                        className="w-full h-14 px-6 text-lg rounded-2xl"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Fixed Domain Display */}
            {fixedDomain && (
              <div className="mb-6">
                <div className="w-full h-14 px-6 text-lg rounded-2xl border border-gray-200 bg-gray-50 flex items-center text-gray-700">
                  {fixedDomain}
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex flex-wrap gap-4">
              {availableLogos.length > 0 && (
                <Button
                  type="button"
                  variant={openPanel === 'logos' ? 'default' : 'outline'}
                  onClick={() =>
                    setOpenPanel(openPanel === 'logos' ? null : 'logos')
                  }
                  className="rounded-full"
                >
                  Use Logo
                  {selectedLogo && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Selected
                    </span>
                  )}
                </Button>
              )}

              <Button
                type="button"
                variant={openPanel === 'about' ? 'default' : 'outline'}
                onClick={() =>
                  setOpenPanel(openPanel === 'about' ? null : 'about')
                }
                className="rounded-full"
              >
                Description
              </Button>
            </div>

            {/* Logo Selection */}
            {openPanel === 'logos' && availableLogos.length > 0 && (
              <FormField
                control={form.control}
                name="selectedLogoId"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-lg font-semibold">
                      Choose a logo to base your poster on
                    </FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <Card
                          className={cn(
                            'cursor-pointer transition-all hover:shadow-lg',
                            !field.value && 'ring-2 ring-orange-500',
                          )}
                          onClick={() => {
                            field.onChange('');
                            setOpenPanel(null);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="relative aspect-square mb-3 flex items-center justify-center bg-gray-100 rounded-lg">
                              <span className="text-gray-500 text-sm">
                                No Logo
                              </span>
                              {!field.value && (
                                <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center rounded-lg">
                                  <Check className="h-8 w-8 text-white bg-orange-500 rounded-full p-1" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-center">
                              Generate without logo
                            </p>
                          </CardContent>
                        </Card>

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
                                  src={logo.result}
                                  alt={logo.prompt}
                                  className="w-full h-full object-cover"
                                />
                                {field.value === logo.id && (
                                  <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                                    <Check className="h-8 w-8 text-white bg-orange-500 rounded-full p-1" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-1">
                                {logo.metadata?.logoType && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded block text-center">
                                    {logo.metadata.logoType}
                                  </span>
                                )}
                                {logo.metadata?.logoStyle && (
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded block text-center">
                                    {logo.metadata.logoStyle}
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

            {/* Description Field */}
            {openPanel === 'about' && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-gray-700 font-medium">
                      Describe your poster needs (optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us about your poster needs and target audience"
                        className="w-full resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>
        <NamefiButton
          type="submit"
          disabled={isLoading || !domainToUse?.trim()}
          className="self-center mt-8 w-90 text-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate
            </>
          )}
        </NamefiButton>
      </form>
    </Form>
  );
}
