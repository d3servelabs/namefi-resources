/**
 * Layer-1 XML JSON schema for type epp:svcMenuType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppExtURITypeXml } from './epp.extURIType.layer1';

export const EppSvcMenuTypeXml = zloosen(
  z.object({
    'epp:version': z
      .array(zloosen(z.object({ '#text': z.enum(['1.0']) })))
      .min(1),
    'epp:lang': z.array(zloosen(z.object({ '#text': z.string() }))).min(1),
    'epp:objURI': z.array(zloosen(z.object({ '#text': z.string() }))).min(1),
    'epp:svcExtension': EppExtURITypeXml.optional(),
  }),
);

export type EppSvcMenuTypeXml = z.infer<typeof EppSvcMenuTypeXml>;
