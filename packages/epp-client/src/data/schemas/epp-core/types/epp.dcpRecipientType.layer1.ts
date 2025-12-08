/**
 * Layer-1 XML JSON schema for type epp:dcpRecipientType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppDcpOursTypeXml } from './epp.dcpOursType.layer1.js';

export const EppDcpRecipientTypeXml = zloosen(
  z.object({
    'epp:other': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'epp:ours': z.array(EppDcpOursTypeXml).optional(),
    'epp:public': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'epp:same': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
    'epp:unrelated': z
      .union([z.string(), zloosen(z.object({ '#text': z.string() }))])
      .optional(),
  }),
);

export type EppDcpRecipientTypeXml = z.infer<typeof EppDcpRecipientTypeXml>;
