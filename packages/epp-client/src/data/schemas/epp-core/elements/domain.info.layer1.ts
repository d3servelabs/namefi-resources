/**
 * Layer-1 XML JSON schema for <domain:info>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainInfoTypeXml } from '../types/domain.infoType.layer1';

export const DomainInfoXml = DomainInfoTypeXml;

export type DomainInfoXml = z.infer<typeof DomainInfoXml>;
