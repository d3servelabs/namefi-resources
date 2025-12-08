/**
 * Layer-1 XML JSON schema for type xmldsig:KeyValueType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigDSAKeyValueXml } from '../elements/xmldsig.DSAKeyValue.layer1.js';
import { XmldsigRSAKeyValueXml } from '../elements/xmldsig.RSAKeyValue.layer1.js';

const _baseFields = z.object({
  '#text': z.string().optional(),
});

export const XmldsigKeyValueTypeXml = z.union([
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:DSAKeyValue': XmldsigDSAKeyValueXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:RSAKeyValue': XmldsigRSAKeyValueXml,
    }),
  ),
]);

export type XmldsigKeyValueTypeXml = z.infer<typeof XmldsigKeyValueTypeXml>;
