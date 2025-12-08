/**
 * Layer-1 XML JSON schema for type epp:loginSvcType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppExtURITypeXml } from './epp.extURIType.layer1';

export const EppLoginSvcTypeXml = zloosen(
  z.object({
    'epp:objURI': z.array(zloosen(z.object({ '#text': z.string() }))).min(1),
    'epp:svcExtension': EppExtURITypeXml.optional(),
  }),
);

export type EppLoginSvcTypeXml = z.infer<typeof EppLoginSvcTypeXml>;
