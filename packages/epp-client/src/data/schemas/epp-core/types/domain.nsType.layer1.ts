/**
 * Layer-1 XML JSON schema for type domain:nsType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainHostAttrTypeXml } from './domain.hostAttrType.layer1.js';

export const DomainNsTypeXml = z.union([
  z.object({
    'domain:hostObj': z.array(z.string().min(1).max(255)).min(1),
  }),
  z.object({
    'domain:hostAttr': z.array(DomainHostAttrTypeXml).min(1),
  }),
]);

export type DomainNsTypeXml = z.infer<typeof DomainNsTypeXml>;
