/**
 * Layer-1 XML JSON schema for type epp:commandType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppExtCommandTypeXml } from './epp.extCommandType.layer1.js';
import { EppCheckCommandTypeXml } from './epp.checkCommandType.layer1.js';
import { EppCreateCommandTypeXml } from './epp.createCommandType.layer1.js';
import { EppDeleteCommandTypeXml } from './epp.deleteCommandType.layer1.js';
import { EppInfoCommandTypeXml } from './epp.infoCommandType.layer1.js';
import { EppLoginTypeXml } from './epp.loginType.layer1.js';
import { EppPollTypeXml } from './epp.pollType.layer1.js';
import { EppRenewCommandTypeXml } from './epp.renewCommandType.layer1.js';
import { EppTransferTypeXml } from './epp.transferType.layer1.js';
import { EppUpdateCommandTypeXml } from './epp.updateCommandType.layer1.js';

const _base0 = z.object({
  'epp:extension': EppExtCommandTypeXml.optional(),
  'epp:clTRID': z.string().min(0).max(64).optional(),
});

export const EppCommandTypeXml = z.union([
  z.object({
    ..._base0.shape,
    'epp:check': EppCheckCommandTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:create': EppCreateCommandTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:delete': EppDeleteCommandTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:info': EppInfoCommandTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:login': EppLoginTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:logout': z.string(),
  }),
  z.object({
    ..._base0.shape,
    'epp:poll': EppPollTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:renew': EppRenewCommandTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:transfer': EppTransferTypeXml,
  }),
  z.object({
    ..._base0.shape,
    'epp:update': EppUpdateCommandTypeXml,
  }),
]);

export type EppCommandTypeXml = z.infer<typeof EppCommandTypeXml>;
