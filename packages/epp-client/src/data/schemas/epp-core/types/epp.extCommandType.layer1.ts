/**
 * Layer-1 XML JSON schema for type epp:extCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { FeeCheckXml } from '../elements/fee.check.layer1';
import { FeeCreateXml } from '../elements/fee.create.layer1';
import { FeeRenewXml } from '../elements/fee.renew.layer1';
import { FeeTransferXml } from '../elements/fee.transfer.layer1';
import { FeeUpdateXml } from '../elements/fee.update.layer1';
import { SecDNSCreateXml } from '../elements/secDNS.create.layer1';
import { SecDNSUpdateXml } from '../elements/secDNS.update.layer1';
import { RgpUpdateXml } from '../elements/rgp.update.layer1';
import { LaunchCheckXml } from '../elements/launch.check.layer1';
import { LaunchInfoXml } from '../elements/launch.info.layer1';
import { LaunchCreateXml } from '../elements/launch.create.layer1';
import { LaunchUpdateXml } from '../elements/launch.update.layer1';
import { LaunchDeleteXml } from '../elements/launch.delete.layer1';
import { ArtRecordCreateXml } from '../elements/artRecord.create.layer1';
import { ArtRecordUpdateXml } from '../elements/artRecord.update.layer1';

export const EppExtCommandTypeXml = z.union([
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
      'rgp:update': RgpUpdateXml,
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
      'artRecord:create': ArtRecordCreateXml,
    }),
  ),
  zloosen(
    z.object({
      'artRecord:update': ArtRecordUpdateXml,
    }),
  ),
]);

export type EppExtCommandTypeXml = z.infer<typeof EppExtCommandTypeXml>;
