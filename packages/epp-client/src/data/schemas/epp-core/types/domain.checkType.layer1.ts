/**
 * Layer-1 XML JSON schema for type domain:checkType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainCheckNameTypeXml } from './domain.checkNameType.layer1.js';
import { EppcomReasonTypeXml } from './eppcom.reasonType.layer1.js';

export const DomainCheckTypeXml = zloosen(
  z.object({
    'domain:name': DomainCheckNameTypeXml,
    'domain:reason': EppcomReasonTypeXml.optional(),
  }),
);

export type DomainCheckTypeXml = z.infer<typeof DomainCheckTypeXml>;
