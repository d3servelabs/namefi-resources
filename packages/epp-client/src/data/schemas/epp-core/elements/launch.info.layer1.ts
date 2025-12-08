/**
 * Layer-1 XML JSON schema for <launch:info>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { LaunchInfoTypeXml } from '../types/launch.infoType.layer1.js';

export const LaunchInfoXml = LaunchInfoTypeXml;

export type LaunchInfoXml = z.infer<typeof LaunchInfoXml>;
