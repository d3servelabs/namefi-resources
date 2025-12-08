/**
 * Layer-1 XML JSON schema for type epp:dcpType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { EppDcpAccessTypeXml } from './epp.dcpAccessType.layer1.js';
import { EppDcpStatementTypeXml } from './epp.dcpStatementType.layer1.js';
import { EppDcpExpiryTypeXml } from './epp.dcpExpiryType.layer1.js';

export const EppDcpTypeXml = zloosen(
  z.object({
    'epp:access': EppDcpAccessTypeXml,
    'epp:statement': z.array(EppDcpStatementTypeXml).min(1),
    'epp:expiry': EppDcpExpiryTypeXml.optional(),
  }),
);

export type EppDcpTypeXml = z.infer<typeof EppDcpTypeXml>;
