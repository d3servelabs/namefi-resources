/**
 * Layer-1 XML JSON schema for <domain:info>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { DomainInfoTypeXml } from '../types/domain.infoType.layer1.js';

export const DomainInfoXml = DomainInfoTypeXml;

export type DomainInfoXml = z.infer<typeof DomainInfoXml>;
