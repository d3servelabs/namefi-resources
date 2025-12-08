/**
 * Layer-1 XML JSON schema for type contact:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { ContactPaCLIDTypeXml } from './contact.paCLIDType.layer1.js';
import { EppTrIDTypeXml } from './epp.trIDType.layer1.js';

export const ContactPanDataTypeXml = z.object({
  'contact:id': ContactPaCLIDTypeXml,
  'contact:paTRID': EppTrIDTypeXml,
  'contact:paDate': z.string(),
});

export type ContactPanDataTypeXml = z.infer<typeof ContactPanDataTypeXml>;
