/**
 * Layer-1 XML JSON schema for <epp:epp>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { EppEppTypeXml } from '../types/epp.eppType.layer1';

export const EppEppXml = EppEppTypeXml;

export type EppEppXml = z.infer<typeof EppEppXml>;
