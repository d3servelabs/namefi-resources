/**
 * Layer-1 XML JSON schema for type domain:updateType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainAddRemTypeXml } from './domain.addRemType.layer1.js';
import { DomainChgTypeXml } from './domain.chgType.layer1.js';

export const DomainUpdateTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
  'domain:add': DomainAddRemTypeXml.optional(),
  'domain:rem': DomainAddRemTypeXml.optional(),
  'domain:chg': DomainChgTypeXml.optional(),
});

export type DomainUpdateTypeXml = z.infer<typeof DomainUpdateTypeXml>;
