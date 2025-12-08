/**
 * Layer-1 XML JSON schema for type xmldsig:KeyInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { XmldsigKeyNameXml } from '../elements/xmldsig.KeyName.layer1.js';
import { XmldsigKeyValueXml } from '../elements/xmldsig.KeyValue.layer1.js';
import { XmldsigRetrievalMethodXml } from '../elements/xmldsig.RetrievalMethod.layer1.js';
import { XmldsigX509DataXml } from '../elements/xmldsig.X509Data.layer1.js';
import { XmldsigPGPDataXml } from '../elements/xmldsig.PGPData.layer1.js';
import { XmldsigSPKIDataXml } from '../elements/xmldsig.SPKIData.layer1.js';
import { XmldsigMgmtDataXml } from '../elements/xmldsig.MgmtData.layer1.js';

const _baseFields = z.object({
  '@_Id': z.string().optional(),
  '#text': z.string().optional(),
});

export const XmldsigKeyInfoTypeXml = z.union([
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:KeyName': XmldsigKeyNameXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.safeDecode,
      'xmldsig:KeyValue': XmldsigKeyValueXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:RetrievalMethod': XmldsigRetrievalMethodXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:X509Data': XmldsigX509DataXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:PGPData': XmldsigPGPDataXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:SPKIData': XmldsigSPKIDataXml,
    }),
  ),
  zloosen(
    z.object({
      ..._baseFields.shape,
      'xmldsig:MgmtData': XmldsigMgmtDataXml,
    }),
  ),
]);

export type XmldsigKeyInfoTypeXml = z.infer<typeof XmldsigKeyInfoTypeXml>;
