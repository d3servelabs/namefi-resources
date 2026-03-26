import type { Metadata } from 'next';
import { proxyUnauthenticatedClient } from '@/lib/trpc/server';
import { cache } from 'react';
import { GenerationDetailsClient } from '@/components/generation-details';

type Props = {
  params: Promise<{ generationId: string }>;
};

// Cache the generation query to avoid duplicate API calls
const getGeneration = cache(async (generationId: string) => {
  return proxyUnauthenticatedClient.ai.getGenerationById.query({
    id: generationId,
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { generationId } = await params;

  try {
    const generation = await getGeneration(generationId);

    const hasGeneration = !!generation;
    const generationLabel = hasGeneration
      ? generation.type === 'animation'
        ? 'logo animation'
        : generation.type === 'marketing'
          ? 'marketing image'
          : 'logo image'
      : 'brand asset';
    const title = hasGeneration
      ? `AI-generated ${generationLabel} for ${generation.domain}`
      : 'AI Brand Generation';
    const description = hasGeneration
      ? generation.type === 'logo'
        ? `AI-generated logo design for ${generation.domain}. Created with advanced AI technology to help establish your brand identity with professional logo design.`
        : generation.type === 'animation'
          ? `AI-generated logo animation for ${generation.domain}. Motion-ready brand visuals created with artificial intelligence for premium social and product storytelling.`
          : `AI-generated marketing image for ${generation.domain}. Professional marketing visuals created with artificial intelligence to enhance your brand presence and promotional materials.`
      : 'View AI-generated brand assets.';
    const canonicalPath = `/ai-brand-generator/${generationId}`;
    const openGraphImagePath = `${canonicalPath}/opengraph-image`;

    return {
      title,
      description,
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title,
        description,
        type: 'website',
        url: canonicalPath,
        images: [
          {
            url: openGraphImagePath,
            width: 1200,
            height: 630,
          },
        ],
      },
      alternates: {
        canonical: canonicalPath,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        site: '@namefi_io',
        creator: '@namefi_io',
        images: [
          {
            url: openGraphImagePath,
            width: 1200,
            height: 630,
          },
        ],
      },
    };
  } catch {
    // Fallback metadata if the API call fails
    return {
      title: 'AI Brand Generation',
      description: 'View AI-generated brand assets.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }
}

export default async function GenerationPage({ params }: Props) {
  const { generationId } = await params;

  try {
    const generation = await getGeneration(generationId);
    if (!generation) {
      return (
        <GenerationDetailsClient
          domain=""
          generationId={generationId}
          error="Generation not found"
        />
      );
    }

    return (
      <GenerationDetailsClient
        domain={generation.domain ?? ''}
        generationId={generationId}
        initialGeneration={generation}
      />
    );
  } catch {
    return (
      <GenerationDetailsClient
        domain=""
        generationId={generationId}
        error="Failed to load generation"
      />
    );
  }
}
