/**
 * Layer-1 XML JSON schema for type epp:greetingType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppSvcMenuTypeXml } from './epp.svcMenuType.layer1.js';
import { EppDcpTypeXml } from './epp.dcpType.layer1.js';

export const EppGreetingTypeXml = zloosen(
  z.object({
    'epp:svID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'epp:svDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'epp:svcMenu': EppSvcMenuTypeXml,
    'epp:dcp': EppDcpTypeXml,
  }),
);

export type EppGreetingTypeXml = z.infer<typeof EppGreetingTypeXml>;
