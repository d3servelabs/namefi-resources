/**
 * Layer-1 XML JSON schema for <domain:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainInfDataTypeXml } from '../types/domain.infDataType.layer1.js';

export const DomainInfDataXml = DomainInfDataTypeXml;

export type DomainInfDataXml = z.infer<typeof DomainInfDataXml>;
