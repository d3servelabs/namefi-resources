/**
 * Layer-1 XML JSON schema for type contact:trnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ContactTrnDataTypeXml = z.object({
  'contact:id': z.string().min(3).max(64),
  'contact:trStatus': z.enum([
    'clientApproved',
    'clientCancelled',
    'clientRejected',
    'pending',
    'serverApproved',
    'serverCancelled',
  ]),
  'contact:reID': z.string().min(3).max(64),
  'contact:reDate': z.string(),
  'contact:acID': z.string().min(3).max(64),
  'contact:acDate': z.string(),
});

export type ContactTrnDataTypeXml = z.infer<typeof ContactTrnDataTypeXml>;
