/**
 * Layer-1 XML JSON schema for type epp:eppType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { EppGreetingTypeXml } from './epp.greetingType.layer1.js';
import { EppCommandTypeXml } from './epp.commandType.layer1.js';
import { EppResponseTypeXml } from './epp.responseType.layer1.js';
import { EppExtAnyTypeXml } from './epp.extAnyType.layer1.js';

export const EppEppTypeXml = z.union([
  z.object({
    'epp:greeting': EppGreetingTypeXml,
  }),
  z.object({
    'epp:hello': z.string(),
  }),
  z.object({
    'epp:command': EppCommandTypeXml,
  }),
  z.object({
    'epp:response': EppResponseTypeXml,
  }),
  z.object({
    'epp:extension': EppExtAnyTypeXml,
  }),
]);

export type EppEppTypeXml = z.infer<typeof EppEppTypeXml>;
