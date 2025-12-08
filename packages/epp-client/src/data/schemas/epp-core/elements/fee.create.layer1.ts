/**
 * Layer-1 XML JSON schema for <fee:create>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { FeeTransformCommandTypeXml } from '../types/fee.transformCommandType.layer1.js';

export const FeeCreateXml = FeeTransformCommandTypeXml;

export type FeeCreateXml = z.infer<typeof FeeCreateXml>;
