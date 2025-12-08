/**
 * Layer-1 XML JSON schema for type contact:authInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppcomPwAuthInfoTypeXml } from './eppcom.pwAuthInfoType.layer1';
import { EppcomExtAuthInfoTypeXml } from './eppcom.extAuthInfoType.layer1';

export const ContactAuthInfoTypeXml = z.union([
  zloosen(
    z.object({
      'contact:pw': EppcomPwAuthInfoTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:ext': EppcomExtAuthInfoTypeXml,
    }),
  ),
]);

export type ContactAuthInfoTypeXml = z.infer<typeof ContactAuthInfoTypeXml>;
