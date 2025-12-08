/**
 * Layer-1 XML JSON schema for <fee:renew>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeTransformCommandTypeXml } from '../types/fee.transformCommandType.layer1.js';

export const FeeRenewXml = FeeTransformCommandTypeXml;

export type FeeRenewXml = z.infer<typeof FeeRenewXml>;
