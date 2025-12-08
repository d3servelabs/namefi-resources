/**
 * Layer-1 XML JSON schema for type epp:updateCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainUpdateXml } from '../elements/domain.update.layer1.js';
import { ContactUpdateXml } from '../elements/contact.update.layer1.js';
import { HostUpdateXml } from '../elements/host.update.layer1.js';

export const EppUpdateCommandTypeXml = z.union([
  z.object({
    'domain:update': DomainUpdateXml,
  }),
  z.object({
    'contact:update': ContactUpdateXml,
  }),
  z.object({
    'host:update': HostUpdateXml,
  }),
]);

export type EppUpdateCommandTypeXml = z.infer<typeof EppUpdateCommandTypeXml>;
