/**
 * Layer-1 XML JSON schema for type contact:addrType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactAddrTypeXml = z.object({
  'contact:street': z.array(z.string().max(255)).optional(),
  'contact:city': z.string().min(1).max(255),
  'contact:sp': z.string().max(255).optional(),
  'contact:pc': z.string().max(16).optional(),
  'contact:cc': z.string(),
});

export type ContactAddrTypeXml = z.infer<typeof ContactAddrTypeXml>;
