/**
 * Layer-1 XML JSON schema for type host:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostCheckNameTypeXml } from './host.checkNameType.layer1.js';
import { EppcomReasonTypeXml } from './eppcom.reasonType.layer1.js';

export const HostCheckTypeXml = z.object({
  'host:name': HostCheckNameTypeXml,
  'host:reason': EppcomReasonTypeXml.optional(),
});

export type HostCheckTypeXml = z.infer<typeof HostCheckTypeXml>;
