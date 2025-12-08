/**
 * Layer-1 XML JSON schema for type host:panDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { HostPaNameTypeXml } from './host.paNameType.layer1';
import { EppTrIDTypeXml } from './epp.trIDType.layer1';

export const HostPanDataTypeXml = zloosen(
  z.object({
    'host:name': HostPaNameTypeXml,
    'host:paTRID': EppTrIDTypeXml,
    'host:paDate': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type HostPanDataTypeXml = z.infer<typeof HostPanDataTypeXml>;
