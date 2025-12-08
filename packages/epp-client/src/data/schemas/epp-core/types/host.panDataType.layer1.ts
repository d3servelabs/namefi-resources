/**
 * Layer-1 XML JSON schema for type host:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { HostPaNameTypeXml } from './host.paNameType.layer1.js';
import { EppTrIDTypeXml } from './epp.trIDType.layer1.js';

export const HostPanDataTypeXml = zloosen(
  z.object({
    'host:name': HostPaNameTypeXml,
    'host:paTRID': EppTrIDTypeXml,
    'host:paDate': z.union([
      z.string(),
      zloosen(z.object({ '#text': z.string() })),
    ]),
  }),
);

export type HostPanDataTypeXml = z.infer<typeof HostPanDataTypeXml>;
