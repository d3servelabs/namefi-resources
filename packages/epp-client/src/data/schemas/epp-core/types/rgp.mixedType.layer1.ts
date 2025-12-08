/**
 * Layer-1 XML JSON schema for type rgp:mixedType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const RgpMixedTypeXml = zloosen(z.object({}));

export type RgpMixedTypeXml = z.infer<typeof RgpMixedTypeXml>;
