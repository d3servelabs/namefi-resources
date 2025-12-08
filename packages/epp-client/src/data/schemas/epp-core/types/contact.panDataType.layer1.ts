/**
 * Layer-1 XML JSON schema for type contact:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ContactPaCLIDTypeXml } from './contact.paCLIDType.layer1';
import { EppTrIDTypeXml } from './epp.trIDType.layer1';

export const ContactPanDataTypeXml = zloosen(
  z.object({
    'contact:id': ContactPaCLIDTypeXml,
    'contact:paTRID': EppTrIDTypeXml,
    'contact:paDate': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type ContactPanDataTypeXml = z.infer<typeof ContactPanDataTypeXml>;
