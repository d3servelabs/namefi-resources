/**
 * Layer-1 XML JSON schema for type epp:greetingType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppSvcMenuTypeXml } from './epp.svcMenuType.layer1.js';
import { EppDcpTypeXml } from './epp.dcpType.layer1.js';

export const EppGreetingTypeXml = z.object({
  'epp:svID': z.string().min(3).max(64),
  'epp:svDate': z.string(),
  'epp:svcMenu': EppSvcMenuTypeXml,
  'epp:dcp': EppDcpTypeXml,
});

export type EppGreetingTypeXml = z.infer<typeof EppGreetingTypeXml>;
