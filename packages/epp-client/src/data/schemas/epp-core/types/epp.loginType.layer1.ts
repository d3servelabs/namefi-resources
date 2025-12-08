/**
 * Layer-1 XML JSON schema for type epp:loginType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppCredsOptionsTypeXml } from './epp.credsOptionsType.layer1.js';
import { EppLoginSvcTypeXml } from './epp.loginSvcType.layer1.js';

export const EppLoginTypeXml = z.object({
  'epp:clID': z.string().min(3).max(64),
  'epp:pw': z.string().min(6).max(16),
  'epp:newPW': z.string().min(6).max(16).optional(),
  'epp:options': EppCredsOptionsTypeXml,
  'epp:svcs': EppLoginSvcTypeXml,
});

export type EppLoginTypeXml = z.infer<typeof EppLoginTypeXml>;
