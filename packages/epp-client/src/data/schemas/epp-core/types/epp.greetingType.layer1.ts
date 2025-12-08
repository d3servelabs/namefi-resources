/**
 * Layer-1 XML JSON schema for type epp:greetingType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppSvcMenuTypeXml } from './epp.svcMenuType.layer1';
import { EppDcpTypeXml } from './epp.dcpType.layer1';

export const EppGreetingTypeXml = zloosen(
  z.object({
    'epp:svID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'epp:svDate': zloosen(z.object({ '#text': z.string() })),
    'epp:svcMenu': EppSvcMenuTypeXml,
    'epp:dcp': EppDcpTypeXml,
  }),
);

export type EppGreetingTypeXml = z.infer<typeof EppGreetingTypeXml>;
