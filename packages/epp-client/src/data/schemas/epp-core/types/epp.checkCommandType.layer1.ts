/**
 * Layer-1 XML JSON schema for type epp:checkCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainCheckXml } from '../elements/domain.check.layer1.js';
import { ContactCheckXml } from '../elements/contact.check.layer1.js';
import { HostCheckXml } from '../elements/host.check.layer1.js';

export const EppCheckCommandTypeXml = z.union([
  zloosen(
    z.object({
      'domain:check': DomainCheckXml,
    }),
  ),
  zloosen(
    z.object({
      'contact:check': ContactCheckXml,
    }),
  ),
  zloosen(
    z.object({
      'host:check': HostCheckXml,
    }),
  ),
]);

export type EppCheckCommandTypeXml = z.infer<typeof EppCheckCommandTypeXml>;
