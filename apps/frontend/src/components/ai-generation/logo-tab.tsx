import type { Generation } from '@/types/brand';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { type GeneratedItem, ImageGrid } from './image-grid';
import { LogoGenerator } from './logo-generator';

interface LogoTabProps {
  existingGenerations?: Generation[];
  brandDomain?: string;
  onGenerationUpdate?: () => void; // Callback to refresh generations
}

export function LogoTab({
  existingGenerations = [],
  brandDomain,
  onGenerationUpdate,
}: LogoTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastLogoPrompt, setLastLogoPrompt] = useState<{
    domain: string;
    type: string;
    style: string;
    description?: string;
  } | null>(null);

  const trpc = useTRPC();

  const generateLogoMutation = useMutation(
    trpc.ai.generateLogo.mutationOptions({
      onSuccess: (data, variables) => {
        if (data.output) {
          // Create a descriptive prompt for storage
          const promptParts = [
            `Logo for ${variables.brandName}`,
            `Type: ${variables.type}`,
            `Style: ${variables.style}`,
          ];

          if (variables.description) {
            promptParts.push(`Description: ${variables.description}`);
          }
          const prompt = promptParts.join(', ');

          const metadata = {
            logoType: variables.type,
            logoStyle: variables.style,
          };

          console.log('Logo generation completed, calling onComplete with:', {
            prompt,
            url: data.url,
            domain: variables.brandName,
            generationCallId: data.output.externalId || '',
            metadata,
          });

          // Refresh the generations list
          onGenerationUpdate?.();
        }
        setError(null);
      },
      onError: (error) => {
        setError(error.message || 'An error occurred');
        console.error('Error generating logo:', error);
      },
    }),
  );

  const handleGenerateLogos = (
    domain: string,
    type: string,
    style: string,
    description?: string,
  ) => {
    setError(null);
    setLastLogoPrompt({ domain, type, style, description });

    const payload: {
      brandName: string;
      type: string;
      style: string;
      description?: string;
    } = {
      brandName: domain,
      type,
      style,
    };

    if (description) {
      payload.description = description;
    }

    generateLogoMutation.mutate(payload);
  };

  const handleGenerateAnotherLogo = () => {
    if (lastLogoPrompt) {
      handleGenerateLogos(
        lastLogoPrompt.domain,
        lastLogoPrompt.type,
        lastLogoPrompt.style,
        lastLogoPrompt.description,
      );
    }
  };

  // Convert existing generations to GeneratedItem format
  const existingItems: GeneratedItem[] = existingGenerations.map((gen) => ({
    id: gen.id,
    url: gen.result,
    prompt: gen.prompt,
    timestamp: new Date(gen.createdAt).toISOString(),
    type: gen.metadata?.logoType,
    style: gen.metadata?.logoStyle,
  }));

  // Combine existing and newly generated items
  const allItems = [...existingItems];

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      <LogoGenerator
        onGenerate={handleGenerateLogos}
        isLoading={generateLogoMutation.isPending}
        fixedDomain={brandDomain}
      />
      <ImageGrid
        items={allItems}
        title="Generated Logos"
        isLoading={generateLogoMutation.isPending}
        onGenerateAnother={
          lastLogoPrompt ? handleGenerateAnotherLogo : undefined
        }
        brandDomain={brandDomain}
      />
    </>
  );
}
