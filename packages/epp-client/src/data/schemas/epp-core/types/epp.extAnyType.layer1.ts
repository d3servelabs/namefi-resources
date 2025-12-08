/**
 * Layer-1 XML JSON schema for type epp:extAnyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { FeeCheckXml } from '../elements/fee.check.layer1';
import { FeeCreateXml } from '../elements/fee.create.layer1';
import { FeeRenewXml } from '../elements/fee.renew.layer1';
import { FeeTransferXml } from '../elements/fee.transfer.layer1';
import { FeeUpdateXml } from '../elements/fee.update.layer1';
import { FeeChkDataXml } from '../elements/fee.chkData.layer1';
import { FeeCreDataXml } from '../elements/fee.creData.layer1';
import { FeeRenDataXml } from '../elements/fee.renData.layer1';
import { FeeTrnDataXml } from '../elements/fee.trnData.layer1';
import { FeeUpdDataXml } from '../elements/fee.updData.layer1';
import { FeeDelDataXml } from '../elements/fee.delData.layer1';
import { SecDNSCreateXml } from '../elements/secDNS.create.layer1';
import { SecDNSUpdateXml } from '../elements/secDNS.update.layer1';
import { SecDNSInfDataXml } from '../elements/secDNS.infData.layer1';
import { IdnDataXml } from '../elements/idn.data.layer1';
import { RgpUpdateXml } from '../elements/rgp.update.layer1';
import { RgpInfDataXml } from '../elements/rgp.infData.layer1';
import { RgpUpDataXml } from '../elements/rgp.upData.layer1';
import { LaunchCheckXml } from '../elements/launch.check.layer1';
import { LaunchInfoXml } from '../elements/launch.info.layer1';
import { LaunchCreateXml } from '../elements/launch.create.layer1';
import { LaunchUpdateXml } from '../elements/launch.update.layer1';
import { LaunchDeleteXml } from '../elements/launch.delete.layer1';
import { LaunchChkDataXml } from '../elements/launch.chkData.layer1';
import { LaunchCreDataXml } from '../elements/launch.creData.layer1';
import { LaunchInfDataXml } from '../elements/launch.infData.layer1';
import { ArtRecordCreateXml } from '../elements/artRecord.create.layer1';
import { ArtRecordUpdateXml } from '../elements/artRecord.update.layer1';
import { ArtRecordInfDataXml } from '../elements/artRecord.infData.layer1';

export const EppExtAnyTypeXml = z.union([
  zloosen(
    z.object({
      'fee:check': FeeCheckXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:create': FeeCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:renew': FeeRenewXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:transfer': FeeTransferXml,
    }),
  ),
  zloosen(
    z.object({
      'fee:update': FeeUpdateXml,
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
      'secDNS:create': SecDNSCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'secDNS:update': SecDNSUpdateXml,
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
      'rgp:update': RgpUpdateXml,
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
      'launch:check': LaunchCheckXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:info': LaunchInfoXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:create': LaunchCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:update': LaunchUpdateXml,
    }),
  ),
  zloosen(
    z.object({
      'launch:delete': LaunchDeleteXml,
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
      'artRecord:create': ArtRecordCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'artRecord:update': ArtRecordUpdateXml,
    }),
  ),
  zloosen(
    z.object({
      'artRecord:infData': ArtRecordInfDataXml,
    }),
  ),
]);

export type EppExtAnyTypeXml = z.infer<typeof EppExtAnyTypeXml>;
