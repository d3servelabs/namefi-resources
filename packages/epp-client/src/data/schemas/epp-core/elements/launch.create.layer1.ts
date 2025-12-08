/**
 * Layer-1 XML JSON schema for <launch:create>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchCreateTypeXml } from '../types/launch.createType.layer1';

export const LaunchCreateXml = LaunchCreateTypeXml;

export type LaunchCreateXml = z.infer<typeof LaunchCreateXml>;
