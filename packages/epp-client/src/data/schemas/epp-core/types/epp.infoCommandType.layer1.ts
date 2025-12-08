/**
 * Layer-1 XML JSON schema for type epp:infoCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { DomainInfoXml } from '../elements/domain.info.layer1';
import { ContactInfoXml } from '../elements/contact.info.layer1';
import { HostInfoXml } from '../elements/host.info.layer1';

export const EppInfoCommandTypeXml = z.union([
  zloosen(
    z.object({
      'domain:info': DomainInfoXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:info': ContactInfoXml,
    }),
  ),
  zloosen(
    z.object({
      'host:info': HostInfoXml,
    }),
  ),
]);

export type EppInfoCommandTypeXml = z.infer<typeof EppInfoCommandTypeXml>;
