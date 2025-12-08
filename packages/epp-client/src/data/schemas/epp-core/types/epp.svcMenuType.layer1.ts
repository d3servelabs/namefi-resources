/**
 * Layer-1 XML JSON schema for type epp:svcMenuType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppExtURITypeXml } from './epp.extURIType.layer1.js';

export const EppSvcMenuTypeXml = z.object({
  'epp:version': z.array(z.enum(['1.0'])).min(1),
  'epp:lang': z.array(z.string()).min(1),
  'epp:objURI': z.array(z.string()).min(1),
  'epp:svcExtension': EppExtURITypeXml.optional(),
});

export type EppSvcMenuTypeXml = z.infer<typeof EppSvcMenuTypeXml>;
