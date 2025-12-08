/**
 * Layer-1 XML JSON schema for type domain:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { DomainPaNameTypeXml } from './domain.paNameType.layer1.js';
import { EppTrIDTypeXml } from './epp.trIDType.layer1.js';

export const DomainPanDataTypeXml = zloosen(
  z.object({
    'domain:name': DomainPaNameTypeXml,
    'domain:paTRID': EppTrIDTypeXml,
    'domain:paDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type DomainPanDataTypeXml = z.infer<typeof DomainPanDataTypeXml>;
