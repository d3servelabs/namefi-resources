/**
 * Layer-1 XML JSON schema for <launch:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchInfDataTypeXml } from '../types/launch.infDataType.layer1.js';

export const LaunchInfDataXml = LaunchInfDataTypeXml;

export type LaunchInfDataXml = z.infer<typeof LaunchInfDataXml>;
