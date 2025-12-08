/**
 * Layer-1 XML JSON schema for type epp:extDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { IdnDataXml } from '../elements/idn.data.layer1.js';
import { FeeChkDataXml } from '../elements/fee.chkData.layer1.js';
import { FeeCreDataXml } from '../elements/fee.creData.layer1.js';
import { FeeRenDataXml } from '../elements/fee.renData.layer1.js';
import { FeeTrnDataXml } from '../elements/fee.trnData.layer1.js';
import { FeeUpdDataXml } from '../elements/fee.updData.layer1.js';
import { FeeDelDataXml } from '../elements/fee.delData.layer1.js';
import { SecDNSDsOrKeyTypeXml } from './secDNS.dsOrKeyType.layer1.js';
import { RgpInfDataXml } from '../elements/rgp.infData.layer1.js';
import { RgpUpDataXml } from '../elements/rgp.upData.layer1.js';
import { LaunchChkDataXml } from '../elements/launch.chkData.layer1.js';
import { LaunchCreDataXml } from '../elements/launch.creData.layer1.js';
import { LaunchInfDataXml } from '../elements/launch.infData.layer1.js';
import { ArtRecordInfDataXml } from '../elements/artRecord.infData.layer1.js';

export const EppExtDataTypeXml = z.union([
  z.object({
    'idn:data': IdnDataXml,
  }),
  z.object({
    'fee:chkData': FeeChkDataXml,
  }),
  z.object({
    'fee:creData': FeeCreDataXml,
  }),
  z.object({
    'fee:renData': FeeRenDataXml,
  }),
  z.object({
    'fee:trnData': FeeTrnDataXml,
  }),
  z.object({
    'fee:updData': FeeUpdDataXml,
  }),
  z.object({
    'fee:delData': FeeDelDataXml,
  }),
  z.object({
    'epp:infData': SecDNSDsOrKeyTypeXml,
  }),
  z.object({
    'idn:data': IdnDataXml,
  }),
  z.object({
    'rgp:infData': RgpInfDataXml,
  }),
  z.object({
    'rgp:upData': RgpUpDataXml,
  }),
  z.object({
    'launch:chkData': LaunchChkDataXml,
  }),
  z.object({
    'launch:creData': LaunchCreDataXml,
  }),
  z.object({
    'launch:infData': LaunchInfDataXml,
  }),
  z.object({
    'artRecord:infData': ArtRecordInfDataXml,
  }),
]);

export type EppExtDataTypeXml = z.infer<typeof EppExtDataTypeXml>;
