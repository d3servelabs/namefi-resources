/**
 * Layer-1 XML JSON schema for type artRecord:artRecordType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';

export const ArtRecordArtRecordTypeXml = z.object({
  'artRecord:objectType': z.string().min(0).max(255),
  'artRecord:materialsAndTechniques': z.string().min(0).max(255),
  'artRecord:dimensions': z.string().min(0).max(255),
  'artRecord:title': z.string().min(0).max(255),
  'artRecord:dateOrPeriod': z.string().min(0).max(255),
  'artRecord:maker': z.string().min(0).max(255),
  'artRecord:subject': z.string().min(0).max(255),
  'artRecord:inscriptionsAndMarkings': z.string().min(0).max(255),
  'artRecord:features': z.string().min(0).max(255),
  'artRecord:reference': z.string().min(0).max(255),
});

export type ArtRecordArtRecordTypeXml = z.infer<
  typeof ArtRecordArtRecordTypeXml
>;
