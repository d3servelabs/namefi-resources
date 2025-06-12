'use client';

import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import { LOGO_STYLES, LOGO_TYPES } from '@/lib/types/logo-options';
import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { NamefiButton } from '../namefi-button';

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
  const [domain, setDomain] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [description, setDescription] = useState('');
  const [openPanel, setOpenPanel] = useState<null | 'type' | 'style' | 'about'>(
    null,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const domainToUse = fixedDomain || domain;
    if (domainToUse.trim()) {
      onGenerate(
        domainToUse,
        selectedType,
        selectedStyle,
        description || undefined,
      );
    }
  };

  const getTypeDisplay = () => {
    if (!selectedType) return null;
    const type = LOGO_TYPES[selectedType as keyof typeof LOGO_TYPES];
    return type ? type.name : selectedType;
  };

  const getStyleDisplay = () => {
    if (!selectedStyle) return null;
    const style = LOGO_STYLES[selectedStyle as keyof typeof LOGO_STYLES];
    return style ? style.name : selectedStyle;
  };

  const domainToUse = fixedDomain || domain;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
      <Card>
        <CardContent className="p-8">
          {/* Domain Input - Hidden when fixedDomain is provided */}
          {!fixedDomain && (
            <div className="mb-6">
              <Input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter your domain (e.g., example.com)"
                className="w-full h-14 px-6 text-lg rounded-2xl"
                required={true}
              />
            </div>
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
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              type="button"
              variant={openPanel === 'type' ? 'default' : 'outline'}
              onClick={() => setOpenPanel(openPanel === 'type' ? null : 'type')}
              className="rounded-full"
            >
              Type
              {selectedType && (
                <Badge variant="secondary" className="ml-1">
                  {getTypeDisplay()}
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
                  {getStyleDisplay()}
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

            <NamefiButton
              type="submit"
              disabled={isLoading || !domainToUse.trim()}
              className="ml-auto rounded-full"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </NamefiButton>
          </div>

          {/* Description Field */}
          {openPanel === 'about' && (
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-3">
                Describe your brand (optional)
              </h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about your brand vision"
                className="w-full resize-none"
                rows={4}
              />
            </div>
          )}

          {/* Type Selection Tiles */}
          {openPanel === 'type' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Choose a type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(LOGO_TYPES).map(([key, type]) => (
                  <Card
                    key={key}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-lg',
                      selectedType === key && 'ring-2 ring-orange-500',
                    )}
                    onClick={() => {
                      setSelectedType(key);
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
                        {selectedType === key && (
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
                      <h4 className="font-medium text-sm mb-1">{type.name}</h4>
                      <p className="text-xs text-gray-500">
                        {type.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Style Selection Tiles */}
          {openPanel === 'style' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Choose a style</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {Object.entries(LOGO_STYLES).map(([key, style]) => (
                  <Card
                    key={key}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-lg',
                      selectedStyle === key && 'ring-2 ring-orange-500',
                    )}
                    onClick={() => {
                      setSelectedStyle(key);
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
                        {selectedStyle === key && (
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
                      <h4 className="font-medium text-sm mb-1">{style.name}</h4>
                      <p className="text-xs text-gray-500">
                        {style.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
