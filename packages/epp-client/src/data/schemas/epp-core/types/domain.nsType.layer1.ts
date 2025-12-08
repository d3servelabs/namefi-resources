/**
 * Layer-1 XML JSON schema for type domain:nsType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainHostAttrTypeXml } from './domain.hostAttrType.layer1';

export const DomainNsTypeXml = z.union([
  zloosen(
    z.object({
      'domain:hostObj': z
        .array(zloosen(z.object({ '#text': z.string().min(1).max(255) })))
        .min(1),
    }),
  ),
  zloosen(
    z.object({
      'domain:hostAttr': z.array(DomainHostAttrTypeXml).min(1),
    }),
  ),
]);

export type DomainNsTypeXml = z.infer<typeof DomainNsTypeXml>;
