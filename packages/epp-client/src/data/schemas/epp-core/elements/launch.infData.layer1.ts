/**
 * Layer-1 XML JSON schema for <launch:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchInfDataTypeXml } from '../types/launch.infDataType.layer1';

export const LaunchInfDataXml = LaunchInfDataTypeXml;

export type LaunchInfDataXml = z.infer<typeof LaunchInfDataXml>;
