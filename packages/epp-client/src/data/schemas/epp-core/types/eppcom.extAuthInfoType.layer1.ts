/**
 * Layer-1 XML JSON schema for type eppcom:extAuthInfoType.
 * Auto-generated from XSD. Do not edit manually.
 */
import { z } from 'zod';
import { zloosen } from '../helpers/zod/loosen.js';

export const EppcomExtAuthInfoTypeXml = zloosen(z.object({}));

export type EppcomExtAuthInfoTypeXml = z.infer<typeof EppcomExtAuthInfoTypeXml>;
