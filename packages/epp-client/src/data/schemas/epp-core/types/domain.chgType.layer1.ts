/**
 * Layer-1 XML JSON schema for type domain:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainAuthInfoChgTypeXml } from './domain.authInfoChgType.layer1.js';

export const DomainChgTypeXml = zloosen(
  z.object({
    'domain:registrant': z
      .union([
        z.string().min(0).max(16),
        zloosen(z.object({ '#text': z.string().min(0).max(16) })),
      ])
      .optional(),
    'domain:authInfo': DomainAuthInfoChgTypeXml.optional(),
  }),
);

export type DomainChgTypeXml = z.infer<typeof DomainChgTypeXml>;
