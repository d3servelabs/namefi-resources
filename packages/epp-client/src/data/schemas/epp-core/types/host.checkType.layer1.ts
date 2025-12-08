/**
 * Layer-1 XML JSON schema for type host:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostCheckNameTypeXml } from './host.checkNameType.layer1';
import { EppcomReasonTypeXml } from './eppcom.reasonType.layer1';

export const HostCheckTypeXml = zloosen(
  z.object({
    'host:name': HostCheckNameTypeXml,
    'host:reason': EppcomReasonTypeXml.optional(),
  }),
);

export type HostCheckTypeXml = z.infer<typeof HostCheckTypeXml>;
