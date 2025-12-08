/**
 * Layer-1 XML JSON schema for type domain:addRemType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainNsTypeXml } from './domain.nsType.layer1';
import { DomainContactTypeXml } from './domain.contactType.layer1';
import { DomainStatusTypeXml } from './domain.statusType.layer1';

export const DomainAddRemTypeXml = zloosen(
  z.object({
    'domain:ns': DomainNsTypeXml.optional(),
    'domain:contact': z.array(DomainContactTypeXml).optional(),
    'domain:status': z.array(DomainStatusTypeXml).optional(),
  }),
);

export type DomainAddRemTypeXml = z.infer<typeof DomainAddRemTypeXml>;
