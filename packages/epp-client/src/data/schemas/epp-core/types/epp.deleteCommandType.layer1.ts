/**
 * Layer-1 XML JSON schema for type epp:deleteCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainDeleteXml } from '../elements/domain.delete.layer1';
import { ContactDeleteXml } from '../elements/contact.delete.layer1';
import { HostDeleteXml } from '../elements/host.delete.layer1';

export const EppDeleteCommandTypeXml = z.union([
  zloosen(
    z.object({
      'domain:delete': DomainDeleteXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:delete': ContactDeleteXml,
    }),
  ),
  zloosen(
    z.object({
      'host:delete': HostDeleteXml,
    }),
  ),
]);

export type EppDeleteCommandTypeXml = z.infer<typeof EppDeleteCommandTypeXml>;
