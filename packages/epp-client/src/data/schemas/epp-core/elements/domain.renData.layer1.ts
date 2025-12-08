/**
 * Layer-1 XML JSON schema for <domain:renData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainRenDataTypeXml } from '../types/domain.renDataType.layer1.js';

export const DomainRenDataXml = DomainRenDataTypeXml;

export type DomainRenDataXml = z.infer<typeof DomainRenDataXml>;
