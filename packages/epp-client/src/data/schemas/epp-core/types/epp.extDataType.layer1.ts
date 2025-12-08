/**
 * Layer-1 XML JSON schema for type epp:extDataType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { IdnDataXml } from '../elements/idn.data.layer1';
import { FeeChkDataXml } from '../elements/fee.chkData.layer1';
import { FeeCreDataXml } from '../elements/fee.creData.layer1';
import { FeeRenDataXml } from '../elements/fee.renData.layer1';
import { FeeTrnDataXml } from '../elements/fee.trnData.layer1';
import { FeeUpdDataXml } from '../elements/fee.updData.layer1';
import { FeeDelDataXml } from '../elements/fee.delData.layer1';
import { SecDNSInfDataXml } from '../elements/secDNS.infData.layer1';
import { RgpInfDataXml } from '../elements/rgp.infData.layer1';
import { RgpUpDataXml } from '../elements/rgp.upData.layer1';
import { LaunchChkDataXml } from '../elements/launch.chkData.layer1';
import { LaunchCreDataXml } from '../elements/launch.creData.layer1';
import { LaunchInfDataXml } from '../elements/launch.infData.layer1';
import { ArtRecordInfDataXml } from '../elements/artRecord.infData.layer1';

export const EppExtDataTypeXml = z.union([
  zloosen(
    z.object({
      'idn:data': IdnDataXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:chkData': FeeChkDataXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:creData': FeeCreDataXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:renData': FeeRenDataXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:trnData': FeeTrnDataXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:updData': FeeUpdDataXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:delData': FeeDelDataXml,
    }),
  ),
  zloosen(
    z.object({
      'secDNS:infData': SecDNSInfDataXml,
    }),
  ),
  zloosen(
    z.object({
      'idn:data': IdnDataXml,
    }),
  ),
  zloosen(
    z.object({
      'rgp:infData': RgpInfDataXml,
    }),
  ),
  zloosen(
    z.object({
      'rgp:upData': RgpUpDataXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:chkData': LaunchChkDataXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:creData': LaunchCreDataXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:infData': LaunchInfDataXml,
    }),
  ),
  zloosen(
    z.object({
      'artRecord:infData': ArtRecordInfDataXml,
    }),
  ),
]);

export type EppExtDataTypeXml = z.infer<typeof EppExtDataTypeXml>;
