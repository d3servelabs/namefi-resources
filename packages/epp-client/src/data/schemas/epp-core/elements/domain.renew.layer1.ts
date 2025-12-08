/**
 * Layer-1 XML JSON schema for <domain:renew>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainRenewTypeXml } from '../types/domain.renewType.layer1';

export const DomainRenewXml = DomainRenewTypeXml;

export type DomainRenewXml = z.infer<typeof DomainRenewXml>;
