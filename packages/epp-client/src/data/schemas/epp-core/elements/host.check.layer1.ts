/**
 * Layer-1 XML JSON schema for <host:check>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostMNameTypeXml } from '../types/host.mNameType.layer1.js';

export const HostCheckXml = HostMNameTypeXml;

export type HostCheckXml = z.infer<typeof HostCheckXml>;
