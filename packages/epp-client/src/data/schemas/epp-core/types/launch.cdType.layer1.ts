/**
 * Layer-1 XML JSON schema for type launch:cdType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { LaunchCdNameTypeXml } from './launch.cdNameType.layer1.js';
import { LaunchClaimKeyTypeXml } from './launch.claimKeyType.layer1.js';

export const LaunchCdTypeXml = zloosen(
  z.object({
    'launch:name': LaunchCdNameTypeXml,
    'launch:claimKey': LaunchClaimKeyTypeXml.optional(),
  }),
);

export type LaunchCdTypeXml = z.infer<typeof LaunchCdTypeXml>;
