/**
 * Layer-1 XML JSON schema for type domain:infoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainInfoNameTypeXml } from './domain.infoNameType.layer1.js';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1.js';

export const DomainInfoTypeXml = z.object({
  'domain:name': DomainInfoNameTypeXml,
  'domain:authInfo': DomainAuthInfoTypeXml.optional(),
});

export type DomainInfoTypeXml = z.infer<typeof DomainInfoTypeXml>;
