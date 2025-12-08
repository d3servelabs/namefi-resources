/**
 * Layer-1 XML JSON schema for type rgp:updateType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { RgpRestoreTypeXml } from './rgp.restoreType.layer1.js';

export const RgpUpdateTypeXml = zloosen(
  z.object({
    'rgp:restore': RgpRestoreTypeXml,
  }),
);

export type RgpUpdateTypeXml = z.infer<typeof RgpUpdateTypeXml>;
