/**
 * Layer-1 XML JSON schema for type domain:chgType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainAuthInfoChgTypeXml } from './domain.authInfoChgType.layer1';

export const DomainChgTypeXml = zloosen(
  z.object({
    'domain:registrant': zloosen(
      z.object({ '#text': z.string().min(0).max(16) }),
    ).optional(),
    'domain:authInfo': DomainAuthInfoChgTypeXml.optional(),
  }),
);

export type DomainChgTypeXml = z.infer<typeof DomainChgTypeXml>;
