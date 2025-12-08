/**
 * Layer-1 XML JSON schema for type mark:abstractMarkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const MarkAbstractMarkTypeXml = zloosen(z.object({}));

export type MarkAbstractMarkTypeXml = z.infer<typeof MarkAbstractMarkTypeXml>;
