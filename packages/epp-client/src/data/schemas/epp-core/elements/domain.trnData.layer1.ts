/**
 * Layer-1 XML JSON schema for <domain:trnData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainTrnDataTypeXml } from '../types/domain.trnDataType.layer1';

export const DomainTrnDataXml = DomainTrnDataTypeXml;

export type DomainTrnDataXml = z.infer<typeof DomainTrnDataXml>;
