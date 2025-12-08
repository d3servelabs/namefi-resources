/**
 * Layer-1 XML JSON schema for type artRecord:artRecordType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const ArtRecordArtRecordTypeXml = zloosen(
  z.object({
    'artRecord:objectType': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:materialsAndTechniques': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:dimensions': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:title': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:dateOrPeriod': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:maker': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:subject': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:inscriptionsAndMarkings': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:features': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
    'artRecord:reference': z.union([
      z.string().min(0).max(255),
      zloosen(z.object({ '#text': z.string().min(0).max(255) })),
    ]),
  }),
);

export type ArtRecordArtRecordTypeXml = z.infer<
  typeof ArtRecordArtRecordTypeXml
>;
