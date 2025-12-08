/**
 * Layer-1 XML JSON schema for type domain:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainPaNameTypeXml } from './domain.paNameType.layer1.js';
import { EppTrIDTypeXml } from './epp.trIDType.layer1.js';

export const DomainPanDataTypeXml = z.object({
  'domain:name': DomainPaNameTypeXml,
  'domain:paTRID': EppTrIDTypeXml,
  'domain:paDate': z.string(),
});

export type DomainPanDataTypeXml = z.infer<typeof DomainPanDataTypeXml>;
