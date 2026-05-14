import type {
  NotificationRelatedResource,
  NotificationResourceType,
} from '@namefi-astra/common/shared-schemas';
import type { Route } from 'next';

/**
 * Resource kinds that map to a real detail page in this app. Used both
 * by `NotificationItem` (footer link rendering) and by the browser
 * notification watcher (to compute the OS-banner click destination).
 */
export const LINKABLE_NOTIFICATION_RESOURCE_TYPES: ReadonlySet<NotificationResourceType> =
  new Set(['domain', 'order', 'order_item']);

export function resourceHref(
  resource: NotificationRelatedResource,
): Route | string | null {
  switch (resource.type) {
    case 'domain':
      return `/domains/${encodeURIComponent(resource.identifier)}`;
    case 'order':
      return `/orders/${encodeURIComponent(resource.identifier)}`;
    case 'order_item':
      // Order items don't have a standalone page; route to the order list as a
      // fallback. Replace with a deep link once the orders page accepts item ids.
      return '/orders';
    default:
      return null;
  }
}

export function resourceLabel(resource: NotificationRelatedResource): string {
  switch (resource.type) {
    case 'domain':
      return 'Domain';
    case 'order':
      return 'Order';
    case 'order_item':
      return 'Order item';
    default:
      return resource.type;
  }
}
