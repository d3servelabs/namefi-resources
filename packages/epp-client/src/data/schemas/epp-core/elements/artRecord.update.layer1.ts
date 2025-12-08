/**
 * Layer-1 XML JSON schema for <artRecord:update>.
 * Auto-generated from XSD. Do not edit manually.
 */
import type { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';
import { ArtRecordArtRecordTypeXml } from '../types/artRecord.artRecordType.layer1';

export const ArtRecordUpdateXml = ArtRecordArtRecordTypeXml;

export type ArtRecordUpdateXml = z.infer<typeof ArtRecordUpdateXml>;
