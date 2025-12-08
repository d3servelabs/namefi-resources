/**
 * Layer-1 XML JSON schema for <fee:updData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeTransformResultTypeXml } from '../types/fee.transformResultType.layer1.js';

export const FeeUpdDataXml = FeeTransformResultTypeXml;

export type FeeUpdDataXml = z.infer<typeof FeeUpdDataXml>;
