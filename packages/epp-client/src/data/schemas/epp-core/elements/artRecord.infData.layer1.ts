/**
 * Layer-1 XML JSON schema for <artRecord:infData>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';
import { ArtRecordArtRecordTypeXml } from '../types/artRecord.artRecordType.layer1.js';

export const ArtRecordInfDataXml = ArtRecordArtRecordTypeXml;

export type ArtRecordInfDataXml = z.infer<typeof ArtRecordInfDataXml>;
