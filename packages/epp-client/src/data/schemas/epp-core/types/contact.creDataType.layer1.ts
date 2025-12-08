/**
 * Layer-1 XML JSON schema for type contact:creDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const ContactCreDataTypeXml = zloosen(
  z.object({
    'contact:id': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:crDate': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type ContactCreDataTypeXml = z.infer<typeof ContactCreDataTypeXml>;
