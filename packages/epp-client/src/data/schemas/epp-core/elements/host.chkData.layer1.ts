/**
 * Layer-1 XML JSON schema for <host:chkData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostChkDataTypeXml } from '../types/host.chkDataType.layer1.js';

export const HostChkDataXml = HostChkDataTypeXml;

export type HostChkDataXml = z.infer<typeof HostChkDataXml>;
