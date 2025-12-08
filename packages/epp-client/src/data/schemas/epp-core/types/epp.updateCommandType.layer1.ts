/**
 * Layer-1 XML JSON schema for type epp:updateCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainUpdateXml } from '../elements/domain.update.layer1';
import { ContactUpdateXml } from '../elements/contact.update.layer1';
import { HostUpdateXml } from '../elements/host.update.layer1';

export const EppUpdateCommandTypeXml = z.union([
  zloosen(
    z.object({
      'domain:update': DomainUpdateXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:update': ContactUpdateXml,
    }),
  ),
  zloosen(
    z.object({
      'host:update': HostUpdateXml,
    }),
  ),
]);

export type EppUpdateCommandTypeXml = z.infer<typeof EppUpdateCommandTypeXml>;
