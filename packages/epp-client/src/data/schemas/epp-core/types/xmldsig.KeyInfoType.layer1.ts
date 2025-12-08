/**
 * Layer-1 XML JSON schema for type xmldsig:KeyInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { XmldsigKeyNameXml } from '../elements/xmldsig.KeyName.layer1.js';
import { XmldsigKeyValueXml } from '../elements/xmldsig.KeyValue.layer1.js';
import { XmldsigRetrievalMethodXml } from '../elements/xmldsig.RetrievalMethod.layer1.js';
import { XmldsigX509DataXml } from '../elements/xmldsig.X509Data.layer1.js';
import { XmldsigPGPDataXml } from '../elements/xmldsig.PGPData.layer1.js';
import { XmldsigSPKIDataXml } from '../elements/xmldsig.SPKIData.layer1.js';
import { XmldsigMgmtDataXml } from '../elements/xmldsig.MgmtData.layer1.js';

export const XmldsigKeyInfoTypeXml = z
  .object({
    '@_Id': z.string().optional(),
    '#text': z.string().optional(),
  })
  .and(
    z.union([
      z.object({
        'xmldsig:KeyName': XmldsigKeyNameXml,
      }),
      z.object({
        'xmldsig:KeyValue': XmldsigKeyValueXml,
      }),
      z.object({
        'xmldsig:RetrievalMethod': XmldsigRetrievalMethodXml,
      }),
      z.object({
        'xmldsig:X509Data': XmldsigX509DataXml,
      }),
      z.object({
        'xmldsig:PGPData': XmldsigPGPDataXml,
      }),
      z.object({
        'xmldsig:SPKIData': XmldsigSPKIDataXml,
      }),
      z.object({
        'xmldsig:MgmtData': XmldsigMgmtDataXml,
      }),
    ]),
  );

export type XmldsigKeyInfoTypeXml = z.infer<typeof XmldsigKeyInfoTypeXml>;
