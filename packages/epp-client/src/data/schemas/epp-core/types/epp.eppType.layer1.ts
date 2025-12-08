/**
 * Layer-1 XML JSON schema for type epp:eppType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppGreetingTypeXml } from './epp.greetingType.layer1';
import { EppCommandTypeXml } from './epp.commandType.layer1';
import { EppResponseTypeXml } from './epp.responseType.layer1';
import { EppExtAnyTypeXml } from './epp.extAnyType.layer1';

export const EppEppTypeXml = z.union([
  zloosen(
    z.object({
      'epp:greeting': EppGreetingTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'epp:hello': zloosen(z.object({ '#text': z.string() })),
    }),
  ),
  zloosen(
    z.object({
      'epp:command': EppCommandTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'epp:response': EppResponseTypeXml,
    }),
  ),
  zloosen(
    z.object({
      'epp:extension': EppExtAnyTypeXml,
    }),
  ),
]);

export type EppEppTypeXml = z.infer<typeof EppEppTypeXml>;
