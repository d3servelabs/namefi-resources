/**
 * Layer-1 XML JSON schema for type domain:addRemType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainNsTypeXml } from './domain.nsType.layer1.js';
import { DomainContactTypeXml } from './domain.contactType.layer1.js';
import { DomainStatusTypeXml } from './domain.statusType.layer1.js';

export const DomainAddRemTypeXml = z.object({
  'domain:ns': DomainNsTypeXml.optional(),
  'domain:contact': z.array(DomainContactTypeXml).optional(),
  'domain:status': z.array(DomainStatusTypeXml).optional(),
});

export type DomainAddRemTypeXml = z.infer<typeof DomainAddRemTypeXml>;
