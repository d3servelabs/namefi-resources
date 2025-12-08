/**
 * Layer-1 XML JSON schema for <fee:chkData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeChkDataTypeXml } from '../types/fee.chkDataType.layer1.js';

export const FeeChkDataXml = FeeChkDataTypeXml;

export type FeeChkDataXml = z.infer<typeof FeeChkDataXml>;
