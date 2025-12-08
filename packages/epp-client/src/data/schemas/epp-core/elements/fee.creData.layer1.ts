/**
 * Layer-1 XML JSON schema for <fee:creData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeTransformResultTypeXml } from '../types/fee.transformResultType.layer1.js';

export const FeeCreDataXml = FeeTransformResultTypeXml;

export type FeeCreDataXml = z.infer<typeof FeeCreDataXml>;
