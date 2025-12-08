/**
 * Layer-1 XML JSON schema for type epp:loginType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppCredsOptionsTypeXml } from './epp.credsOptionsType.layer1.js';
import { EppLoginSvcTypeXml } from './epp.loginSvcType.layer1.js';

export const EppLoginTypeXml = zloosen(
  z.object({
    'epp:clID': z.union([
      z.string().min(3).max(64),
      zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    ]),
    'epp:pw': z.union([
      z.string().min(6).max(16),
      zloosen(z.object({ '#text': z.string().min(6).max(16) })),
    ]),
    'epp:newPW': z
      .union([
        z.string().min(6).max(16),
        zloosen(z.object({ '#text': z.string().min(6).max(16) })),
      ])
      .optional(),
    'epp:options': EppCredsOptionsTypeXml,
    'epp:svcs': EppLoginSvcTypeXml,
  }),
);

export type EppLoginTypeXml = z.infer<typeof EppLoginTypeXml>;
