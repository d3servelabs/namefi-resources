/**
 * Layer-1 XML JSON schema for type domain:authInfoChgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppcomPwAuthInfoTypeXml } from './eppcom.pwAuthInfoType.layer1.js';
import { EppcomExtAuthInfoTypeXml } from './eppcom.extAuthInfoType.layer1.js';

export const DomainAuthInfoChgTypeXml = z.union([
  zloosen(
    z.object({
      'domain:pw': EppcomPwAuthInfoTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:ext': EppcomExtAuthInfoTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'domain:null': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
    }),
  ),
]);

export type DomainAuthInfoChgTypeXml = z.infer<typeof DomainAuthInfoChgTypeXml>;
