/**
 * Registrar Error Factory Functions
 *
 * These factory functions convert registrar-specific errors into unified RegistrarError types.
 */

export {
  createRegistrarErrorFromR53,
  type CreateFromR53Options,
} from './from-r53';

export {
  createRegistrarErrorFromDynadot,
  isDynadotResponseFailed,
  type CreateFromDynadotOptions,
  type DynadotErrorResponse,
} from './from-dynadot';

export {
  createRegistrarErrorFromEpp,
  type CreateFromEppOptions,
} from './from-epp';
