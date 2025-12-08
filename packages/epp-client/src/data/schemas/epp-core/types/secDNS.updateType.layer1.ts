/**
 * Layer-1 XML JSON schema for type secDNS:updateType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { SecDNSRemTypeXml } from './secDNS.remType.layer1.js';
import { SecDNSDsOrKeyTypeXml } from './secDNS.dsOrKeyType.layer1.js';
import { SecDNSChgTypeXml } from './secDNS.chgType.layer1.js';

export const SecDNSUpdateTypeXml = z.object({
  '@_urgent': z
    .union([
      z.literal('true'),
      z.literal('false'),
      z.literal('1'),
      z.literal('0'),
    ])
    .default('false')
    .optional(),
  'secDNS:rem': SecDNSRemTypeXml.optional(),
  'secDNS:add': SecDNSDsOrKeyTypeXml.optional(),
  'secDNS:chg': SecDNSChgTypeXml.optional(),
});

export type SecDNSUpdateTypeXml = z.infer<typeof SecDNSUpdateTypeXml>;
