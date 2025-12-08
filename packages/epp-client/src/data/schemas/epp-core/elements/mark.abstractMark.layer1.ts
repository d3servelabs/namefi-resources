/**
 * Layer-1 XML JSON schema for <mark:abstractMark>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { MarkAbstractMarkTypeXml } from '../types/mark.abstractMarkType.layer1';

export const MarkAbstractMarkXml = MarkAbstractMarkTypeXml;

export type MarkAbstractMarkXml = z.infer<typeof MarkAbstractMarkXml>;
