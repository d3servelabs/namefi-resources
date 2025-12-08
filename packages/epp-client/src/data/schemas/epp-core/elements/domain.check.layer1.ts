/**
 * Layer-1 XML JSON schema for <domain:check>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainMNameTypeXml } from '../types/domain.mNameType.layer1';

export const DomainCheckXml = DomainMNameTypeXml;

export type DomainCheckXml = z.infer<typeof DomainCheckXml>;
