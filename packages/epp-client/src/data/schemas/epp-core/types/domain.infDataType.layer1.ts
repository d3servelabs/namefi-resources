/**
 * Layer-1 XML JSON schema for type domain:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainStatusTypeXml } from './domain.statusType.layer1.js';
import { DomainContactTypeXml } from './domain.contactType.layer1.js';
import { DomainNsTypeXml } from './domain.nsType.layer1.js';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1.js';

export const DomainInfDataTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
  'domain:roid': z.string().regex(/(\w|_){1,80}-\w{1,8}/),
  'domain:status': z.array(DomainStatusTypeXml).optional(),
  'domain:registrant': z.string().min(3).max(64).optional(),
  'domain:contact': z.array(DomainContactTypeXml).optional(),
  'domain:ns': DomainNsTypeXml.optional(),
  'domain:host': z.array(z.string().min(1).max(255)).optional(),
  'domain:clID': z.string().min(3).max(64),
  'domain:crID': z.string().min(3).max(64).optional(),
  'domain:crDate': z.string().optional(),
  'domain:upID': z.string().min(3).max(64).optional(),
  'domain:upDate': z.string().optional(),
  'domain:exDate': z.string().optional(),
  'domain:trDate': z.string().optional(),
  'domain:authInfo': DomainAuthInfoTypeXml.optional(),
});

export type DomainInfDataTypeXml = z.infer<typeof DomainInfDataTypeXml>;
