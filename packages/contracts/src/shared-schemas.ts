import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'PARTIALLY_COMPLETED',
]);

export const itemTypeSchema = z.enum(['REGISTER', 'IMPORT', 'RENEW']);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
