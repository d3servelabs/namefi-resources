/**
 * Layer-1 XML JSON schema for type domain:renewType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';

export const DomainRenewTypeXml = z.object({
  'domain:name': z.string().min(1).max(255),
  'domain:curExpDate': z.string(),
  'domain:period': DomainPeriodTypeXml.optional(),
});

export type DomainRenewTypeXml = z.infer<typeof DomainRenewTypeXml>;
