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

export const notificationBodyTypeValues = ['markdown', 'plain'] as const;
export const notificationBodyTypeSchema = z.enum(notificationBodyTypeValues);
export type NotificationBodyType = z.infer<typeof notificationBodyTypeSchema>;

/**
 * Notification urgency. Drives the sound + (later) banner styling.
 *
 * - `silent` / `low`: never trigger the audio cue.
 * - `normal` / `high` / `critical`: trigger the audio cue when a rise in
 *   unread count includes at least one notification at this level or above.
 *
 * Order is meaningful — keep `silent < low < normal < high < critical` so
 * `NOTIFICATION_PRIORITY_RANK` can compare directly.
 */
export const notificationPriorityValues = [
  'silent',
  'low',
  'normal',
  'high',
  'critical',
] as const;
export const notificationPrioritySchema = z.enum(notificationPriorityValues);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const NOTIFICATION_PRIORITY_RANK: Record<NotificationPriority, number> =
  {
    silent: 0,
    low: 1,
    normal: 2,
    high: 3,
    critical: 4,
  };

/** Threshold at which a rising notification triggers the audio cue. */
export const NOTIFICATION_AUDIBLE_RANK = NOTIFICATION_PRIORITY_RANK.normal;

export function isAudibleNotificationPriority(
  priority: NotificationPriority,
): boolean {
  return NOTIFICATION_PRIORITY_RANK[priority] >= NOTIFICATION_AUDIBLE_RANK;
}

/**
 * Discriminator for a notification's related-resource pointer.
 * Keep in sync with `notificationsTable.relatedResources` in
 * `packages/db/src/schema.ts`. Add new kinds as the product grows.
 */
export const notificationResourceTypeValues = [
  'user',
  'domain',
  'wallet',
  'order',
  'order_item',
  'payment',
  'cart',
  'dns_record',
] as const;
export const notificationResourceTypeSchema = z.enum(
  notificationResourceTypeValues,
);
export type NotificationResourceType = z.infer<
  typeof notificationResourceTypeSchema
>;

export const notificationRelatedResourceSchema = z.object({
  type: notificationResourceTypeSchema,
  identifier: z.string().min(1),
});
export type NotificationRelatedResource = z.infer<
  typeof notificationRelatedResourceSchema
>;

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
