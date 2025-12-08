/**
 * Layer-1 XML JSON schema for type epp:pollType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen';

export const EppPollTypeXml = zloosen(
  z.object({
    '@_op': z.enum(['ack', 'req']),
    '@_msgID': z.string().optional(),
  }),
);

export type EppPollTypeXml = z.infer<typeof EppPollTypeXml>;
