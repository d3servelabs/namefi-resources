/**
 * Layer-1 XML JSON schema for <domain:creData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainCreDataTypeXml } from '../types/domain.creDataType.layer1';

export const DomainCreDataXml = DomainCreDataTypeXml;

export type DomainCreDataXml = z.infer<typeof DomainCreDataXml>;
