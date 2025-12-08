/**
 * Layer-1 XML JSON schema for type epp:deleteCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainDeleteXml } from '../elements/domain.delete.layer1.js';
import { ContactDeleteXml } from '../elements/contact.delete.layer1.js';
import { HostDeleteXml } from '../elements/host.delete.layer1.js';

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
