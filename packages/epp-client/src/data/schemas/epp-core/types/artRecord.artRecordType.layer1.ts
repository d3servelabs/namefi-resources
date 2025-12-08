/**
 * Layer-1 XML JSON schema for type artRecord:artRecordType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const ArtRecordArtRecordTypeXml = zloosen(
  z.object({
    'artRecord:objectType': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:materialsAndTechniques': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:dimensions': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:title': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:dateOrPeriod': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:maker': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:subject': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:inscriptionsAndMarkings': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:features': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
    'artRecord:reference': zloosen(
      z.object({ '#text': z.string().min(0).max(255) }),
    ),
  }),
);

export type ArtRecordArtRecordTypeXml = z.infer<
  typeof ArtRecordArtRecordTypeXml
>;
