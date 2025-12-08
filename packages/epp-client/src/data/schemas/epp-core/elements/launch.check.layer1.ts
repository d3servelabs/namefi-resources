/**
 * Layer-1 XML JSON schema for <launch:check>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchCheckTypeXml } from '../types/launch.checkType.layer1';

export const LaunchCheckXml = LaunchCheckTypeXml;

export type LaunchCheckXml = z.infer<typeof LaunchCheckXml>;
