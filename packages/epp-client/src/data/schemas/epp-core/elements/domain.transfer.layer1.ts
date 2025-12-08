/**
 * Layer-1 XML JSON schema for <domain:transfer>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { DomainTransferTypeXml } from '../types/domain.transferType.layer1.js';

export const DomainTransferXml = DomainTransferTypeXml;

export type DomainTransferXml = z.infer<typeof DomainTransferXml>;
