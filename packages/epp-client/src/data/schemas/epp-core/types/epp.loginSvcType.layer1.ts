/**
 * Layer-1 XML JSON schema for type epp:loginSvcType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppExtURITypeXml } from './epp.extURIType.layer1.js';

export const EppLoginSvcTypeXml = z.object({
  'epp:objURI': z.array(z.string()).min(1),
  'epp:svcExtension': EppExtURITypeXml.optional(),
});

export type EppLoginSvcTypeXml = z.infer<typeof EppLoginSvcTypeXml>;
