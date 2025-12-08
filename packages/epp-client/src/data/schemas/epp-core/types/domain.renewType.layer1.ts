/**
 * Layer-1 XML JSON schema for type domain:renewType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';

export const DomainRenewTypeXml = zloosen(
  z.object({
    'domain:name': z.union([
      z.string().min(1).max(255),
      zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    ]),
    'domain:curExpDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
    'domain:period': DomainPeriodTypeXml.optional(),
  }),
);

export type DomainRenewTypeXml = z.infer<typeof DomainRenewTypeXml>;
