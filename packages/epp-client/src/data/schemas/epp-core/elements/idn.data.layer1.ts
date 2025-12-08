/**
 * Layer-1 XML JSON schema for <idn:data>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { IdnIdnDataTypeXml } from '../types/idn.idnDataType.layer1';

export const IdnDataXml = IdnIdnDataTypeXml;

export type IdnDataXml = z.infer<typeof IdnDataXml>;
