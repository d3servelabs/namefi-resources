/**
 * Layer-1 XML JSON schema for type domain:renewType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainPeriodTypeXml } from './domain.periodType.layer1';

export const DomainRenewTypeXml = zloosen(
  z.object({
    'domain:name': zloosen(z.object({ '#text': z.string().min(1).max(255) })),
    'domain:curExpDate': zloosen(z.object({ '#text': z.string() })),
    'domain:period': DomainPeriodTypeXml.optional(),
  }),
);

export type DomainRenewTypeXml = z.infer<typeof DomainRenewTypeXml>;
