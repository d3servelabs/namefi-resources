'use client';

import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Textarea } from '@/components/ui/shadcn/textarea';
import type { Generation } from '@/types/brand';
import { Check } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { NamefiButton } from '../namefi-button';

interface MarketingImageGeneratorProps {
  onGenerate: (
    domain: string,
    description?: string,
    selectedLogoId?: string,
  ) => void;
  isLoading?: boolean;
  fixedDomain?: string; // When provided, domain input is hidden and this value is used
  availableLogos?: Generation[]; // Available logo generations for selection
}

export function MarketingImageGenerator({
  onGenerate,
  isLoading,
  fixedDomain,
  availableLogos = [],
}: MarketingImageGeneratorProps) {
  const [domain, setDomain] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<null | 'about' | 'logos'>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const domainToUse = fixedDomain || domain;
    if (domainToUse.trim()) {
      onGenerate(
        domainToUse,
        description || undefined,
        selectedLogoId || undefined,
      );
    }
  };

  const domainToUse = fixedDomain || domain;
  const selectedLogo = availableLogos.find(
    (logo) => logo.id === selectedLogoId,
  );

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

            <NamefiButton
              type="submit"
              disabled={isLoading || !domainToUse.trim()}
              className="ml-auto rounded-full"
            >
              {isLoading ? 'Generating...' : 'Generate Marketing Image'}
            </NamefiButton>
          </div>

          {/* Logo Selection */}
          {openPanel === 'logos' && availableLogos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Choose a logo to base your marketing image on
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedLogoId === null ? 'ring-2 ring-orange-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedLogoId(null);
                    setOpenPanel(null);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3 flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-gray-500 text-sm">No Logo</span>
                      {selectedLogoId === null && (
                        <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center rounded-lg">
                          <Check className="h-8 w-8 text-white bg-orange-500 rounded-full p-1" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-center">Generate without logo</p>
                  </CardContent>
                </Card>

                {availableLogos.map((logo) => (
                  <Card
                    key={logo.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedLogoId === logo.id ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedLogoId(logo.id);
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
                        {selectedLogoId === logo.id && (
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
            </div>
          )}

          {/* Description Field */}
          {openPanel === 'about' && (
            <div className="mb-6">
              <h3 className="text-gray-700 font-medium mb-3">
                Describe your marketing needs (optional)
              </h3>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your marketing goals and target audience"
                className="w-full resize-none"
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
