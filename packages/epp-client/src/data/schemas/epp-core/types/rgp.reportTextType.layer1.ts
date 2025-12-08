/**
 * Layer-1 XML JSON schema for type rgp:reportTextType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const RgpReportTextTypeXml = zloosen(
  z.object({
    '@_lang': z.string().default('en').optional(),
  }),
);

export type RgpReportTextTypeXml = z.infer<typeof RgpReportTextTypeXml>;
