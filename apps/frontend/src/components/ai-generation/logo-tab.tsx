import type { Generation } from '@/types/brand';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { type GeneratedItem, ImageGrid } from './image-grid';
import { LogoGenerator } from './logo-generator';

interface LogoTabProps {
  onComplete?: (
    prompt: string,
    result: string,
    domain: string,
    generationCallId: string,
    metadata?: {
      logoType?: string;
      logoStyle?: string;
      generationCallId?: string;
    },
  ) => void;
  existingGenerations?: Generation[];
  brandDomain?: string;
  onGenerationUpdate?: () => void; // Callback to refresh generations
}

export function LogoTab({
  onComplete,
  existingGenerations = [],
  brandDomain,
  onGenerationUpdate,
}: LogoTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [lastLogoPrompt, setLastLogoPrompt] = useState<{
    domain: string;
    type?: string;
    style?: string;
    description?: string;
  } | null>(null);

  const trpc = useTRPC();

  const generateLogoMutation = useMutation(
    trpc.ai.generateLogo.mutationOptions({
      onSuccess: (data, variables) => {
        if (data.logo) {
          // Create a descriptive prompt for storage
          const promptParts = [`Logo for ${variables.brandName}`];
          if (variables.type) promptParts.push(`Type: ${variables.type}`);
          if (variables.style) promptParts.push(`Style: ${variables.style}`);
          if (variables.description)
            promptParts.push(`Description: ${variables.description}`);
          const prompt = promptParts.join(', ');

          // Create metadata object with only defined values
          const metadata: {
            logoType?: string;
            logoStyle?: string;
          } = {};

          if (variables.type) metadata.logoType = variables.type;
          if (variables.style) metadata.logoStyle = variables.style;

          console.log('Logo generation completed, calling onComplete with:', {
            prompt,
            url: data.logo.url,
            domain: variables.brandName,
            generationCallId: data.logo.generationCallId,
            metadata,
          });

          // Call parent to save to storage
          onComplete?.(
            prompt,
            data.logo.url,
            variables.brandName,
            data.logo.generationCallId || '',
            metadata,
          );

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

  const handleGenerateLogos = async (
    domain: string,
    type?: string,
    style?: string,
    description?: string,
  ) => {
    setError(null);
    setLastLogoPrompt({ domain, type, style, description });

    const payload: {
      brandName: string;
      type?: string;
      style?: string;
      description?: string;
    } = {
      brandName: domain,
    };

    if (type) payload.type = type;
    if (style) payload.style = style;
    if (description) payload.description = description;

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
