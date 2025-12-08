/**
 * Layer-1 XML JSON schema for <fee:check>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeCheckTypeXml } from '../types/fee.checkType.layer1.js';

export const FeeCheckXml = FeeCheckTypeXml;

export type FeeCheckXml = z.infer<typeof FeeCheckXml>;
