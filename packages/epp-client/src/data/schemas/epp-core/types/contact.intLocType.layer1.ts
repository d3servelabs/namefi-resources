/**
 * Layer-1 XML JSON schema for type contact:intLocType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactIntLocTypeXml = z.object({
  '@_type': z.enum(['loc', 'int']),
});

export type ContactIntLocTypeXml = z.infer<typeof ContactIntLocTypeXml>;
