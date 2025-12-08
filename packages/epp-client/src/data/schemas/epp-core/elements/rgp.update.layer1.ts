/**
 * Layer-1 XML JSON schema for <rgp:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { RgpUpdateTypeXml } from '../types/rgp.updateType.layer1';

export const RgpUpdateXml = RgpUpdateTypeXml;

export type RgpUpdateXml = z.infer<typeof RgpUpdateXml>;
