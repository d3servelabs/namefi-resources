/**
 * Layer-1 XML JSON schema for <launch:delete>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchIdContainerTypeXml } from '../types/launch.idContainerType.layer1';

export const LaunchDeleteXml = LaunchIdContainerTypeXml;

export type LaunchDeleteXml = z.infer<typeof LaunchDeleteXml>;
