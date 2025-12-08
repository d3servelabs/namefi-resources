/**
 * Layer-1 XML JSON schema for type domain:periodType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const DomainPeriodTypeXml = z.object({
  '@_unit': z.enum(['y', 'm']),
  '#text': z.string().regex(/^-?\d+$/),
});

export type DomainPeriodTypeXml = z.infer<typeof DomainPeriodTypeXml>;
