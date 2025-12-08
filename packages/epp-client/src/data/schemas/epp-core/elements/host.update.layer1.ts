/**
 * Layer-1 XML JSON schema for <host:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostUpdateTypeXml } from '../types/host.updateType.layer1';

export const HostUpdateXml = HostUpdateTypeXml;

export type HostUpdateXml = z.infer<typeof HostUpdateXml>;
