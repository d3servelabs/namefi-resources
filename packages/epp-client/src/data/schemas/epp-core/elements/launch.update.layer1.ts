/**
 * Layer-1 XML JSON schema for <launch:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { LaunchIdContainerTypeXml } from '../types/launch.idContainerType.layer1';

export const LaunchUpdateXml = LaunchIdContainerTypeXml;

export type LaunchUpdateXml = z.infer<typeof LaunchUpdateXml>;
