/**
 * Layer-1 XML JSON schema for type domain:authInfoChgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppcomPwAuthInfoTypeXml } from './eppcom.pwAuthInfoType.layer1.js';
import { EppcomExtAuthInfoTypeXml } from './eppcom.extAuthInfoType.layer1.js';

export const DomainAuthInfoChgTypeXml = z.union([
  z.object({
    'domain:pw': EppcomPwAuthInfoTypeXml,
  }),
  z.object({
    'domain:ext': EppcomExtAuthInfoTypeXml,
  }),
  z.object({
    'domain:null': z.string(),
  }),
]);

export type DomainAuthInfoChgTypeXml = z.infer<typeof DomainAuthInfoChgTypeXml>;
