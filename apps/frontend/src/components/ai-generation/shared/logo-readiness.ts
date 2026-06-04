import type { Generation } from './types';

export function isReadyLogoGeneration(
  generation: Partial<Generation> | undefined | null,
): generation is Generation {
  return (
    generation?.type === 'logo' &&
    generation.status === 'SUCCEEDED' &&
    generation.output?.type === 'logo' &&
    Boolean(generation.output.storagePath) &&
    Boolean(generation.url ?? generation.thumbnailUrl)
  );
}
