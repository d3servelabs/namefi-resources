/**
 * Layer-1 XML JSON schema for type epp:dcpStatementType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppDcpPurposeTypeXml } from './epp.dcpPurposeType.layer1.js';
import { EppDcpRecipientTypeXml } from './epp.dcpRecipientType.layer1.js';
import { EppDcpRetentionTypeXml } from './epp.dcpRetentionType.layer1.js';

export const EppDcpStatementTypeXml = z.object({
  'epp:purpose': EppDcpPurposeTypeXml,
  'epp:recipient': EppDcpRecipientTypeXml,
  'epp:retention': EppDcpRetentionTypeXml,
});

export type EppDcpStatementTypeXml = z.infer<typeof EppDcpStatementTypeXml>;
