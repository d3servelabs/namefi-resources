/**
 * Layer-1 XML JSON schema for <launch:creData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchIdContainerTypeXml } from '../types/launch.idContainerType.layer1.js';

export const LaunchCreDataXml = LaunchIdContainerTypeXml;

export type LaunchCreDataXml = z.infer<typeof LaunchCreDataXml>;
