/**
 * Layer-1 XML JSON schema for type epp:dcpRecipientType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppDcpOursTypeXml } from './epp.dcpOursType.layer1.js';

export const EppDcpRecipientTypeXml = z.object({
  'epp:other': z.string().optional(),
  'epp:ours': z.array(EppDcpOursTypeXml).optional(),
  'epp:public': z.string().optional(),
  'epp:same': z.string().optional(),
  'epp:unrelated': z.string().optional(),
});

export type EppDcpRecipientTypeXml = z.infer<typeof EppDcpRecipientTypeXml>;
