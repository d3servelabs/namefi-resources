/**
 * Layer-1 XML JSON schema for type contact:updateType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactAddRemTypeXml } from './contact.addRemType.layer1';
import { ContactChgTypeXml } from './contact.chgType.layer1';

export const ContactUpdateTypeXml = zloosen(
  z.object({
    'contact:id': zloosen(z.object({ '#text': z.string().min(3).max(64) })),
    'contact:add': ContactAddRemTypeXml.optional(),
    'contact:rem': ContactAddRemTypeXml.optional(),
    'contact:chg': ContactChgTypeXml.optional(),
  }),
);

export type ContactUpdateTypeXml = z.infer<typeof ContactUpdateTypeXml>;
