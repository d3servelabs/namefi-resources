'use client';

import { Badge } from '@/components/ui/shadcn/badge';
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
import { LOGO_STYLES, LOGO_TYPES } from '@/lib/types/logo-options';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { NamefiButton } from '../namefi-button';

const logoFormSchema = z.object({
  domain: namefiNormalizedDomainSchema,
  type: z.string().min(1, 'Logo type is required'),
  style: z.string().min(1, 'Logo style is required'),
  description: z.string().optional(),
});

type LogoFormData = z.infer<typeof logoFormSchema>;

interface LogoGeneratorProps {
  onGenerate: (
    domain: string,
    type: string,
    style: string,
    description?: string,
  ) => void;
  isLoading?: boolean;
  fixedDomain?: string; // When provided, domain input is hidden and this value is used
}

export function LogoGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
}: LogoGeneratorProps) {
  const [openPanel, setOpenPanel] = useState<null | 'type' | 'style' | 'about'>(
    null,
  );

  const form = useForm<LogoFormData>({
    resolver: zodResolver(logoFormSchema),
    defaultValues: {
      domain: fixedDomain || '',
      type: 'let-ai-choose',
      style: 'let-ai-choose',
      description: '',
    },
  });

  const handleSubmit = (data: LogoFormData) => {
    const domainToUse = fixedDomain || data.domain;
    if (domainToUse?.trim()) {
      onGenerate(
        domainToUse,
        data.type,
        data.style,
        data.description || undefined,
      );
    }
  };

  const getTypeDisplay = (type: string) => {
    const logoType = LOGO_TYPES[type as keyof typeof LOGO_TYPES];
    return logoType ? logoType.name : type;
  };

  const getStyleDisplay = (style: string) => {
    const logoStyle = LOGO_STYLES[style as keyof typeof LOGO_STYLES];
    return logoStyle ? logoStyle.name : style;
  };

  const selectedType = form.watch('type');
  const selectedStyle = form.watch('style');
  const domainToUse = fixedDomain || form.watch('domain');

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
              <Button
                type="button"
                variant={openPanel === 'type' ? 'default' : 'outline'}
                onClick={() =>
                  setOpenPanel(openPanel === 'type' ? null : 'type')
                }
                className="rounded-full"
              >
                Type
                {selectedType && (
                  <Badge variant="secondary" className="ml-1">
                    {getTypeDisplay(selectedType)}
                  </Badge>
                )}
              </Button>

              <Button
                type="button"
                variant={openPanel === 'style' ? 'default' : 'outline'}
                onClick={() =>
                  setOpenPanel(openPanel === 'style' ? null : 'style')
                }
                className="rounded-full"
              >
                Style
                {selectedStyle && (
                  <Badge variant="secondary" className="ml-1">
                    {getStyleDisplay(selectedStyle)}
                  </Badge>
                )}
              </Button>

              <Button
                type="button"
                variant={openPanel === 'about' ? 'default' : 'outline'}
                onClick={() =>
                  setOpenPanel(openPanel === 'about' ? null : 'about')
                }
                className="rounded-full"
              >
                Brand Vision
              </Button>
            </div>

            {/* Description Field */}
            {openPanel === 'about' && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel className="text-gray-700 font-medium">
                      Describe your brand (optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us more about your brand vision"
                        className="w-full resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Type Selection Tiles */}
            {openPanel === 'type' && (
              <FormField
                control={form.control}
                name="type"
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
                                    <Check className="h-8 w-8 text-white bg-orange-500 rounded-full p-1" />
                                  </div>
                                )}
                                {key === 'let-ai-choose' && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-white" />
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
            {openPanel === 'style' && (
              <FormField
                control={form.control}
                name="style"
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
                                    <Check className="h-8 w-8 text-white bg-orange-500 rounded-full p-1" />
                                  </div>
                                )}
                                {key === 'let-ai-choose' && (
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Sparkles className="h-8 w-8 text-white" />
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
