/**
 * Layer-1 XML JSON schema for <secDNS:create>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { SecDNSDsOrKeyTypeXml } from '../types/secDNS.dsOrKeyType.layer1.js';

export const SecDNSCreateXml = SecDNSDsOrKeyTypeXml;

export type SecDNSCreateXml = z.infer<typeof SecDNSCreateXml>;
