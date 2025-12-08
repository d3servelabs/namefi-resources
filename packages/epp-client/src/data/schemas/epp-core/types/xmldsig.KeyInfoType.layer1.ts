/**
 * Layer-1 XML JSON schema for type xmldsig:KeyInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { XmldsigKeyNameXml } from '../elements/xmldsig.KeyName.layer1';
import { XmldsigKeyValueXml } from '../elements/xmldsig.KeyValue.layer1';
import { XmldsigRetrievalMethodXml } from '../elements/xmldsig.RetrievalMethod.layer1';
import { XmldsigX509DataXml } from '../elements/xmldsig.X509Data.layer1';
import { XmldsigPGPDataXml } from '../elements/xmldsig.PGPData.layer1';
import { XmldsigSPKIDataXml } from '../elements/xmldsig.SPKIData.layer1';
import { XmldsigMgmtDataXml } from '../elements/xmldsig.MgmtData.layer1';

const _base0 = z.object({
  '@_Id': z.string().optional(),
  '#text': z.string().optional(),
});

export const XmldsigKeyInfoTypeXml = z.union([
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:KeyName': XmldsigKeyNameXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:KeyValue': XmldsigKeyValueXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:RetrievalMethod': XmldsigRetrievalMethodXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:X509Data': XmldsigX509DataXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:PGPData': XmldsigPGPDataXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:SPKIData': XmldsigSPKIDataXml,
    }),
  ),
  zloosen(
    z.object({
      ..._base0.shape,
      'xmldsig:MgmtData': XmldsigMgmtDataXml,
    }),
  ),
]);

export type XmldsigKeyInfoTypeXml = z.infer<typeof XmldsigKeyInfoTypeXml>;
