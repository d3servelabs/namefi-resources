import type { Generation } from '@namefi-astra/ai/types';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const trpc = useTRPC();

  const generateLogoMutation = useMutation(
    trpc.ai.generateLogo.mutationOptions({
      onSuccess: (data, variables) => {
        if (data.output) {
          onGenerationUpdate?.();
        }
      },
      onError: (error) => {
        toast.error(error.message || 'An error occurred generating logos');
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
      <LogoGenerator
        onGenerate={handleGenerateLogos}
        isLoading={generateLogoMutation.isPending}
        fixedDomain={brandDomain}
      />
      <ImageGrid
        items={allItems}
        title="Generated Logos"
        brandDomain={brandDomain}
        isLoading={generateLogoMutation.isPending}
      />
    </>
  );
}
