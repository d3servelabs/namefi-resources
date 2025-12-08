/**
 * Layer-1 XML JSON schema for type domain:transferType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';
import { DomainAuthInfoTypeXml } from './domain.authInfoType.layer1.js';

export const DomainTransferTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:period': DomainPeriodTypeXml.optional(),
    'domain:authInfo': DomainAuthInfoTypeXml.optional(),
  }),
);

export type DomainTransferTypeXml = z.infer<typeof DomainTransferTypeXml>;
