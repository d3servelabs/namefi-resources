/**
 * Layer-1 XML JSON schema for type epp:createCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { DomainCreateXml } from '../elements/domain.create.layer1.js';
import { ContactCreateXml } from '../elements/contact.create.layer1.js';
import { HostCreateXml } from '../elements/host.create.layer1.js';

export const EppCreateCommandTypeXml = z.union([
  z.object({
    'domain:create': DomainCreateXml,
  }),
  z.object({
    'contact:create': ContactCreateXml,
  }),
  z.object({
    'host:create': HostCreateXml,
  }),
]);

export type EppCreateCommandTypeXml = z.infer<typeof EppCreateCommandTypeXml>;
