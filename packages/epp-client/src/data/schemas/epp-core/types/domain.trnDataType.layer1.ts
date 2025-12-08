/**
 * Layer-1 XML JSON schema for type domain:trnDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainTrnDataTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
  'domain:trStatus': z.enum([
    'clientApproved',
    'clientCancelled',
    'clientRejected',
    'pending',
    'serverApproved',
    'serverCancelled',
  ]),
  'domain:reID': z.string().min(3).max(64),
  'domain:reDate': z.string(),
  'domain:acID': z.string().min(3).max(64),
  'domain:acDate': z.string(),
  'domain:exDate': z.string().optional(),
});

export type DomainTrnDataTypeXml = z.infer<typeof DomainTrnDataTypeXml>;
