/**
 * Layer-1 XML JSON schema for <fee:transfer>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { FeeTransformCommandTypeXml } from '../types/fee.transformCommandType.layer1.js';

export const FeeTransferXml = FeeTransformCommandTypeXml;

export type FeeTransferXml = z.infer<typeof FeeTransferXml>;
