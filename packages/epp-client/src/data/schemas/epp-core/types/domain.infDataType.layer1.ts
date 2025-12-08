/**
 * Layer-1 XML JSON schema for type domain:infDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainStatusTypeXml } from './domain.statusType.layer1';
import { DomainContactTypeXml } from './domain.contactType.layer1';
import { DomainNsTypeXml } from './domain.nsType.layer1';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1';

export const DomainInfDataTypeXml = zloosen(
  z.object({
    'domain:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'domain:roid': zloosen(
      z.object({ '#text': z.string().regex(/(\w|_){1,80}-\w{1,8}/) }),
    ),
    'domain:status': z.array(DomainStatusTypeXml).optional(),
    'domain:registrant': zloosen(
      z.object({ '#text': z.string().min(3).max(64) }),
    ).optional(),
    'domain:contact': z.array(DomainContactTypeXml).optional(),
    'domain:ns': DomainNsTypeXml.optional(),
    'domain:host': z
      .array(zloosen(z.object({ '#text': z.string().min(1).max(255) })))
      .optional(),
    'domain:clID': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'domain:crID': zloosen(
      z.object({ '#text': z.string().min(3).max(64) }),
    ).optional(),
    'domain:crDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'domain:upID': zloosen(
      z.object({ '#text': z.string().min(3).max(64) }),
    ).optional(),
    'domain:upDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'domain:exDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'domain:trDate': zloosen(z.object({ '#text': z.string() })).optional(),
    'domain:authInfo': DomainAuthInfoTypeXml.optional(),
  }),
);

export type DomainInfDataTypeXml = z.infer<typeof DomainInfDataTypeXml>;
