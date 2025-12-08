/**
 * Layer-1 XML JSON schema for <launch:chkData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchChkDataTypeXml } from '../types/launch.chkDataType.layer1';

export const LaunchChkDataXml = LaunchChkDataTypeXml;

export type LaunchChkDataXml = z.infer<typeof LaunchChkDataXml>;
