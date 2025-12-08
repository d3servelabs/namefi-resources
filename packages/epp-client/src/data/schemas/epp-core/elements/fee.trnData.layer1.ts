/**
 * Layer-1 XML JSON schema for <fee:trnData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeTransformResultTypeXml } from '../types/fee.transformResultType.layer1.js';

export const FeeTrnDataXml = FeeTransformResultTypeXml;

export type FeeTrnDataXml = z.infer<typeof FeeTrnDataXml>;
