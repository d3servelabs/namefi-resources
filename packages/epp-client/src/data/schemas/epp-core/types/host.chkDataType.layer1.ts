/**
 * Layer-1 XML JSON schema for type host:chkDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { HostCheckTypeXml } from './host.checkType.layer1.js';

export const HostChkDataTypeXml = z.object({
  'host:cd': z.array(HostCheckTypeXml).min(1),
});

export type HostChkDataTypeXml = z.infer<typeof HostChkDataTypeXml>;
