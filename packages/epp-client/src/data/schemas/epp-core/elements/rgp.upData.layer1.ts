/**
 * Layer-1 XML JSON schema for <rgp:upData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { RgpRespDataTypeXml } from '../types/rgp.respDataType.layer1';

export const RgpUpDataXml = RgpRespDataTypeXml;

export type RgpUpDataXml = z.infer<typeof RgpUpDataXml>;
