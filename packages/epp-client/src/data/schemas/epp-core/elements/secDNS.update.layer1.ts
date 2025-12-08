/**
 * Layer-1 XML JSON schema for <secDNS:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { SecDNSUpdateTypeXml } from '../types/secDNS.updateType.layer1.js';

export const SecDNSUpdateXml = SecDNSUpdateTypeXml;

export type SecDNSUpdateXml = z.infer<typeof SecDNSUpdateXml>;
