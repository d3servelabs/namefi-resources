/**
 * Layer-1 XML JSON schema for type epp:eppType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppGreetingTypeXml } from './epp.greetingType.layer1.js';
import { EppCommandTypeXml } from './epp.commandType.layer1.js';
import { EppResponseTypeXml } from './epp.responseType.layer1.js';
import { EppExtAnyTypeXml } from './epp.extAnyType.layer1.js';
import { zloosen } from '../../../../utils/zod.js';

export const EppEppTypeXml = z.union([
  zloosen(
    z.object({
      'epp:greeting': zloosen(EppGreetingTypeXml),
    }),
  ),
  zloosen(
    z.object({
      'epp:hello': z.string(),
    }),
  ),
  zloosen(
    z.object({
      'epp:command': EppCommandTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'epp:response': zloosen(EppResponseTypeXml),
    }),
  ),
  zloosen(
    z.object({
      'epp:extension': EppExtAnyTypeXml,
    }),
  ),
]);

export type EppEppTypeXml = z.infer<typeof EppEppTypeXml>;
