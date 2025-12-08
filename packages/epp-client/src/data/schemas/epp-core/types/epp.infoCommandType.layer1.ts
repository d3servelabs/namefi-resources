/**
 * Layer-1 XML JSON schema for type epp:infoCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainInfoXml } from '../elements/domain.info.layer1.js';
import { ContactInfoXml } from '../elements/contact.info.layer1.js';
import { HostInfoXml } from '../elements/host.info.layer1.js';

export const EppInfoCommandTypeXml = z.union([
  z.object({
    'domain:info': DomainInfoXml,
  }),
  z.object({
    'contact:info': ContactInfoXml,
  }),
  z.object({
    'host:info': HostInfoXml,
  }),
]);

export type EppInfoCommandTypeXml = z.infer<typeof EppInfoCommandTypeXml>;
