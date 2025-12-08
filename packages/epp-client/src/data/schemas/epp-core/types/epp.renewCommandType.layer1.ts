/**
 * Layer-1 XML JSON schema for type epp:renewCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainRenewXml } from '../elements/domain.renew.layer1';

export const EppRenewCommandTypeXml = zloosen(
  z.object({
    'domain:renew': DomainRenewXml,
  }),
);

export type EppRenewCommandTypeXml = z.infer<typeof EppRenewCommandTypeXml>;
