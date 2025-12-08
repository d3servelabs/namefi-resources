/**
 * Layer-1 XML JSON schema for <host:create>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostCreateTypeXml } from '../types/host.createType.layer1';

export const HostCreateXml = HostCreateTypeXml;

export type HostCreateXml = z.infer<typeof HostCreateXml>;
