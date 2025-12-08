/**
 * Layer-1 XML JSON schema for type host:chkDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostCheckTypeXml } from './host.checkType.layer1';

export const HostChkDataTypeXml = zloosen(
  z.object({
    'host:cd': z.array(HostCheckTypeXml).min(1),
  }),
);

export type HostChkDataTypeXml = z.infer<typeof HostChkDataTypeXml>;
