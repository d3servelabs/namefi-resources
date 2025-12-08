/**
 * Layer-1 XML JSON schema for <host:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostInfDataTypeXml } from '../types/host.infDataType.layer1';

export const HostInfDataXml = HostInfDataTypeXml;

export type HostInfDataXml = z.infer<typeof HostInfDataXml>;
