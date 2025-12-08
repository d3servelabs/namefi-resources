/**
 * Layer-1 XML JSON schema for <domain:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainUpdateTypeXml } from '../types/domain.updateType.layer1';

export const DomainUpdateXml = DomainUpdateTypeXml;

export type DomainUpdateXml = z.infer<typeof DomainUpdateXml>;
