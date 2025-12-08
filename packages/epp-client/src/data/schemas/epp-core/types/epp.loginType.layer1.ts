/**
 * Layer-1 XML JSON schema for type epp:loginType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppCredsOptionsTypeXml } from './epp.credsOptionsType.layer1';
import { EppLoginSvcTypeXml } from './epp.loginSvcType.layer1';

export const EppLoginTypeXml = zloosen(
  z.object({
    'epp:clID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'epp:pw': zloosen(z.object({ '#text': z.string().min(6).max(16) })),
    'epp:newPW': zloosen(
      z.object({ '#text': z.string().min(6).max(16) }),
    ).optional(),
    'epp:options': EppCredsOptionsTypeXml,
    'epp:svcs': EppLoginSvcTypeXml,
  }),
);

export type EppLoginTypeXml = z.infer<typeof EppLoginTypeXml>;
