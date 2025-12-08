/**
 * Layer-1 XML JSON schema for type domain:chkDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainCheckTypeXml } from './domain.checkType.layer1.js';

export const DomainChkDataTypeXml = z.object({
  'domain:cd': z.array(DomainCheckTypeXml).min(1),
});

export type DomainChkDataTypeXml = z.infer<typeof DomainChkDataTypeXml>;
