/**
 * Layer-1 XML JSON schema for type epp:extCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { FeeCheckXml } from '../elements/fee.check.layer1.js';
import { FeeCreateXml } from '../elements/fee.create.layer1.js';
import { FeeRenewXml } from '../elements/fee.renew.layer1.js';
import { FeeTransferXml } from '../elements/fee.transfer.layer1.js';
import { FeeUpdateXml } from '../elements/fee.update.layer1.js';
import { SecDNSCreateXml } from '../elements/secDNS.create.layer1.js';
import { SecDNSUpdateXml } from '../elements/secDNS.update.layer1.js';
import { LaunchCheckXml } from '../elements/launch.check.layer1.js';
import { LaunchInfoXml } from '../elements/launch.info.layer1.js';
import { LaunchCreateXml } from '../elements/launch.create.layer1.js';
import { LaunchUpdateXml } from '../elements/launch.update.layer1.js';
import { LaunchDeleteXml } from '../elements/launch.delete.layer1.js';
import { ArtRecordCreateXml } from '../elements/artRecord.create.layer1.js';
import { ArtRecordUpdateXml } from '../elements/artRecord.update.layer1.js';

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
      'epp:rgp:update': z.union([
        z.string(),
        zloosen(z.object({ '#text': z.string() })),
      ]),
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
