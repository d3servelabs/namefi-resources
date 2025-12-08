/**
 * Layer-1 XML JSON schema for type domain:infoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainInfoNameTypeXml } from './domain.infoNameType.layer1';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1';

export const DomainInfoTypeXml = zloosen(
  z.object({
    'domain:name': DomainInfoNameTypeXml,
    'domain:authInfo': DomainAuthInfoTypeXml.optional(),
  }),
);

export type DomainInfoTypeXml = z.infer<typeof DomainInfoTypeXml>;
