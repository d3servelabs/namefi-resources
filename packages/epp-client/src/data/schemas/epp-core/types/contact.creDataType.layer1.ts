/**
 * Layer-1 XML JSON schema for type contact:creDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactCreDataTypeXml = z.object({
  'contact:id': z.string().min(3).max(64),
  'contact:crDate': z.string(),
});

export type ContactCreDataTypeXml = z.infer<typeof ContactCreDataTypeXml>;
