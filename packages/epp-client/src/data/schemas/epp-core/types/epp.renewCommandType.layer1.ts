/**
 * Layer-1 XML JSON schema for type epp:renewCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainRenewXml } from '../elements/domain.renew.layer1.js';

export const EppRenewCommandTypeXml = z.object({
  'domain:renew': DomainRenewXml,
});

export type EppRenewCommandTypeXml = z.infer<typeof EppRenewCommandTypeXml>;
