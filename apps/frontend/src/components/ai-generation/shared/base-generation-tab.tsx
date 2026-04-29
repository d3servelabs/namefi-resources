import { type GeneratedItem, ImageGrid } from '../image-grid';
import { useMemo, type ReactNode } from 'react';
import {
  ANIMATION_MOTION_PRESETS,
  type AnimationMotionPresetId,
} from '@namefi-astra/ai/types';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import type { Generation } from './types';

interface LogoAction {
  label: string;
  onRequest: (generation: Generation) => void;
}

interface BaseGenerationTabProps {
  existingGenerations?: Generation[];
  brandDomain?: NamefiNormalizedDomain;

  // Generator component as children
  generator: ReactNode;

  // Title and conversion logic
  title: string;
  convertToGeneratedItems: (
    generations: Generation[],
    availableLogos?: Generation[],
  ) => GeneratedItem[];

  // Optional additional data for the conversion
  availableLogos?: Generation[];
  logoActions?: LogoAction[];
}

export function BaseGenerationTab({
  existingGenerations = [],
  brandDomain,
  generator,
  title,
  convertToGeneratedItems,
  availableLogos,
  logoActions,
}: BaseGenerationTabProps) {
  // Convert existing generations to GeneratedItem format
  const existingItems = convertToGeneratedItems(
    existingGenerations,
    availableLogos,
  );

  const generationMap = useMemo(() => {
    const map = new Map<string, Generation>();
    for (const generation of existingGenerations) {
      if (generation?.id) {
        map.set(generation.id, generation);
      }
    }
    return map;
  }, [existingGenerations]);

  const resolvedLogoActions = useMemo(() => {
    if (!logoActions?.length || existingGenerations.length === 0) {
      return undefined;
    }

    return logoActions.map((action) => ({
      label: action.label,
      onClick: (item: GeneratedItem) => {
        if (!item.id || item.kind !== 'logo') return;
        const generation = generationMap.get(item.id);
        if (!generation) return;
        if (generation.type !== 'logo' && generation.output?.type !== 'logo') {
          return;
        }
        action.onRequest(generation);
      },
    }));
  }, [existingGenerations.length, generationMap, logoActions]);

  return (
    <>
      {generator}

      <ImageGrid
        items={existingItems}
        title={title}
        brandDomain={brandDomain}
        logoActions={resolvedLogoActions}
      />
    </>
  );
}

// Helper functions for common conversion patterns
export const convertLogoGenerations = (
  generations: Generation[],
): GeneratedItem[] => {
  return generations.map((gen) => ({
    id: gen.id,
    url: gen.url,
    previewUrl: gen.thumbnailUrl ?? gen.url,
    thumbnailUrl: gen.thumbnailUrl,
    mimeType: gen.mimeType,
    timestamp: new Date(gen.createdAt).toISOString(),
    // Use resolved values from output when available (AI-chosen)
    type: gen.output?.type === 'logo' ? gen.output.logoType : undefined,
    style: gen.output?.type === 'logo' ? gen.output.logoStyle : undefined,
    kind: 'logo',
    domain: gen.domain,
  }));
};

export const convertPosterGenerations = (
  generations: Generation[],
  availableLogos: Generation[] = [],
): GeneratedItem[] => {
  return generations.map((gen) => ({
    id: gen.id,
    url: gen.url,
    previewUrl: gen.thumbnailUrl ?? gen.url,
    thumbnailUrl: gen.thumbnailUrl,
    mimeType: gen.mimeType,
    timestamp: new Date(gen.createdAt).toISOString(),
    kind: 'marketing',
    domain: gen.domain,
    // Show resolved collateral type when available
    type: (() => {
      const key =
        gen.output?.type === 'marketing'
          ? gen.output.collateralType
          : undefined;
      return key ?? undefined;
    })(),
    basedOnLogo: gen.referenceGenerationId
      ? (() => {
          const logo = availableLogos.find(
            (logo) => logo.id === gen.referenceGenerationId,
          );
          const logoPreviewUrl = logo?.thumbnailUrl ?? logo?.url;
          if (!logo || !logoPreviewUrl) {
            return undefined;
          }

          return {
            id: logo.id,
            result: logoPreviewUrl,
            metadata:
              logo.output?.type === 'logo'
                ? {
                    // Prefer output values if present
                    logoType: logo.output.logoType,
                    logoStyle: logo.output.logoStyle,
                  }
                : undefined,
          };
        })()
      : undefined,
  }));
};

const resolveAnimationGenerationPreviewUrl = (generation: Generation) => {
  if (
    generation.input?.type === 'animation' &&
    generation.input.mode === 'sheet-guided'
  ) {
    return generation.url;
  }

  return generation.thumbnailUrl ?? generation.url;
};

export const convertAnimationGenerations = (
  generations: Generation[],
  availableLogos: Generation[] = [],
): GeneratedItem[] => {
  const resolveMotionLabel = (generation: Generation) => {
    if (generation.input?.type !== 'animation') {
      return undefined;
    }

    const metadata =
      generation.metadata &&
      typeof generation.metadata === 'object' &&
      !Array.isArray(generation.metadata)
        ? generation.metadata
        : undefined;

    const resolvedMotionPreset =
      metadata &&
      'resolvedMotionPreset' in metadata &&
      typeof metadata.resolvedMotionPreset === 'string' &&
      metadata.resolvedMotionPreset in ANIMATION_MOTION_PRESETS
        ? (metadata.resolvedMotionPreset as AnimationMotionPresetId)
        : undefined;

    const inputMotionPreset =
      'motionPreset' in generation.input
        ? generation.input.motionPreset
        : undefined;

    const motionPreset =
      resolvedMotionPreset ??
      (inputMotionPreset && inputMotionPreset in ANIMATION_MOTION_PRESETS
        ? (inputMotionPreset as AnimationMotionPresetId)
        : undefined);

    return motionPreset
      ? ANIMATION_MOTION_PRESETS[motionPreset].name
      : undefined;
  };

  return generations.map((gen) => ({
    id: gen.id,
    url: gen.url,
    previewUrl: resolveAnimationGenerationPreviewUrl(gen),
    thumbnailUrl: gen.thumbnailUrl,
    mimeType: gen.mimeType,
    timestamp: new Date(gen.createdAt).toISOString(),
    kind: 'animation',
    domain: gen.domain,
    type: resolveMotionLabel(gen),
    basedOnLogo: gen.referenceGenerationId
      ? (() => {
          const logo = availableLogos.find(
            (candidate) => candidate.id === gen.referenceGenerationId,
          );
          const logoPreviewUrl = logo?.thumbnailUrl ?? logo?.url;
          if (!logo || !logoPreviewUrl) {
            return undefined;
          }

          return {
            id: logo.id,
            result: logoPreviewUrl,
            metadata:
              logo.output?.type === 'logo'
                ? {
                    logoType: logo.output.logoType,
                    logoStyle: logo.output.logoStyle,
                  }
                : undefined,
          };
        })()
      : undefined,
  }));
};
