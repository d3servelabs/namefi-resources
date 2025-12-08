/**
 * Layer-1 XML JSON schema for type epp:extAnyType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeCheckXml } from '../elements/fee.check.layer1.js';
import { FeeCreateXml } from '../elements/fee.create.layer1.js';
import { FeeRenewXml } from '../elements/fee.renew.layer1.js';
import { FeeTransferXml } from '../elements/fee.transfer.layer1.js';
import { FeeUpdateXml } from '../elements/fee.update.layer1.js';
import { FeeChkDataXml } from '../elements/fee.chkData.layer1.js';
import { FeeCreDataXml } from '../elements/fee.creData.layer1.js';
import { FeeRenDataXml } from '../elements/fee.renData.layer1.js';
import { FeeTrnDataXml } from '../elements/fee.trnData.layer1.js';
import { FeeUpdDataXml } from '../elements/fee.updData.layer1.js';
import { FeeDelDataXml } from '../elements/fee.delData.layer1.js';
import { SecDNSCreateXml } from '../elements/secDNS.create.layer1.js';
import { SecDNSUpdateXml } from '../elements/secDNS.update.layer1.js';
import { SecDNSDsOrKeyTypeXml } from './secDNS.dsOrKeyType.layer1.js';
import { IdnDataXml } from '../elements/idn.data.layer1.js';
import { RgpInfDataXml } from '../elements/rgp.infData.layer1.js';
import { RgpUpDataXml } from '../elements/rgp.upData.layer1.js';
import { LaunchCheckXml } from '../elements/launch.check.layer1.js';
import { LaunchInfoXml } from '../elements/launch.info.layer1.js';
import { LaunchCreateXml } from '../elements/launch.create.layer1.js';
import { LaunchUpdateXml } from '../elements/launch.update.layer1.js';
import { LaunchDeleteXml } from '../elements/launch.delete.layer1.js';
import { LaunchChkDataXml } from '../elements/launch.chkData.layer1.js';
import { LaunchCreDataXml } from '../elements/launch.creData.layer1.js';
import { LaunchInfDataXml } from '../elements/launch.infData.layer1.js';
import { ArtRecordCreateXml } from '../elements/artRecord.create.layer1.js';
import { ArtRecordUpdateXml } from '../elements/artRecord.update.layer1.js';
import { ArtRecordInfDataXml } from '../elements/artRecord.infData.layer1.js';

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
      'epp:infData': SecDNSDsOrKeyTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'idn:data': IdnDataXml,
    }),
  ),
  zloosen(
    z.object({
      'epp:rgp:update': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
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
