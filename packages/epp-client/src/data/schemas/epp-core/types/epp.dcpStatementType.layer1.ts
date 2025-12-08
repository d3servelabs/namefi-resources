/**
 * Layer-1 XML JSON schema for type epp:dcpStatementType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppDcpPurposeTypeXml } from './epp.dcpPurposeType.layer1';
import { EppDcpRecipientTypeXml } from './epp.dcpRecipientType.layer1';
import { EppDcpRetentionTypeXml } from './epp.dcpRetentionType.layer1';

export const EppDcpStatementTypeXml = zloosen(
  z.object({
    'epp:purpose': EppDcpPurposeTypeXml,
    'epp:recipient': EppDcpRecipientTypeXml,
    'epp:retention': EppDcpRetentionTypeXml,
  }),
);

export type EppDcpStatementTypeXml = z.infer<typeof EppDcpStatementTypeXml>;
