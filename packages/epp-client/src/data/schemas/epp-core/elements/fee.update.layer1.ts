/**
 * Layer-1 XML JSON schema for <fee:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeTransformCommandTypeXml } from '../types/fee.transformCommandType.layer1.js';

export const FeeUpdateXml = FeeTransformCommandTypeXml;

export type FeeUpdateXml = z.infer<typeof FeeUpdateXml>;
