/**
 * Layer-1 XML JSON schema for type xmldsig:DSAKeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const XmldsigDSAKeyValueTypeXml = zloosen(
  z.object({
    'xmldsig:G': zloosen(z.object({ '#text': z.string() })).optional(),
    'xmldsig:Y': zloosen(z.object({ '#text': z.string() })),
    'xmldsig:J': zloosen(z.object({ '#text': z.string() })).optional(),
    'xmldsig:P': zloosen(z.object({ '#text': z.string() })),
    'xmldsig:Q': zloosen(z.object({ '#text': z.string() })),
    'xmldsig:Seed': zloosen(z.object({ '#text': z.string() })),
    'xmldsig:PgenCounter': zloosen(z.object({ '#text': z.string() })),
  }),
);

export type XmldsigDSAKeyValueTypeXml = z.infer<
  typeof XmldsigDSAKeyValueTypeXml
>;
