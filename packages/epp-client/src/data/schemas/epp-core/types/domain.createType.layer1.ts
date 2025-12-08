/**
 * Layer-1 XML JSON schema for type domain:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainPeriodTypeXml } from './domain.periodType.layer1';
import { DomainNsTypeXml } from './domain.nsType.layer1';
import { DomainContactTypeXml } from './domain.contactType.layer1';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1';

export const DomainCreateTypeXml = zloosen(
  z.object({
    'domain:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'domain:period': DomainPeriodTypeXml.optional(),
    'domain:ns': DomainNsTypeXml.optional(),
    'domain:registrant': zloosen(
      z.object({ '#text': z.string().min(3).max(64) }),
    ).optional(),
    'domain:contact': z.array(DomainContactTypeXml).optional(),
    'domain:authInfo': DomainAuthInfoTypeXml,
  }),
);

export type DomainCreateTypeXml = z.infer<typeof DomainCreateTypeXml>;
