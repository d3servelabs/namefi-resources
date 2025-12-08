/**
 * Layer-1 XML JSON schema for type epp:extCommandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
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
  z.object({
    'fee:check': FeeCheckXml,
  }),
  z.object({
    'fee:create': FeeCreateXml,
  }),
  z.object({
    'fee:renew': FeeRenewXml,
  }),
  z.object({
    'fee:transfer': FeeTransferXml,
  }),
  z.object({
    'fee:update': FeeUpdateXml,
  }),
  z.object({
    'secDNS:create': SecDNSCreateXml,
  }),
  z.object({
    'secDNS:update': SecDNSUpdateXml,
  }),
  z.object({
    'epp:rgp:update': z.string(),
  }),
  z.object({
    'launch:check': LaunchCheckXml,
  }),
  z.object({
    'launch:info': LaunchInfoXml,
  }),
  z.object({
    'launch:create': LaunchCreateXml,
  }),
  z.object({
    'launch:update': LaunchUpdateXml,
  }),
  z.object({
    'launch:delete': LaunchDeleteXml,
  }),
  z.object({
    'artRecord:create': ArtRecordCreateXml,
  }),
  z.object({
    'artRecord:update': ArtRecordUpdateXml,
  }),
]);

export type EppExtCommandTypeXml = z.infer<typeof EppExtCommandTypeXml>;
