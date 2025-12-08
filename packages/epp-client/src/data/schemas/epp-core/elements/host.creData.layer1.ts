/**
 * Layer-1 XML JSON schema for <host:creData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostCreDataTypeXml } from '../types/host.creDataType.layer1.js';

export const HostCreDataXml = HostCreDataTypeXml;

export type HostCreDataXml = z.infer<typeof HostCreDataXml>;
