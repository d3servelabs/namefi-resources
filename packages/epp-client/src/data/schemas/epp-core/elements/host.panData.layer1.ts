/**
 * Layer-1 XML JSON schema for <host:panData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostPanDataTypeXml } from '../types/host.panDataType.layer1.js';

export const HostPanDataXml = HostPanDataTypeXml;

export type HostPanDataXml = z.infer<typeof HostPanDataXml>;
