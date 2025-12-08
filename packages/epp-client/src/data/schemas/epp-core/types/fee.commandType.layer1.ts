/**
 * Layer-1 XML JSON schema for type fee:commandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainPeriodTypeXml } from './domain.periodType.layer1.js';

export const FeeCommandTypeXml = z.object({
  '@_name': z.enum([
    'create',
    'delete',
    'renew',
    'update',
    'transfer',
    'restore',
    'custom',
  ]),
  '@_customName': z.string().optional(),
  '@_phase': z.string().optional(),
  '@_subphase': z.string().optional(),
  'fee:period': DomainPeriodTypeXml.optional(),
});

export type FeeCommandTypeXml = z.infer<typeof FeeCommandTypeXml>;
