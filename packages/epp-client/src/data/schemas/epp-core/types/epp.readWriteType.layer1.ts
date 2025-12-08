/**
 * Layer-1 XML JSON schema for type epp:readWriteType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppReadWriteTypeXml = zloosen(z.object({}));

export type EppReadWriteTypeXml = z.infer<typeof EppReadWriteTypeXml>;
