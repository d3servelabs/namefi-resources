/**
 * Layer-1 XML JSON schema for <domain:delete>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainSNameTypeXml } from '../types/domain.sNameType.layer1';

export const DomainDeleteXml = DomainSNameTypeXml;

export type DomainDeleteXml = z.infer<typeof DomainDeleteXml>;
