import type { Generation } from './types';

type ReadyLogoOutput = Extract<
  NonNullable<Generation['output']>,
  { type: 'logo' }
> & {
  storagePath: string;
};

type ReadyLogoMedia =
  | (Pick<Generation, 'thumbnailUrl'> & {
      url: NonNullable<Generation['url']>;
    })
  | (Pick<Generation, 'url'> & {
      thumbnailUrl: NonNullable<Generation['thumbnailUrl']>;
    });

export type ReadyLogoGenerationFields = Pick<
  Generation,
  'output' | 'status' | 'type'
> &
  ReadyLogoMedia & {
    type: 'logo';
    status: 'SUCCEEDED';
    output: ReadyLogoOutput;
  };

export type ReadyLogoGeneration = Generation & ReadyLogoGenerationFields;

export type ReadyLogoSource = Pick<Generation, 'domain' | 'id'> &
  ReadyLogoGenerationFields;

export function isReadyLogoGeneration(
  generation: Generation | undefined | null,
): generation is ReadyLogoGeneration;
export function isReadyLogoGeneration(
  generation: Partial<Generation> | undefined | null,
): generation is ReadyLogoGenerationFields;
export function isReadyLogoGeneration(
  generation: Partial<Generation> | undefined | null,
): generation is ReadyLogoGenerationFields {
  return (
    generation?.type === 'logo' &&
    generation.status === 'SUCCEEDED' &&
    generation.output?.type === 'logo' &&
    Boolean(generation.output.storagePath) &&
    Boolean(generation.url ?? generation.thumbnailUrl)
  );
}

export function filterReadyLogoGenerations<
  GenerationT extends Partial<Generation>,
>(
  generations: readonly GenerationT[],
): Array<GenerationT & ReadyLogoGenerationFields> {
  return generations.filter(
    (generation): generation is GenerationT & ReadyLogoGenerationFields =>
      isReadyLogoGeneration(generation),
  );
}
