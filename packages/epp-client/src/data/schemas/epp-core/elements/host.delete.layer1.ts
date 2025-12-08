/**
 * Layer-1 XML JSON schema for <host:delete>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostSNameTypeXml } from '../types/host.sNameType.layer1.js';

export const HostDeleteXml = HostSNameTypeXml;

export type HostDeleteXml = z.infer<typeof HostDeleteXml>;
