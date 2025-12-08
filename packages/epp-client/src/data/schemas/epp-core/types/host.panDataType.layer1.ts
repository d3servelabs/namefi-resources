/**
 * Layer-1 XML JSON schema for type host:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostPaNameTypeXml } from './host.paNameType.layer1.js';
import { EppTrIDTypeXml } from './epp.trIDType.layer1.js';

export const HostPanDataTypeXml = z.object({
  'host:name': HostPaNameTypeXml,
  'host:paTRID': EppTrIDTypeXml,
  'host:paDate': z.string(),
});

export type HostPanDataTypeXml = z.infer<typeof HostPanDataTypeXml>;
