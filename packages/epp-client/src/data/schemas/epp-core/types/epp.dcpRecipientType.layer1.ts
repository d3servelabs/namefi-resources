/**
 * Layer-1 XML JSON schema for type epp:dcpRecipientType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppDcpOursTypeXml } from './epp.dcpOursType.layer1';

export const EppDcpRecipientTypeXml = zloosen(
  z.object({
    'epp:other': zloosen(z.object({ '#text': z.string() })).optional(),
    'epp:ours': z.array(EppDcpOursTypeXml).optional(),
    'epp:public': zloosen(z.object({ '#text': z.string() })).optional(),
    'epp:same': zloosen(z.object({ '#text': z.string() })).optional(),
    'epp:unrelated': zloosen(z.object({ '#text': z.string() })).optional(),
  }),
);

export type EppDcpRecipientTypeXml = z.infer<typeof EppDcpRecipientTypeXml>;
