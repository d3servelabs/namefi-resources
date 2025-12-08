/**
 * Layer-1 XML JSON schema for <rgp:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { RgpRespDataTypeXml } from '../types/rgp.respDataType.layer1.js';

export const RgpInfDataXml = RgpRespDataTypeXml;

export type RgpInfDataXml = z.infer<typeof RgpInfDataXml>;
