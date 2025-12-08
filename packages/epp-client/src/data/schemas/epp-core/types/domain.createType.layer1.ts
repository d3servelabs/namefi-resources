/**
 * Layer-1 XML JSON schema for type domain:createType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';
import { DomainNsTypeXml } from './domain.nsType.layer1.js';
import { DomainContactTypeXml } from './domain.contactType.layer1.js';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1.js';

export const DomainCreateTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:period': DomainPeriodTypeXml.optional(),
    'domain:ns': DomainNsTypeXml.optional(),
    'domain:registrant': z
      .union([
        z.string().min(3).max(64),
        zloosen(z.object({ '#text': z.string().min(3).max(64) })),
      ])
      .optional(),
    'domain:contact': z.array(DomainContactTypeXml).optional(),
    'domain:authInfo': DomainAuthInfoTypeXml,
  }),
);

export type DomainCreateTypeXml = z.infer<typeof DomainCreateTypeXml>;
