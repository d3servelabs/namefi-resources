/**
 * Layer-1 XML JSON schema for type domain:authInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppcomPwAuthInfoTypeXml } from './eppcom.pwAuthInfoType.layer1.js';
import { EppcomExtAuthInfoTypeXml } from './eppcom.extAuthInfoType.layer1.js';

export const DomainAuthInfoTypeXml = z.union([
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
]);

export type DomainAuthInfoTypeXml = z.infer<typeof DomainAuthInfoTypeXml>;
