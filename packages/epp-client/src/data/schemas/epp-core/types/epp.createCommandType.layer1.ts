/**
 * Layer-1 XML JSON schema for type epp:createCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainCreateXml } from '../elements/domain.create.layer1';
import { ContactCreateXml } from '../elements/contact.create.layer1';
import { HostCreateXml } from '../elements/host.create.layer1';

export const EppCreateCommandTypeXml = z.union([
  zloosen(
    z.object({
      'domain:create': DomainCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:create': ContactCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'host:create': HostCreateXml,
    }),
  ),
]);

export type EppCreateCommandTypeXml = z.infer<typeof EppCreateCommandTypeXml>;
