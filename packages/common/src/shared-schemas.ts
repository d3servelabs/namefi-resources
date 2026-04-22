import { z } from 'zod';

export const basicStatusValues = [
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;

export const orderStatusValues = [
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'PARTIALLY_COMPLETED',
] as const;

export const paymentStatusValues = [
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUND_REQUESTED',
  'REQUIRES_CAPTURE',
] as const;

export const refundStatusValues = [
  'CREATED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REQUIRES_ACTION',
] as const;

export const paymentProviderValues = [
  'NFSC_BASE',
  'NFSC_ETHEREUM',
  'NFSC_ETHEREUM_SEPOLIA',
  'MPP',
  'STRIPE',
  'X402',
] as const;

export const itemTypeValues = ['REGISTER', 'IMPORT', 'RENEW'] as const;

export const freeClaimClaimingStatusValues = [
  'IDLE',
  'CLAIMING',
  'CLAIMED',
] as const;

export const orderStatusSchema = z.enum(orderStatusValues);
export const paymentStatusSchema = z.enum(paymentStatusValues);
export const refundStatusSchema = z.enum(refundStatusValues);
export const itemTypeSchema = z.enum(itemTypeValues);
export const freeClaimClaimingStatusSchema = z.enum(
  freeClaimClaimingStatusValues,
);

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;
export type RefundStatus = z.infer<typeof refundStatusSchema>;
export type ItemType = z.infer<typeof itemTypeSchema>;
export type FreeClaimClaimingStatus = z.infer<
  typeof freeClaimClaimingStatusSchema
>;
