import type { Metadata } from 'next';
import { proxyUnauthenticatedClient } from '@/utils/trpc/server';
import { secrets } from '@/lib/env';
import { cache } from 'react';
import { GenerationDetailsClient } from '@/components/generation-details';

type Props = {
  params: Promise<{ domain: string; generationId: string }>;
};

// Cache the generation query to avoid duplicate API calls
const getGeneration = cache(async (generationId: string) => {
  return proxyUnauthenticatedClient.ai.getGenerationById.query({
    id: generationId,
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain, generationId } = await params;

  try {
    const generation = await getGeneration(generationId);

    if (!generation) {
      return {
        title: `AI Generation for ${domain}`,
        description: `View AI-generated brand assets for ${domain}`,
      };
    }

    // Create metadata based on the generation data
    const title = `AI-generated ${generation.type} image for ${domain}`;
    const description =
      generation.type === 'logo'
        ? `AI-generated logo design for ${domain}. Created with advanced AI technology to help establish your brand identity with professional logo design.`
        : `AI-generated marketing image for ${domain}. Professional marketing visuals created with artificial intelligence to enhance your brand presence and promotional materials.`;

    return {
      title,
      description,
      metadataBase: new URL(
        `${secrets.NEXT_PUBLIC_VERCEL_URL}/ai-brand-generator/brand/${domain}/${generationId}`,
      ),
      openGraph: {
        title,
        description,
        type: 'website',
        url: '/',
        images: [
          {
            url: '/opengraph-image',
            width: 1200,
            height: 630,
          },
        ],
      },
      alternates: {
        canonical: '/',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        creator: '@namefi_io',
        images: [
          {
            url: '/opengraph-image',
            width: 1200,
            height: 630,
          },
        ],
      },
    };
  } catch (error) {
    console.error('Error fetching generation metadata:', error);
    // Fallback metadata if the API call fails
    return {
      title: `AI Generation for ${domain}`,
      description: `View AI-generated brand assets for ${domain}`,
    };
  }
}

export default async function GenerationPage({ params }: Props) {
  const { domain, generationId } = await params;

  try {
    const generation = await getGeneration(generationId);

    return (
      <GenerationDetailsClient
        domain={domain}
        generationId={generationId}
        initialGeneration={generation}
      />
    );
  } catch (error) {
    console.error('Error fetching generation:', error);
    return (
      <GenerationDetailsClient
        domain={domain}
        generationId={generationId}
        error="Failed to load generation"
      />
    );
  }
}
