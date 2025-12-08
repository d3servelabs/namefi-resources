/**
 * Layer-1 XML JSON schema for type xmldsig:KeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { XmldsigDSAKeyValueXml } from '../elements/xmldsig.DSAKeyValue.layer1.js';
import { XmldsigRSAKeyValueXml } from '../elements/xmldsig.RSAKeyValue.layer1.js';

export const XmldsigKeyValueTypeXml = z
  .object({
    '#text': z.string().optional(),
  })
  .and(
    z.union([
      z.object({
        'xmldsig:DSAKeyValue': XmldsigDSAKeyValueXml,
      }),
      z.object({
        'xmldsig:RSAKeyValue': XmldsigRSAKeyValueXml,
      }),
    ]),
  );

export type XmldsigKeyValueTypeXml = z.infer<typeof XmldsigKeyValueTypeXml>;
