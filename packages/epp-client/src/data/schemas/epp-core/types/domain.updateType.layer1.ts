/**
 * Layer-1 XML JSON schema for type domain:updateType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainAddRemTypeXml } from './domain.addRemType.layer1';
import { DomainChgTypeXml } from './domain.chgType.layer1';

export const DomainUpdateTypeXml = zloosen(
  z.object({
    'domain:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'domain:add': DomainAddRemTypeXml.optional(),
    'domain:rem': DomainAddRemTypeXml.optional(),
    'domain:chg': DomainChgTypeXml.optional(),
  }),
);

export type DomainUpdateTypeXml = z.infer<typeof DomainUpdateTypeXml>;
